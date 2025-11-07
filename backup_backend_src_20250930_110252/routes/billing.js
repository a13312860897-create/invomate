const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');

// Stripe配置（在生产环境中应该使用环境变量）
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'invalid-stripe-key');

// 定价配置
const PRICING_PLANS = {
  pro: {
    name: 'Pro',
    monthlyPriceId: 'price_pro_monthly',
    yearlyPriceId: 'price_pro_yearly',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'unlimited_invoices',
      'email_sending',
      'dgfip_reporting',
      'peppol_network',
      'advanced_templates',
      'client_management',
      'basic_support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPriceId: 'price_enterprise_monthly',
    yearlyPriceId: 'price_enterprise_yearly',
    monthlyPrice: 99,
    yearlyPrice: 990,
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
      'bulk_operations'
    ]
  }
};

// 检查用户订阅状态
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'subscription', 'subscriptionStatus', 'subscriptionEndDate', 'stripeCustomerId']
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

// 创建Stripe结账会话
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { plan, billingCycle, successUrl, cancelUrl } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!PRICING_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PRICING_PLANS[plan];
    const priceId = billingCycle === 'yearly' ? planConfig.yearlyPriceId : planConfig.monthlyPriceId;

    // 创建或获取Stripe客户
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id.toString()
        }
      });
      customerId = customer.id;
      await user.update({ stripeCustomerId: customerId });
    }

    // 创建结账会话
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id.toString(),
        plan,
        billingCycle
      }
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理Stripe Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// 取消订阅
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 获取用户的活跃订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 取消订阅（在当前计费周期结束时）
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    res.json({ 
      message: 'Subscription will be cancelled at the end of the current billing period',
      cancelAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 重新激活订阅
router.post('/reactivate-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // 获取用户的订阅
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 取消取消计划
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false
    });

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取计费历史
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      description: invoice.lines.data[0]?.description || 'Subscription',
      downloadUrl: invoice.hosted_invoice_url
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook处理函数
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;
  const billingCycle = session.metadata.billingCycle;

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
    stripeCustomerId: session.customer
  });
}

async function handleSubscriptionUpdated(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;
  
  if (!userId) return;
  
  const user = await User.findByPk(userId);
  if (!user) return;

  const status = subscription.status === 'active' ? 'active' : 'inactive';
  const endDate = new Date(subscription.current_period_end * 1000);

  await user.update({
    subscriptionStatus: status,
    subscriptionEndDate: endDate
  });
}

async function handleSubscriptionDeleted(subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;
  
  if (!userId) return;
  
  const user = await User.findByPk(userId);
  if (!user) return;

  await user.update({
    subscription: 'free',
    subscriptionStatus: 'inactive',
    subscriptionEndDate: null
  });
}

async function handlePaymentSucceeded(invoice) {
  // 可以在这里发送付款成功的邮件通知
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice) {
  // 可以在这里发送付款失败的邮件通知
  console.log('Payment failed for invoice:', invoice.id);
}

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
      // 付费用户可以使用所有功能
      const planConfig = PRICING_PLANS[subscription];
      canUse = planConfig ? planConfig.features.includes(feature) : false;
    }

    res.json({ canUse, subscription });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;