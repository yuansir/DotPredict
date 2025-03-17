/**
 * 防抖函数 - 避免短时间内重复触发
 * 
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖包装后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    // 保存最新的参数
    latestArgs = args;
    
    // 记录调试信息
    if (args[0] && typeof args[0] === 'object' && 'history' in args[0]) {
      console.log('[DEBUG] debounce - 接收到新参数:', {
        historyLength: (args[0] as any).history?.length || 0,
        time: new Date().toISOString()
      });
    }
    
    if (timer) {
      clearTimeout(timer);
      console.log('[DEBUG] debounce - 清除之前的定时器');
    }
    
    timer = setTimeout(() => {
      console.log('[DEBUG] debounce - 执行延迟函数');
      // 使用最新的参数
      fn.apply(this, latestArgs || args);
      timer = null;
      latestArgs = null;
    }, delay);
  };
}
