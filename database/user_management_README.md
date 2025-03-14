# 用户管理功能 - 数据库脚本（简化版）

本目录包含实现简化版用户管理功能所需的数据库脚本。

## 文件说明

1. `user_management_schema.sql` - 创建用户管理所需的表和基本数据访问控制
2. `create_admin_user.sql` - 创建初始管理员用户并将现有数据关联到该用户

## 执行顺序

请按照以下顺序执行脚本：

1. 首先执行 `user_management_schema.sql` 创建必要的数据库结构
2. 执行 `create_admin_user.sql` 创建管理员用户并迁移现有数据

## 注意事项

1. 执行脚本前请先备份数据库
2. 脚本中使用了 `IF NOT EXISTS` 和 `IF EXISTS` 子句，可以重复执行而不会出错
3. 默认管理员用户的邮箱为 `admin@example.com`，密码为 `admin123`，请在生产环境中修改为安全的密码
4. 密码以哈希形式存储，使用 bcrypt 算法
5. 此简化版实现不依赖 Supabase Auth，而是直接使用 app_users 表进行认证

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
3. 数据库表是否正确创建
4. 初始管理员用户是否成功创建 