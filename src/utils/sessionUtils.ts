/**
 * 会话管理工具 - 提供会话令牌的存储、获取和清除功能
 */

// 会话令牌的本地存储键
const SESSION_TOKEN_KEY = 'app_session_token';
// 会话过期时间的本地存储键
const SESSION_EXPIRES_KEY = 'app_session_expires';
// 默认会话过期时间（24小时）
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * 存储会话令牌
 * @param token 会话令牌
 * @param duration 会话持续时间（毫秒），默认24小时
 */
export const setSessionToken = (token: string, duration: number = DEFAULT_SESSION_DURATION): void => {
  try {
    // 存储令牌
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    
    // 计算过期时间
    const expiresAt = new Date().getTime() + duration;
    localStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
    
    console.log('会话令牌已存储，过期时间:', new Date(expiresAt).toISOString());
  } catch (error) {
    console.error('存储会话令牌失败:', error);
  }
};

/**
 * 获取会话令牌
 * @returns 会话令牌，如果不存在或已过期则返回null
 */
export const getSessionToken = (): string | null => {
  try {
    // 获取令牌和过期时间
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(SESSION_EXPIRES_KEY);
    
    // 如果令牌不存在，返回null
    if (!token || !expiresAtStr) {
      return null;
    }
    
    // 检查是否过期
    const expiresAt = parseInt(expiresAtStr, 10);
    const now = new Date().getTime();
    
    if (now > expiresAt) {
      // 如果已过期，清除令牌并返回null
      clearSessionToken();
      console.log('会话令牌已过期');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('获取会话令牌失败:', error);
    return null;
  }
};

/**
 * 清除会话令牌
 */
export const clearSessionToken = (): void => {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRES_KEY);
    console.log('会话令牌已清除');
  } catch (error) {
    console.error('清除会话令牌失败:', error);
  }
};

/**
 * 刷新会话令牌的过期时间
 * @param duration 新的会话持续时间（毫秒），默认24小时
 * @returns 是否成功刷新
 */
export const refreshSessionExpiry = (duration: number = DEFAULT_SESSION_DURATION): boolean => {
  try {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      return false;
    }
    
    // 计算新的过期时间
    const expiresAt = new Date().getTime() + duration;
    localStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
    
    console.log('会话过期时间已刷新，新过期时间:', new Date(expiresAt).toISOString());
    return true;
  } catch (error) {
    console.error('刷新会话过期时间失败:', error);
    return false;
  }
};

/**
 * 检查会话是否有效
 * @returns 会话是否有效
 */
export const isSessionValid = (): boolean => {
  return getSessionToken() !== null;
}; 