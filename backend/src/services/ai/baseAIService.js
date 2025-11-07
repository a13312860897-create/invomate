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
    // 基础日志记录实现
    console.log(`[${this.provider}] AI Request:`, {
      timestamp: new Date().toISOString(),
      model: this.model,
      ...logData
    });
  }

  /**
   * 生成请求ID
   * @returns {string} - 唯一请求ID
   */
  generateRequestId() {
    return `${this.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理PII数据（个人身份信息）
   * @param {string} text - 原始文本
   * @returns {Object} - 处理结果
   */
  sanitizePII(text) {
    // 简化的PII处理实现
    const piiMap = new Map();
    let sanitizedText = text;
    
    // 这里可以添加更复杂的PII检测和替换逻辑
    // 目前只是返回原始文本
    
    return {
      sanitizedText,
      piiMap
    };
  }

  /**
   * 恢复PII数据
   * @param {string} text - 处理后的文本
   * @param {Map} piiMap - PII映射表
   * @returns {string} - 恢复后的文本
   */
  restorePII(text, piiMap) {
    let restoredText = text;
    
    // 恢复PII数据
    for (const [placeholder, originalValue] of piiMap) {
      restoredText = restoredText.replace(new RegExp(placeholder, 'g'), originalValue);
    }
    
    return restoredText;
  }

  /**
   * 验证配置
   * @returns {Object} - 验证结果
   */
  validateConfig() {
    const errors = [];
    const warnings = [];
    
    if (!this.apiKey) {
      warnings.push('API key not provided');
    }
    
    if (this.timeout < 1000) {
      warnings.push('Timeout is very low, may cause request failures');
    }
    
    if (this.maxRetries < 1) {
      errors.push('Max retries must be at least 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取服务状态
   * @returns {Object} - 服务状态
   */
  getStatus() {
    return {
      provider: this.provider,
      model: this.model,
      isConfigured: !!this.apiKey,
      config: {
        maxRetries: this.maxRetries,
        timeout: this.timeout,
        temperature: this.temperature,
        maxTokens: this.maxTokens
      }
    };
  }

  /**
   * 重试机制
   * @param {Function} fn - 要重试的函数
   * @param {number} retries - 重试次数
   * @returns {Promise<any>} - 函数执行结果
   */
  async retry(fn, retries = this.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying request, ${retries} attempts remaining:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
        return this.retry(fn, retries - 1);
      }
      throw error;
    }
  }
}

module.exports = BaseAIService;