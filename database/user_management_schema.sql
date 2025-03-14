-- 用户管理功能 - 数据库结构扩展（简化版）
-- 此脚本用于创建用户管理所需的表和基本数据访问控制

-- 1. 创建简化版用户表
CREATE TABLE IF NOT EXISTS public.app_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    display_name text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    last_login timestamp with time zone,
    session_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 为app_users表添加索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);

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

-- 3. 创建辅助函数

-- 创建一个函数，用于验证用户登录
CREATE OR REPLACE FUNCTION public.verify_user_login(p_email text, p_password text)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_password_hash text;
BEGIN
    -- 获取用户ID和密码哈希
    SELECT id, password_hash INTO v_user_id, v_password_hash
    FROM public.app_users
    WHERE email = p_email;
    
    -- 如果用户不存在，返回NULL
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- 验证密码（注意：实际实现应使用安全的密码哈希比较函数）
    -- 此处简化处理，实际前端应使用bcrypt等算法进行哈希比较
    IF v_password_hash = p_password THEN
        -- 更新最后登录时间
        UPDATE public.app_users
        SET last_login = now(),
            session_token = uuid_generate_v4()
        WHERE id = v_user_id;
        
        RETURN v_user_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建一个函数，用于获取用户信息
CREATE OR REPLACE FUNCTION public.get_user_by_token(p_token text)
RETURNS json AS $$
DECLARE
    v_user json;
BEGIN
    SELECT json_build_object(
        'id', id,
        'email', email,
        'display_name', display_name,
        'role', role,
        'last_login', last_login,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_user
    FROM public.app_users
    WHERE session_token = p_token;
    
    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 数据迁移辅助函数
-- 创建一个函数，用于将现有数据关联到默认管理员用户
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

-- 5. 创建初始管理员用户的辅助函数
CREATE OR REPLACE FUNCTION public.create_admin_user(
    p_email text,
    p_password_hash text,
    p_display_name text DEFAULT 'Admin'
)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- 检查用户是否已存在
    SELECT id INTO v_user_id FROM public.app_users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        -- 创建新管理员用户
        INSERT INTO public.app_users (
            email,
            password_hash,
            display_name,
            role,
            last_login,
            created_at,
            updated_at
        ) VALUES (
            p_email,
            p_password_hash,
            p_display_name,
            'admin',
            now(),
            now(),
            now()
        ) RETURNING id INTO v_user_id;
    ELSE
        -- 更新现有用户为管理员
        UPDATE public.app_users
        SET role = 'admin',
            password_hash = p_password_hash,
            display_name = COALESCE(p_display_name, display_name),
            updated_at = now()
        WHERE id = v_user_id;
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 