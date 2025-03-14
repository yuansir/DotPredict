import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * 受保护的路由组件 - 确保只有已登录用户可以访问
 * 如果设置了requireAdmin，则只有管理员可以访问
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();

  console.log('ProtectedRoute渲染', { 
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    requireAdmin,
    user: user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('ProtectedRoute useEffect - 认证状态变化', { 
      isAuthenticated, 
      isAdmin, 
      isLoading, 
      requireAdmin,
      user: user?.email,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, user]);

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    console.log('ProtectedRoute - 认证状态加载中', { timestamp: new Date().toISOString() });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    console.log('ProtectedRoute - 用户未认证，重定向到登录页面', { timestamp: new Date().toISOString() });
    return <Navigate to="/login" replace />;
  }

  // 如果需要管理员权限但用户不是管理员，重定向到首页
  if (requireAdmin && !isAdmin) {
    console.log('ProtectedRoute - 需要管理员权限但用户不是管理员，重定向到首页', { 
      requireAdmin, 
      isAdmin,
      timestamp: new Date().toISOString() 
    });
    return <Navigate to="/" replace />;
  }

  // 如果用户已登录且满足权限要求，渲染子组件
  console.log('ProtectedRoute - 用户已认证且满足权限要求，渲染子组件', { 
    requireAdmin, 
    isAdmin,
    timestamp: new Date().toISOString() 
  });
  return <>{children}</>;
};

export default ProtectedRoute;
