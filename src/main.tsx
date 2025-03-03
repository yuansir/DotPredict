// 过滤控制台日志，防止CLEARLY日志污染控制台
// 放在文件顶部，确保最早加载执行
if (typeof window !== 'undefined') {
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (args.length > 0 && typeof args[0] === 'string' && 
        (args[0].includes('CLEARLY') || args[0].includes('[CLEARLY'))) {
      return; // 直接返回，不打印日志
    }
    originalConsoleLog.apply(console, args);
  };
}

// React 在 JSX 转换中隐式使用
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.Fragment>
    <App />
  </React.Fragment>
)
