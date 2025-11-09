const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const paddleService = require('../services/paddleService');

// Paddle配置
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID || '123456';
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || 'your-paddle-api-key';
const PADDLE_PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY || 'your-paddle-public-key';
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || 'ntfset_01k8fvwxgq48qv7smd2e5k3rhz';

// 定价配置 - 从环境变量读取价格ID（优先），否则回退到占位ID
const PADDLE_PRICING_PLANS = {
  basic: {
    name: 'Basic Plan',
    productId: process.env.PADDLE_BASIC_PRODUCT_ID || 'pro_01k8fvwxgq48qv7smd2e5k3rhz',
    monthlyPriceId: process.env.PADDLE_BASIC_MONTHLY_PRICE_ID || 'pri_01k8fvwxgq48qv7smd2e5k3rhz',
    yearlyPriceId: process.env.PADDLE_BASIC_YEARLY_PRICE_ID || 'pri_01k8fvwxgq48qv7smd2e5k3rhy',
    monthlyPrice: 18.70,
    yearlyPrice: 187.00,
    currency: 'EUR',
    features: [
      'unlimited_invoices',
      'email_sending',
      'dgfip_reporting',
      'basic_templates',
      'client_management',
      'basic_support',
      'multi_currency'
    ]
  },
  professional: {
    name: 'Professional Plan',
    productId: process.env.PADDLE_PRO_PRODUCT_ID || 'pro_01k8fvwxgq48qv7smd2e5k3ria',
    monthlyPriceId: process.env.PADDLE_PRO_MONTHLY_PRICE_ID || 'pri_01k8fvwxgq48qv7smd2e5k3rib',
    yearlyPriceId: process.env.PADDLE_PRO_YEARLY_PRICE_ID || 'pri_01k8fvwxgq48qv7smd2e5k3ric',
    monthlyPrice: 37.40,
    yearlyPrice: 374.00,
    currency: 'EUR',
    features: [
      'unlimited_invoices',
      'email_sending',
      'dgfip_reporting',
      'advanced_templates',
      'client_management',
      'priority_support',
      'multi_currency',
      'advanced_reporting',
      'api_access',
      'custom_branding'
    ]
  }
};

// 激活试用（14天免费试用）
router.post('/activate-trial', authenticateToken, async (req, res) => {
  try {
    const SubscriptionTimeManager = require('../services/SubscriptionTimeManager');
    const userId = req.user.id;

    // 检查用户是否已经使用过试用
    const user = await User.findByPk(userId);
    if (user.hasUsedTrial) {
        return res.status(400).json({ error: '您已经使用过免费试用' });
      }

    console.log('=== 🎯 新版试用激活API ===');
    console.log('用户当前状态:', {
      id: user.id,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStatus: user.subscriptionStatus
    });

    // 使用统一时间管理服务计算新的到期时间
    const newEndDate = SubscriptionTimeManager.activateTrial(user);

    // 更新用户试用状态
    const updateData = {
      subscription: 'trial',
      subscriptionStatus: 'trial',
      subscriptionEndDate: newEndDate,
      hasUsedTrial: true
    };

    if (typeof user.update === 'function') {
      // Sequelize模型实例
      await user.update(updateData);
      console.log('✅ Sequelize更新成功');
    } else {
      // 内存数据库或简单对象
      const memoryDb = require('../config/memoryDatabase');
      memoryDb.updateUser(user.id, updateData);
      console.log('✅ 内存数据库更新成功');
    }

    const subscriptionStatus = SubscriptionTimeManager.getSubscriptionStatus({
      subscriptionEndDate: newEndDate,
      subscriptionPlan: 'trial'
    });

    console.log('✅ 试用激活成功:', subscriptionStatus);

    res.json({
      success: true,
      message: '成功激活14天免费试用',
      subscription: {
        endDate: newEndDate,
        planType: 'trial',
        status: 'trial',
        daysRemaining: subscriptionStatus.daysRemaining
      }
    });

  } catch (error) {
    console.error('试用激活失败:', error);
    res.status(500).json({ error: '试用激活失败' });
  }
});

