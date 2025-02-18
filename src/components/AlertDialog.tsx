import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertDialogProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: 'info' | 'warning' | 'error';
}

const AlertDialog: React.FC<AlertDialogProps> = ({ 
  isOpen, 
  message, 
  onClose,
  type = 'info'
}) => {
  const colors = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400',
      button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-400',
      button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-400',
      button: 'bg-red-100 hover:bg-red-200 text-red-800'
    }
  };

  const colorScheme = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-25"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={`max-w-sm w-full ${colorScheme.bg} ${colorScheme.border} border rounded-lg shadow-lg`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {type === 'info' && (
                    <svg className={`w-6 h-6 ${colorScheme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  {type === 'warning' && (
                    <svg className={`w-6 h-6 ${colorScheme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  )}
                  {type === 'error' && (
                    <svg className={`w-6 h-6 ${colorScheme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${colorScheme.text}`}>
                    {message}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${colorScheme.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  onClick={onClose}
                >
                  知道了
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertDialog;
