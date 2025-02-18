-- 创建扩展
create extension if not exists "uuid-ossp";

-- 1. 日期记录表
create table daily_records (
    id uuid default uuid_generate_v4() primary key,
    date date not null unique,                    -- 日期，唯一索引
    total_predictions integer default 0,          -- 当天总预测次数
    correct_predictions integer default 0,        -- 当天正确预测次数
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. 移动记录表
create table moves (
    id uuid default uuid_generate_v4() primary key,
    date date not null,                          -- 关联日期
    position jsonb not null,                     -- 位置 {row, col}
    color text not null,                         -- 颜色
    sequence_number integer not null,            -- 序号，用于排序和分页
    prediction jsonb,                            -- 预测信息
    created_at timestamptz default now(),
    
    foreign key (date) references daily_records(date),
    unique(date, sequence_number)                -- 确保每天的序号唯一
);

-- 3. 序列模式表（优化序列查询）
create table sequence_patterns (
    id uuid default uuid_generate_v4() primary key,
    pattern text[] not null,                     -- 颜色序列数组
    pattern_length integer not null,             -- 序列长度
    next_color text not null,                    -- 下一个颜色
    occurrence_count integer default 1,          -- 出现次数
    first_seen_at timestamptz default now(),    -- 首次出现时间
    last_seen_at timestamptz default now(),     -- 最后出现时间
    
    unique(pattern, pattern_length, next_color)  -- 确保序列模式唯一
);

-- 4. 序列统计表（用于快速查询）
create table sequence_stats (
    id uuid default uuid_generate_v4() primary key,
    pattern text[] not null,                     -- 颜色序列数组
    pattern_length integer not null,             -- 序列长度
    total_occurrences integer default 0,         -- 总出现次数
    red_next_count integer default 0,            -- 下一个是红色的次数
    black_next_count integer default 0,          -- 下一个是黑色的次数
    last_updated_at timestamptz default now(),   -- 最后更新时间
    
    unique(pattern, pattern_length)              -- 确保序列统计唯一
);

-- 创建索引
create index idx_moves_date on moves(date);
create index idx_moves_sequence on moves(sequence_number);
create index idx_sequence_patterns_pattern on sequence_patterns using gin(pattern);
create index idx_sequence_patterns_length on sequence_patterns(pattern_length);
create index idx_sequence_stats_pattern on sequence_stats using gin(pattern);
create index idx_sequence_stats_length on sequence_stats(pattern_length);

-- 创建触发器函数：更新序列模式
create or replace function update_sequence_patterns()
returns trigger as $$
begin
    -- 更新序列模式表
    insert into sequence_patterns (pattern, pattern_length, next_color)
    values (NEW.pattern, array_length(NEW.pattern, 1), NEW.next_color)
    on conflict (pattern, pattern_length, next_color)
    do update set 
        occurrence_count = sequence_patterns.occurrence_count + 1,
        last_seen_at = now();
        
    -- 更新序列统计表
    insert into sequence_stats (
        pattern, 
        pattern_length, 
        total_occurrences,
        red_next_count,
        black_next_count
    )
    values (
        NEW.pattern,
        array_length(NEW.pattern, 1),
        1,
        case when NEW.next_color = 'red' then 1 else 0 end,
        case when NEW.next_color = 'black' then 1 else 0 end
    )
    on conflict (pattern, pattern_length)
    do update set 
        total_occurrences = sequence_stats.total_occurrences + 1,
        red_next_count = sequence_stats.red_next_count + 
            case when NEW.next_color = 'red' then 1 else 0 end,
        black_next_count = sequence_stats.black_next_count + 
            case when NEW.next_color = 'black' then 1 else 0 end,
        last_updated_at = now();
        
    return NEW;
end;
$$ language plpgsql;

-- 创建函数：获取序列预测
create or replace function get_sequence_prediction(
    current_pattern text[],
    pattern_length integer
)
returns table (
    predicted_color text,
    confidence numeric
) as $$
begin
    return query
    select
        case 
            when s.red_next_count > s.black_next_count then 'red'
            else 'black'
        end as predicted_color,
        greatest(
            s.red_next_count::numeric / s.total_occurrences,
            s.black_next_count::numeric / s.total_occurrences
        ) * 100 as confidence
    from sequence_stats s
    where s.pattern = current_pattern
    and s.pattern_length = pattern_length
    and s.total_occurrences > 0;
end;
$$ language plpgsql;