// 设置订阅时间 - 用于测试
router.post('/set-subscription-time', authenticateToken, async (req, res) => {
  try {
    const { endDate } = req.body;
    const user = req.user;

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate is required'
      });
    }

    // 验证日期格式
    const subscriptionEndDate = new Date(endDate);
    if (isNaN(subscriptionEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // 确定订阅状态
    const now = new Date();
    const subscriptionStatus = subscriptionEndDate > now ? 'professional' : 'free';

    // 更新用户订阅信息
    try {
      if (typeof user.update === 'function') {
        // Sequelize模型实例
        await user.update({
          subscriptionStatus: subscriptionStatus,
          subscriptionEndDate: subscriptionEndDate
        });
      } else {
        // 内存数据库或简单对象
        const memoryDb = require('../config/memoryDatabase');
        
        const updatedUser = memoryDb.updateUser(user.id, {
          subscriptionStatus: subscriptionStatus,
          subscriptionEndDate: subscriptionEndDate
        });
        
        if (!updatedUser) {
          // 如果内存数据库更新失败，尝试Sequelize
          const { User } = require('../models');
          await User.update({
            subscriptionStatus: subscriptionStatus,
            subscriptionEndDate: subscriptionEndDate
          }, { where: { id: user.id } });
        }
      }
    } catch (updateError) {
      console.error('Error updating user subscription time:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update user subscription', 
        details: updateError.message 
      });
    }

    console.log('Subscription time set:', {
      userId: user.id,
      subscriptionStatus,
      subscriptionEndDate
    });

    res.json({
      success: true,
      message: 'Subscription time updated successfully',
      endDate: subscriptionEndDate,
      status: subscriptionStatus
    });
  } catch (error) {
    console.error('Error setting subscription time:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to set subscription time', 
      details: error.message 
    });
  }
});

module.exports = router;

// 测试路由 - 用于调试
router.get('/', (req, res) => {
  res.json({ message: 'Paddle routes are working', timestamp: new Date().toISOString() });
});

// 测试Paddle API连接
router.get('/test-connection', authenticateToken, async (req, res) => {
  try {
    const paddleService = require('../services/paddleService');
    const products = await paddleService.getProducts();
    res.json({ 
      success: true, 
      message: 'Paddle API connection successful',
      productCount: products.data ? products.data.length : 0
    });
  } catch (error) {
    console.error('Paddle API connection test failed:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Paddle API connection failed',
      details: error.response?.data || error.message
    });
  }
});
  
  // 获取试用状态 - 不需要认证，因为前端可能在用户登录前调用
router.get('/trial-status', async (req, res) => {
  try {
    // 如果没有提供用户ID，返回默认状态
    const userId = req.query.userId;
    
    if (!userId) {
      return res.json({
        hasUsedTrial: false,
        isTrialActive: false,
        trialEndDate: null,
        subscription: null,
        subscriptionStatus: 'none'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        hasUsedTrial: false,
        isTrialActive: false,
        trialEndDate: null,
        subscription: null,
        subscriptionStatus: 'none'
      });
    }

    const now = new Date();
    const isTrialActive = user.subscriptionStatus === 'trial' && 
                         user.subscriptionEndDate && 
                         new Date(user.subscriptionEndDate) > now;

    res.json({
      hasUsedTrial: user.hasUsedTrial || false,
      isTrialActive: isTrialActive,
      trialEndDate: user.subscriptionEndDate,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus
    });

  } catch (error) {
    console.error('获取试用状态失败:', error);
    res.status(500).json({ error: '获取试用状态失败' });
  }
});

