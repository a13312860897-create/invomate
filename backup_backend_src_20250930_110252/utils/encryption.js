const crypto = require('crypto');
const bcrypt = require('bcrypt');

// 加密配置
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_ROUNDS = 12;

// 从环境变量获取主密钥，如果不存在则生成一个
const MASTER_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH).toString('hex');

if (!process.env.ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. Using generated key.');
  console.warn('Generated key:', MASTER_KEY);
  console.warn('Please set ENCRYPTION_KEY in your environment variables for production.');
}

// 将十六进制字符串转换为Buffer
const masterKeyBuffer = Buffer.from(MASTER_KEY, 'hex');

/**
 * 加密敏感数据
 * @param {string} text - 要加密的文本
 * @param {string} additionalData - 可选的附加认证数据
 * @returns {string} 加密后的数据（base64编码）
 */
const encrypt = (text, additionalData = '') => {
  try {
    if (!text) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, masterKeyBuffer, iv);
    
    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // 组合IV、认证标签和加密数据
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * 解密敏感数据
 * @param {string} encryptedData - 加密的数据（base64编码）
 * @param {string} additionalData - 可选的附加认证数据
 * @returns {string} 解密后的文本
 */
const decrypt = (encryptedData, additionalData = '') => {
  try {
    if (!encryptedData) return null;
    
    const combined = Buffer.from(encryptedData, 'base64');
    
    // 提取IV、认证标签和加密数据
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = combined.slice(IV_LENGTH + 16);
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, masterKeyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * 哈希密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 哈希后的密码
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hashedPassword - 哈希后的密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
const verifyPassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * 生成安全的随机令牌
 * @param {number} length - 令牌长度（字节）
 * @returns {string} 十六进制令牌
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * 创建HMAC签名
 * @param {string} data - 要签名的数据
 * @param {string} secret - 签名密钥
 * @returns {string} HMAC签名
 */
const createHMAC = (data, secret = MASTER_KEY) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * 验证HMAC签名
 * @param {string} data - 原始数据
 * @param {string} signature - 签名
 * @param {string} secret - 签名密钥
 * @returns {boolean} 签名是否有效
 */
const verifyHMAC = (data, signature, secret = MASTER_KEY) => {
  const expectedSignature = createHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * 加密对象（将对象序列化后加密）
 * @param {Object} obj - 要加密的对象
 * @param {string} additionalData - 可选的附加认证数据
 * @returns {string} 加密后的数据
 */
const encryptObject = (obj, additionalData = '') => {
  try {
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString, additionalData);
  } catch (error) {
    console.error('Object encryption error:', error);
    throw new Error('Failed to encrypt object');
  }
};

/**
 * 解密对象（解密后反序列化为对象）
 * @param {string} encryptedData - 加密的数据
 * @param {string} additionalData - 可选的附加认证数据
 * @returns {Object} 解密后的对象
 */
const decryptObject = (encryptedData, additionalData = '') => {
  try {
    const jsonString = decrypt(encryptedData, additionalData);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Object decryption error:', error);
    throw new Error('Failed to decrypt object');
  }
};

/**
 * 安全地比较两个字符串（防止时序攻击）
 * @param {string} a - 字符串A
 * @param {string} b - 字符串B
 * @returns {boolean} 字符串是否相等
 */
const safeCompare = (a, b) => {
  try {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }
    
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch (error) {
    return false;
  }
};

/**
 * 生成密码重置令牌
 * @param {string} userId - 用户ID
 * @param {string} email - 用户邮箱
 * @returns {Object} 包含令牌和过期时间的对象
 */
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
  };
  
  const token = encryptObject(payload, 'password_reset');
  
  return {
    token,
    expires: payload.expires
  };
};

/**
 * 验证密码重置令牌
 * @param {string} token - 重置令牌
 * @returns {Object|null} 解密后的载荷或null（如果无效）
 */
const verifyPasswordResetToken = (token) => {
  try {
    const payload = decryptObject(token, 'password_reset');
    
    // 检查是否过期
    if (Date.now() > payload.expires) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Password reset token verification error:', error);
    return null;
  }
};

/**
 * 数据脱敏函数
 * @param {string} data - 要脱敏的数据
 * @param {string} type - 数据类型（email, phone, card等）
 * @returns {string} 脱敏后的数据
 */
const maskSensitiveData = (data, type = 'default') => {
  if (!data) return data;
  
  switch (type) {
    case 'email':
      const [username, domain] = data.split('@');
      if (username && domain) {
        const maskedUsername = username.length > 2 
          ? username.substring(0, 2) + '*'.repeat(username.length - 2)
          : '*'.repeat(username.length);
        return `${maskedUsername}@${domain}`;
      }
      return data;
      
    case 'phone':
      if (data.length > 4) {
        return '*'.repeat(data.length - 4) + data.slice(-4);
      }
      return '*'.repeat(data.length);
      
    case 'card':
      if (data.length > 4) {
        return '*'.repeat(data.length - 4) + data.slice(-4);
      }
      return '*'.repeat(data.length);
      
    case 'name':
      if (data.length > 2) {
        return data.substring(0, 1) + '*'.repeat(data.length - 2) + data.slice(-1);
      }
      return '*'.repeat(data.length);
      
    default:
      if (data.length > 6) {
        return data.substring(0, 3) + '*'.repeat(data.length - 6) + data.slice(-3);
      }
      return '*'.repeat(data.length);
  }
};

/**
 * 生成数据完整性校验码
 * @param {Object} data - 要校验的数据
 * @returns {string} 校验码
 */
const generateChecksum = (data) => {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
};

/**
 * 验证数据完整性
 * @param {Object} data - 数据
 * @param {string} expectedChecksum - 期望的校验码
 * @returns {boolean} 数据是否完整
 */
const verifyChecksum = (data, expectedChecksum) => {
  const actualChecksum = generateChecksum(data);
  return safeCompare(actualChecksum, expectedChecksum);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateUUID,
  createHMAC,
  verifyHMAC,
  encryptObject,
  decryptObject,
  safeCompare,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  maskSensitiveData,
  generateChecksum,
  verifyChecksum
};