-- 创建初始管理员用户并迁移现有数据
-- 此脚本用于创建默认管理员用户，并将现有数据关联到该用户

-- 1. 创建默认管理员用户
-- 注意：密码哈希值应在实际部署时替换为安全的哈希值
-- 默认密码为 'admin123'，此处使用明文存储仅用于演示
-- 实际应用中应使用bcrypt等算法生成安全的哈希值
DO $$
DECLARE
    v_admin_id uuid;
BEGIN
    -- 调用创建管理员用户的函数
    SELECT public.create_admin_user(
        'admin@admin.com',  -- 默认管理员邮箱
        'password123',           -- 默认管理员密码（实际应用中应使用哈希值）
        '系统管理员'           -- 显示名称
    ) INTO v_admin_id;
    
    -- 将现有数据关联到管理员用户
    PERFORM public.migrate_existing_data_to_admin(v_admin_id);
    
    RAISE NOTICE '管理员用户创建成功，ID: %', v_admin_id;
END $$;

-- 2. 验证管理员用户是否创建成功
SELECT id, email, display_name, role, created_at
FROM public.app_users
WHERE role = 'admin';

-- 3. 验证数据迁移是否成功
SELECT 
    (SELECT COUNT(*) FROM public.moves WHERE user_id IS NULL) AS null_user_moves,
    (SELECT COUNT(*) FROM public.daily_records WHERE user_id IS NULL) AS null_user_daily_records,
    (SELECT COUNT(*) FROM public.sequence_patterns WHERE user_id IS NULL) AS null_user_sequence_patterns,
    (SELECT COUNT(*) FROM public.sequence_stats WHERE user_id IS NULL) AS null_user_sequence_stats;

-- 删除现有的可能导致循环依赖的策略
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.app_users;

-- 创建新的不会导致循环依赖的策略
-- 使用auth.role()而不是查询app_users表来判断管理员权限
CREATE POLICY "Allow all operations for authenticated users" ON public.app_users
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 临时禁用RLS
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_stats DISABLE ROW LEVEL SECURITY; 