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
  console.log('AuthProvider组件初始化');
  
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  // 初始化认证状态
  useEffect(() => {
    console.log('AuthProvider useEffect - 初始化认证状态', { timestamp: new Date().toISOString() });
    
    // 添加超时处理
    const authTimeoutId = setTimeout(() => {
      console.warn('AuthProvider - 认证初始化超时，强制设置为未认证状态', { timestamp: new Date().toISOString() });
      setAuthState({
        currentUser: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }, 10000); // 10秒超时
    
    const initAuth = async () => {
      try {
        console.log('AuthProvider - 开始获取当前用户', { timestamp: new Date().toISOString() });
        const user = await authService.getCurrentUser();
        
        if (user) {
          console.log('AuthProvider - 用户已登录:', { 
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString()
          });
          
          setAuthState({
            currentUser: user,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
          });
        } else {
          console.log('AuthProvider - 用户未登录', { timestamp: new Date().toISOString() });
          setAuthState({
            currentUser: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error('AuthProvider - 初始化认证状态失败:', error, { timestamp: new Date().toISOString() });
        setAuthState({
          currentUser: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      } finally {
        clearTimeout(authTimeoutId);
      }
    };
    
    initAuth();
    
    return () => {
      clearTimeout(authTimeoutId);
    };
  }, []);

  // 登录
  const login = async (email: string, password: string) => {
    console.log('AuthContext.login - 开始登录', { email, timestamp: new Date().toISOString() });
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { user } = await authService.login(email, password);
      
      setAuthState({
        currentUser: user,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
      });
      
      console.log('AuthContext.login - 登录成功', { 
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AuthContext.login - 登录失败:', error, { timestamp: new Date().toISOString() });
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    console.log('AuthContext.logout - 开始登出', { timestamp: new Date().toISOString() });
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setAuthState({
        currentUser: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
      
      console.log('AuthContext.logout - 登出成功', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('AuthContext.logout - 登出失败:', error, { timestamp: new Date().toISOString() });
      
      // 即使登出失败，也清除本地状态
      setAuthState({
        currentUser: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
      
      // 强制清除会话令牌
      clearSessionToken();
      
      throw error;
    }
  };

  // 创建用户（仅管理员可用）
  const createUser = async (email: string, password: string, role: UserRole = 'user', displayName?: string) => {
    console.log('AuthContext.createUser - 开始创建用户', { 
      email, 
      role, 
      displayName,
      timestamp: new Date().toISOString()
    });
    
    if (!authState.isAdmin) {
      console.error('AuthContext.createUser - 非管理员尝试创建用户', { timestamp: new Date().toISOString() });
      throw new Error('只有管理员可以创建用户');
    }
    
    try {
      await authService.createUser(email, password, role, displayName);
      console.log('AuthContext.createUser - 创建用户成功', { email, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('AuthContext.createUser - 创建用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  };

  // 更新用户（仅管理员可用）
  const updateUser = async (userId: string, updates: any) => {
    console.log('AuthContext.updateUser - 开始更新用户', { 
      userId, 
      updates,
      timestamp: new Date().toISOString()
    });
    
    if (!authState.isAdmin) {
      console.error('AuthContext.updateUser - 非管理员尝试更新用户', { timestamp: new Date().toISOString() });
      throw new Error('只有管理员可以更新用户');
    }
    
    try {
      await authService.updateUser(userId, updates);
      console.log('AuthContext.updateUser - 更新用户成功', { userId, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('AuthContext.updateUser - 更新用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  };

  // 删除用户（仅管理员可用）
  const deleteUser = async (userId: string) => {
    console.log('AuthContext.deleteUser - 开始删除用户', { userId, timestamp: new Date().toISOString() });
    
    if (!authState.isAdmin) {
      console.error('AuthContext.deleteUser - 非管理员尝试删除用户', { timestamp: new Date().toISOString() });
      throw new Error('只有管理员可以删除用户');
    }
    
    try {
      await authService.deleteUser(userId);
      console.log('AuthContext.deleteUser - 删除用户成功', { userId, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('AuthContext.deleteUser - 删除用户失败:', error, { timestamp: new Date().toISOString() });
      throw error;
    }
  };

  // 获取所有用户（仅管理员可用）
  const getUsers = async () => {
    console.log('AuthContext.getUsers - 开始获取所有用户', { timestamp: new Date().toISOString() });
    
    if (!authState.isAdmin) {
      console.error('AuthContext.getUsers - 非管理员尝试获取所有用户', { timestamp: new Date().toISOString() });
      throw new Error('只有管理员可以查看所有用户');
    }
    
    try {
      const users = await authService.getUsers();
      console.log('AuthContext.getUsers - 获取所有用户成功', { 
        count: users.length,
        timestamp: new Date().toISOString()
      });
      return users;
    } catch (error) {
      console.error('AuthContext.getUsers - 获取所有用户失败:', error, { timestamp: new Date().toISOString() });
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
