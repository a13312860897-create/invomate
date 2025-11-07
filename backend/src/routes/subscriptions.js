const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const subscriptionSyncService = require('../services/subscriptionSyncService');
const paddleService = require('../services/paddleService');

/**
 * @route GET /api/subscriptions/current
 * @desc 获取当前用户的活跃订阅
 * @access Private
 */
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找用户的活跃订阅
    const subscription = await Subscription.findActiveByUserId(userId);
    
    if (!subscription) {
      return res.json({
        subscription: null,
        plan: 'free',
        status: 'inactive',
        message: 'No active subscription found'
      });
    }

    // 检查订阅是否过期
    const isExpired = Subscription.isExpired(subscription);
    const isTrialExpired = Subscription.isTrialExpired(subscription);
    const daysRemaining = Subscription.getDaysRemaining(subscription);

    res.json({
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndDate: subscription.trialEndDate,
        nextBillingDate: subscription.nextBillingDate,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        currency: subscription.currency,
        isExpired,
        isTrialExpired,
        daysRemaining,
        lastSyncAt: subscription.lastSyncAt
      },
      plan: subscription.planType,
      status: isExpired ? 'expired' : subscription.status
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * @route GET /api/subscriptions/history
 * @desc 获取用户的订阅历史
 * @access Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscriptions = await Subscription.findAllByUserId(userId);
    
    const history = subscriptions.map(sub => ({
      id: sub.id,
      planType: sub.planType,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      cancelledAt: sub.cancelledAt,
      cancelReason: sub.cancelReason,
      createdAt: sub.createdAt
    }));

    res.json({ history });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ error: 'Failed to fetch subscription history' });
  }
});

/**
 * @route POST /api/subscriptions/sync
 * @desc 手动同步用户订阅状态
 * @access Private
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await subscriptionSyncService.syncUserSubscription(userId);
    
    if (!subscription) {
      return res.json({
        success: true,
        message: 'No active subscription to sync',
        subscription: null
      });
    }

    res.json({
      success: true,
      message: 'Subscription synced successfully',
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        endDate: subscription.endDate,
        lastSyncAt: subscription.lastSyncAt
      }
    });
  } catch (error) {
    console.error('Error syncing subscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync subscription',
      details: error.message
    });
  }
});

/**
 * @route POST /api/subscriptions/cancel
 * @desc 取消用户订阅
 * @access Private
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;
    
    // 查找用户的活跃订阅
    const subscription = await Subscription.findActiveByUserId(userId);
    
    if (!subscription || !subscription.paddleSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // 通过Paddle取消订阅
    await paddleService.cancelSubscription(subscription.paddleSubscriptionId, {
      effective_from: 'next_billing_period' // 在下个计费周期生效
    });

    // 更新本地订阅状态
    await Subscription.update(subscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason || 'User requested cancellation'
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      effectiveDate: subscription.nextBillingDate || subscription.endDate
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
});

/**
 * @route GET /api/subscriptions/billing-history
 * @desc 获取用户的账单历史
 * @access Private
 */
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找用户的订阅
    const subscription = await Subscription.findActiveByUserId(userId);
    
    if (!subscription || !subscription.paddleCustomerId) {
      return res.json({ transactions: [] });
    }

    // 从Paddle获取交易历史
    const transactions = await paddleService.getCustomerTransactions(subscription.paddleCustomerId);
    
    const billingHistory = transactions.data?.map(transaction => ({
      id: transaction.id,
      amount: transaction.details?.totals?.grand_total?.amount || 0,
      currency: transaction.currency_code,
      status: transaction.status,
      billedAt: transaction.billed_at,
      description: transaction.details?.line_items?.[0]?.product?.name || 'Subscription',
      invoiceNumber: transaction.invoice_number,
      receiptUrl: transaction.receipt_url
    })) || [];

    res.json({ transactions: billingHistory });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

/**
 * @route GET /api/subscriptions/features
 * @desc 获取用户订阅的功能权限
 * @access Private
 */
router.get('/features', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await Subscription.findActiveByUserId(userId);
    const planType = subscription?.planType || 'free';
    const isActive = subscription && !Subscription.isExpired(subscription);

    // 定义各计划的功能权限
    const featureMatrix = {
      free: {
        maxInvoices: null, // 无限制，改为14天试用期限制
        maxClients: null, // 无限制，改为14天试用期限制
        customTemplates: true, // 试用期内可用
        advancedReports: true, // 试用期内可用
        apiAccess: true, // 试用期内可用
        prioritySupport: false,
        multiCurrency: true, // 试用期内可用
        automatedReminders: true // 试用期内可用
      },
      basic: {
        maxInvoices: 100,
        maxClients: 50,
        customTemplates: true,
        advancedReports: false,
        apiAccess: false,
        prioritySupport: false,
        multiCurrency: true,
        automatedReminders: true
      },
      pro: {
        maxInvoices: 1000,
        maxClients: 500,
        customTemplates: true,
        advancedReports: true,
        apiAccess: true,
        prioritySupport: false,
        multiCurrency: true,
        automatedReminders: true
      },
      enterprise: {
        maxInvoices: null, // unlimited
        maxClients: null, // unlimited
        customTemplates: true,
        advancedReports: true,
        apiAccess: true,
        prioritySupport: true,
        multiCurrency: true,
        automatedReminders: true
      }
    };

    const features = featureMatrix[planType] || featureMatrix.free;
    
    // 如果订阅不活跃，降级到免费计划功能
    const effectiveFeatures = isActive ? features : featureMatrix.free;

    res.json({
      planType,
      isActive,
      features: effectiveFeatures,
      subscription: subscription ? {
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining: Subscription.getDaysRemaining(subscription)
      } : null
    });
  } catch (error) {
    console.error('Error fetching subscription features:', error);
    res.status(500).json({ error: 'Failed to fetch subscription features' });
  }
});

/**
 * @route GET /api/subscriptions/stats
 * @desc 获取订阅同步统计信息（管理员功能）
 * @access Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 这里可以添加管理员权限检查
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const stats = await subscriptionSyncService.getSyncStats();
    
    res.json({
      syncStats: stats,
      isRunning: subscriptionSyncService.isRunning,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ error: 'Failed to fetch subscription stats' });
  }
});

/**
 * @route POST /api/subscriptions/admin/sync-all
 * @desc 手动触发所有订阅同步（管理员功能）
 * @access Private
 */
router.post('/admin/sync-all', authenticateToken, async (req, res) => {
  try {
    // 这里可以添加管理员权限检查
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const results = await subscriptionSyncService.syncAllActiveSubscriptions();
    
    res.json({
      success: true,
      message: 'Sync completed',
      results
    });
  } catch (error) {
    console.error('Error triggering sync all:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync all subscriptions',
      details: error.message
    });
  }
});

module.exports = router;