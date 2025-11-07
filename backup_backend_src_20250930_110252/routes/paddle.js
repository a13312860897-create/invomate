const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

// Paddle配置
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID || '123456';
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || 'your-paddle-api-key';
const PADDLE_PUBLIC_KEY = process.env.PADDLE_PUBLIC_KEY || 'your-paddle-public-key';
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || 'your-webhook-secret';

// 定价配置 - 基于调研的三层定价架构
const PADDLE_PRICING_PLANS = {
  pro: {
    name: 'Professional',
    monthlyProductId: 'pro_monthly_product_id',
    yearlyProductId: 'pro_yearly_product_id',
    monthlyPrice: 19,
    yearlyPrice: 190, // 约17% 折扣
    currency: 'EUR',
    features: [
      'unlimited_invoices',
      'email_sending',
      'dgfip_reporting',
      'peppol_network',
      'advanced_templates',
      'client_management',
      'basic_support',
      'multi_currency',
      'recurring_invoices'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    monthlyProductId: 'enterprise_monthly_product_id',
    yearlyProductId: 'enterprise_yearly_product_id',
    monthlyPrice: 49,
    yearlyPrice: 490, // 约17% 折扣
    currency: 'EUR',
    features: [
      'unlimited_invoices',
      'email_sending',
      'dgfip_reporting',
      'peppol_network',
      'advanced_templates',
      'client_management',
      'priority_support',
      'custom_branding',
      'api_access',
      'bulk_operations',
      'advanced_analytics',
      'white_label',
      'dedicated_account_manager'
    ]
  }
};

// 激活试用（0元预演）
router.post('/activate-trial', authenticateToken, [
  body('planType').isIn(['pro', 'enterprise']).withMessage('无效的订阅计划'),
  body('trialDays').isInt({ min: 1, max: 90 }).withMessage('试用天数必须在1-90天之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planType, trialDays } = req.body;
    const userId = req.user.id;

    // 检查用户是否已经使用过试用
    const user = await User.findByPk(userId);
    if (user.hasUsedTrial) {
      return res.status(400).json({ error: '您已经使用过免费试用' });
    }

    // 计算试用结束时间
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // 更新用户试用状态
    await user.update({
      subscription: planType,
      subscriptionStatus: 'trial',
      subscriptionEndDate: trialEndDate,
      hasUsedTrial: true
    });

    res.json({
      success: true,
      message: `成功激活${trialDays}天免费试用`,
      trialEndDate: trialEndDate,
      planType: planType
    });

  } catch (error) {
    console.error('试用激活失败:', error);
    res.status(500).json({ error: '试用激活失败' });
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
    const invoiceCount = await Invoice.count({
      where: { userId: user.id }
    });

    const thisMonthInvoices = await Invoice.count({
      where: {
        userId: user.id,
        createdAt: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });

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
        maxInvoices: user.subscription === 'free' ? 10 : null,
        canUseAdvancedFeatures: user.subscription !== 'free'
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

    if (!PADDLE_PRICING_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PADDLE_PRICING_PLANS[plan];
    const productId = billingCycle === 'yearly' ? planConfig.yearlyProductId : planConfig.monthlyProductId;
    const price = billingCycle === 'yearly' ? planConfig.yearlyPrice : planConfig.monthlyPrice;

    // 构建Paddle Checkout参数
    const checkoutData = {
      vendor: PADDLE_VENDOR_ID,
      product: productId,
      title: `${planConfig.name} - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`,
      webhook_url: `${process.env.BASE_URL}/api/paddle/webhook`,
      prices: [`${planConfig.currency}:${price}`],
      customer_email: user.email,
      customer_country: user.country || 'FR',
      marketing_consent: '0',
      passthrough: JSON.stringify({
        userId: user.id,
        plan: plan,
        billingCycle: billingCycle
      }),
      success_redirect_url: successUrl,
      cancel_redirect_url: cancelUrl
    };

    // 在实际应用中，这里应该调用Paddle API创建支付链接
    // 现在返回模拟的支付链接
    const paymentLink = `https://checkout.paddle.com/checkout?${new URLSearchParams(checkoutData).toString()}`;

    res.json({ 
      paymentLink,
      checkoutData 
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理Paddle Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['paddle-signature'];
    const body = req.body;

    // 验证Webhook签名
    if (!verifyPaddleWebhook(body, signature)) {
      console.error('Invalid Paddle webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body.toString());
    console.log('Paddle webhook received:', event.alert_name);

    switch (event.alert_name) {
      case 'subscription_payment_succeeded':
        await handleSubscriptionPaymentSucceeded(event);
        break;
      
      case 'subscription_created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'subscription_payment_failed':
        await handleSubscriptionPaymentFailed(event);
        break;
      
      default:
        console.log(`Unhandled Paddle webhook: ${event.alert_name}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Paddle webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// 取消订阅
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.paddleSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 在实际应用中，这里应该调用Paddle API取消订阅
    // 现在只更新数据库状态
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

    // 在实际应用中，这里应该调用Paddle API获取支付历史
    // 现在返回模拟数据
    const mockPayments = [
      {
        id: 'pay_123456',
        amount: user.subscription === 'pro' ? 19 : 49,
        currency: 'EUR',
        status: 'completed',
        date: new Date(),
        description: `${user.subscription === 'pro' ? 'Professional' : 'Enterprise'} Plan`,
        receiptUrl: '#'
      }
    ];

    res.json({ payments: mockPayments });
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
        const invoiceCount = await Invoice.count({
          where: { userId: user.id }
        });
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

// Webhook处理函数
async function handleSubscriptionCreated(event) {
  try {
    const passthrough = JSON.parse(event.passthrough);
    const userId = passthrough.userId;
    const plan = passthrough.plan;
    const billingCycle = passthrough.billingCycle;

    const user = await User.findByPk(userId);
    if (!user) return;

    // 计算订阅结束日期
    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    await user.update({
      subscription: plan,
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate,
      paddleCustomerId: event.user_id,
      paddleSubscriptionId: event.subscription_id
    });

    console.log(`Subscription created for user ${userId}: ${plan}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionPaymentSucceeded(event) {
  try {
    const subscriptionId = event.subscription_id;
    const user = await User.findOne({
      where: { paddleSubscriptionId: subscriptionId }
    });

    if (!user) return;

    // 更新订阅状态和结束日期
    const nextBillDate = new Date(event.next_bill_date);
    await user.update({
      subscriptionStatus: 'active',
      subscriptionEndDate: nextBillDate
    });

    console.log(`Payment succeeded for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handleSubscriptionUpdated(event) {
  try {
    const subscriptionId = event.subscription_id;
    const user = await User.findOne({
      where: { paddleSubscriptionId: subscriptionId }
    });

    if (!user) return;

    const status = event.status === 'active' ? 'active' : 'inactive';
    const endDate = event.next_bill_date ? new Date(event.next_bill_date) : null;

    await user.update({
      subscriptionStatus: status,
      subscriptionEndDate: endDate
    });

    console.log(`Subscription updated: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const subscriptionId = event.subscription_id;
    const user = await User.findOne({
      where: { paddleSubscriptionId: subscriptionId }
    });

    if (!user) return;

    await user.update({
      subscription: 'free',
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: null
    });

    console.log(`Subscription cancelled: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionPaymentFailed(event) {
  try {
    const subscriptionId = event.subscription_id;
    const user = await User.findOne({
      where: { paddleSubscriptionId: subscriptionId }
    });

    if (!user) return;

    await user.update({
      subscriptionStatus: 'payment_failed'
    });

    console.log(`Payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// 验证Paddle Webhook签名
function verifyPaddleWebhook(body, signature) {
  if (!PADDLE_WEBHOOK_SECRET || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
      .update(body)
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

module.exports = router;