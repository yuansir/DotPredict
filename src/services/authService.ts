import { supabase } from '../lib/supabase';
import { AppUser, UserRole } from '../types/auth';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';
import { getSessionToken, setSessionToken, clearSessionToken, refreshSessionExpiry } from '../utils/sessionUtils';
import { v4 as uuidv4 } from 'uuid';

// 用户更新类型，包含密码字段
interface UserUpdates extends Partial<Omit<AppUser, 'id' | 'created_at' | 'updated_at'>> {
  password?: string;
}

/**
 * 认证服务 - 封装与用户认证相关的操作
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
      // 1. 获取用户信息
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError) {
        console.error('authService.login - 获取用户信息失败:', userError, { 
          timestamp: new Date().toISOString()
        });
        throw new Error('账户或者密码错误');
      }
      
      if (!userData) {
        console.error('authService.login - 用户不存在:', email, { 
          timestamp: new Date().toISOString()
        });
        throw new Error('账户或者密码错误');
      }
      
      // 2. 验证密码
      const isPasswordValid = await verifyPassword(password, userData.password_hash);
      if (!isPasswordValid) {
        console.error('authService.login - 密码验证失败:', email, { 
          timestamp: new Date().toISOString()
        });
        throw new Error('账户或者密码错误');
      }
      
      // 3. 生成会话令牌
      const sessionToken = crypto.randomUUID();
      
      // 4. 更新用户的会话令牌和最后登录时间
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          session_token: sessionToken,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);
      
      if (updateError) {
        console.error('authService.login - 更新会话令牌失败:', updateError, { 
          timestamp: new Date().toISOString()
        });
        throw new Error('登录过程中发生错误');
      }
      
      // 5. 存储会话令牌到本地存储
      setSessionToken(sessionToken);
      
      // 6. 返回用户信息
      const user: AppUser = {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        role: userData.role,
        last_login: new Date().toISOString(),
        session_token: sessionToken,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
      
      console.log('authService.login - 登录成功:', { 
        user: user.email,
        role: user.role,
        timestamp: new Date().toISOString()
      });
      
      return { user };
    } catch (error) {
      console.error('authService.login - 登录失败:', error, { 
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  /**
   * 登出
   */
  async logout() {
    console.log('authService.logout - 开始登出', { timestamp: new Date().toISOString() });
    try {
      // 获取当前会话令牌
      const sessionToken = getSessionToken();
      
      if (sessionToken) {
        // 清除数据库中的会话令牌
        await supabase
          .from('app_users')
          .update({
            session_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('session_token', sessionToken);
      }
      
      // 清除本地存储中的会话令牌
      clearSessionToken();
      
      console.log('authService.logout - 登出成功', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('authService.logout - 登出失败:', error, { 
        timestamp: new Date().toISOString()
      });
      // 即使发生错误，也清除本地会话
      clearSessionToken();
      throw error;
    }
  },
  
  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<AppUser | null> {
    console.log('authService.getCurrentUser - 开始获取当前用户', { timestamp: new Date().toISOString() });
    try {
      // 获取会话令牌
      const sessionToken = getSessionToken();
      
      if (!sessionToken) {
        console.log('authService.getCurrentUser - 无会话令牌', { timestamp: new Date().toISOString() });
        return null;
      }
      
      // 根据会话令牌获取用户信息
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('session_token', sessionToken)
        .single();
      
      if (error) {
        console.error('authService.getCurrentUser - 获取用户信息失败:', error, { 
          timestamp: new Date().toISOString()
        });
        clearSessionToken();
        return null;
      }
      
      if (!data) {
        console.log('authService.getCurrentUser - 会话令牌无效', { timestamp: new Date().toISOString() });
        clearSessionToken();
        return null;
      }
      
      // 刷新会话过期时间
      refreshSessionExpiry();
      
      const user: AppUser = {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        role: data.role,
        last_login: data.last_login,
        session_token: data.session_token,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('authService.getCurrentUser - 获取当前用户成功:', { 
        user: user.email,
        role: user.role,
        timestamp: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      console.error('authService.getCurrentUser - 获取当前用户失败:', error, { 
        timestamp: new Date().toISOString()
      });
      return null;
    }
  },
  
  /**
   * 创建用户（仅管理员可用）
   * @param email 邮箱
   * @param password 密码
   * @param role 角色
   * @param displayName 显示名称
   */
  async createUser(email: string, password: string, role: UserRole = 'user', displayName?: string): Promise<AppUser> {
    console.log('authService.createUser - 开始创建用户:', { email, role, timestamp: new Date().toISOString() });
    try {
      // 检查邮箱是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        console.error('authService.createUser - 邮箱已存在:', email, { timestamp: new Date().toISOString() });
        throw new Error('邮箱已被注册');
      }
      
      // 对密码进行哈希处理
      const hashedPassword = await hashPassword(password);
      
      // 创建用户
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          email,
          password_hash: hashedPassword,
          display_name: displayName || email.split('@')[0],
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('authService.createUser - 创建用户失败:', error, { timestamp: new Date().toISOString() });
        throw new Error('创建用户失败');
      }
      
      const newUser: AppUser = {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        role: data.role,
        last_login: data.last_login,
        session_token: data.session_token,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('authService.createUser - 创建用户成功:', { 
        user: newUser.email,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });
      
      return newUser;
    } catch (error) {
      console.error('authService.createUser - 创建用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  },
  
  /**
   * 更新用户信息（仅管理员可用）
   * @param userId 用户ID
   * @param updates 更新内容
   */
  async updateUser(userId: string, updates: UserUpdates): Promise<AppUser> {
    console.log('authService.updateUser - 开始更新用户:', { userId, updates, timestamp: new Date().toISOString() });
    try {
      // 准备更新数据
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // 如果包含密码更新，进行哈希处理
      if (updates.password) {
        updateData.password_hash = await hashPassword(updates.password);
        delete updateData.password;
      }
      
      // 更新用户
      const { data, error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('authService.updateUser - 更新用户失败:', error, { timestamp: new Date().toISOString() });
        throw new Error('更新用户失败');
      }
      
      const updatedUser: AppUser = {
        id: data.id,
        email: data.email,
        display_name: data.display_name,
        role: data.role,
        last_login: data.last_login,
        session_token: data.session_token,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      console.log('authService.updateUser - 更新用户成功:', { 
        user: updatedUser.email,
        timestamp: new Date().toISOString()
      });
      
      return updatedUser;
    } catch (error) {
      console.error('authService.updateUser - 更新用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  },
  
  /**
   * 删除用户（仅管理员可用）
   * @param userId 用户ID
   */
  async deleteUser(userId: string): Promise<void> {
    console.log('authService.deleteUser - 开始删除用户:', { userId, timestamp: new Date().toISOString() });
    try {
      // 1. 先删除用户关联的moves记录
      const { error: movesError } = await supabase
        .from('moves')
        .delete()
        .eq('user_id', userId);
      
      if (movesError) {
        console.error('authService.deleteUser - 删除用户moves记录失败:', movesError, { timestamp: new Date().toISOString() });
        throw new Error('删除用户关联记录失败');
      }
      
      // 2. 删除用户关联的sequence_patterns记录
      const { error: patternsError } = await supabase
        .from('sequence_patterns')
        .delete()
        .eq('user_id', userId);
      
      if (patternsError) {
        console.error('authService.deleteUser - 删除用户sequence_patterns记录失败:', patternsError, { timestamp: new Date().toISOString() });
        throw new Error('删除用户关联记录失败');
      }
      
      // 3. 删除用户关联的sequence_stats记录
      const { error: statsError } = await supabase
        .from('sequence_stats')
        .delete()
        .eq('user_id', userId);
      
      if (statsError) {
        console.error('authService.deleteUser - 删除用户sequence_stats记录失败:', statsError, { timestamp: new Date().toISOString() });
        throw new Error('删除用户关联记录失败');
      }
      
      // 4. 删除用户关联的daily_records记录
      const { error: recordsError } = await supabase
        .from('daily_records')
        .delete()
        .eq('user_id', userId);
      
      if (recordsError) {
        console.error('authService.deleteUser - 删除用户daily_records记录失败:', recordsError, { timestamp: new Date().toISOString() });
        throw new Error('删除用户关联记录失败');
      }
      
      // 5. 最后删除用户记录
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('authService.deleteUser - 删除用户失败:', error, { timestamp: new Date().toISOString() });
        throw new Error('删除用户失败');
      }
      
      console.log('authService.deleteUser - 删除用户成功:', { userId, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('authService.deleteUser - 删除用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  },
  
  /**
   * 获取所有用户（仅管理员可用）
   */
  async getUsers(): Promise<AppUser[]> {
    console.log('authService.getUsers - 开始获取所有用户', { timestamp: new Date().toISOString() });
    try {
      // 获取所有用户
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('authService.getUsers - 获取用户列表失败:', error, { timestamp: new Date().toISOString() });
        throw new Error('获取用户列表失败');
      }
      
      const users: AppUser[] = data.map(user => ({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        last_login: user.last_login,
        session_token: user.session_token,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      console.log('authService.getUsers - 获取用户列表成功:', { count: users.length, timestamp: new Date().toISOString() });
      
      return users;
    } catch (error) {
      console.error('authService.getUsers - 获取用户列表失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  }
}; 