/**
 * 简化版AI功能控制器 - MVP阶段
 * 处理基本的邮件发送功能
 */
const reminderEmailService = require('../services/ai/reminderEmailService_new');
const { EmailConfig } = require('../models');

class AIController {
  /**
   * 发送发票邮件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async sendInvoiceEmail(req, res) {
    try {
      console.log('=== AI Controller: sendInvoiceEmail 开始 ===');
      console.log('请求体:', req.body);
      console.log('用户信息:', req.user);
      
      const { invoiceId, recipientEmail, type = 'invoice', attachPDF = true, useUserConfig = true } = req.body;
      const userId = req.user.id;
      
      // 验证必要参数
      if (!invoiceId) {
        console.log('错误: 缺少发票ID');
        return res.status(400).json({
          success: false,
          message: '发票ID是必需的'
        });
      }

      console.log('查找发票ID:', invoiceId);
      
      // 从数据库获取发票数据
      const { Invoice, Client } = require('../models');
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [{
          model: Client,
          as: 'Client'
        }]
      });

      console.log('找到的发票:', invoice ? '存在' : '不存在');
      
      if (!invoice) {
        console.log('错误: 发票不存在');
        return res.status(404).json({
          success: false,
          message: '发票不存在'
        });
      }

      // 确定收件人邮箱
      const targetEmail = recipientEmail || (invoice.Client && invoice.Client.email);
      console.log('目标邮箱:', targetEmail);
      
      if (!targetEmail) {
        console.log('错误: 未找到收件人邮箱');
        return res.status(400).json({
          success: false,
          message: '未找到收件人邮箱，请提供收件人邮箱或确保客户信息中包含邮箱'
        });
      }

      // 获取用户邮件配置（如果启用）
      let emailConfig = null;
      if (useUserConfig) {
        emailConfig = await EmailConfig.findOne({
          where: { userId }
        });
        console.log('用户邮件配置:', emailConfig ? '存在' : '不存在');
      }

      // 获取用户数据（公司信息）
      const { User } = require('../models');
      const userData = await User.findByPk(userId);
      console.log('用户数据:', userData ? '存在' : '不存在');
      
      if (!userData) {
        console.log('错误: 用户数据不存在');
        return res.status(404).json({
          success: false,
          message: '用户数据不存在'
        });
      }

      // 构造发票数据 - 修复总金额字段映射问题
      const invoiceData = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        // 修复：确保所有可能的总金额字段都被正确设置
        amount: invoice.total,
        total: invoice.total,
        totalAmount: invoice.total,
        total_amount: invoice.total,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        customerName: invoice.Client ? invoice.Client.name : '未知客户',
        customerEmail: targetEmail,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        items: JSON.parse(invoice.items || '[]'),
        userData: userData // 添加用户数据
      };

      console.log('🔍 AI控制器 - 发票数据构造结果:', {
        'invoice.total (原始)': invoice.total,
        'invoiceData.amount': invoiceData.amount,
        'invoiceData.total': invoiceData.total,
        'invoiceData.totalAmount': invoiceData.totalAmount,
        'invoiceData.total_amount': invoiceData.total_amount
      });

      console.log('准备发送邮件，发票数据:', {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount,
        customerName: invoiceData.customerName
      });

      // 发送邮件
      const result = await reminderEmailService.sendInvoiceEmail(
        invoiceData, 
        targetEmail, 
        { type, attachPDF, emailConfig, userData }
      );

      console.log('邮件发送结果:', result);

      if (result.success) {
        console.log('邮件发送成功');
        res.json({
          success: true,
          message: '邮件发送成功',
          data: {
            messageId: result.messageId,
            recipient: result.recipient,
            usedCustomConfig: !!emailConfig
          }
        });
      } else {
        console.log('邮件发送失败:', result.error);
        res.status(500).json({
          success: false,
          message: result.error || '邮件发送失败'
        });
      }
    } catch (error) {
      console.error('=== AI Controller: sendInvoiceEmail 错误 ===');
      console.error('错误详情:', error);
      console.error('错误堆栈:', error.stack);
      res.status(500).json({
        success: false,
        message: error.message || '发送邮件时发生错误'
      });
    }
  }

  /**
   * 批量发送发票邮件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async sendBatchInvoiceEmails(req, res) {
    try {
      const { invoices, type = 'invoice', attachPDF = true } = req.body;
      
      if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
        return res.status(400).json({
          success: false,
          message: '发票列表是必需的'
        });
      }

      // 模拟发票数据
      const mockInvoices = invoices.map(inv => ({
        id: inv.invoiceId,
        invoiceNumber: `INV-${inv.invoiceId}`,
        amount: inv.amount || 1000,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'sent',
        customerName: inv.customerName || '测试客户',
        customerEmail: inv.recipientEmail
      }));

      const results = await reminderEmailService.sendBatchInvoiceEmails(
        mockInvoices, 
        { type, attachPDF }
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        message: `批量发送完成: ${successCount} 成功, ${failureCount} 失败`,
        data: {
          total: results.length,
          success: successCount,
          failure: failureCount,
          results: results
        }
      });

    } catch (error) {
      console.error('批量发送发票邮件失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  /**
   * 验证邮件配置
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async verifyEmailConfig(req, res) {
    try {
      const result = await reminderEmailService.verifyEmailConfig();
      // 统一返回结构，前端期望顶层包含 ok 字段
      const ok = typeof result.valid === 'boolean' ? result.valid : !!result.success;
      const message = ok ? '邮件配置有效' : '邮件配置无效';

      res.json({
        success: true,
        ok,
        message,
        data: { ...result, ok }
      });

    } catch (error) {
      console.error('验证邮件配置失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  /**
   * 健康检查
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async healthCheck(req, res) {
    try {
      res.json({
        success: true,
        message: 'AI服务运行正常',
        data: {
          service: 'simplified-ai-controller',
          version: '1.0.0-mvp',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '服务异常',
        error: error.message
      });
    }
  }
}

module.exports = new AIController();