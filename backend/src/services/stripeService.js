const { stripeClient, stripeConfig } = require('../config/stripe');

class StripeService {
  constructor() {
    this.stripe = stripeClient;
    this.config = stripeConfig;
  }

  /**
   * 创建支付意图
   * @param {Object} options - 支付选项
   * @param {number} options.amount - 支付金额（分为单位）
   * @param {string} options.currency - 货币类型
   * @param {string} options.description - 支付描述
   * @param {Object} options.metadata - 元数据
   * @returns {Promise<Object>} 支付意图对象
   */
  async createPaymentIntent(options) {
    try {
      const { amount, currency = 'eur', description, metadata = {} } = options;

      // 检查是否使用模拟支付或内存模式
      const isMemoryMode = process.env.DB_TYPE === 'memory';
      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';
      const hasValidStripeKey = this.config.secretKey && !this.config.secretKey.includes('YourTestSecretKeyHere');

      if (isMemoryMode || useMockPayment || !hasValidStripeKey) {
        // 返回模拟的支付意图 - 使用正确的Stripe格式
        const timestamp = Date.now().toString();
        const randomId = Math.random().toString(36).substr(2, 9);
        const mockPaymentIntentId = `pi_${timestamp}${randomId}`;  // 移除时间戳和随机ID之间的下划线
        const secretPart = Math.random().toString(36).substr(2, 24);
        const mockClientSecret = `${mockPaymentIntentId}_secret_${secretPart}`;
        
        console.log('🔧 使用模拟支付意图 (内存模式)');
        
        return {
          success: true,
          data: {
            clientSecret: mockClientSecret,
            paymentIntentId: mockPaymentIntentId,
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            status: 'requires_payment_method'
          }
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // 转换为分
        currency: currency.toLowerCase(),
        description,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 确认支付
   * @param {string} paymentIntentId - 支付意图ID
   * @returns {Promise<Object>} 支付结果
   */
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          charges: paymentIntent.charges?.data || []
        }
      };
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent object
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      // 检查是否使用模拟支付或内存模式
      const isMemoryMode = process.env.DB_TYPE === 'memory';
      const useMockPayment = process.env.USE_MOCK_PAYMENT === 'true';
      const hasValidStripeKey = this.config.secretKey && !this.config.secretKey.includes('YourTestSecretKeyHere');

      if (isMemoryMode || useMockPayment || !hasValidStripeKey) {
        // 对于模拟支付意图，返回模拟的成功状态
        if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
          console.log('🔧 返回模拟支付意图状态 (内存模式)');
          return {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 5000, // 默认金额
            currency: 'eur',
            created: Math.floor(Date.now() / 1000),
            charges: {
              data: [{
                id: `ch_${Math.random().toString(36).substr(2, 24)}`,
                amount: 5000,
                currency: 'eur',
                status: 'succeeded'
              }]
            }
          };
        }
      }

      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Retrieve payment intent error:', error);
      throw error;
    }
  }

  /**
   * 创建退款
   * @param {string} paymentIntentId - 支付意图ID
   * @param {number} amount - 退款金额（可选，不提供则全额退款）
   * @returns {Promise<Object>} 退款结果
   */
  async createRefund(paymentIntentId, amount = null) {
    try {
      const refundData = { payment_intent: paymentIntentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        success: true,
        data: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          created: refund.created
        }
      };
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取支付方法
   * @param {string} paymentMethodId - 支付方法ID
   * @returns {Promise<Object>} 支付方法信息
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      return {
        success: true,
        data: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card,
          created: paymentMethod.created
        }
      };
    } catch (error) {
      console.error('Stripe payment method retrieval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 处理Webhook事件
   * @param {string} payload - Webhook载荷
   * @param {string} signature - Webhook签名
   * @returns {Promise<Object>} 处理结果
   */
  async handleWebhook(payload, signature) {
    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!endpointSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);

      return {
        success: true,
        data: {
          type: event.type,
          id: event.id,
          object: event.data.object
        }
      };
    } catch (error) {
      console.error('Stripe webhook handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取支付统计
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 统计结果
   */
  async getPaymentStats(options = {}) {
    try {
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 默认30天前
        endDate = new Date() 
      } = options;

      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const stats = {
        totalAmount: 0,
        totalCount: 0,
        successfulCount: 0,
        failedCount: 0,
        refundedAmount: 0
      };

      charges.data.forEach(charge => {
        stats.totalCount++;
        if (charge.status === 'succeeded') {
          stats.successfulCount++;
          stats.totalAmount += charge.amount;
        } else {
          stats.failedCount++;
        }
        if (charge.refunded) {
          stats.refundedAmount += charge.amount_refunded;
        }
      });

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Stripe payment stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new StripeService();