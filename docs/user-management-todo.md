# 用户管理功能实现计划

## 需求概述

基于对项目的分析，我们需要开发一个新的功能模块，将用户信息使用Supabase存储，并实现以下功能：

1. 有管理员用户，管理员可以添加、删除和修改用户
2. 有多个普通用户可以实现登录
3. 目前数据都存放在表中，表中的数据和用户没有关联，我们要实现每个用户只能查看和修改自己填入的小球矩阵数据
4. 管理员可以存储历史会话和日期的数据，普通用户只能输入当前数据，不能存储，页面刷新或者终止输入就清空
5. 不改变已有的布局和样式以及组件

## 实现计划

### 1. 数据库结构扩展

- [x] 创建自定义用户表 `public.app_users`，关联到 `auth.users`
- [x] 为现有业务表添加用户ID外键：
  - [x] `public.moves`
  - [x] `public.daily_records`
  - [x] `public.sequence_patterns`
  - [x] `public.sequence_stats`
- [x] 创建触发器，在创建auth用户时自动创建app_users记录
- [x] 设置行级安全策略(RLS)，确保用户只能访问自己的数据

### 2. 认证系统实现

- [ ] 更新 `AuthContext.tsx`，使用Supabase Auth服务
- [ ] 实现用户登录、注册和登出功能
- [ ] 实现用户角色管理（管理员、普通用户）
- [ ] 实现基于角色的权限控制

### 3. 用户管理功能

- [ ] 创建用户管理页面
- [ ] 实现管理员添加用户功能
- [ ] 实现管理员修改用户功能
- [ ] 实现管理员删除用户功能
- [ ] 实现用户列表查看功能

### 4. 数据权限控制

- [ ] 修改 `GameContext.tsx`，添加用户权限控制
- [ ] 修改数据存储服务，添加用户ID关联
- [ ] 实现管理员可以存储历史数据的功能
- [ ] 实现普通用户数据不保存的功能

### 5. UI组件调整

- [ ] 更新登录页面
- [ ] 创建用户管理界面
- [ ] 调整GameContainer组件，根据用户权限显示不同功能
- [ ] 调整ControlPanel组件，根据用户权限调整按钮功能

### 6. 路由和导航

- [ ] 添加用户管理路由
- [ ] 扩展ProtectedRoute组件，添加角色检查
- [ ] 添加导航菜单，根据用户角色显示不同选项

### 7. 初始化和数据迁移

- [x] 创建初始管理员用户
- [x] 为现有数据设置默认用户ID
- [ ] 测试数据迁移和权限控制

## 技术方案

### 数据库结构

```sql
-- 创建自定义用户表
CREATE TABLE public.app_users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    auth_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 添加外键约束到现有表
ALTER TABLE public.moves ADD COLUMN user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.daily_records ADD COLUMN user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.sequence_patterns ADD COLUMN user_id uuid REFERENCES public.app_users(id);
ALTER TABLE public.sequence_stats ADD COLUMN user_id uuid REFERENCES public.app_users(id);
```

### 认证上下文

```typescript
// 定义认证上下文类型
interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUsers: () => Promise<AppUser[]>;
}
```

### 游戏上下文扩展

```typescript
interface GameContextType {
  // 现有属性
  // ...
  
  // 新增属性
  canSaveData: boolean; // 是否可以保存数据（管理员可以，普通用户不可以）
  canViewHistory: boolean; // 是否可以查看历史（管理员可以，普通用户不可以）
}
```

## 注意事项

1. 保持现有UI组件的样式和布局不变
2. 确保向后兼容性，不破坏现有功能
3. 确保数据安全，防止未授权访问
4. 提供清晰的用户反馈，特别是权限相关的操作
5. 实现渐进式功能，先完成基础认证，再添加高级管理功能 