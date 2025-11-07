const { User, Client, Invoice, AuditLog } = require('../models');
const { Op } = require('sequelize');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { encrypt, decrypt, maskSensitiveData } = require('./encryption');
const cron = require('node-cron');

/**
 * GDPR合规工具类
 */
class GDPRCompliance {
  constructor() {
    this.dataRetentionPolicies = {
      '1year': 365 * 24 * 60 * 60 * 1000,
      '3years': 3 * 365 * 24 * 60 * 60 * 1000,
      '7years': 7 * 365 * 24 * 60 * 60 * 1000,
      'indefinite': null
    };
    
    // 启动定期清理任务
    this.startCleanupTasks();
  }

  /**
   * 启动定期清理任务
   */
  startCleanupTasks() {
    // 每天凌晨2点执行数据清理
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily GDPR compliance cleanup...');
      await this.performScheduledCleanup();
    });

    // 每周日凌晨3点执行深度清理
    cron.schedule('0 3 * * 0', async () => {
      console.log('Starting weekly GDPR deep cleanup...');
      await this.performDeepCleanup();
    });
  }

  /**
   * 执行定期清理
   */
  async performScheduledCleanup() {
    try {
      await this.cleanupExpiredData();
      await this.processAccountDeletions();
      await this.cleanupOldAuditLogs();
      console.log('Daily GDPR cleanup completed successfully');
    } catch (error) {
      console.error('Error during scheduled cleanup:', error);
    }
  }

  /**
   * 执行深度清理
   */
  async performDeepCleanup() {
    try {
      await this.anonymizeOldData();
      await this.compressOldAuditLogs();
      console.log('Weekly GDPR deep cleanup completed successfully');
    } catch (error) {
      console.error('Error during deep cleanup:', error);
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData() {
    const users = await User.findAll({
      where: {
        dataRetentionPeriod: {
          [Op.ne]: 'indefinite'
        },
        isActive: true
      }
    });

    for (const user of users) {
      const retentionPeriod = this.dataRetentionPolicies[user.dataRetentionPeriod];
      if (!retentionPeriod) continue;

      const cutoffDate = new Date(Date.now() - retentionPeriod);

      // 删除过期的发票
      const expiredInvoices = await Invoice.findAll({
        where: {
          userId: user.id,
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      for (const invoice of expiredInvoices) {
        await this.secureDeleteInvoice(invoice.id, user.id);
      }

      // 记录清理活动
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.DATA_CLEANUP,
        {
          deletedInvoices: expiredInvoices.length,
          retentionPeriod: user.dataRetentionPeriod,
          cutoffDate: cutoffDate.toISOString()
        }
      );
    }
  }

  /**
   * 处理账户删除请求
   */
  async processAccountDeletions() {
    const usersToDelete = await User.findAll({
      where: {
        deletionRequested: true,
        deletionDate: {
          [Op.lte]: new Date()
        }
      }
    });

    for (const user of usersToDelete) {
      await this.permanentlyDeleteUser(user.id);
    }
  }

  /**
   * 永久删除用户及其所有数据
   * @param {number} userId - 用户ID
   */
  async permanentlyDeleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return;

      // 记录删除操作
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.ACCOUNT_PERMANENT_DELETION,
        {
          userEmail: user.email,
          deletionDate: new Date().toISOString(),
          dataRetentionPeriod: user.dataRetentionPeriod
        }
      );

      // 删除相关数据
      await Invoice.destroy({ where: { userId } });
      await Client.destroy({ where: { userId } });
      
      // 保留审计日志但匿名化
      await AuditLog.update(
        {
          userId: null,
          details: encrypt(JSON.stringify({ anonymized: true, originalUserId: userId }))
        },
        { where: { userId } }
      );

      // 删除用户记录
      await user.destroy();

      console.log(`User ${userId} permanently deleted from system`);
    } catch (error) {
      console.error(`Error permanently deleting user ${userId}:`, error);
    }
  }

  /**
   * 安全删除发票
   * @param {number} invoiceId - 发票ID
   * @param {number} userId - 用户ID
   */
  async secureDeleteInvoice(invoiceId, userId) {
    try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) return;

      // 记录删除操作
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.INVOICE_SECURE_DELETE,
        {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          deletionReason: 'data_retention_policy'
        }
      );

      // 删除发票
      await invoice.destroy();
    } catch (error) {
      console.error(`Error securely deleting invoice ${invoiceId}:`, error);
    }
  }

  /**
   * 匿名化旧数据
   */
  async anonymizeOldData() {
    const anonymizationCutoff = new Date(Date.now() - (2 * 365 * 24 * 60 * 60 * 1000)); // 2年前

    // 匿名化旧的客户数据
    const oldClients = await Client.findAll({
      where: {
        createdAt: {
          [Op.lt]: anonymizationCutoff
        },
        isAnonymized: {
          [Op.ne]: true
        }
      }
    });

    for (const client of oldClients) {
      await this.anonymizeClient(client);
    }
  }

  /**
   * 匿名化客户数据
   * @param {Object} client - 客户对象
   */
  async anonymizeClient(client) {
    try {
      await client.update({
        name: 'Anonymized Client',
        email: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
        isAnonymized: true
      });

      await logAuditEvent(
        client.userId,
        AUDIT_ACTIONS.CLIENT_ANONYMIZED,
        {
          clientId: client.id,
          anonymizationDate: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error(`Error anonymizing client ${client.id}:`, error);
    }
  }

  /**
   * 清理旧的审计日志
   */
  async cleanupOldAuditLogs() {
    const logRetentionPeriod = 2 * 365 * 24 * 60 * 60 * 1000; // 2年
    const cutoffDate = new Date(Date.now() - logRetentionPeriod);

    const deletedCount = await AuditLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });

    console.log(`Cleaned up ${deletedCount} old audit log entries`);
  }

  /**
   * 压缩旧的审计日志
   */
  async compressOldAuditLogs() {
    const compressionCutoff = new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)); // 6个月前

    const oldLogs = await AuditLog.findAll({
      where: {
        createdAt: {
          [Op.lt]: compressionCutoff
        },
        details: {
          [Op.not]: null
        }
      }
    });

    for (const log of oldLogs) {
      try {
        // 压缩详细信息
        const details = JSON.parse(log.details);
        const compressedDetails = this.compressLogDetails(details);
        
        await log.update({
          details: JSON.stringify(compressedDetails)
        });
      } catch (error) {
        console.error(`Error compressing audit log ${log.id}:`, error);
      }
    }
  }

  /**
   * 压缩日志详情
   * @param {Object} details - 原始详情
   * @returns {Object} 压缩后的详情
   */
  compressLogDetails(details) {
    const compressed = {
      action: details.action,
      timestamp: details.timestamp,
      success: details.success
    };

    // 移除敏感或冗余信息
    if (details.error) {
      compressed.hasError = true;
    }

    if (details.responseTime) {
      compressed.responseTime = details.responseTime > 1000 ? 'slow' : 'fast';
    }

    return compressed;
  }

  /**
   * 生成GDPR合规报告
   * @param {number} userId - 用户ID
   * @returns {Object} 合规报告
   */
  async generateComplianceReport(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const clients = await Client.findAll({ where: { userId } });
      const invoices = await Invoice.findAll({ where: { userId } });
      const auditLogs = await AuditLog.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      const report = {
        user: {
          id: user.id,
          email: maskSensitiveData(user.email, 'email'),
          createdAt: user.createdAt,
          dataRetentionPeriod: user.dataRetentionPeriod,
          consentStatus: {
            dataProcessing: user.dataProcessingConsent,
            marketing: user.marketingConsent,
            analytics: user.analyticsConsent
          }
        },
        dataInventory: {
          clients: clients.length,
          invoices: invoices.length,
          auditLogs: auditLogs.length
        },
        dataRetention: {
          policy: user.dataRetentionPeriod,
          nextCleanupDate: this.calculateNextCleanupDate(user.dataRetentionPeriod)
        },
        recentActivity: auditLogs.slice(0, 10).map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          success: log.success
        })),
        complianceStatus: {
          hasValidConsent: user.dataProcessingConsent,
          dataRetentionConfigured: !!user.dataRetentionPeriod,
          auditTrailMaintained: auditLogs.length > 0,
          lastReviewDate: new Date().toISOString()
        }
      };

      // 记录报告生成
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.COMPLIANCE_REPORT_GENERATED,
        {
          reportDate: new Date().toISOString(),
          dataInventory: report.dataInventory
        }
      );

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * 计算下次清理日期
   * @param {string} retentionPeriod - 保留期限
   * @returns {string|null} 下次清理日期
   */
  calculateNextCleanupDate(retentionPeriod) {
    if (retentionPeriod === 'indefinite') {
      return null;
    }

    const period = this.dataRetentionPolicies[retentionPeriod];
    if (!period) return null;

    const nextCleanup = new Date(Date.now() + period);
    return nextCleanup.toISOString();
  }

  /**
   * 验证用户同意状态
   * @param {number} userId - 用户ID
   * @returns {Object} 同意状态验证结果
   */
  async validateConsentStatus(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const consentValidation = {
        isValid: true,
        issues: [],
        recommendations: []
      };

      // 检查基本数据处理同意
      if (!user.dataProcessingConsent) {
        consentValidation.isValid = false;
        consentValidation.issues.push('Missing data processing consent');
        consentValidation.recommendations.push('Obtain explicit consent for data processing');
      }

      // 检查数据保留策略
      if (!user.dataRetentionPeriod) {
        consentValidation.issues.push('No data retention period specified');
        consentValidation.recommendations.push('Configure data retention policy');
      }

      // 检查最近的同意更新
      const recentConsentUpdate = await AuditLog.findOne({
        where: {
          userId,
          action: AUDIT_ACTIONS.PRIVACY_SETTINGS_UPDATE
        },
        order: [['createdAt', 'DESC']]
      });

      if (!recentConsentUpdate || 
          (Date.now() - new Date(recentConsentUpdate.createdAt).getTime()) > (365 * 24 * 60 * 60 * 1000)) {
        consentValidation.recommendations.push('Review and update consent preferences annually');
      }

      return consentValidation;
    } catch (error) {
      console.error('Error validating consent status:', error);
      throw error;
    }
  }

  /**
   * 处理数据主体权利请求
   * @param {number} userId - 用户ID
   * @param {string} requestType - 请求类型（access, rectification, erasure, portability）
   * @param {Object} requestDetails - 请求详情
   * @returns {Object} 处理结果
   */
  async handleDataSubjectRequest(userId, requestType, requestDetails = {}) {
    try {
      await logAuditEvent(
        userId,
        `data_subject_request_${requestType}`,
        {
          requestType,
          requestDetails,
          requestDate: new Date().toISOString()
        }
      );

      switch (requestType) {
        case 'access':
          return await this.handleAccessRequest(userId);
        case 'rectification':
          return await this.handleRectificationRequest(userId, requestDetails);
        case 'erasure':
          return await this.handleErasureRequest(userId);
        case 'portability':
          return await this.handlePortabilityRequest(userId);
        default:
          throw new Error(`Unsupported request type: ${requestType}`);
      }
    } catch (error) {
      console.error('Error handling data subject request:', error);
      throw error;
    }
  }

  /**
   * 处理数据访问请求
   * @param {number} userId - 用户ID
   * @returns {Object} 用户数据摘要
   */
  async handleAccessRequest(userId) {
    const report = await this.generateComplianceReport(userId);
    return {
      requestType: 'access',
      status: 'completed',
      data: report,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * 处理数据更正请求
   * @param {number} userId - 用户ID
   * @param {Object} corrections - 更正内容
   * @returns {Object} 处理结果
   */
  async handleRectificationRequest(userId, corrections) {
    // 这里应该实现数据更正逻辑
    return {
      requestType: 'rectification',
      status: 'pending_review',
      corrections,
      submittedAt: new Date().toISOString()
    };
  }

  /**
   * 处理数据删除请求
   * @param {number} userId - 用户ID
   * @returns {Object} 处理结果
   */
  async handleErasureRequest(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 设置删除标记（30天后执行）
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await user.update({
      deletionRequested: true,
      deletionDate: deletionDate,
      isActive: false
    });

    return {
      requestType: 'erasure',
      status: 'scheduled',
      scheduledDeletionDate: deletionDate.toISOString(),
      gracePeriodDays: 30
    };
  }

  /**
   * 处理数据可携带性请求
   * @param {number} userId - 用户ID
   * @returns {Object} 处理结果
   */
  async handlePortabilityRequest(userId) {
    // 这里应该生成可携带的数据格式
    return {
      requestType: 'portability',
      status: 'processing',
      estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

// 创建全局实例
const gdprCompliance = new GDPRCompliance();

module.exports = {
  GDPRCompliance,
  gdprCompliance
};