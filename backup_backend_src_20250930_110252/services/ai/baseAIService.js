/**
 * AI服务基础抽象类
 * 定义所有AI服务的通用接口和基础功能
 */
class BaseAIService {
  constructor(config = {}) {
    this.provider = config.provider || 'openai';
    this.model = config.model || 'gpt-3.5-turbo';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000; // 30秒超时
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
  }

  /**
   * 生成文本的通用接口
   * @param {string} prompt - 提示词
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 生成结果
   */
  async generateText(prompt, options = {}) {
    throw new Error('generateText method must be implemented by subclass');
  }

  /**
   * 处理文档的通用接口
   * @param {Buffer|string} document - 文档内容或路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 处理结果
   */
  async processDocument(document, options = {}) {
    throw new Error('processDocument method must be implemented by subclass');
  }

  /**
   * 分析数据的通用接口
   * @param {Object} data - 要分析的数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 分析结果
   */
  async analyzeData(data, options = {}) {
    throw new Error('analyzeData method must be implemented by subclass');
  }

  /**
   * 记录AI请求日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<void>}
   */
  async logRequest(logData) {
    // 实现日志记录逻辑
    console.log('AI Request Log:', logData);
    // TODO: 将日志保存到数据库
  }

  /**
   * 处理PII数据
   * @param {string} text - 包含可能PII的文本
   * @returns {Object} - {sanitizedText, piiMap}
   */
  sanitizePII(text) {
    // 简单的PII检测和替换逻辑
    // 实际实现应该使用更复杂的PII检测算法
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    
    const piiMap = {};
    let sanitizedText = text;
    
    // 替换邮箱
    sanitizedText = sanitizedText.replace(emailRegex, (match) => {
      const id = `EMAIL_${Object.keys(piiMap).length + 1}`;
      piiMap[id] = match;
      return id;
    });
    
    // 替换电话号码
    sanitizedText = sanitizedText.replace(phoneRegex, (match) => {
      const id = `PHONE_${Object.keys(piiMap).length + 1}`;
      piiMap[id] = match;
      return id;
    });
    
    return { sanitizedText, piiMap };
  }

  /**
   * 恢复PII数据
   * @param {string} sanitizedText - 清理后的文本
   * @param {Object} piiMap - PII映射
   * @returns {string} - 恢复PII后的文本
   */
  restorePII(sanitizedText, piiMap) {
    let restoredText = sanitizedText;
    
    for (const [id, value] of Object.entries(piiMap)) {
      restoredText = restoredText.replace(new RegExp(id, 'g'), value);
    }
    
    return restoredText;
  }

  /**
   * 重试机制
   * @param {Function} fn - 要重试的函数
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<any>} - 函数执行结果
   */
  async withRetry(fn, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed:`, error.message);
        
        // 如果是最后一次尝试，抛出错误
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // 指数退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * 超时控制
   * @param {Promise} promise - 要执行的Promise
   * @param {number} timeoutMs - 超时时间（毫秒）
   * @returns {Promise<any>} - Promise结果
   */
  async withTimeout(promise, timeoutMs = this.timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
}

module.exports = BaseAIService;