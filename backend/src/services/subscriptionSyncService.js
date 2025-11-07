const Subscription = require('../models/Subscription');
const User = require('../models/User');
const paddleService = require('./paddleService');

class SubscriptionSyncService {
  constructor() {
    this.syncInterval = 30 * 60 * 1000; // 30分钟同步一次
    this.isRunning = false;
  }

  // 启动定期同步
  startPeriodicSync() {
    if (this.isRunning) {
      console.log('Subscription sync is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting periodic subscription sync...');
    
    // 立即执行一次同步
    this.syncAllActiveSubscriptions();
    
    // 设置定期同步
    this.syncTimer = setInterval(() => {
      this.syncAllActiveSubscriptions();
    }, this.syncInterval);
  }

  // 停止定期同步
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isRunning = false;
    console.log('Stopped periodic subscription sync');
  }

  // 同步所有活跃订阅
  async syncAllActiveSubscriptions() {
    try {
      console.log('Starting sync of all active subscriptions...');
      
      // 获取所有需要同步的订阅
      const subscriptions = await this.getSubscriptionsToSync();
      
      if (subscriptions.length === 0) {
        console.log('No subscriptions to sync');
        return;
      }

      console.log(`Found ${subscriptions.length} subscriptions to sync`);
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // 并发同步，但限制并发数量
      const batchSize = 5;
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        const batchPromises = batch.map(subscription => 
          this.syncSingleSubscription(subscription).catch(error => {
            results.failed++;
            results.errors.push({
              subscriptionId: subscription.id,
              paddleSubscriptionId: subscription.paddleSubscriptionId,
              error: error.message
            });
            console.error(`Failed to sync subscription ${subscription.id}:`, error);
          })
        );

        await Promise.allSettled(batchPromises);
        results.success += batch.length - results.failed;
      }

      console.log(`Subscription sync completed: ${results.success} success, ${results.failed} failed`);
      
      if (results.errors.length > 0) {
        console.error('Sync errors:', results.errors);
      }

      return results;
    } catch (error) {
      console.error('Error in syncAllActiveSubscriptions:', error);
      throw error;
    }
  }

  // 获取需要同步的订阅
  async getSubscriptionsToSync() {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      return memoryDb.getSubscriptions().filter(sub => 
        sub.paddleSubscriptionId && 
        ['active', 'trial', 'past_due'].includes(sub.status)
      );
    } else {
      const { Subscription } = require('../models');
      return await Subscription.findAll({
        where: {
          paddleSubscriptionId: {
            [require('sequelize').Op.ne]: null
          },
          status: ['active', 'trial', 'past_due']
        }
      });
    }
  }

  // 同步单个订阅
  async syncSingleSubscription(subscription) {
    try {
      if (!subscription.paddleSubscriptionId) {
        throw new Error('No Paddle subscription ID found');
      }

      // 从Paddle获取最新订阅信息
      const paddleSubscription = await paddleService.getSubscription(subscription.paddleSubscriptionId);
      
      if (!paddleSubscription || !paddleSubscription.data) {
        throw new Error('Failed to fetch subscription from Paddle');
      }

      // 同步订阅状态
      const updatedSubscription = await Subscription.syncWithPaddle(
        subscription.paddleSubscriptionId,
        paddleSubscription.data
      );

      // 如果订阅状态发生变化，更新用户记录
      if (updatedSubscription && updatedSubscription.status !== subscription.status) {
        await this.updateUserSubscriptionStatus(updatedSubscription);
      }

      console.log(`Successfully synced subscription ${subscription.id}`);
      return updatedSubscription;
    } catch (error) {
      console.error(`Error syncing subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  // 更新用户的订阅状态
  async updateUserSubscriptionStatus(subscription) {
    try {
      const userUpdates = {
        subscription: subscription.planType,
        subscriptionStatus: subscription.status,
        subscriptionEndDate: subscription.endDate,
        paddleCustomerId: subscription.paddleCustomerId,
        paddleSubscriptionId: subscription.paddleSubscriptionId
      };

      const dbType = process.env.DB_TYPE || 'postgres';
      
      if (dbType === 'memory') {
        const memoryDb = require('../config/memoryDatabase');
        memoryDb.updateUser(subscription.userId, userUpdates);
      } else {
        await User.update(userUpdates, {
          where: { id: subscription.userId }
        });
      }

      console.log(`Updated user ${subscription.userId} subscription status to ${subscription.status}`);
    } catch (error) {
      console.error(`Error updating user subscription status:`, error);
      throw error;
    }
  }

  // 处理Webhook事件
  async handleWebhookEvent(eventType, eventData) {
    try {
      console.log(`Processing subscription webhook: ${eventType}`);
      
      switch (eventType) {
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
        case 'subscription.paused':
          return await this.handleSubscriptionPaused(eventData);
        case 'subscription.resumed':
          return await this.handleSubscriptionResumed(eventData);
        default:
          console.log(`Unhandled subscription webhook event: ${eventType}`);
          return { status: 'ignored' };
      }
    } catch (error) {
      console.error('Error handling subscription webhook:', error);
      throw error;
    }
  }

  // 处理订阅创建事件
  async handleSubscriptionCreated(eventData) {
    try {
      const subscriptionData = eventData.data;
      
      // 查找或创建订阅记录
      let subscription = await Subscription.findByPaddleId(subscriptionData.id);
      
      if (!subscription) {
        // 创建新的订阅记录
        subscription = await Subscription.create({
          paddleSubscriptionId: subscriptionData.id,
          paddleCustomerId: subscriptionData.customer_id,
          planType: this.mapPaddlePlanToPlanType(subscriptionData.items[0]?.price?.product?.name),
          status: Subscription.mapPaddleStatus(subscriptionData.status),
          startDate: new Date(subscriptionData.started_at),
          endDate: subscriptionData.next_billed_at ? new Date(subscriptionData.next_billed_at) : null,
          nextBillingDate: subscriptionData.next_billed_at ? new Date(subscriptionData.next_billed_at) : null,
          billingCycle: subscriptionData.billing_cycle?.interval || 'monthly',
          amount: subscriptionData.items[0]?.price?.unit_price?.amount || 0,
          currency: subscriptionData.currency_code || 'USD',
          lastSyncAt: new Date(),
          metadata: { paddleData: subscriptionData }
        });
      }

      // 更新用户订阅状态
      await this.updateUserSubscriptionStatus(subscription);
      
      console.log(`Subscription created: ${subscriptionData.id}`);
      return { status: 'processed', subscription };
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  // 处理订阅激活事件
  async handleSubscriptionActivated(eventData) {
    return await this.handleSubscriptionStatusChange(eventData, 'active');
  }

  // 处理订阅更新事件
  async handleSubscriptionUpdated(eventData) {
    try {
      const SubscriptionTimeManager = require('./SubscriptionTimeManager');
      const subscriptionData = eventData.data;
      
      console.log('=== 🎯 新版订阅更新处理 ===');
      console.log('Paddle订阅数据:', subscriptionData);
      
      const subscription = await Subscription.findByPaddleId(subscriptionData.id);
      
      if (!subscription) {
        console.warn(`Subscription not found for update: ${subscriptionData.id}`);
        return { status: 'not_found' };
      }

      // 更新订阅信息
      await Subscription.syncWithPaddle(subscriptionData.id, subscriptionData);
      
      // 获取更新后的订阅信息
      const updatedSubscription = await Subscription.findByPaddleId(subscriptionData.id);
      
      // 使用新的时间管理服务更新用户订阅状态
      await this.updateUserSubscriptionStatusWithTimeManager(updatedSubscription);
      
      console.log(`✅ 订阅更新完成: ${subscriptionData.id}`);
      return { status: 'processed', subscription: updatedSubscription };
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  // 处理订阅取消事件
  async handleSubscriptionCancelled(eventData) {
    return await this.handleSubscriptionStatusChange(eventData, 'cancelled');
  }

  // 处理订阅逾期事件
  async handleSubscriptionPastDue(eventData) {
    return await this.handleSubscriptionStatusChange(eventData, 'past_due');
  }

  // 处理订阅暂停事件
  async handleSubscriptionPaused(eventData) {
    return await this.handleSubscriptionStatusChange(eventData, 'paused');
  }

  // 处理订阅恢复事件
  async handleSubscriptionResumed(eventData) {
    return await this.handleSubscriptionStatusChange(eventData, 'active');
  }

  // 通用的订阅状态变更处理
  async handleSubscriptionStatusChange(eventData, newStatus) {
    try {
      const subscriptionData = eventData.data;
      const subscription = await Subscription.findByPaddleId(subscriptionData.id);
      
      if (!subscription) {
        console.warn(`Subscription not found for status change: ${subscriptionData.id}`);
        return { status: 'not_found' };
      }

      // 更新订阅状态
      await Subscription.updateByPaddleId(subscriptionData.id, {
        status: newStatus,
        lastSyncAt: new Date(),
        ...(newStatus === 'cancelled' && { cancelledAt: new Date() }),
        ...(newStatus === 'paused' && { pausedAt: new Date() }),
        ...(newStatus === 'active' && subscription.status === 'paused' && { resumedAt: new Date() })
      });

      // 更新用户订阅状态
      const updatedSubscription = await Subscription.findByPaddleId(subscriptionData.id);
      await this.updateUserSubscriptionStatus(updatedSubscription);
      
      console.log(`Subscription status changed to ${newStatus}: ${subscriptionData.id}`);
      return { status: 'processed', subscription: updatedSubscription };
    } catch (error) {
      console.error(`Error handling subscription status change to ${newStatus}:`, error);
      throw error;
    }
  }

  // 映射Paddle产品名称到计划类型
  mapPaddlePlanToPlanType(productName) {
    if (!productName) return 'basic';
    
    const name = productName.toLowerCase();
    if (name.includes('enterprise')) return 'enterprise';
    if (name.includes('pro') || name.includes('professional')) return 'pro';
    if (name.includes('basic')) return 'basic';
    
    return 'basic';
  }

  // 手动同步特定用户的订阅
  async syncUserSubscription(userId) {
    try {
      const subscription = await Subscription.findActiveByUserId(userId);
      
      if (!subscription || !subscription.paddleSubscriptionId) {
        console.log(`No active subscription found for user ${userId}`);
        return null;
      }

      return await this.syncSingleSubscription(subscription);
    } catch (error) {
      console.error(`Error syncing subscription for user ${userId}:`, error);
      throw error;
    }
  }

  // 获取同步状态统计
  async getSyncStats() {
    try {
      const subscriptions = await this.getSubscriptionsToSync();
      const now = new Date();
      
      const stats = {
        total: subscriptions.length,
        needsSync: 0,
        lastSyncOld: 0,
        byStatus: {}
      };

      subscriptions.forEach(sub => {
        // 统计状态分布
        stats.byStatus[sub.status] = (stats.byStatus[sub.status] || 0) + 1;
        
        // 检查是否需要同步（超过1小时未同步）
        if (!sub.lastSyncAt || (now - new Date(sub.lastSyncAt)) > 60 * 60 * 1000) {
          stats.needsSync++;
        }
        
        // 检查同步时间是否过旧（超过24小时）
        if (!sub.lastSyncAt || (now - new Date(sub.lastSyncAt)) > 24 * 60 * 60 * 1000) {
          stats.lastSyncOld++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  // 使用新时间管理服务更新用户订阅状态
  async updateUserSubscriptionStatusWithTimeManager(subscription) {
    try {
      const SubscriptionTimeManager = require('./SubscriptionTimeManager');
      
      console.log('=== 🎯 使用新时间管理服务更新用户状态 ===');
      console.log('订阅信息:', {
        id: subscription.id,
        userId: subscription.userId,
        endDate: subscription.endDate,
        status: subscription.status
      });

      // 获取用户
      const dbType = process.env.DB_TYPE || 'postgres';
      let user;
      
      if (dbType === 'memory') {
        const memoryDb = require('../config/memoryDatabase');
        user = memoryDb.findUserById(subscription.userId);
      } else {
        const { User } = require('../models');
        user = await User.findByPk(subscription.userId);
      }

      if (!user) {
        console.warn(`User not found: ${subscription.userId}`);
        return;
      }

      console.log('用户当前状态:', {
        id: user.id,
        subscriptionEndDate: user.subscriptionEndDate,
        subscriptionStatus: user.subscriptionStatus
      });

      // 使用统一时间管理服务获取订阅状态
      const subscriptionStatus = SubscriptionTimeManager.getSubscriptionStatus({
        subscriptionEndDate: subscription.endDate,
        subscriptionPlan: subscription.status === 'active' ? 'premium' : 'free'
      });

      console.log('计算的订阅状态:', subscriptionStatus);

      // 更新用户订阅信息
      const updateData = {
        subscriptionEndDate: subscription.endDate,
        subscriptionStatus: subscriptionStatus.status,
        subscription: subscriptionStatus.status === 'active' ? 'premium' : 'free'
      };

      if (dbType === 'memory') {
        const memoryDb = require('../config/memoryDatabase');
        const updatedUser = memoryDb.updateUser(user.id, updateData);
        console.log('✅ 内存数据库更新成功:', updatedUser ? '成功' : '失败');
      } else {
        if (typeof user.update === 'function') {
          await user.update(updateData);
          console.log('✅ Sequelize更新成功');
        } else {
          const { User } = require('../models');
          await User.update(updateData, { where: { id: user.id } });
          console.log('✅ Sequelize静态更新成功');
        }
      }

      console.log('✅ 用户订阅状态更新完成');
    } catch (error) {
      console.error('Error updating user subscription status with time manager:', error);
      throw error;
    }
  }
}

module.exports = new SubscriptionSyncService();