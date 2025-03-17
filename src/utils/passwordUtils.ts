/**
 * 密码工具 - 提供密码哈希和验证功能
 */
import * as bcrypt from 'bcryptjs';

/**
 * 对密码进行哈希处理
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // 使用bcrypt生成盐值和哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('密码哈希失败:', error);
    throw new Error('密码哈希处理失败');
  }
};

/**
 * 验证密码是否匹配
 * @param password 原始密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否匹配
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    // 使用bcrypt比较密码
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
};

/**
 * 生成临时密码
 * @param length 密码长度
 * @returns 生成的临时密码
 */
export const generateTempPassword = (length: number = 10): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}; 