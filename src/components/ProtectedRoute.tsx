import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 受保护的路由组件 - 确保只有已登录用户可以访问
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果用户已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
