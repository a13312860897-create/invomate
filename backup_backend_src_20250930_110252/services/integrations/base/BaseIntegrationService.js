const axios = require('axios');
const { SyncLog } = require('../../../models');

/**
 * 基础集成服务类
 * 所有第三方集成服务的基类，提供通用的认证、数据同步、错误处理等功能
 */
class BaseIntegrationService {
  constructor(config) {
    this.platform = config.platform;
    this.platformType = config.platformType; // 'crm' or 'project_management'
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.integrationId = config.integrationId;
    
    // 创建axios实例
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InvoiceApp-Integration/1.0'
      }
    });
    
    // 添加请求拦截器
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`[${this.platform}] API Request:`, {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        console.error(`[${this.platform}] Request Error:`, error);
        return Promise.reject(error);
      }
    );
    
    // 添加响应拦截器
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`[${this.platform}] API Response:`, {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        console.error(`[${this.platform}] Response Error:`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 认证方法 - 子类必须实现
   * @returns {Promise<Object>} 认证结果
   */
  async authenticate() {
    throw new Error(`authenticate method must be implemented by ${this.platform} service`);
  }

  /**
   * 验证连接状态
   * @returns {Promise<boolean>} 连接是否有效
   */
  async validateConnection() {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error(`[${this.platform}] Connection validation failed:`, error.message);
      return false;
    }
  }

  /**
   * 数据同步方法 - 子类必须实现
   * @param {string} entityType - 实体类型 (client, invoice, project等)
   * @param {string} operation - 操作类型 (pull, push, bidirectional)
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncData(entityType, operation = 'pull', options = {}) {
    throw new Error(`syncData method must be implemented by ${this.platform} service`);
  }

  /**
   * 数据映射方法 - 子类必须实现
   * @param {Object} data - 要映射的数据
   * @param {string} direction - 映射方向 ('inbound' | 'outbound')
   * @returns {Object} 映射后的数据
   */
  async mapData(data, direction = 'inbound') {
    throw new Error(`mapData method must be implemented by ${this.platform} service`);
  }

  /**
   * Webhook处理方法 - 子类可选实现
   * @param {Object} payload - Webhook载荷
   * @returns {Promise<Object>} 处理结果
   */
  async handleWebhook(payload) {
    console.log(`[${this.platform}] Webhook received but not implemented`);
    return { success: false, message: 'Webhook handler not implemented' };
  }

  /**
   * 带重试的HTTP请求
   * @param {Function} requestFn - 请求函数
   * @param {number} attempt - 当前尝试次数
   * @returns {Promise<any>} 请求结果
   */
  async requestWithRetry(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        console.log(`[${this.platform}] Retrying request (${attempt}/${this.retryAttempts})...`);
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * 判断错误是否可重试
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否可重试
   */
  isRetryableError(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.response?.status;
    return retryableStatuses.includes(status) || error.code === 'ECONNRESET';
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录同步日志
   * @param {string} syncType - 同步类型
   * @param {string} entityType - 实体类型
   * @param {string} operation - 操作类型
   * @param {string} status - 状态
   * @param {Object} data - 同步数据
   * @param {string} errorMessage - 错误信息
   * @returns {Promise<Object>} 日志记录
   */
  async logSync(syncType, entityType, operation, status, data = null, errorMessage = null) {
    try {
      const logData = {
        integration_id: this.integrationId,
        sync_type: syncType,
        entity_type: entityType,
        operation: operation,
        status: status,
        sync_data: data,
        error_message: errorMessage
      };
      
      return await SyncLog.create(logData);
    } catch (error) {
      console.error(`[${this.platform}] Failed to log sync:`, error);
      return null;
    }
  }

  /**
   * 批量处理数据
   * @param {Array} items - 要处理的项目数组
   * @param {Function} processFn - 处理函数
   * @param {number} batchSize - 批次大小
   * @returns {Promise<Array>} 处理结果数组
   */
  async processBatch(items, processFn, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => processFn(item));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // 批次间延迟，避免API限流
        if (i + batchSize < items.length) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`[${this.platform}] Batch processing error:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @returns {Object} 格式化的错误信息
   */
  formatError(error) {
    return {
      platform: this.platform,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取平台特定的配置
   * @returns {Object} 平台配置
   */
  getConfig() {
    return {
      platform: this.platform,
      platformType: this.platformType,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.httpClient) {
      // 清理axios实例
      this.httpClient = null;
    }
  }
}

module.exports = BaseIntegrationService;