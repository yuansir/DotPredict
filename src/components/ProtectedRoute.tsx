import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 受保护路由组件 - 确保只有已认证用户可以访问
 * 可选参数requireAdmin用于限制只有管理员可以访问
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果需要管理员权限但用户不是管理员，显示未授权
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-red-500 mb-4">访问被拒绝</div>
        <div className="text-gray-600">您没有访问此页面的权限</div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    );
  }

  // 通过所有检查，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
