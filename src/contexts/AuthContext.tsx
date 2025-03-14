import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { AppUser, AuthState, UserRole } from '../types/auth';

// 定义认证上下文类型
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  // 仅管理员可用的功能
  createUser: (email: string, password: string, role?: UserRole, displayName?: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<AppUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUsers: () => Promise<AppUser[]>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider组件初始化');
  
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    appUser: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  // 初始化认证状态
  useEffect(() => {
    console.log('AuthProvider useEffect - 初始化认证状态');
    
    const initAuth = async () => {
      console.log('initAuth - 开始初始化认证状态');
      try {
        // 获取当前会话
        console.log('initAuth - 获取当前会话');
        const session = await authService.getSession();
        
        if (session) {
          console.log('initAuth - 发现有效会话，获取用户信息');
          const user = await authService.getCurrentUser();
          let appUser = null;
          
          if (user) {
            console.log('initAuth - 获取应用用户信息');
            appUser = await authService.getAppUser(user.id);
          }
          
          console.log('initAuth - 设置认证状态:', { 
            isAuthenticated: true, 
            isAdmin: appUser?.role === 'admin',
            user: user?.email,
            appUser: appUser?.role
          });
          
          setAuthState({
            session,
            user,
            appUser,
            isLoading: false,
            isAuthenticated: !!session,
            isAdmin: appUser?.role === 'admin',
          });
        } else {
          console.log('initAuth - 没有有效会话，设置未认证状态');
          setAuthState({
            session: null,
            user: null,
            appUser: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error('initAuth - 初始化认证状态出错:', error);
        setAuthState({
          session: null,
          user: null,
          appUser: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    };

    // 监听认证状态变化
    console.log('AuthProvider - 设置认证状态变化监听器');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange - 认证状态变化:', { event, session: !!session });
        
        if (session) {
          console.log('onAuthStateChange - 有会话，获取用户信息');
          const user = await authService.getCurrentUser();
          let appUser = null;
          
          if (user) {
            console.log('onAuthStateChange - 获取应用用户信息');
            try {
              appUser = await authService.getAppUser(user.id);
              console.log('onAuthStateChange - 应用用户信息:', appUser);
            } catch (error) {
              console.error('onAuthStateChange - 获取应用用户信息失败:', error);
            }
          }
          
          console.log('onAuthStateChange - 设置认证状态:', { 
            isAuthenticated: true, 
            isAdmin: appUser?.role === 'admin',
            user: user?.email,
            appUser: appUser?.role
          });
          
          setAuthState({
            session,
            user,
            appUser,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: appUser?.role === 'admin',
          });
        } else {
          console.log('onAuthStateChange - 无会话，设置未认证状态');
          setAuthState({
            session: null,
            user: null,
            appUser: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      }
    );

    initAuth();

    // 清理订阅
    return () => {
      console.log('AuthProvider - 清理认证状态变化监听器');
      subscription.unsubscribe();
    };
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    console.log('AuthContext.login - 开始登录:', email, { timestamp: new Date().toISOString() });
    try {
      console.log('AuthContext.login - 调用authService.login前', { timestamp: new Date().toISOString() });
      const result = await authService.login(email, password);
      console.log('AuthContext.login - 登录成功:', { 
        session: result.session ? '有效' : '无效',
        user: result.user?.email,
        timestamp: new Date().toISOString()
      });
      
      // 检查认证状态是否已更新
      console.log('AuthContext.login - 检查认证状态:', { 
        isAuthenticated: authState.isAuthenticated,
        user: authState.user?.email,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('AuthContext.login - 登录失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    console.log('AuthContext.logout - 开始登出');
    try {
      await authService.logout();
      console.log('AuthContext.logout - 登出成功');
    } catch (error) {
      console.error('AuthContext.logout - 登出失败:', error);
      throw error;
    }
  };

  // 管理员创建用户
  const createUser = async (email: string, password: string, role: UserRole = 'user', displayName?: string) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以创建用户');
    }
    
    try {
      await authService.createUser(email, password, role, displayName);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  };

  // 管理员更新用户
  const updateUser = async (userId: string, updates: Partial<AppUser>) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以更新用户');
    }
    
    try {
      await authService.updateUser(userId, updates);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // 管理员删除用户
  const deleteUser = async (userId: string) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以删除用户');
    }
    
    try {
      await authService.deleteUser(userId);
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  // 管理员获取所有用户
  const getUsers = async () => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以查看所有用户');
    }
    
    try {
      return await authService.getUsers();
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  };

  console.log('AuthProvider渲染 - 当前认证状态:', { 
    isAuthenticated: authState.isAuthenticated, 
    isAdmin: authState.isAdmin,
    isLoading: authState.isLoading,
    user: authState.user?.email
  });

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        getUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
