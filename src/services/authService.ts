import { supabase } from '../lib/supabase';
import { AppUser, UserRole } from '../types/auth';

/**
 * 认证服务 - 封装与Supabase Auth相关的操作
 */
export const authService = {
  /**
   * 登录
   * @param email 邮箱
   * @param password 密码
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  /**
   * 登出
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * 获取当前会话
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * 获取应用用户信息
   * @param authId 认证用户ID
   */
  async getAppUser(authId: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_id', authId)
      .single();
    
    if (error) {
      console.error('Error fetching app user:', error);
      return null;
    }
    
    return data as AppUser;
  },

  /**
   * 管理员创建用户
   * @param email 邮箱
   * @param password 密码
   * @param role 角色
   * @param displayName 显示名称
   */
  async createUser(email: string, password: string, role: UserRole = 'user', displayName?: string) {
    // 创建认证用户
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (error) throw error;
    
    // 触发器会自动创建app_users记录
    // 如果需要设置角色或显示名称，更新app_users记录
    if (role === 'admin' || displayName) {
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          role: role,
          display_name: displayName || email,
        })
        .eq('auth_id', data.user.id);
      
      if (updateError) throw updateError;
    }
    
    return data.user;
  },

  /**
   * 管理员更新用户
   * @param userId 用户ID
   * @param updates 更新内容
   */
  async updateUser(userId: string, updates: Partial<AppUser>) {
    const { data, error } = await supabase
      .from('app_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as AppUser;
  },

  /**
   * 管理员删除用户
   * @param userId 用户ID
   */
  async deleteUser(userId: string) {
    // 获取auth_id
    const { data: appUser, error: fetchError } = await supabase
      .from('app_users')
      .select('auth_id')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // 删除认证用户（会级联删除app_users记录）
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      appUser.auth_id
    );
    
    if (deleteError) throw deleteError;
  },

  /**
   * 管理员获取所有用户
   */
  async getUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as AppUser[];
  }
}; 