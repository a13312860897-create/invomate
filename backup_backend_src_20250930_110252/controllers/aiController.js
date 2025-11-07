/**
 * AI功能控制器
 * 处理AI相关的API请求
 */
const reminderEmailService = require('../services/ai/reminderEmailService');
const invoiceService = require('../services/mockInvoiceService');
const clientService = require('../services/mockclientservice');

class AIController {
  /**
   * 生成催款邮件内容
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async generateReminderEmail(req, res) {
    try {
      const { invoiceId, clientId, options = {} } = req.body;
      
      // 验证必要参数
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: '发票ID是必需的'
        });
      }
      
      // 获取发票数据
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的发票'
        });
      }
      
      // 获取客户数据
      let client;
      if (clientId) {
        client = await clientService.getClientById(clientId);
      } else if (invoice.clientId) {
        client = await clientService.getClientById(invoice.clientId);
      }
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的客户'
        });
      }
      
      // 生成催款邮件
      const result = await reminderEmailService.generateReminderEmail(invoice, client, options);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: '生成催款邮件失败',
          error: result.error
        });
      }
      
      // 返回成功响应
      return res.json({
        success: true,
        data: {
          subject: result.subject,
          body: result.body,
          template: result.template,
          tone: result.tone,
          urgency: result.urgency
        }
      });
    } catch (error) {
      console.error('Error in generateReminderEmail:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 发送催款邮件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async sendReminderEmail(req, res) {
    try {
      const { invoiceId, clientId, options = {} } = req.body;
      
      // 验证必要参数
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: '发票ID是必需的'
        });
      }
      
      // 获取发票数据
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的发票'
        });
      }
      
      // 获取客户数据
      let client;
      if (clientId) {
        client = await clientService.getClientById(clientId);
      } else if (invoice.clientId) {
        client = await clientService.getClientById(invoice.clientId);
      }
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: '找不到指定的客户'
        });
      }
      
      // 发送催款邮件
      const result = await reminderEmailService.sendReminderEmail(invoice, client, options);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: '发送催款邮件失败',
          error: result.error
        });
      }
      
      // 返回成功响应
      return res.json({
        success: true,
        data: {
          emailId: result.emailId,
          subject: result.subject,
          template: result.template,
          tone: result.tone,
          urgency: result.urgency
        }
      });
    } catch (error) {
      console.error('Error in sendReminderEmail:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 批量发送催款邮件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async sendBulkReminderEmails(req, res) {
    try {
      const { invoiceClientPairs, options = {} } = req.body;
      
      // 验证必要参数
      if (!invoiceClientPairs || !Array.isArray(invoiceClientPairs) || invoiceClientPairs.length === 0) {
        return res.status(400).json({
          success: false,
          message: '发票客户对数组是必需的且不能为空'
        });
      }
      
      // 设置默认延迟时间（毫秒）
      const finalOptions = {
        delayBetweenEmails: 1000, // 1秒延迟
        ...options
      };
      
      // 批量发送催款邮件
      const result = await reminderEmailService.sendBulkReminderEmails(invoiceClientPairs, finalOptions);
      
      // 返回成功响应
      return res.json({
        success: true,
        data: {
          total: result.total,
          successCount: result.successCount,
          failureCount: result.failureCount,
          results: result.results
        }
      });
    } catch (error) {
      console.error('Error in sendBulkReminderEmails:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }

  /**
   * 获取AI服务状态
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getAIStatus(req, res) {
    try {
      // 检查AI服务是否可用
      const aiServiceFactory = require('../services/ai/aiServiceFactory');
      const supportedProviders = aiServiceFactory.getSupportedProviders();
      
      // 返回AI服务状态
      return res.json({
        success: true,
        data: {
          enabled: true,
          supportedProviders,
          defaultProvider: aiServiceFactory.defaultProvider,
          features: [
            {
              name: '自动催款邮件',
              description: '使用AI生成个性化的催款邮件内容',
              enabled: true
            }
            // 可以在这里添加更多AI功能
          ]
        }
      });
    } catch (error) {
      console.error('Error in getAIStatus:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }
}

// 创建控制器实例
const aiController = new AIController();

module.exports = aiController;