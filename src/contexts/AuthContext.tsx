import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { AppUser, AuthState, UserRole } from '../types/auth';
import { clearSessionToken } from '../utils/sessionUtils';

// 定义认证上下文类型
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // 仅管理员可用的功能
  createUser: (email: string, password: string, role?: UserRole, displayName?: string) => Promise<void>;
  updateUser: (userId: string, updates: any) => Promise<void>;
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
    currentUser: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false
  });

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        
        if (user) {
          setAuthState({
            currentUser: user,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: user.role === 'admin'
          });
        } else {
          setAuthState({
            currentUser: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false
          });
        }
      } catch (error) {
        setAuthState({
          currentUser: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false
        });
      }
    };

    initAuth();
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { user } = await authService.login(email, password);
      
      setAuthState({
        currentUser: user,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
      
      setAuthState({
        currentUser: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false
      });
    } catch (error) {
      // 即使登出失败，也清除本地状态
      setAuthState({
        currentUser: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false
      });
      
      // 强制清除会话令牌
      clearSessionToken();
      
      throw error;
    }
  };

  // 创建用户（仅管理员可用）
  const createUser = async (email: string, password: string, role: UserRole = 'user', displayName?: string) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以创建用户');
    }
    
    try {
      await authService.createUser(email, password, role, displayName);
    } catch (error) {
      throw error;
    }
  };

  // 更新用户（仅管理员可用）
  const updateUser = async (userId: string, updates: any) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以更新用户');
    }
    
    try {
      await authService.updateUser(userId, updates);
    } catch (error) {
      throw error;
    }
  };

  // 删除用户（仅管理员可用）
  const deleteUser = async (userId: string) => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以删除用户');
    }
    
    try {
      await authService.deleteUser(userId);
    } catch (error) {
      throw error;
    }
  };

  // 获取所有用户（仅管理员可用）
  const getUsers = async () => {
    if (!authState.isAdmin) {
      throw new Error('只有管理员可以查看所有用户');
    }
    
    try {
      const users = await authService.getUsers();
      return users;
    } catch (error) {
      throw error;
    }
  };

  // 提供认证上下文
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
