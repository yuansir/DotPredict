-- 用户管理功能 - 数据库结构扩展
-- 此脚本用于创建用户管理所需的表、触发器和行级安全策略

-- 1. 创建自定义用户表
CREATE TABLE IF NOT EXISTS public.app_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 为app_users表添加索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_app_users_auth_id ON public.app_users(auth_id);

-- 2. 为现有业务表添加用户ID外键
ALTER TABLE public.moves ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.daily_records ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.sequence_patterns ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.sequence_stats ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.app_users(id);

-- 为新增的外键字段添加索引
CREATE INDEX IF NOT EXISTS idx_moves_user_id ON public.moves(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_user_id ON public.daily_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_patterns_user_id ON public.sequence_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_stats_user_id ON public.sequence_stats(user_id);

-- 3. 创建触发器，自动创建app_users记录
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (auth_id, display_name, role)
  VALUES (
    new.id, 
    COALESCE(new.email, 'User'), 
    CASE 
      -- 可以设置特定邮箱为管理员，例如以admin@开头的邮箱
      WHEN new.email LIKE 'admin@%' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. 设置行级安全策略(RLS)
-- 启用RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_stats ENABLE ROW LEVEL SECURITY;

-- app_users表的策略
-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all users" ON public.app_users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- 用户可以查看自己的信息
CREATE POLICY "Users can view own data" ON public.app_users
    FOR SELECT USING (auth_id = auth.uid());

-- 管理员可以创建、更新和删除用户
CREATE POLICY "Admins can insert users" ON public.app_users
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON public.app_users
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete users" ON public.app_users
    FOR DELETE USING (
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- moves表的策略
-- 用户只能查看自己的数据，管理员可以查看所有数据
CREATE POLICY "Users can read own moves" ON public.moves
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- 用户只能插入自己的数据
CREATE POLICY "Users can insert own moves" ON public.moves
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        )
    );

-- 用户只能更新自己的数据，管理员可以更新所有数据
CREATE POLICY "Users can update own moves" ON public.moves
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- 用户只能删除自己的数据，管理员可以删除所有数据
CREATE POLICY "Users can delete own moves" ON public.moves
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- daily_records表的策略
CREATE POLICY "Users can read own daily_records" ON public.daily_records
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can insert own daily_records" ON public.daily_records
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own daily_records" ON public.daily_records
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can delete own daily_records" ON public.daily_records
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- sequence_patterns表的策略
CREATE POLICY "Users can read own sequence_patterns" ON public.sequence_patterns
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can insert own sequence_patterns" ON public.sequence_patterns
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own sequence_patterns" ON public.sequence_patterns
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can delete own sequence_patterns" ON public.sequence_patterns
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- sequence_stats表的策略
CREATE POLICY "Users can read own sequence_stats" ON public.sequence_stats
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can insert own sequence_stats" ON public.sequence_stats
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own sequence_stats" ON public.sequence_stats
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

CREATE POLICY "Users can delete own sequence_stats" ON public.sequence_stats
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.app_users WHERE auth_id = auth.uid()
        ) OR 
        auth.uid() IN (
            SELECT auth_id FROM public.app_users WHERE role = 'admin'
        )
    );

-- 5. 数据迁移辅助函数
-- 创建一个函数，用于将现有数据关联到默认管理员用户
-- 注意：此函数应在创建初始管理员用户后执行
CREATE OR REPLACE FUNCTION public.migrate_existing_data_to_admin(admin_user_id uuid)
RETURNS void AS $$
BEGIN
  -- 更新moves表
  UPDATE public.moves SET user_id = admin_user_id WHERE user_id IS NULL;
  
  -- 更新daily_records表
  UPDATE public.daily_records SET user_id = admin_user_id WHERE user_id IS NULL;
  
  -- 更新sequence_patterns表
  UPDATE public.sequence_patterns SET user_id = admin_user_id WHERE user_id IS NULL;
  
  -- 更新sequence_stats表
  UPDATE public.sequence_stats SET user_id = admin_user_id WHERE user_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用示例：
-- SELECT public.migrate_existing_data_to_admin('管理员用户ID'); 