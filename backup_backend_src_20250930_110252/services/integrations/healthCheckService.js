const logger = require('../../utils/logger');
const { Integration, SyncLog } = require('../../models');
const HubSpotService = require('./hubspotService');
const { Op } = require('sequelize');

/**
 * 集成健康检查服务
 * 监控所有集成的状态、性能和可用性
 */
class HealthCheckService {
  constructor() {
    this.checkInterval = 5 * 60 * 1000; // 5分钟
    this.isRunning = false;
    this.healthStatus = new Map();
    this.services = {
      hubspot: new HubSpotService()
    };
  }
  
  /**
   * 启动健康检查服务
   */
  start() {
    if (this.isRunning) {
      logger.warn('Health check service is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting integration health check service');
    
    // 立即执行一次检查
    this.performHealthCheck();
    
    // 设置定期检查
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }
  
  /**
   * 停止健康检查服务
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    logger.info('Integration health check service stopped');
  }
  
  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      logger.info('Performing integration health check');
      
      const integrations = await Integration.findAll({
        where: {
          status: {
            [Op.in]: ['active', 'error', 'warning']
          }
        }
      });
      
      const checkPromises = integrations.map(integration => 
        this.checkIntegrationHealth(integration)
      );
      
      const results = await Promise.allSettled(checkPromises);
      
      // 处理检查结果
      results.forEach((result, index) => {
        const integration = integrations[index];
        
        if (result.status === 'fulfilled') {
          this.healthStatus.set(integration.id, result.value);
        } else {
          logger.error(`Health check failed for integration ${integration.id}:`, result.reason);
          this.healthStatus.set(integration.id, {
            status: 'error',
            message: result.reason.message,
            timestamp: new Date(),
            metrics: null
          });
        }
      });
      
      // 生成健康报告
      await this.generateHealthReport();
      
    } catch (error) {
      logger.error('Health check service error:', error.message);
    }
  }
  
  /**
   * 检查单个集成的健康状态
   * @param {Object} integration - 集成对象
   * @returns {Promise<Object>} 健康状态
   */
  async checkIntegrationHealth(integration) {
    const startTime = Date.now();
    
    try {
      const service = this.services[integration.platform];
      if (!service) {
        return {
          status: 'unknown',
          message: `No health check service available for ${integration.platform}`,
          timestamp: new Date(),
          metrics: null
        };
      }
      
      // 测试连接
      const connectionResult = await service.testConnection(integration);
      const responseTime = Date.now() - startTime;
      
      // 获取同步统计
      const syncStats = await this.getSyncStatistics(integration.id);
      
      // 计算健康分数
      const healthScore = this.calculateHealthScore({
        connected: connectionResult.connected,
        responseTime,
        syncStats,
        lastSync: integration.lastSyncAt
      });
      
      // 确定状态
      let status = 'healthy';
      let message = 'Integration is functioning normally';
      
      if (!connectionResult.connected) {
        status = 'error';
        message = connectionResult.error || 'Connection failed';
      } else if (healthScore < 50) {
        status = 'warning';
        message = 'Integration performance is degraded';
      } else if (responseTime > 10000) {
        status = 'warning';
        message = 'High response time detected';
      }
      
      // 更新集成状态（如果需要）
      if (integration.status !== status && ['error', 'warning'].includes(status)) {
        await integration.update({
          status,
          errorMessage: status === 'error' ? message : null,
          lastCheckedAt: new Date()
        });
      } else if (status === 'healthy' && integration.status === 'error') {
        await integration.update({
          status: 'active',
          errorMessage: null,
          lastCheckedAt: new Date()
        });
      }
      
      return {
        status,
        message,
        timestamp: new Date(),
        metrics: {
          responseTime,
          healthScore,
          syncStats,
          connected: connectionResult.connected
        }
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await integration.update({
        status: 'error',
        errorMessage: error.message,
        lastCheckedAt: new Date()
      });
      
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        metrics: {
          responseTime,
          healthScore: 0,
          connected: false
        }
      };
    }
  }
  
  /**
   * 获取同步统计信息
   * @param {string} integrationId - 集成ID
   * @returns {Promise<Object>} 同步统计
   */
  async getSyncStatistics(integrationId) {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const [recent, weekly, lastSync, failedSyncs] = await Promise.all([
        // 最近24小时的同步
        SyncLog.count({
          where: {
            integrationId,
            startedAt: { [Op.gte]: last24Hours }
          }
        }),
        
        // 最近7天的同步
        SyncLog.count({
          where: {
            integrationId,
            startedAt: { [Op.gte]: last7Days }
          }
        }),
        
        // 最后一次成功同步
        SyncLog.findOne({
          where: {
            integrationId,
            status: 'completed'
          },
          order: [['completedAt', 'DESC']]
        }),
        
        // 最近失败的同步
        SyncLog.count({
          where: {
            integrationId,
            status: 'failed',
            startedAt: { [Op.gte]: last24Hours }
          }
        })
      ]);
      
      return {
        syncsLast24Hours: recent,
        syncsLast7Days: weekly,
        lastSuccessfulSync: lastSync?.completedAt || null,
        failedSyncsLast24Hours: failedSyncs,
        successRate: recent > 0 ? ((recent - failedSyncs) / recent * 100).toFixed(2) : 100
      };
    } catch (error) {
      logger.error(`Failed to get sync statistics for integration ${integrationId}:`, error.message);
      return {
        syncsLast24Hours: 0,
        syncsLast7Days: 0,
        lastSuccessfulSync: null,
        failedSyncsLast24Hours: 0,
        successRate: 0
      };
    }
  }
  
