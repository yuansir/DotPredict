import React, { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { GameContainer } from './components/GameContainer';
import LoadingScreen from './components/LoadingScreen';
import AlertDialog from './components/AlertDialog';

/**
 * App组件 - 应用程序入口
 */
const App: React.FC = () => {
  // 应用级状态
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  /**
   * 显示提示信息
   */
  const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
  };

  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <GameContainer />
        </div>

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

        {/* 弹窗和加载组件 */}
        <AlertDialog
          isOpen={showAlert}
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlert(false)}
        />

        {isLoading && <LoadingScreen />}
      </div>
    </GameProvider>
  );
};

export default App;
