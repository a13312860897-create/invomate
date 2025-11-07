/**
 * AI服务工厂类
 * 用于创建和管理不同类型的AI服务实例
 */
const OpenAIService = require('./openaiService');

// 可以在这里添加其他AI服务提供商
// const AnthropicService = require('./anthropicService');
// const GoogleAIService = require('./googleAIService');

class AIServiceFactory {
  constructor() {
    this.services = new Map();
    this.defaultProvider = 'openai';
  }

  /**
   * 创建AI服务实例
   * @param {string} provider - AI服务提供商
   * @param {Object} config - 配置选项
   * @returns {BaseAIService} - AI服务实例
   */
  createService(provider, config = {}) {
    let service;
    
    switch (provider.toLowerCase()) {
      case 'openai':
        service = new OpenAIService(config);
        break;
      
      // 可以在这里添加其他AI服务提供商
      // case 'anthropic':
      //   service = new AnthropicService(config);
      //   break;
      // 
      // case 'google':
      //   service = new GoogleAIService(config);
      //   break;
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    return service;
  }

  /**
   * 获取AI服务实例
   * @param {string} provider - AI服务提供商（可选，默认使用默认提供商）
   * @param {Object} config - 配置选项（可选）
   * @returns {BaseAIService} - AI服务实例
   */
  getService(provider = this.defaultProvider, config = {}) {
    const cacheKey = this.getCacheKey(provider, config);
    
    // 如果服务实例已存在且配置相同，则返回缓存的实例
    if (this.services.has(cacheKey)) {
      return this.services.get(cacheKey);
    }
    
    // 创建新的服务实例
    const service = this.createService(provider, config);
    
    // 缓存服务实例
    this.services.set(cacheKey, service);
    
    return service;
  }

  /**
   * 获取默认AI服务实例
   * @param {Object} config - 配置选项（可选）
   * @returns {BaseAIService} - AI服务实例
   */
  getDefaultService(config = {}) {
    return this.getService(this.defaultProvider, config);
  }

  /**
   * 设置默认AI服务提供商
   * @param {string} provider - AI服务提供商
   */
  setDefaultProvider(provider) {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    this.defaultProvider = provider;
  }

  /**
   * 检查是否支持指定的AI服务提供商
   * @param {string} provider - AI服务提供商
   * @returns {boolean} - 是否支持
   */
  isProviderSupported(provider) {
    switch (provider.toLowerCase()) {
      case 'openai':
        return true;
      
      // 可以在这里添加其他AI服务提供商
      // case 'anthropic':
      // case 'google':
      //   return true;
      
      default:
        return false;
    }
  }

  /**
   * 获取所有支持的AI服务提供商
   * @returns {Array<string>} - 支持的提供商列表
   */
  getSupportedProviders() {
    return ['openai']; // 可以在这里添加其他AI服务提供商
  }

  /**
   * 清除缓存的AI服务实例
   * @param {string} provider - AI服务提供商（可选）
   */
  clearCache(provider) {
    if (provider) {
      // 清除指定提供商的所有缓存实例
      for (const [key] of this.services) {
        if (key.startsWith(`${provider}_`)) {
          this.services.delete(key);
        }
      }
    } else {
      // 清除所有缓存实例
      this.services.clear();
    }
  }

  /**
   * 生成缓存键
   * @param {string} provider - AI服务提供商
   * @param {Object} config - 配置选项
   * @returns {string} - 缓存键
   */
  getCacheKey(provider, config) {
    // 将配置对象转换为字符串以生成缓存键
    const configStr = JSON.stringify(config);
    return `${provider}_${configStr}`;
  }
}

// 创建单例实例
const aiServiceFactory = new AIServiceFactory();

module.exports = aiServiceFactory;