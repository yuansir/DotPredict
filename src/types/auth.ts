import { Session, User as SupabaseUser } from '@supabase/supabase-js';

/**
 * 用户角色类型
 */
export type UserRole = 'user' | 'admin';

/**
 * 应用用户类型，对应数据库中的app_users表
 */
export interface AppUser {
  id: string;
  auth_id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * 认证状态类型
 */
export interface AuthState {
  session: Session | null;
  user: SupabaseUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
} 