  /**
   * 计算健康分数
   * @param {Object} metrics - 指标数据
   * @returns {number} 健康分数 (0-100)
   */
  calculateHealthScore(metrics) {
    let score = 0;
    
    // 连接状态 (40分)
    if (metrics.connected) {
      score += 40;
    }
    
    // 响应时间 (20分)
    if (metrics.responseTime < 1000) {
      score += 20;
    } else if (metrics.responseTime < 5000) {
      score += 15;
    } else if (metrics.responseTime < 10000) {
      score += 10;
    }
    
    // 同步成功率 (25分)
    if (metrics.syncStats) {
      const successRate = parseFloat(metrics.syncStats.successRate);
      if (successRate >= 95) {
        score += 25;
      } else if (successRate >= 80) {
        score += 20;
      } else if (successRate >= 60) {
        score += 15;
      } else if (successRate >= 40) {
        score += 10;
      }
    }
    
    // 最近同步时间 (15分)
    if (metrics.lastSync) {
      const hoursSinceLastSync = (Date.now() - new Date(metrics.lastSync).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSync < 1) {
        score += 15;
      } else if (hoursSinceLastSync < 6) {
        score += 12;
      } else if (hoursSinceLastSync < 24) {
        score += 8;
      } else if (hoursSinceLastSync < 72) {
        score += 4;
      }
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * 生成健康报告
   */
  async generateHealthReport() {
    try {
      const totalIntegrations = this.healthStatus.size;
      const healthyCount = Array.from(this.healthStatus.values())
        .filter(status => status.status === 'healthy').length;
      const warningCount = Array.from(this.healthStatus.values())
        .filter(status => status.status === 'warning').length;
      const errorCount = Array.from(this.healthStatus.values())
        .filter(status => status.status === 'error').length;
      
      const report = {
        timestamp: new Date(),
        summary: {
          total: totalIntegrations,
          healthy: healthyCount,
          warning: warningCount,
          error: errorCount,
          healthPercentage: totalIntegrations > 0 ? 
            ((healthyCount / totalIntegrations) * 100).toFixed(2) : 100
        },
        details: Object.fromEntries(this.healthStatus)
      };
      
      logger.info('Integration health report:', {
        total: report.summary.total,
        healthy: report.summary.healthy,
        warning: report.summary.warning,
        error: report.summary.error,
        healthPercentage: report.summary.healthPercentage
      });
      
      // 如果有错误或警告，发送通知
      if (errorCount > 0 || warningCount > 0) {
        await this.sendHealthAlert(report);
      }
      
      return report;
    } catch (error) {
      logger.error('Failed to generate health report:', error.message);
    }
  }
  
  /**
   * 发送健康警报
   * @param {Object} report - 健康报告
   */
  async sendHealthAlert(report) {
    try {
      const alertMessage = `Integration Health Alert:\n` +
        `Total: ${report.summary.total}\n` +
        `Healthy: ${report.summary.healthy}\n` +
        `Warning: ${report.summary.warning}\n` +
        `Error: ${report.summary.error}\n` +
        `Health Percentage: ${report.summary.healthPercentage}%`;
      
      logger.warn('Integration health alert:', alertMessage);
      
      // 这里可以添加发送邮件、Slack通知等逻辑
      // await this.sendEmailAlert(alertMessage);
      // await this.sendSlackAlert(alertMessage);
      
    } catch (error) {
      logger.error('Failed to send health alert:', error.message);
    }
  }
  
  /**
   * 获取特定集成的健康状态
   * @param {string} integrationId - 集成ID
   * @returns {Object|null} 健康状态
   */
  getIntegrationHealth(integrationId) {
    return this.healthStatus.get(integrationId) || null;
  }
  
  /**
   * 获取所有集成的健康状态
   * @returns {Object} 所有健康状态
   */
  getAllHealthStatus() {
    return Object.fromEntries(this.healthStatus);
  }
  
  /**
   * 强制检查特定集成
   * @param {string} integrationId - 集成ID
   * @returns {Promise<Object>} 健康状态
   */
  async forceCheckIntegration(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      const healthStatus = await this.checkIntegrationHealth(integration);
      this.healthStatus.set(integrationId, healthStatus);
      
      return healthStatus;
    } catch (error) {
      logger.error(`Failed to force check integration ${integrationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * 获取健康检查服务状态
   * @returns {Object} 服务状态
   */
  getServiceStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheckTime,
      monitoredIntegrations: this.healthStatus.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// 创建单例实例
const healthCheckService = new HealthCheckService();

module.exports = healthCheckService;