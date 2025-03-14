/**
 * 错误消息转换工具 - 将英文错误消息转换为中文
 */

// 错误消息映射表
const errorMessages: Record<string, string> = {
  // 认证相关错误
  'Invalid login credentials': '账户或者密码错误',
  'Email not confirmed': '邮箱未验证，请先验证邮箱',
  'User not found': '用户不存在',
  'Email already in use': '邮箱已被使用',
  'Password is too weak': '密码强度不足',
  'Password recovery failed': '密码恢复失败',
  'Email link is invalid or has expired': '邮箱链接无效或已过期',
  'Token has expired or is invalid': '令牌已过期或无效',
  'User already registered': '用户已注册',
  'New password should be different from the old password': '新密码不能与旧密码相同',
  'Unable to validate email address': '无法验证邮箱地址',
  
  // 通用错误
  'Network error': '网络错误，请检查网络连接',
  'Server error': '服务器错误，请稍后再试',
  'Request failed': '请求失败，请稍后再试',
  'Timeout': '请求超时，请稍后再试',
  'Unknown error': '未知错误，请稍后再试',
  
  // 默认错误
  'default': '操作失败，请稍后再试'
};

/**
 * 将英文错误消息转换为中文
 * @param message 英文错误消息
 * @returns 中文错误消息
 */
export const translateErrorMessage = (message: string): string => {
  // 精确匹配
  if (errorMessages[message]) {
    return errorMessages[message];
  }
  
  // 部分匹配
  for (const key in errorMessages) {
    if (message.includes(key)) {
      return errorMessages[key];
    }
  }
  
  // 默认返回原始消息
  return message;
};

/**
 * 处理认证错误，返回友好的中文错误消息
 * @param error 错误对象
 * @returns 友好的中文错误消息
 */
export const handleAuthError = (error: any): string => {
  if (!error) return errorMessages.default;
  
  // 如果有错误消息，尝试翻译
  if (error.message) {
    return translateErrorMessage(error.message);
  }
  
  // 如果有错误代码，根据代码返回消息
  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return '邮箱格式不正确';
      case 'auth/user-disabled':
        return '用户已被禁用';
      case 'auth/user-not-found':
        return '用户不存在';
      case 'auth/wrong-password':
        return '密码错误';
      case 'auth/email-already-in-use':
        return '邮箱已被使用';
      case 'auth/weak-password':
        return '密码强度不足';
      case 'auth/operation-not-allowed':
        return '操作不被允许';
      case 'auth/invalid-credential':
        return '认证信息无效';
      default:
        return `认证错误 (${error.code})`;
    }
  }
  
  // 默认错误消息
  return errorMessages.default;
}; 