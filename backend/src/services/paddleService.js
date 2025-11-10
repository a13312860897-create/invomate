const axios = require('axios');
const crypto = require('crypto');

// 确保环境变量被加载
require('dotenv').config();

class PaddleService {
  constructor() {
    this.apiKey = process.env.PADDLE_API_KEY;
    this.vendorId = process.env.PADDLE_VENDOR_ID;
    this.environment = process.env.PADDLE_ENVIRONMENT || 'sandbox';
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    
    // 使用Paddle Classic API（部分接口）
    this.baseURL = this.environment === 'production'
      ? 'https://vendors.paddle.com/api/2.0'
      : 'https://sandbox-vendors.paddle.com/api/2.0';

    // 新版 Paddle Platform API（交易/客户/订阅）
    this.platformBaseURL = this.environment === 'production'
      ? 'https://api.paddle.com'
      : 'https://sandbox-api.paddle.com';

    // Classic API axios实例
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Platform API axios实例
    this.platformApi = axios.create({
      baseURL: this.platformBaseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined,
        // 明确使用 Platform API v1，避免未来版本变更导致不兼容
        'Paddle-Version': '1'
      }
    });
  }

  // 获取产品列表 - Paddle Classic API
  async getProducts() {
    try {
      const response = await this.api.post('/product/get_products', {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // 获取价格列表 - Paddle Classic API
  async getPrices() {
    try {
      const response = await this.api.post('/subscription/plans', {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  // 获取特定价格信息 - Paddle Classic API
  async getPrice(priceId) {
    try {
      const response = await this.api.post('/subscription/plans', {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey,
        plan: priceId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  // 创建支付链接 - Paddle Classic API
  async createPaymentLink(data) {
    try {
      // 使用Paddle Classic API的Pay Links功能
      const payLinkData = {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey,
        title: data.title || 'Invoice Payment',
        webhook_url: data.webhook_url,
        prices: data.prices || [`${data.currency_code || 'EUR'}:${data.amount || 0}`],
        recurring_prices: data.recurring_prices,
        trial_days: data.trial_days,
        custom_message: data.custom_message,
        coupon_code: data.coupon_code,
        discountable: data.discountable || 1,
        image_url: data.image_url,
        return_url: data.return_url,
        quantity_variable: data.quantity_variable || 0,
        quantity: data.quantity || 1,
        expires: data.expires,
        affiliates: data.affiliates,
        recurring_affiliate_limit: data.recurring_affiliate_limit,
        marketing_consent: data.marketing_consent,
        customer_email: data.customer_email,
        customer_country: data.customer_country,
        customer_postcode: data.customer_postcode,
        passthrough: data.passthrough || JSON.stringify(data.custom_data || {})
      };

      // 移除未定义的字段
      Object.keys(payLinkData).forEach(key => {
        if (payLinkData[key] === undefined || payLinkData[key] === null) {
          delete payLinkData[key];
        }
      });

      const response = await this.api.post('/product/generate_pay_link', payLinkData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment link:', error.message);
      if (error.response && error.response.data) {
        console.error('Paddle API Error Details:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // 创建订阅 - Paddle Classic API
  async createSubscription(data) {
    try {
      const subscriptionData = {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey,
        plan_id: data.plan_id,
        customer_email: data.customer_email,
        customer_postcode: data.customer_postcode,
        customer_country: data.customer_country,
        passthrough: data.passthrough
      };

      const response = await this.api.post('/subscription/users', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // 获取订阅信息 - Paddle Classic API
  async getSubscription(subscriptionId) {
    try {
      const response = await this.api.post('/subscription/users', {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey,
        subscription_id: subscriptionId
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // 更新订阅 - Paddle Classic API
  async updateSubscription(subscriptionId, data) {
    try {
      const updateData = {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey,
        subscription_id: subscriptionId,
        ...data
      };

      const response = await this.api.post('/subscription/users/update', updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // 取消订阅
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const response = await this.platformApi.post(`/subscriptions/${subscriptionId}/cancel`, options);
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // 获取客户信息
  async getCustomer(customerId) {
    try {
      const response = await this.platformApi.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // 创建客户
  async createCustomer(data) {
    try {
      const response = await this.platformApi.post('/customers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // 获取客户交易记录
  async getCustomerTransactions(customerId) {
    try {
      const response = await this.platformApi.get(`/customers/${customerId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      throw error;
    }
  }

  // 创建交易
  async createTransaction(data) {
    try {
      const response = await this.platformApi.post('/transactions', data);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // 获取账户信息（通过Classic API产品接口测试连接）
  async getAccountInfo() {
    try {
      const response = await this.api.post('/product/get_products', {
        vendor_id: this.vendorId,
        vendor_auth_code: this.apiKey
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  // 验证Webhook签名
  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // 处理Webhook事件
  async handleWebhookEvent(eventType, eventData) {
    try {
      console.log(`Processing Paddle webhook event: ${eventType}`);
      
      switch (eventType) {
        case 'transaction.completed':
          return await this.handleTransactionCompleted(eventData);
        case 'subscription.created':
          return await this.handleSubscriptionCreated(eventData);
        case 'subscription.activated':
          return await this.handleSubscriptionActivated(eventData);
        case 'subscription.updated':
          return await this.handleSubscriptionUpdated(eventData);
        case 'subscription.cancelled':
          return await this.handleSubscriptionCancelled(eventData);
        case 'subscription.past_due':
          return await this.handleSubscriptionPastDue(eventData);
        case 'payment.succeeded':
          return await this.handlePaymentSucceeded(eventData);
        case 'payment.failed':
          return await this.handlePaymentFailed(eventData);
        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
          return { status: 'ignored' };
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  // 处理交易完成事件（Platform: transaction.completed）
  async handleTransactionCompleted(eventData) {
    try {
      console.log('Handling transaction completed event:', JSON.stringify(eventData, null, 2));
      const customData = eventData?.custom_data || {};

      // 分流：如果包含发票令牌，交给发票支付服务处理
      if (customData.payment_token && customData.invoice_id) {
        const InvoicePaymentService = require('./invoicePaymentService');
        const invoicePaymentService = new InvoicePaymentService();

        const result = await invoicePaymentService.handlePaymentWebhook({
          event_type: 'transaction.completed',
          data: eventData
        });

        console.log('Invoice payment webhook processed:', result);
        return result;
      }

      // 否则处理订阅购买完成（基于自定义数据）
      const userId = customData.user_id || customData.userId;
      const plan = customData.plan || 'professional';
      const billingCycle = customData.billing_cycle || customData.billingCycle || 'monthly';

      if (!userId) {
        console.warn('transaction.completed without user_id in custom_data; ignoring');
        return { status: 'ignored', reason: 'missing_user_id' };
      }

      const SubscriptionTimeManager = require('./SubscriptionTimeManager');
      const { User } = require('../models');

      const userPk = parseInt(userId, 10) || userId;
      const user = await User.findByPk(userPk);
      if (!user) {
        console.warn(`User not found for transaction.completed: ${userId}`);
        return { status: 'ignored', reason: 'user_not_found', userId };
      }

      const newEndDate = SubscriptionTimeManager.purchaseSubscription(user, plan, billingCycle);
      const updateData = {
        subscription: plan,
        subscriptionStatus: plan,
        subscriptionEndDate: newEndDate,
        paddleTransactionId: eventData?.id,
        paddleCustomerId: eventData?.customer_id || user.paddleCustomerId,
        paddleSubscriptionId: eventData?.subscription_id || user.paddleSubscriptionId
      };

      try {
        if (typeof user.update === 'function') {
          await user.update(updateData);
          console.log('User subscription updated via model instance');
        } else {
          await User.update(updateData, { where: { id: userPk } });
          console.log('User subscription updated via model update');
        }
      } catch (updateError) {
        console.error('Error updating user subscription from webhook:', updateError);
      }

      return { status: 'processed', plan, billingCycle, userId: userPk };
    } catch (error) {
      console.error('Error handling transaction.completed:', error);
      throw error;
    }
  }

  // 处理订阅创建事件
  async handleSubscriptionCreated(eventData) {
    console.log('Handling subscription created event:', eventData);
    const subscriptionSyncService = require('./subscriptionSyncService');
    return await subscriptionSyncService.handleSubscriptionCreated(eventData);
  }

  // 处理订阅激活事件
  async handleSubscriptionActivated(eventData) {
    console.log('Handling subscription activated event:', eventData);
    const subscriptionSyncService = require('./subscriptionSyncService');
    return await subscriptionSyncService.handleSubscriptionActivated(eventData);
  }

  // 处理订阅更新事件
  async handleSubscriptionUpdated(eventData) {
    console.log('Handling subscription updated event:', eventData);
    const subscriptionSyncService = require('./subscriptionSyncService');
    return await subscriptionSyncService.handleSubscriptionUpdated(eventData);
  }

  // 处理订阅取消事件
  async handleSubscriptionCancelled(eventData) {
    console.log('Handling subscription cancelled event:', eventData);
    const subscriptionSyncService = require('./subscriptionSyncService');
    return await subscriptionSyncService.handleSubscriptionCancelled(eventData);
  }

  // 处理订阅逾期事件
  async handleSubscriptionPastDue(eventData) {
    console.log('Handling subscription past due event:', eventData);
    const subscriptionSyncService = require('./subscriptionSyncService');
    return await subscriptionSyncService.handleSubscriptionPastDue(eventData);
  }

  // 处理支付成功事件
  async handlePaymentSucceeded(eventData) {
    console.log('Handling payment succeeded event:', eventData);
    // 这里可以添加具体的业务逻辑
    return { status: 'processed' };
  }

  // 处理支付失败事件
  async handlePaymentFailed(eventData) {
    console.log('Handling payment failed event:', eventData);
    // 这里可以添加具体的业务逻辑
    return { status: 'processed' };
  }

  // 测试API连接
  async testConnection() {
    try {
      // 测试获取产品信息
      const products = await this.getAccountInfo();
      console.log('✓ API连接成功');
      console.log(`产品数量:`, products.data ? products.data.length : 0);
      
      return { success: true, products };
    } catch (error) {
      console.error('✗ API连接失败:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PaddleService();