// 生成邀请链接
router.post('/generate-referral', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const referralCode = `${userId}_${Math.random().toString(36).substring(2, 15)}`;
    
    // 保存邀请码到数据库（实际应用中需要创建Referral模型）
    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/register?ref=${referralCode}`;
    
    res.json({
      success: true,
      referralCode: referralCode,
      referralLink: referralLink,
      rewardDays: 7
    });

  } catch (error) {
    console.error('生成邀请链接失败:', error);
    res.status(500).json({ error: '生成邀请链接失败' });
  }
});

// 处理邀请奖励
router.post('/process-referral-reward', authenticateToken, [
  body('referralCode').notEmpty().withMessage('邀请码不能为空'),
  body('newUserId').isInt().withMessage('新用户ID必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { referralCode, newUserId } = req.body;
    const referrerId = parseInt(referralCode.split('_')[0]);
    
    // 验证邀请者
    const referrer = await User.findByPk(referrerId);
    if (!referrer) {
      return res.status(400).json({ error: '无效的邀请码' });
    }

    // 给邀请者增加奖励时间
    const rewardDays = 7;
    let newExpiryDate;
    
    if (referrer.subscriptionStatus === 'active' && referrer.subscriptionEndDate) {
      newExpiryDate = new Date(referrer.subscriptionEndDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + rewardDays);
    } else {
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + rewardDays);
    }

    await referrer.update({
      subscriptionEndDate: newExpiryDate,
      referralRewards: (referrer.referralRewards || 0) + rewardDays
    });

    res.json({
      success: true,
      message: `成功获得${rewardDays}天奖励时间`,
      newExpiryDate: newExpiryDate,
      totalRewards: (referrer.referralRewards || 0) + rewardDays
    });

  } catch (error) {
    console.error('处理邀请奖励失败:', error);
    res.status(500).json({ error: '处理邀请奖励失败' });
  }
});

// 获取定价计划（前端需要的端点）
router.get('/pricing-plans', (req, res) => {
  try {
    const pricingPlans = Object.keys(PADDLE_PRICING_PLANS).map(key => ({
      id: key,
      ...PADDLE_PRICING_PLANS[key]
    }));
    
    res.json({
      success: true,
      plans: pricingPlans,
      vendorId: PADDLE_VENDOR_ID,
      currency: 'EUR'
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取用户订阅状态（前端需要的端点）
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'subscription', 'subscriptionStatus', 'subscriptionEndDate', 'paddleCustomerId', 'paddleSubscriptionId']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查订阅是否过期
    const now = new Date();
    let isActive = true;
    
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < now) {
      isActive = false;
      // 自动降级到免费计划
      await User.update({
        subscription: 'free',
        subscriptionStatus: 'inactive'
      }, {
        where: { id: user.id }
      });
      // 更新本地user对象
      user.subscription = 'free';
      user.subscriptionStatus = 'inactive';
    }

    // 获取使用统计
    const invoiceCountResult = await Invoice.findAndCountAll({
      where: { userId: user.id }
    });
    const invoiceCount = invoiceCountResult.count;

    const thisMonthInvoicesResult = await Invoice.findAndCountAll({
      where: {
        userId: user.id,
        createdAt: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });
    const thisMonthInvoices = thisMonthInvoicesResult.count;

    // 计算剩余天数
    let daysRemaining = null;
    if (user.subscriptionEndDate) {
      const endDate = new Date(user.subscriptionEndDate);
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, diffDays);
    }

    res.json({
      success: true,
      subscription: user.subscription || 'free',
      status: isActive ? (user.subscriptionStatus || 'active') : 'inactive',
      endDate: user.subscriptionEndDate,
      daysRemaining,
      paddleCustomerId: user.paddleCustomerId,
      paddleSubscriptionId: user.paddleSubscriptionId,
      usage: {
        totalInvoices: invoiceCount,
        thisMonthInvoices
      },
      limits: {
        maxInvoices: null, // 无限制，改为14天试用期限制
        canUseAdvancedFeatures: true // 试用期内可用高级功能
      }
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取定价信息
router.get('/pricing', (req, res) => {
  try {
    const pricingInfo = {
      plans: PADDLE_PRICING_PLANS,
      vendorId: PADDLE_VENDOR_ID,
      currency: 'EUR'
    };
    
    res.json(pricingInfo);
  } catch (error) {
    console.error('Error fetching pricing info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 检查用户订阅状态
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'subscription', 'subscriptionStatus', 'subscriptionEndDate', 'paddleCustomerId', 'paddleSubscriptionId']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查订阅是否过期
    const now = new Date();
    let isActive = true;
    
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < now) {
      isActive = false;
      // 自动降级到免费计划
      await user.update({
        subscription: 'free',
        subscriptionStatus: 'inactive'
      });
    }

    // 获取使用统计
    const invoiceCountResult2 = await Invoice.findAndCountAll({
      where: { userId: user.id }
    });
    const invoiceCount = invoiceCountResult2.count;

    const thisMonthInvoicesResult2 = await Invoice.findAndCountAll({
      where: {
        userId: user.id,
        createdAt: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });
    const thisMonthInvoices = thisMonthInvoicesResult2.count;

    res.json({
      subscription: user.subscription || 'free',
      status: isActive ? (user.subscriptionStatus || 'active') : 'inactive',
      endDate: user.subscriptionEndDate,
      paddleCustomerId: user.paddleCustomerId,
      paddleSubscriptionId: user.paddleSubscriptionId,
      usage: {
        totalInvoices: invoiceCount,
        thisMonthInvoices
      },
      limits: {
        maxInvoices: null, // 无限制，改为14天试用期限制
        canUseAdvancedFeatures: true // 试用期内可用高级功能
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建Paddle支付链接
router.post('/create-payment-link', authenticateToken, async (req, res) => {
  try {
    const { plan, billingCycle, successUrl, cancelUrl } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 基础配置校验，避免无谓调用Paddle API
    if (!PADDLE_API_KEY) {
      return res.status(500).json({
        error: 'Paddle API未配置',
        details: '缺少 PADDLE_API_KEY，请在后端环境变量中设置。'
      });
    }

    if (!PADDLE_PRICING_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PADDLE_PRICING_PLANS[plan];
    
    // 创建或获取Paddle客户
    let paddleCustomer;
    if (user.paddleCustomerId) {
      try {
        paddleCustomer = await paddleService.getCustomer(user.paddleCustomerId);
      } catch (error) {
        console.log('Customer not found, creating new one:', error.message);
        // 如果客户不存在，创建新的
        paddleCustomer = await paddleService.createCustomer({
          name: user.name || user.email,
          email: user.email,
          locale: 'en'
        });
        // 兼容内存数据库和Sequelize
        if (typeof user.update === 'function') {
          await user.update({ paddleCustomerId: paddleCustomer.data.id });
        } else {
          await User.update({ paddleCustomerId: paddleCustomer.data.id }, { where: { id: user.id } });
        }
      }
    } else {
      try {
        // 创建新客户（生产模式）
        paddleCustomer = await paddleService.createCustomer({
          name: user.name || user.email,
          email: user.email,
          locale: 'en'
        });
        // 保存客户ID
        if (typeof user.update === 'function') {
          await user.update({ paddleCustomerId: paddleCustomer.data.id });
        } else {
          await User.update({ paddleCustomerId: paddleCustomer.data.id }, { where: { id: user.id } });
        }
      } catch (error) {
        // 403/401等权限问题时，降级为无客户创建的结账流程
        console.error('Error creating customer:', error.response?.data || error.message);
        console.log('Proceeding without creating customer; customer will be created at checkout.');
        paddleCustomer = null;
      }
    }

    // 获取价格ID
    const priceId = billingCycle === 'yearly' ? planConfig.yearlyPriceId : planConfig.monthlyPriceId;
    if (!priceId) {
      // 价格ID未配置或仍为占位ID
      return res.status(500).json({
        error: 'Paddle价格ID未配置',
        details: `请设置 ${billingCycle === 'yearly' ? 'PADDLE_BASIC_YEARLY_PRICE_ID / PADDLE_PRO_YEARLY_PRICE_ID' : 'PADDLE_BASIC_MONTHLY_PRICE_ID / PADDLE_PRO_MONTHLY_PRICE_ID'} 于后端环境变量。`
      });
    }
    
    // 创建简化的交易数据，符合Paddle API要求
    const frontendOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://invomate.app' : 'http://localhost:3002');

    const transactionData = {
      items: [{
        price_id: priceId,
        quantity: 1
      }],
      customer_id: paddleCustomer?.data?.id || paddleCustomer?.id,
      collection_mode: 'automatic',
      custom_data: {
        user_id: user.id.toString(),
        plan: plan,
        billing_cycle: billingCycle
      },
      checkout: {
        success_url: successUrl || `${frontendOrigin}/payment-success`,
        cancel_url: cancelUrl || `${frontendOrigin}/pricing?cancelled=true`
      }
    };

    // 清理未定义字段，确保Platform API接受payload
    if (!transactionData.customer_id) {
      delete transactionData.customer_id;
    }

    console.log('Creating transaction with data:', JSON.stringify(transactionData, null, 2));
    
    // 创建交易
    try {
      const transaction = await paddleService.createTransaction(transactionData);
      const tx = transaction?.data || transaction;

      res.json({ 
        checkoutUrl: tx?.checkout?.url || tx?.checkout_url,
        transactionId: tx?.id
      });
    } catch (error) {
      const errData = error.response?.data;
      const errCode = errData?.error?.code;
      const errDetail = errData?.error?.detail || error.message;
      console.error('Error creating transaction:', errData || error.message);

      if (errCode === 'transaction_default_checkout_url_not_set') {
        return res.status(500).json({
          error: 'Paddle 未配置默认支付链接',
          code: errCode,
          details: errDetail,
          fix: '请在 Paddle 控制台的 Checkout 设置中配置 Default Payment Link（生产环境）。'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to create transaction', 
        code: errCode,
        details: errDetail 
      });
    }
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理Paddle Webhook
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const body = req.body;
    const edgeVerified = (req.headers['x-paddle-verified'] || '').toString().toLowerCase() === 'true';

    // 在生产环境中，如果前置（边缘函数）已校验签名，则直接信任
    if (process.env.NODE_ENV === 'production') {
      if (edgeVerified) {
        console.log('Webhook verified at edge (X-Paddle-Verified=true). Proceeding.');
      } else {
        console.warn('Missing X-Paddle-Verified header in production; rejecting unverified webhook');
        return res.status(400).json({ error: 'Webhook signature not verified' });
      }
    } else {
      // 开发环境：跳过签名验证，便于调试
      console.log('Development mode: Skipping webhook signature verification');
    }

    console.log('Paddle webhook received:', body.event_type);
    console.log('Event data:', JSON.stringify(body.data, null, 2));

    // 使用paddleService处理webhook事件，传递正确的参数
    const result = await paddleService.handleWebhookEvent(body.event_type, body.data);
    console.log('Webhook processing result:', result);

    res.json({ received: true, result });
  } catch (error) {
    console.error('Error handling Paddle webhook:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Webhook handler failed', message: error.message });
  }
});

// 取消订阅
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.paddleSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 使用Paddle SDK取消订阅
    await paddleService.cancelSubscription(user.paddleSubscriptionId);

    await user.update({
      subscriptionStatus: 'cancelled'
    });

    res.json({ 
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取计费历史
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.paddleCustomerId) {
      return res.json({ payments: [] });
    }

    // 使用Paddle SDK获取支付历史
    const transactions = await paddleService.getCustomerTransactions(user.paddleCustomerId);

    res.json({ payments: transactions });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 检查用户是否可以使用特定功能
router.get('/check-feature/:feature', authenticateToken, async (req, res) => {
  try {
    const { feature } = req.params;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = user.subscription || 'free';
    let canUse = false;

    // 免费用户限制
    if (subscription === 'free') {
      const freeFeatures = ['basic_invoicing', 'client_management_basic'];
      canUse = freeFeatures.includes(feature);
      
      // 检查发票数量限制
      if (feature === 'create_invoice') {
        const invoiceCountResult3 = await Invoice.findAndCountAll({
          where: { userId: user.id }
        });
        const invoiceCount = invoiceCountResult3.count;
        canUse = invoiceCount < 10;
      }
    } else {
      // 付费用户可以使用相应计划的功能
      const planConfig = PADDLE_PRICING_PLANS[subscription];
      canUse = planConfig ? planConfig.features.includes(feature) : false;
    }

    res.json({ canUse, subscription });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 模拟支付链接创建（用于测试）
router.post('/create-payment-link-mock', authenticateToken, async (req, res) => {
  try {
    const { plan, billingCycle, successUrl, cancelUrl } = req.body;
    const user = req.user;

    // 模拟支付链接
    const mockCheckoutUrl = `https://checkout.paddle.com/mock?plan=${plan}&billing=${billingCycle}&user=${user.id}`;
    const mockTransactionId = `txn_mock_${Date.now()}`;

    console.log('Mock payment link created:', {
      plan,
      billingCycle,
      checkoutUrl: mockCheckoutUrl,
      transactionId: mockTransactionId
    });

    res.json({
      success: true,
      checkoutUrl: mockCheckoutUrl,
      transactionId: mockTransactionId
    });
  } catch (error) {
    console.error('Error creating mock payment link:', error);
    res.status(500).json({ 
      error: 'Failed to create mock payment link', 
      details: error.message 
    });
  }
});

