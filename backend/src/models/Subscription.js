const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 获取适当的Subscription模型
const getSubscriptionModel = () => {
  const dbType = process.env.DB_TYPE || 'postgres';
  
  if (dbType === 'memory') {
    // 使用内存数据库
    const memoryDb = require('../config/memoryDatabase');
    return memoryDb;
  } else {
    // 使用Sequelize模型
    const { DataTypes } = require('sequelize');
    const sequelize = db.sequelize;
    
    // 定义Subscription模型
    const Subscription = sequelize.define('Subscription', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      paddleCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Paddle客户ID'
      },
      paddleSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Paddle订阅ID'
      },
      planType: {
        type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
        defaultValue: 'free',
        allowNull: false,
        comment: '订阅计划类型'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'past_due', 'trial', 'paused'),
        defaultValue: 'inactive',
        allowNull: false,
        comment: '订阅状态'
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '订阅开始日期'
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '订阅结束日期'
      },
      trialEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '试用期结束日期'
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '下次计费日期'
      },
      billingCycle: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        allowNull: true,
        comment: '计费周期'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '订阅金额'
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        comment: '货币类型'
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '取消时间'
      },
      cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '取消原因'
      },
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '暂停时间'
      },
      resumedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '恢复时间'
      },
      lastSyncAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后同步时间'
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '额外的订阅元数据'
      }
    }, {
      tableName: 'subscriptions',
      timestamps: true,
      indexes: [
        {
          fields: ['userId']
        },
        {
          fields: ['paddleSubscriptionId']
        },
        {
          fields: ['status']
        },
        {
          fields: ['planType']
        }
      ]
    });
    
    return Subscription;
  }
};

const Subscription = getSubscriptionModel();

// Subscription模型适配Sequelize和内存数据库
class SubscriptionModel {
  // 创建新订阅
  static async create(subscriptionData) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      return Subscription.createSubscription(subscriptionData);
    } else {
      // 使用Sequelize模型
      return await Subscription.create(subscriptionData);
    }
  }

  // 查找订阅
  static async findOne(options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        return Subscription.findSubscriptionById(options.where.id);
      } else if (options.where && options.where.userId) {
        return Subscription.findActiveSubscriptionByUserId(options.where.userId);
      } else if (options.where && options.where.paddleSubscriptionId) {
        return Subscription.findSubscriptionByPaddleId(options.where.paddleSubscriptionId);
      }
      return null;
    } else {
      // 使用Sequelize模型
      return await Subscription.findOne(options);
    }
  }

  // 根据用户ID查找活跃订阅
  static async findActiveByUserId(userId) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      return Subscription.findActiveSubscriptionByUserId(userId);
    } else {
      return await Subscription.findOne({
        where: {
          userId,
          status: ['active', 'trial']
        },
        order: [['createdAt', 'DESC']]
      });
    }
  }

  // 根据Paddle订阅ID查找
  static async findByPaddleId(paddleSubscriptionId) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      return Subscription.findSubscriptionByPaddleId(paddleSubscriptionId);
    } else {
      return await Subscription.findOne({
        where: { paddleSubscriptionId }
      });
    }
  }

  // 更新订阅
  static async update(subscriptionId, updates) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      return Subscription.updateSubscription(subscriptionId, updates);
    } else {
      const [affectedRows] = await Subscription.update(updates, {
        where: { id: subscriptionId }
      });
      return affectedRows > 0;
    }
  }

  // 根据Paddle ID更新订阅
  static async updateByPaddleId(paddleSubscriptionId, updates) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      return Subscription.updateSubscriptionByPaddleId(paddleSubscriptionId, updates);
    } else {
      const [affectedRows] = await Subscription.update(updates, {
        where: { paddleSubscriptionId }
      });
      return affectedRows > 0;
    }
  }

  // 获取用户的所有订阅历史
  static async findAllByUserId(userId) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      return Subscription.findSubscriptionsByUserId(userId);
    } else {
      return await Subscription.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
    }
  }

  // 检查订阅是否过期
  static isExpired(subscription) {
    if (!subscription || !subscription.endDate) {
      return false;
    }
    return new Date(subscription.endDate) < new Date();
  }

  // 检查试用期是否过期
  static isTrialExpired(subscription) {
    if (!subscription || !subscription.trialEndDate) {
      return false;
    }
    return new Date(subscription.trialEndDate) < new Date();
  }

  // 获取订阅剩余天数
  static getDaysRemaining(subscription) {
    if (!subscription || !subscription.endDate) {
      return null;
    }
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // 同步Paddle订阅状态
  static async syncWithPaddle(paddleSubscriptionId, paddleData) {
    try {
      const subscription = await this.findByPaddleId(paddleSubscriptionId);
      
      if (!subscription) {
        console.warn(`Subscription not found for Paddle ID: ${paddleSubscriptionId}`);
        return null;
      }

      const updates = {
        status: this.mapPaddleStatus(paddleData.status),
        lastSyncAt: new Date(),
        metadata: {
          ...subscription.metadata,
          lastPaddleSync: paddleData
        }
      };

      // 更新相关日期
      if (paddleData.next_billed_at) {
        updates.nextBillingDate = new Date(paddleData.next_billed_at);
      }
      
      if (paddleData.started_at) {
        updates.startDate = new Date(paddleData.started_at);
      }

      if (paddleData.canceled_at) {
        updates.cancelledAt = new Date(paddleData.canceled_at);
      }

      if (paddleData.paused_at) {
        updates.pausedAt = new Date(paddleData.paused_at);
      }

      await this.updateByPaddleId(paddleSubscriptionId, updates);
      
      console.log(`Subscription ${paddleSubscriptionId} synced successfully`);
      return await this.findByPaddleId(paddleSubscriptionId);
    } catch (error) {
      console.error('Error syncing subscription with Paddle:', error);
      throw error;
    }
  }

  // 映射Paddle状态到本地状态
  static mapPaddleStatus(paddleStatus) {
    const statusMap = {
      'active': 'active',
      'canceled': 'cancelled',
      'past_due': 'past_due',
      'paused': 'paused',
      'trialing': 'trial'
    };
    
    return statusMap[paddleStatus] || 'inactive';
  }
}

module.exports = SubscriptionModel;