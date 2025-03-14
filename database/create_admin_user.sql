-- 创建初始管理员用户
-- 此脚本用于创建一个初始管理员用户，并将现有数据关联到该用户

-- 1. 创建管理员用户
-- 注意：此处使用的是Supabase的auth.users表API，需要在Supabase控制台执行
-- 或者通过Supabase客户端API创建用户

-- 以下是通过SQL直接创建用户的示例（仅供参考，实际应通过API创建）

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(), -- 生成UUID作为用户ID
  '00000000-0000-0000-0000-000000000000', -- 默认实例ID
  'admin@example.com',
  -- 这里需要加密的密码，不建议直接在SQL中设置
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  now(),
  now()
) RETURNING id;


-- 2. 确保app_users表中有对应的管理员记录
-- 假设已通过API或控制台创建了auth用户，并且触发器已自动创建app_users记录
-- 如果需要手动设置，可以执行以下SQL

-- 将特定邮箱的用户设置为管理员
UPDATE public.app_users
SET role = 'admin'
WHERE auth_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

-- 3. 将现有数据关联到管理员用户
-- 获取管理员用户ID
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- 获取管理员用户ID
  SELECT id INTO admin_id FROM public.app_users
  WHERE auth_id IN (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
  );
  
  -- 如果找到管理员用户，则迁移数据
  IF admin_id IS NOT NULL THEN
    -- 调用迁移函数
    PERFORM public.migrate_existing_data_to_admin(admin_id);
  END IF;
END $$;

-- 4. 验证数据迁移
-- 检查是否所有数据都已关联到管理员用户
/*
SELECT COUNT(*) FROM public.moves WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.daily_records WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.sequence_patterns WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.sequence_stats WHERE user_id IS NULL;
*/

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