// 模拟支付成功回调
router.post('/mock-payment-success', authenticateToken, async (req, res) => {
  try {
    const SubscriptionTimeManager = require('../services/SubscriptionTimeManager');
    const { transactionId, plan, billingCycle } = req.body;
    const user = req.user;

    console.log('=== 🎯 新版支付成功API ===');
    console.log('请求参数:', { transactionId, plan, billingCycle });
    console.log('用户当前状态:', {
      id: user.id,
      email: user.email,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStatus: user.subscriptionStatus
    });

    // 使用统一时间管理服务计算新的到期时间
    const newEndDate = SubscriptionTimeManager.purchaseSubscription(user, plan, billingCycle);

    // 更新用户订阅信息
    const updateData = {
      subscription: plan,
      subscriptionStatus: plan,
      subscriptionEndDate: newEndDate,
      paddleTransactionId: transactionId
    };

    try {
      console.log('=== 开始更新数据库 ===');
      if (typeof user.update === 'function') {
        // Sequelize模型实例
        console.log('使用Sequelize模型更新');
        await user.update(updateData);
        console.log('✅ Sequelize更新成功');
      } else {
        // 内存数据库或简单对象
        console.log('使用内存数据库更新');
        const memoryDb = require('../config/memoryDatabase');
        
        const updatedUser = memoryDb.updateUser(user.id, updateData);
        console.log('✅ 内存数据库更新成功:', updatedUser ? '成功' : '失败');
        
        if (!updatedUser) {
          // 如果内存数据库更新失败，尝试Sequelize
          console.log('内存数据库更新失败，尝试Sequelize');
          const { User } = require('../models');
          await User.update(updateData, { where: { id: user.id } });
        }
      }
    } catch (updateError) {
      console.error('=== 数据库更新错误 ===');
      console.error('Error updating user subscription:', updateError);
      // 即使更新失败，也返回成功，因为这是模拟支付
    }

    const subscriptionStatus = SubscriptionTimeManager.getSubscriptionStatus({
      subscriptionEndDate: newEndDate,
      subscriptionPlan: plan
    });

    console.log('=== API处理完成 ===');
    console.log('✅ 支付处理成功:', subscriptionStatus);

    const responseData = {
      success: true,
      message: 'Mock payment processed successfully',
      subscription: {
        status: plan,
        endDate: newEndDate,
        transactionId,
        daysRemaining: subscriptionStatus.daysRemaining
      }
    };
    
    console.log('=== 返回响应 ===');
    console.log('响应数据:', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ 
      error: 'Failed to process mock payment', 
      details: error.message 
    });
  }
});

