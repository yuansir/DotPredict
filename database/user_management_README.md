# 用户管理功能 - 数据库脚本

本目录包含实现用户管理功能所需的数据库脚本。

## 文件说明

1. `user_management_schema.sql` - 创建用户管理所需的表、触发器和行级安全策略
2. `create_admin_user.sql` - 创建初始管理员用户并将现有数据关联到该用户

## 执行顺序

请按照以下顺序执行脚本：

1. 首先执行 `user_management_schema.sql` 创建必要的数据库结构
2. 通过Supabase控制台或API创建管理员用户（邮箱建议使用 `admin@example.com` 或以 `admin@` 开头的邮箱）
3. 执行 `create_admin_user.sql` 将用户设置为管理员并迁移现有数据

## 注意事项

1. 执行脚本前请先备份数据库
2. 脚本中使用了 `IF NOT EXISTS` 和 `IF EXISTS` 子句，可以重复执行而不会出错
3. 创建用户时，建议通过Supabase控制台或API创建，而不是直接执行SQL语句
4. 脚本中的邮箱地址 `admin@example.com` 请替换为实际使用的邮箱地址
5. 行级安全策略(RLS)确保用户只能访问自己的数据，管理员可以访问所有数据

## 验证

执行脚本后，可以通过以下SQL语句验证设置是否成功：

```sql
-- 检查app_users表是否创建成功
SELECT * FROM public.app_users;

-- 检查是否有管理员用户
SELECT * FROM public.app_users WHERE role = 'admin';

-- 检查现有数据是否已关联到管理员用户
SELECT COUNT(*) FROM public.moves WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.daily_records WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.sequence_patterns WHERE user_id IS NULL;
SELECT COUNT(*) FROM public.sequence_stats WHERE user_id IS NULL;
```

## 故障排除

如果遇到问题，请检查：

1. Supabase连接是否正常
2. 是否有足够的权限执行脚本
3. 触发器是否正常工作（创建用户时是否自动创建app_users记录）
4. 行级安全策略是否正确设置 