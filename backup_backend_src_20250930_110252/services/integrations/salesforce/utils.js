const crypto = require('crypto');
const config = require('./config');

/**
 * Salesforce集成工具类
 */
class SalesforceUtils {
  /**
   * 验证Webhook签名
   */
  static verifyWebhookSignature(payload, signature, secret) {
    if (!config.webhooks.verification.enabled) {
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac(config.webhooks.verification.algorithm, secret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook签名验证失败:', error);
      return false;
    }
  }

  /**
   * 构建SOQL查询
   */
  static buildSOQLQuery(options) {
    const {
      select = ['Id'],
      from,
      where = [],
      orderBy = [],
      limit,
      offset
    } = options;

    let query = `SELECT ${select.join(', ')} FROM ${from}`;

    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    if (orderBy.length > 0) {
      query += ` ORDER BY ${orderBy.join(', ')}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  }

  /**
   * 转义SOQL字符串
   */
  static escapeSOQL(value) {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
  }

  /**
   * 格式化日期为Salesforce格式
   */
  static formatDateForSalesforce(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  }

  /**
   * 格式化日期时间为Salesforce格式
   */
  static formatDateTimeForSalesforce(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString();
  }

  /**
   * 解析Salesforce日期
   */
  static parseSalesforceDate(dateString) {
    if (!dateString) return null;
    return new Date(dateString + 'T00:00:00.000Z');
  }

  /**
   * 解析Salesforce日期时间
   */
  static parseSalesforceDateTime(dateTimeString) {
    if (!dateTimeString) return null;
    return new Date(dateTimeString);
  }

  /**
   * 验证邮箱格式
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证电话号码格式
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone?.replace(/\s/g, ''));
  }

  /**
   * 清理电话号码
   */
  static cleanPhoneNumber(phone) {
    if (!phone) return null;
    return phone.replace(/[^\d\+]/g, '');
  }

  /**
   * 生成唯一的外部ID
   */
  static generateExternalId(prefix = 'INV') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * 分块处理数组
   */
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 延迟执行
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试机制
   */
  static async retry(fn, options = {}) {
    const {
      attempts = config.api.retryAttempts,
      delay = config.api.retryDelay,
      backoff = true
    } = options;

    let lastError;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 检查是否为可重试的错误
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // 最后一次尝试，不再延迟
        if (i === attempts - 1) {
          break;
        }
        
        // 计算延迟时间
        const delayTime = backoff ? delay * Math.pow(2, i) : delay;
        await this.delay(delayTime);
      }
    }
    
    throw lastError;
  }

  /**
   * 检查是否为可重试的错误
   */
  static isRetryableError(error) {
    if (!error.response) {
      return true; // 网络错误等
    }

    const status = error.response.status;
    const errorCode = error.response.data?.errorCode;

    // HTTP状态码检查
    if (status >= 500 || status === 429) {
      return true;
    }

    // Salesforce错误代码检查
    if (errorCode && config.errorHandling.retryableErrors.includes(errorCode)) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否应该忽略错误
   */
  static shouldIgnoreError(error) {
    const errorCode = error.response?.data?.errorCode;
    return errorCode && config.errorHandling.ignoredErrors.includes(errorCode);
  }

  /**
   * 格式化错误信息
   */
  static formatError(error) {
    if (error.response?.data) {
      const { message, errorCode, fields } = error.response.data;
      return {
        message: message || 'Unknown Salesforce error',
        code: errorCode,
        fields: fields,
        status: error.response.status
      };
    }

    return {
      message: error.message || 'Unknown error',
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * 验证必填字段
   */
  static validateRequiredFields(data, requiredFields) {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        missingFields.push(field);
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * 清理数据对象（移除空值）
   */
  static cleanData(data, options = {}) {
    const { removeNull = true, removeEmpty = true, removeUndefined = true } = options;
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (removeUndefined && value === undefined) continue;
      if (removeNull && value === null) continue;
      if (removeEmpty && value === '') continue;
      
      cleaned[key] = value;
    }
    
    return cleaned;
  }

  /**
   * 构建批量操作请求
   */
  static buildBatchRequest(operations) {
    return {
      batchRequests: operations.map((op, index) => ({
        method: op.method || 'POST',
        url: op.url,
        richInput: op.data,
        binaryPartName: `request${index}`
      }))
    };
  }

  /**
   * 解析批量操作响应
   */
  static parseBatchResponse(response) {
    return response.results.map((result, index) => ({
      index,
      success: result.statusCode >= 200 && result.statusCode < 300,
      statusCode: result.statusCode,
      data: result.result,
      error: result.statusCode >= 400 ? result.result : null
    }));
  }

  /**
   * 计算API使用率
   */
  static calculateApiUsage(used, limit) {
    if (!limit || limit === 0) return 0;
    return Math.round((used / limit) * 100);
  }

  /**
   * 检查API限制
   */
  static checkApiLimits(headers) {
    const limits = {};
    
    // 解析API使用情况
    const apiUsage = headers['sforce-limit-info'];
    if (apiUsage) {
      const matches = apiUsage.match(/api-usage=(\d+)\/(\d+)/);
      if (matches) {
        limits.apiCalls = {
          used: parseInt(matches[1]),
          limit: parseInt(matches[2]),
          percentage: this.calculateApiUsage(parseInt(matches[1]), parseInt(matches[2]))
        };
      }
    }
    
    return limits;
  }

  /**
   * 生成状态报告
   */
  static generateStatusReport(stats) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: stats.success + stats.errors,
        successRate: stats.success / (stats.success + stats.errors) * 100,
        errorRate: stats.errors / (stats.success + stats.errors) * 100
      },
      details: stats
    };
  }
}

module.exports = SalesforceUtils;