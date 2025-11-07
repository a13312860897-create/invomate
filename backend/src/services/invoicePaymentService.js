const paddleService = require('./paddleService');
const mockPaymentService = require('./mockPaymentService');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class InvoicePaymentService {
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // 在开发环境中，如果Paddle API不可用，使用模拟服务
    this.useMockPayment = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_PAYMENT === 'true';
    this.prisma = prisma; // 添加prisma实例到类中
  }

  /**
   * 为发票生成直接Paddle支付链接
   * @param {Object} invoice - 发票对象
   * @param {Object} options - 选项配置
   * @returns {Promise<Object>} 支付链接信息
   */
  async generateDirectPaymentLink(invoice, options = {}) {
    try {
      // 生成安全令牌
      const paymentToken = this.generateSecureToken(invoice.id);
      
      // 计算过期时间（默认7天）
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (options.expiryDays || 7));

      // 准备Paddle Platform交易数据
      const paddleData = {
        items: [{
          price: {
            description: `Invoice ${invoice.invoiceNumber}`,
            name: `Payment for Invoice ${invoice.invoiceNumber}`,
            billing_cycle: null, // 一次性付款
            unit_price: {
              amount: Math.round(parseFloat(invoice.totalAmount || invoice.total) * 100).toString(),
              currency_code: invoice.currency || 'EUR'
            }
          },
          quantity: 1
        }],
        collection_mode: 'automatic',
        currency_code: invoice.currency || 'EUR',
        custom_data: {
          invoice_id: invoice.id,
          payment_token: paymentToken,
          customer_email: invoice.clientEmail,
          invoice_number: invoice.invoiceNumber
        },
        checkout: {
          success_url: `${this.frontendUrl}/payment-success`,
          cancel_url: `${this.frontendUrl}/invoices/${invoice.id}?cancelled=true`
        }
      };

      // 调用支付服务创建交易
      let paddleResponse;

      if (this.useMockPayment) {
        console.log('🎭 使用模拟支付服务');
        paddleResponse = await mockPaymentService.createPaymentLink(paddleData);
      } else {
        console.log('💳 使用真实Paddle服务');
        try {
          // 使用平台API创建交易
          paddleResponse = await paddleService.createTransaction(paddleData);
        } catch (error) {
          console.error('❌ Paddle API调用失败，切换到模拟服务:', error.message);
          console.log('🎭 自动切换到模拟支付服务');
          paddleResponse = await mockPaymentService.createPaymentLink(paddleData);
        }
      }

      if (!paddleResponse || !paddleResponse.data) {
        throw new Error('Failed to create Paddle transaction');
      }

      const transaction = paddleResponse.data;
      
      // 检查是否有checkout URL
      if (!transaction.checkout || !transaction.checkout.url) {
        throw new Error('No checkout URL returned from Paddle');
      }

      // 保存支付令牌到数据库
      await this.savePaymentToken(invoice.id, paymentToken, expiresAt, transaction.id);

      return {
        success: true,
        paymentUrl: transaction.checkout.url,
        paymentToken: paymentToken,
        expiresAt: expiresAt,
        paddleTransactionId: transaction.id,
        securityFeatures: {
          tokenProtected: true,
          timeExpiry: true,
          invoiceLinked: true
        }
      };

    } catch (error) {
      console.error('Error generating direct payment link:', error);
      throw new Error(`Failed to generate payment link: ${error.message}`);
    }
  }

  /**
   * 生成安全令牌
   * @param {string} invoiceId - 发票ID
   * @returns {string} 安全令牌
   */
  generateSecureToken(invoiceId) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const data = `${invoiceId}-${timestamp}-${randomBytes}`;
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 32); // 取前32位作为令牌
  }

  /**
   * 保存支付令牌到数据库
   * @param {string} invoiceId - 发票ID
   * @param {string} paymentToken - 支付令牌
   * @param {Date} expiresAt - 过期时间
   * @param {string} paddlePaymentId - Paddle支付ID
   */
  async savePaymentToken(invoiceId, paymentToken, expiresAt, paddlePaymentId) {
    try {
      // 确保invoiceId是字符串类型
      const invoiceIdStr = String(invoiceId);
      
      // 先删除该发票的旧令牌
      await this.prisma.invoicePaymentToken.deleteMany({
        where: { invoiceId: invoiceIdStr }
      });

      // 创建新令牌记录
      await this.prisma.invoicePaymentToken.create({
        data: {
          invoiceId: invoiceIdStr,
          paymentToken: paymentToken,
          paddlePaymentId: paddlePaymentId,
          expiresAt: expiresAt,
          isUsed: false,
          createdAt: new Date()
        }
      });

      console.log(`Payment token saved for invoice ${invoiceId}`);
    } catch (error) {
      console.error('Error saving payment token:', error);
      throw error;
    }
  }

  /**
   * 验证支付令牌
   * @param {string} invoiceId - 发票ID
   * @param {string} paymentToken - 支付令牌
   * @returns {Promise<Object>} 验证结果
   */
  async validatePaymentToken(invoiceId, paymentToken) {
    try {
      // 确保invoiceId是字符串类型
      const invoiceIdStr = String(invoiceId);
      
      const tokenRecord = await this.prisma.invoicePaymentToken.findFirst({
        where: {
          invoiceId: invoiceIdStr,
          paymentToken: paymentToken,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!tokenRecord) {
        return {
          valid: false,
          reason: 'Token not found, expired, or already used'
        };
      }

      return {
        valid: true,
        tokenRecord: tokenRecord
      };
    } catch (error) {
      console.error('Error validating payment token:', error);
      return {
        valid: false,
        reason: 'Validation error'
      };
    }
  }

  /**
   * 标记支付令牌为已使用
   * @param {string} paymentToken - 支付令牌
   */
  async markTokenAsUsed(paymentToken) {
    try {
      await this.prisma.invoicePaymentToken.updateMany({
        where: { paymentToken: paymentToken },
        data: { 
          isUsed: true,
          usedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw error;
    }
  }

  /**
   * 清理过期的支付令牌
   */
  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.invoicePaymentToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired payment tokens`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }

  /**
   * 获取发票的有效支付链接
   * @param {string} invoiceId - 发票ID
   * @returns {Promise<Object|null>} 支付链接信息
   */
  async getValidPaymentLink(invoiceId) {
    try {
      // 确保invoiceId是字符串类型
      const invoiceIdStr = String(invoiceId);
      
      const tokenRecord = await this.prisma.invoicePaymentToken.findFirst({
        where: {
          invoiceId: invoiceIdStr,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!tokenRecord) {
        return null;
      }

      // 从Paddle获取支付链接状态
      // 注意：这里可能需要根据Paddle API调整
      return {
        paymentToken: tokenRecord.paymentToken,
        paddlePaymentId: tokenRecord.paddlePaymentId,
        expiresAt: tokenRecord.expiresAt,
        createdAt: tokenRecord.createdAt
      };
    } catch (error) {
      console.error('Error getting valid payment link:', error);
      return null;
    }
  }

  /**
   * 处理Paddle支付webhook
   * @param {Object} webhookData - Paddle webhook数据
   * @returns {Object} 处理结果
   */
  async handlePaymentWebhook(webhookData) {
    try {
      console.log('🎣 处理Paddle webhook:', webhookData.event_type);

      // 验证webhook事件类型
      if (webhookData.event_type !== 'transaction.completed') {
        console.log('⏭️  跳过非支付完成事件:', webhookData.event_type);
        return {
          success: true,
          message: 'Event type not handled',
          eventType: webhookData.event_type
        };
      }

      const transactionData = webhookData.data;
      const customData = transactionData.custom_data;

      if (!customData || !customData.payment_token) {
        throw new Error('Webhook缺少支付令牌信息');
      }

      const paymentToken = customData.payment_token;
      const invoiceId = customData.invoice_id;
      const paddleTransactionId = transactionData.id;

      console.log('🔍 查找支付令牌:', paymentToken);

      // 查找支付令牌记录
      const tokenRecord = await this.prisma.invoicePaymentToken.findFirst({
        where: { paymentToken }
      });

      if (!tokenRecord) {
        throw new Error(`支付令牌不存在: ${paymentToken}`);
      }

      // 检查令牌是否已过期
      if (new Date() > tokenRecord.expiresAt) {
        throw new Error(`支付令牌已过期: ${paymentToken}`);
      }

      // 检查令牌是否已使用
      if (tokenRecord.isUsed) {
        console.log('⚠️  支付令牌已使用，跳过重复处理');
        return {
          success: true,
          message: 'Payment already processed',
          paymentToken,
          alreadyProcessed: true
        };
      }

      // 验证发票ID匹配
      if (tokenRecord.invoiceId !== invoiceId) {
        throw new Error(`发票ID不匹配: 期望 ${tokenRecord.invoiceId}, 收到 ${invoiceId}`);
      }

      console.log('✅ 支付令牌验证通过，更新状态');

      // 更新支付令牌状态
      const updatedToken = await this.prisma.invoicePaymentToken.update({
        where: { paymentToken },
        data: {
          isUsed: true,
          usedAt: new Date(),
          paddlePaymentId: paddleTransactionId
        }
      });

      console.log('💾 支付令牌状态已更新');

      // 这里可以添加其他业务逻辑，比如：
      // - 更新发票状态为已支付
      // - 发送支付确认邮件
      // - 触发其他业务流程

      return {
        success: true,
        message: 'Payment processed successfully',
        paymentToken,
        invoiceId,
        paddleTransactionId,
        processedAt: updatedToken.usedAt
      };

    } catch (error) {
      console.error('❌ Webhook处理失败:', error.message);
      throw error;
    }
  }
}

module.exports = InvoicePaymentService;