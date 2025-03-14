import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { AppUser, AuthState, UserRole } from '../types/auth';

// 定义认证上下文类型
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
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
    const initAuth = async () => {
      try {
        // 获取当前会话
        const session = await authService.getSession();
        
        if (session) {
          const user = await authService.getCurrentUser();
          let appUser = null;
          
          if (user) {
            appUser = await authService.getAppUser(user.id);
          }
          
          setAuthState({
            session,
            user,
            appUser,
            isLoading: false,
            isAuthenticated: !!session,
            isAdmin: appUser?.role === 'admin',
          });
        } else {
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
        console.error('Error initializing auth:', error);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const user = await authService.getCurrentUser();
          let appUser = null;
          
          if (user) {
            appUser = await authService.getAppUser(user.id);
          }
          
          setAuthState({
            session,
            user,
            appUser,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: appUser?.role === 'admin',
          });
        } else {
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
      subscription.unsubscribe();
    };
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
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
