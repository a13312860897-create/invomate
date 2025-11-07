const logger = require('../utils/logger');
const { Integration, SyncLog } = require('../models');

/**
 * 集成错误处理中间件
 * 统一处理集成相关的错误和异常
 */
class IntegrationErrorHandler {
  /**
   * 包装异步路由处理器
   * @param {Function} fn - 异步处理函数
   * @returns {Function} 包装后的处理函数
   */
  static wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  /**
   * Express错误处理中间件
   * @param {Error} error - 错误对象
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async handleError(error, req, res, next) {
    try {
      const errorInfo = IntegrationErrorHandler.categorizeError(error);
      const integrationId = req.params.integrationId || req.body.integrationId;
      
      // 记录错误日志
      logger.error('Integration error occurred:', {
        type: errorInfo.type,
        message: errorInfo.message,
        status: errorInfo.status,
        integrationId,
        userId: req.user?.id,
        endpoint: req.originalUrl,
        method: req.method,
        stack: error.stack
      });
      
      // 更新集成状态（如果有集成ID）
      if (integrationId) {
        await IntegrationErrorHandler.updateIntegrationStatus(integrationId, errorInfo);
      }
      
      // 发送错误响应
      res.status(errorInfo.status).json({
        success: false,
        error: errorInfo.message,
        type: errorInfo.type,
        code: errorInfo.code,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    } catch (handlerError) {
      logger.error('Error in error handler:', handlerError.message);
      
      // 发送通用错误响应
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        type: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * 分类错误类型
   * @param {Error} error - 错误对象
   * @returns {Object} 错误信息
   */
  static categorizeError(error) {
    // HubSpot API错误
    if (error.response && error.response.config?.url?.includes('hubspot')) {
      return IntegrationErrorHandler.categorizeHubSpotError(error);
    }
    
    // Trello API错误
    if (error.response && error.response.config?.url?.includes('trello')) {
      return IntegrationErrorHandler.categorizeTrelloError(error);
    }
    
    // 数据库错误
    if (error.name === 'SequelizeError' || error.name === 'SequelizeValidationError') {
      return {
        type: 'DATABASE_ERROR',
        message: 'Database operation failed',
        status: 500,
        code: error.name
      };
    }
    
    // 验证错误
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return {
        type: 'VALIDATION_ERROR',
        message: error.message || 'Validation failed',
        status: 400,
        code: 'VALIDATION_FAILED'
      };
    }
    
