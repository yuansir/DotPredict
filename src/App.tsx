import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { GameContainer } from './components/GameContainer';
import LoadingScreen from './components/LoadingScreen';
import { AlertProvider } from './contexts/AlertContext';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminButton from './components/AdminButton';
import AdminPage from './pages/AdminPage';
import { testConnection } from './lib/supabase';

/**
 * App组件 - 应用程序入口
 */
const App: React.FC = () => {
  console.log('App组件初始化', { timestamp: new Date().toISOString() });
  
  // 应用级状态
  const [isLoading, _setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success?: boolean; error?: string; duration?: number}>({});

  // 测试数据库连接
  useEffect(() => {
    console.log('App useEffect - 测试数据库连接', { timestamp: new Date().toISOString() });
    
    const checkConnection = async () => {
      try {
        const result = await testConnection();
        console.log('数据库连接测试结果:', result);
        setConnectionStatus(result);
      } catch (error) {
        console.error('数据库连接测试异常:', error);
        setConnectionStatus({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };
    
    checkConnection();
  }, []);

  console.log('App组件渲染', { 
    isLoading, 
    connectionStatus,
    timestamp: new Date().toISOString() 
  });

  return (
    <AuthProvider>
      <AlertProvider>
        <GameProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              {/* 连接状态指示器 - 仅在开发环境显示 */}
              {process.env.NODE_ENV === 'development' && (
                <div className={`fixed bottom-0 right-0 m-4 p-2 text-xs rounded-md z-50 ${
                  connectionStatus.success ? 'bg-green-100 text-green-800' : 
                  connectionStatus.success === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  DB: {connectionStatus.success ? `✓ ${connectionStatus.duration}ms` : 
                       connectionStatus.success === false ? `✗ ${connectionStatus.error}` : '...'} 
                </div>
              )}
              
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <div className="container mx-auto py-8 px-4 max-w-7xl">
                      <GameContainer />
                      <AdminButton />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
              </Routes>

          {/* 动画样式 */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes borderPulse {
                0%, 100% {
                  border-color: rgb(96 165 250);
                  box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
                }
                50% {
                  border-color: rgb(59 130 246);
                  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
                }
              }

              @keyframes colorPulse {
                0%, 100% {
                  filter: brightness(1) saturate(1);
                  transform: scale(1);
                }
                50% {
                  filter: brightness(1.1) saturate(1.1);
                  transform: scale(1.05);
                }
              }
            `,
          }} />

              {isLoading && <LoadingScreen />}
            </div>
          </Router>
        </GameProvider>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
