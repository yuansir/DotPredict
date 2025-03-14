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
    console.log('authService.login - 开始登录:', email, { timestamp: new Date().toISOString() });
    try {
      console.log('authService.login - 调用supabase.auth.signInWithPassword前', { timestamp: new Date().toISOString() });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('authService.login - 登录失败:', error, { 
          code: error.code,
          message: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      // 安全地格式化日期
      const safeFormatDate = (timestamp: number | null | undefined): string => {
        if (!timestamp) return 'unknown';
        try {
          return new Date(timestamp * 1000).toISOString();
        } catch (e) {
          return 'invalid-date';
        }
      };
      
      console.log('authService.login - 登录成功:', { 
        session: data.session ? {
          expires_at: data.session.expires_at ? safeFormatDate(data.session.expires_at) : 'unknown',
          token: data.session.access_token.substring(0, 10) + '...'
        } : null,
        user: data.user?.email,
        timestamp: new Date().toISOString()
      });
      return data;
    } catch (error) {
      console.error('authService.login - 捕获到异常:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  },

  /**
   * 登出
   */
  async logout() {
    console.log('authService.logout - 开始登出');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('authService.logout - 登出失败:', error);
      throw error;
    }
    console.log('authService.logout - 登出成功');
  },

  /**
   * 获取当前会话
   */
  async getSession() {
    console.log('authService.getSession - 获取当前会话', { timestamp: new Date().toISOString() });
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('authService.getSession - 获取会话失败:', error, { timestamp: new Date().toISOString() });
        throw error;
      }
      
      // 安全地格式化日期
      const safeFormatDate = (timestamp: number | null | undefined): string => {
        if (!timestamp) return 'unknown';
        try {
          return new Date(timestamp * 1000).toISOString();
        } catch (e) {
          return 'invalid-date';
        }
      };
      
      console.log('authService.getSession - 获取会话成功:', { 
        hasSession: !!data.session,
        sessionDetails: data.session ? {
          expiresAt: data.session.expires_at ? safeFormatDate(data.session.expires_at) : 'unknown',
          user: data.session.user?.email,
          token: data.session.access_token.substring(0, 10) + '...'
        } : null,
        timestamp: new Date().toISOString()
      });
      
      return data.session;
    } catch (error) {
      console.error('authService.getSession - 捕获到异常:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  },

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    const startTime = Date.now();
    console.log('authService.getCurrentUser - 开始获取当前用户', { 
      timestamp: new Date().toISOString(),
      startTime
    });
    
    try {
      console.log('authService.getCurrentUser - 发送请求前', { timestamp: new Date().toISOString() });
      const { data, error } = await supabase.auth.getUser();
      const endTime = Date.now();
      
      console.log('authService.getCurrentUser - 请求完成', { 
        duration: endTime - startTime,
        timestamp: new Date().toISOString() 
      });
      
      if (error) {
        console.error('authService.getCurrentUser - 获取用户失败:', error, { 
          code: error.code,
          message: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      if (!data.user) {
        console.warn('authService.getCurrentUser - 未获取到用户数据', { timestamp: new Date().toISOString() });
      }
      
      // 安全地格式化日期
      const formatDate = (dateValue: string | number | null | undefined): string => {
        if (!dateValue) return 'unknown';
        try {
          // 尝试将值转换为日期
          const date = new Date(dateValue);
          // 检查日期是否有效
          if (isNaN(date.getTime())) {
            return 'invalid-date';
          }
          return date.toISOString();
        } catch (e) {
          console.warn('日期格式化失败:', dateValue, e);
          return 'invalid-date';
        }
      };
      
      console.log('authService.getCurrentUser - 获取用户成功:', { 
        email: data.user?.email,
        id: data.user?.id,
        lastSignInAt: data.user?.last_sign_in_at ? formatDate(Number(data.user.last_sign_in_at) * 1000) : 'unknown',
        createdAt: data.user?.created_at ? formatDate(data.user.created_at) : 'unknown',
        timestamp: new Date().toISOString()
      });
      
      return data.user;
    } catch (error) {
      console.error('authService.getCurrentUser - 捕获到异常:', error, { 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString() 
      });
      throw error;
    }
  },

  /**
   * 获取应用用户信息
   * @param authId 认证用户ID
   */
  async getAppUser(authId: string): Promise<AppUser | null> {
    const startTime = Date.now();
    console.log('authService.getAppUser - 开始获取应用用户信息:', authId, { 
      timestamp: new Date().toISOString(),
      startTime
    });
    
    try {
      console.log('authService.getAppUser - 发送请求前', { timestamp: new Date().toISOString() });
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', authId)
        .single();
      
      const endTime = Date.now();
      console.log('authService.getAppUser - 请求完成', { 
        duration: endTime - startTime,
        timestamp: new Date().toISOString() 
      });
      
      if (error) {
        console.error('authService.getAppUser - 获取应用用户信息失败:', error, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        });
        
        // 检查是否是"找不到记录"的错误
        if (error.code === 'PGRST116') {
          console.warn('authService.getAppUser - 用户记录不存在，可能需要创建', { 
            authId,
            timestamp: new Date().toISOString() 
          });
        }
        
        return null;
      }
      
      if (!data) {
        console.warn('authService.getAppUser - 未获取到应用用户数据', { 
          authId,
          timestamp: new Date().toISOString() 
        });
        return null;
      }
      
      // 安全地记录日期，避免格式问题
      const safeLogDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return 'unknown';
        try {
          return new Date(dateStr).toISOString();
        } catch (e) {
          return 'invalid-date';
        }
      };
      
      console.log('authService.getAppUser - 获取应用用户信息成功:', {
        id: data.id,
        role: data.role,
        displayName: data.display_name,
        createdAt: safeLogDate(data.created_at),
        timestamp: new Date().toISOString()
      });
      return data as AppUser;
    } catch (error) {
      console.error('authService.getAppUser - 捕获到异常:', error, { 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString() 
      });
      return null;
    }
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