    // 认证错误
    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      return {
        type: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
        status: 401,
        code: 'AUTH_FAILED'
      };
    }
    
    // 权限错误
    if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      return {
        type: 'AUTHORIZATION_ERROR',
        message: 'Access denied',
        status: 403,
        code: 'ACCESS_DENIED'
      };
    }
    
    // 网络错误
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return {
        type: 'NETWORK_ERROR',
        message: `Network error: ${error.code}`,
        status: 503,
        code: error.code
      };
    }
    
    // 默认错误
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      status: 500,
      code: 'UNKNOWN'
    };
  }
  
  /**
   * 分类HubSpot错误
   * @param {Error} error - 错误对象
   * @returns {Object} 错误信息
   */
  static categorizeHubSpotError(error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    switch (status) {
      case 401:
        return {
          type: 'HUBSPOT_AUTH_ERROR',
          message: 'HubSpot API key is invalid or expired',
          status: 400,
          code: 'INVALID_API_KEY'
        };
      
      case 403:
        return {
          type: 'HUBSPOT_PERMISSION_ERROR',
          message: 'Insufficient permissions for HubSpot API',
          status: 400,
          code: 'INSUFFICIENT_PERMISSIONS'
        };
      
      case 429:
        const retryAfter = error.response.headers['retry-after'] || 60;
        return {
          type: 'HUBSPOT_RATE_LIMIT',
          message: `HubSpot rate limit exceeded. Retry after ${retryAfter} seconds`,
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        };
      
      case 400:
        return {
          type: 'HUBSPOT_BAD_REQUEST',
          message: data?.message || 'Invalid request to HubSpot API',
          status: 400,
          code: 'BAD_REQUEST'
        };
      
      case 404:
        return {
          type: 'HUBSPOT_NOT_FOUND',
          message: 'HubSpot resource not found',
          status: 404,
          code: 'RESOURCE_NOT_FOUND'
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'HUBSPOT_SERVER_ERROR',
          message: 'HubSpot server error. Please try again later',
          status: 503,
          code: 'SERVER_ERROR'
        };
      
      default:
        return {
          type: 'HUBSPOT_API_ERROR',
          message: data?.message || 'HubSpot API error',
          status: status || 500,
          code: 'API_ERROR'
        };
    }
  }
  
  /**
   * 分类Trello错误
   * @param {Error} error - 错误对象
   * @returns {Object} 错误信息
   */
  static categorizeTrelloError(error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    switch (status) {
      case 401:
        return {
          type: 'TRELLO_AUTH_ERROR',
          message: 'Trello authentication failed',
          status: 400,
          code: 'INVALID_TOKEN'
        };
      
      case 403:
        return {
          type: 'TRELLO_PERMISSION_ERROR',
          message: 'Insufficient permissions for Trello API',
          status: 400,
          code: 'INSUFFICIENT_PERMISSIONS'
        };
      
      case 429:
        return {
          type: 'TRELLO_RATE_LIMIT',
          message: 'Trello rate limit exceeded',
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED'
        };
      
      default:
        return {
          type: 'TRELLO_API_ERROR',
          message: data?.message || 'Trello API error',
          status: status || 500,
          code: 'API_ERROR'
        };
    }
  }
  
  /**
   * 更新集成状态
   * @param {string} integrationId - 集成ID
   * @param {Object} errorInfo - 错误信息
   */
  static async updateIntegrationStatus(integrationId, errorInfo) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) return;
      
      // 根据错误类型决定是否更新状态
      const shouldUpdateStatus = [
        'HUBSPOT_AUTH_ERROR',
        'HUBSPOT_PERMISSION_ERROR',
        'TRELLO_AUTH_ERROR',
        'TRELLO_PERMISSION_ERROR'
      ].includes(errorInfo.type);
      
      if (shouldUpdateStatus) {
        await integration.update({
          status: 'error',
          errorMessage: errorInfo.message,
          lastErrorAt: new Date()
        });
      }
      
      // 记录错误到同步日志
      await SyncLog.create({
        integrationId,
        syncType: 'error',
        status: 'failed',
        error: errorInfo.message,
        errorType: errorInfo.type,
        startedAt: new Date(),
        completedAt: new Date()
      });
    } catch (updateError) {
      logger.error('Failed to update integration status:', updateError.message);
    }
  }
  
  /**
   * 创建错误响应
   * @param {string} type - 错误类型
   * @param {string} message - 错误消息
   * @param {number} status - HTTP状态码
   * @param {Object} additional - 额外信息
   * @returns {Object} 错误响应对象
   */
  static createErrorResponse(type, message, status = 500, additional = {}) {
    return {
      success: false,
      error: message,
      type,
      timestamp: new Date().toISOString(),
      ...additional
    };
  }
  
  /**
   * 包装异步函数以处理错误
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  static wrapAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  
  /**
   * 验证集成权限
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Function} next - 下一个中间件
   */
  static async validateIntegrationAccess(req, res, next) {
    try {
      const integrationId = req.params.integrationId;
      const userId = req.user?.id;
      
      if (!integrationId) {
        return res.status(400).json(
          IntegrationErrorHandler.createErrorResponse(
            'VALIDATION_ERROR',
            'Integration ID is required',
            400
          )
        );
      }
      
      if (!userId) {
        return res.status(401).json(
          IntegrationErrorHandler.createErrorResponse(
            'AUTHENTICATION_ERROR',
            'User authentication required',
            401
          )
        );
      }
      
      const integration = await Integration.findOne({
        where: {
          id: integrationId,
          userId: userId
        }
      });
      
      if (!integration) {
        return res.status(404).json(
          IntegrationErrorHandler.createErrorResponse(
            'AUTHORIZATION_ERROR',
            'Integration not found or access denied',
            404
          )
        );
      }
      
      req.integration = integration;
      next();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = IntegrationErrorHandler;