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
    const key = `${provider}_${JSON.stringify(config)}`;
    
    if (!this.services.has(key)) {
      const service = this.createService(provider, config);
      this.services.set(key, service);
    }
    
    return this.services.get(key);
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
   * 获取支持的AI服务提供商列表
   * @returns {Array<string>} - 支持的提供商列表
   */
  getSupportedProviders() {
    return [
      'openai',
      // 'anthropic',
      // 'google'
    ];
  }

  /**
   * 检查是否支持指定的AI服务提供商
   * @param {string} provider - AI服务提供商
   * @returns {boolean} - 是否支持
   */
  isProviderSupported(provider) {
    return this.getSupportedProviders().includes(provider.toLowerCase());
  }

  /**
   * 设置默认AI服务提供商
   * @param {string} provider - AI服务提供商
   */
  setDefaultProvider(provider) {
    if (!this.isProviderSupported(provider)) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    this.defaultProvider = provider.toLowerCase();
  }

  /**
   * 清除缓存的服务实例
   * @param {string} provider - AI服务提供商（可选，不指定则清除所有）
   */
  clearCache(provider = null) {
    if (provider) {
      // 清除指定提供商的缓存
      const keysToDelete = [];
      for (const key of this.services.keys()) {
        if (key.startsWith(`${provider}_`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.services.delete(key));
    } else {
      // 清除所有缓存
      this.services.clear();
    }
  }

  /**
   * 获取服务统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    const stats = {
      totalServices: this.services.size,
      defaultProvider: this.defaultProvider,
      supportedProviders: this.getSupportedProviders(),
      cachedServices: {}
    };

    // 统计每个提供商的缓存服务数量
    for (const key of this.services.keys()) {
      const provider = key.split('_')[0];
      if (!stats.cachedServices[provider]) {
        stats.cachedServices[provider] = 0;
      }
      stats.cachedServices[provider]++;
    }

    return stats;
  }

  /**
   * 验证AI服务配置
   * @param {string} provider - AI服务提供商
   * @param {Object} config - 配置选项
   * @returns {Object} - 验证结果
   */
  validateConfig(provider, config) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!this.isProviderSupported(provider)) {
      result.isValid = false;
      result.errors.push(`Unsupported AI provider: ${provider}`);
      return result;
    }

    // 根据不同提供商验证配置
    switch (provider.toLowerCase()) {
      case 'openai':
        if (!config.apiKey && !process.env.OPENAI_API_KEY) {
          result.warnings.push('OpenAI API key not provided in config or environment variables');
        }
        break;
    }

    return result;
  }
}

// 创建单例实例
const aiServiceFactory = new AIServiceFactory();

module.exports = aiServiceFactory;