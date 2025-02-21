import React from 'react';
import { motion } from 'framer-motion';

const dotVariants = {
  start: {
    y: 0,
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  },
  end: {
    y: -20
  }
};

const containerVariants = {
  start: {
    transition: {
      staggerChildren: 0.2
    }
  },
  end: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="text-center">
        <motion.div
          className="flex justify-center space-x-2 mb-4"
          variants={containerVariants}
          initial="start"
          animate="end"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-4 h-4 rounded-full bg-blue-500"
              // @ts-ignore
              variants={dotVariants}
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl font-semibold text-gray-700"
        >
          加载游戏数据中...
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-gray-500 mt-2"
        >
          请稍候片刻
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