// 强制过期订阅 - 用于测试
router.post('/force-expire', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    console.log('=== 强制过期订阅 ===');
    console.log('用户ID:', user.id);
    console.log('当前订阅状态:', {
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate
    });

    // 设置订阅为今天的开始时间，使剩余天数变为0
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为今天的00:00:00

    const updateData = {
      subscriptionStatus: 'expired',
      subscriptionEndDate: today.toISOString()
    };

    // 更新用户订阅信息
    if (typeof user.update === 'function') {
      // Sequelize模型实例
      await user.update(updateData);
      console.log('✅ Sequelize更新成功');
    } else {
      // 内存数据库或简单对象
      const memoryDb = require('../config/memoryDatabase');
      const updatedUser = memoryDb.updateUser(user.id, updateData);
      console.log('✅ 内存数据库更新成功:', updatedUser ? '成功' : '失败');
      
      if (!updatedUser) {
        // 如果内存数据库更新失败，尝试Sequelize
        console.log('内存数据库更新失败，尝试Sequelize');
        const { User } = require('../models');
        await User.update(updateData, { where: { id: user.id } });
      }
    }

    console.log('订阅已强制过期，到期日期设为:', today.toISOString());

    res.json({
      success: true,
      message: '订阅已强制过期',
      data: {
        subscriptionStatus: 'expired',
        subscriptionEndDate: today.toISOString(),
        daysRemaining: 0
      }
    });

  } catch (error) {
    console.error('强制过期失败:', error);
    res.status(500).json({ 
      error: '强制过期失败', 
      details: error.message 
    });
  }
});

// 重置试用状态 - 用于测试
router.post('/reset-trial-status', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    console.log('=== 重置试用状态 ===');
    console.log('用户ID:', user.id);

    // 更新用户试用状态
    if (typeof user.update === 'function') {
      // Sequelize模型实例
      await user.update({
        hasUsedTrial: false
      });
    } else {
      // 内存数据库或简单对象
      const memoryDb = require('../config/memoryDatabase');
      memoryDb.updateUser(user.id, {
        hasUsedTrial: false
      });
    }

    console.log('试用状态已重置');

    res.json({
      success: true,
      message: '试用状态已重置'
    });

  } catch (error) {
    console.error('重置试用状态失败:', error);
    res.status(500).json({ error: '重置试用状态失败' });
  }
});

module.exports = router;