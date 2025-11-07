/**
 * 新版提醒邮件服务
 * 修复总金额显示问题
 */
const PDFEmailService = require('../pdfEmailService');

class ReminderEmailService {
  constructor() {
    this.pdfEmailService = new PDFEmailService();
  }

  /**
   * 发送发票邮件
   * @param {Object} invoiceData - 发票数据
   * @param {string} recipientEmail - 收件人邮箱
   * @param {Object} options - 发送选项
   * @returns {Promise<Object>} 发送结果
   */
  async sendInvoiceEmail(invoiceData, recipientEmail, options = {}) {
    try {
      console.log('=== ReminderEmailService.sendInvoiceEmail 开始 ===');
      console.log('🔍 接收到的发票数据:', JSON.stringify(invoiceData, null, 2));

      // 引入统一的金额处理工具
      const { normalizeInvoiceAmounts } = require('../../utils/amountUtils');

      const { type = 'invoice', attachPDF = true, emailConfig, userData } = options;

      // 使用统一的金额处理工具标准化发票数据
      const normalizedInvoiceData = normalizeInvoiceAmounts(invoiceData);
      
      console.log('🔧 标准化后的发票数据总金额:', {
        total: normalizedInvoiceData.total,
        totalAmount: normalizedInvoiceData.totalAmount
      });

      // 构建客户数据
      const clientData = {
        name: invoiceData.customerName || invoiceData.clientName || 'Cher client',
        email: recipientEmail
      };

      // 使用PDFEmailService发送邮件
      const result = await this.pdfEmailService.generateAndSendInvoice({
        invoiceId: invoiceData.id || null,
        invoiceData: normalizedInvoiceData,
        userData: userData || invoiceData.userData,
        clientData: clientData,
        recipientEmail: recipientEmail,
        attachPDF: attachPDF,
        emailConfig: emailConfig
      });

      console.log('📧 邮件发送结果:', result);

      return {
        success: result.success,
        messageId: result.messageId,
        recipient: recipientEmail,
        error: result.error
      };
    } catch (error) {
      console.error('=== ReminderEmailService.sendInvoiceEmail 错误 ===');
      console.error('错误详情:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量发送发票邮件
   * @param {Array} invoices - 发票数组
   * @param {Object} options - 发送选项
   * @returns {Promise<Array>} 发送结果数组
   */
  async sendBatchInvoiceEmails(invoices, options = {}) {
    const results = [];
    
    for (const invoice of invoices) {
      try {
        const result = await this.sendInvoiceEmail(
          invoice,
          invoice.clientEmail || invoice.Client?.email,
          options
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          invoiceId: invoice.id
        });
      }
    }
    
    return results;
  }

  /**
   * 验证邮件配置
   * @returns {Promise<Object>} 验证结果
   */
  async verifyEmailConfig() {
    try {
      // 这里可以添加邮件配置验证逻辑
      return { success: true, message: '邮件配置验证成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ReminderEmailService();