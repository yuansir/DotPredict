import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertDialog from '../components/AlertDialog';

// 定义上下文类型
interface AlertContextType {
  showAlert: (message: string, type?: 'info' | 'warning' | 'error') => void;
}

// 创建上下文
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Provider组件
interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  // 弹窗状态
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'warning' | 'error'>('info');

  // 显示弹窗
  const showAlert = (msg: string, type: 'info' | 'warning' | 'error' = 'info') => {
    setMessage(msg);
    setAlertType(type);
    setIsOpen(true);
  };

  // 关闭弹窗
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog
        isOpen={isOpen}
        message={message}
        type={alertType}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

// 自定义Hook
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
