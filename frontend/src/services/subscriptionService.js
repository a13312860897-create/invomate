import api from './api';

/**
 * 订阅服务类
 */
class SubscriptionService {
  /**
   * 获取当前用户的活跃订阅
   */
  async getCurrentSubscription() {
    try {
      const response = await api.get('/subscriptions/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取用户的订阅历史
   */
  async getSubscriptionHistory() {
    try {
      const response = await api.get('/subscriptions/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 手动同步用户订阅状态
   */
  async syncSubscription() {
    try {
      const response = await api.post('/subscriptions/sync');
      return response.data;
    } catch (error) {
      console.error('Error syncing subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 取消用户订阅
   * @param {string} reason - 取消原因
   */
  async cancelSubscription(reason = '') {
    try {
      const response = await api.post('/subscriptions/cancel', { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取用户的账单历史
   */
  async getBillingHistory() {
    try {
      const response = await api.get('/subscriptions/billing-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取用户订阅的功能权限
   */
  async getSubscriptionFeatures() {
    try {
      const response = await api.get('/subscriptions/features');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription features:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取订阅同步统计信息（管理员功能）
   */
  async getSyncStats() {
    try {
      const response = await api.get('/subscriptions/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 手动触发所有订阅同步（管理员功能）
   */
  async syncAllSubscriptions() {
    try {
      const response = await api.post('/subscriptions/admin/sync-all');
      return response.data;
    } catch (error) {
      console.error('Error syncing all subscriptions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 检查用户是否有特定功能权限
   * @param {string} feature - 功能名称
   */
  async hasFeature(feature) {
    try {
      const featuresData = await this.getSubscriptionFeatures();
      return featuresData.features[feature] === true;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false; // 默认返回false，确保安全
    }
  }

  /**
   * 检查用户是否达到使用限制
   * @param {string} limitType - 限制类型 (maxInvoices, maxClients)
   * @param {number} currentCount - 当前使用数量
   */
  async checkUsageLimit(limitType, currentCount) {
    try {
      const featuresData = await this.getSubscriptionFeatures();
      const limit = featuresData.features[limitType];
      
      if (limit === null || limit === undefined) {
        return { hasLimit: false, isExceeded: false, limit: null, remaining: null };
      }

      const isExceeded = currentCount >= limit;
      const remaining = Math.max(0, limit - currentCount);

      return {
        hasLimit: true,
        isExceeded,
        limit,
        remaining,
        currentCount
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      // 安全起见，返回限制已达到
      return { hasLimit: true, isExceeded: true, limit: 0, remaining: 0 };
    }
  }

  /**
   * 格式化订阅状态显示文本
   * @param {string} status - 订阅状态
   */
  formatSubscriptionStatus(status) {
    const statusMap = {
      active: '活跃',
      cancelled: '已取消',
      past_due: '逾期',
      paused: '暂停',
      trialing: '试用中',
      expired: '已过期',
      inactive: '未激活'
    };
    return statusMap[status] || status;
  }

  /**
   * 格式化计费周期显示文本
   * @param {string} billingCycle - 计费周期
   */
  formatBillingCycle(billingCycle) {
    const cycleMap = {
      monthly: '月付',
      yearly: '年付',
      quarterly: '季付'
    };
    return cycleMap[billingCycle] || billingCycle;
  }

  /**
   * 格式化计划类型显示文本
   * @param {string} planType - 计划类型
   */
  formatPlanType(planType) {
    const planMap = {
      free: '免费版',
      basic: '基础版',
      pro: '专业版',
      enterprise: '企业版'
    };
    return planMap[planType] || planType;
  }

  /**
   * 计算剩余天数的显示文本
   * @param {number} daysRemaining - 剩余天数
   */
  formatDaysRemaining(daysRemaining) {
    if (daysRemaining === null || daysRemaining === undefined) {
      return '无限制';
    }
    
    if (daysRemaining < 0) {
      return `已过期 ${Math.abs(daysRemaining)} 天`;
    }
    
    if (daysRemaining === 0) {
      return '今天到期';
    }
    
    if (daysRemaining === 1) {
      return '明天到期';
    }
    
    return `还有 ${daysRemaining} 天`;
  }

  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   */
  handleError(error) {
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      return {
        status,
        message: data.error || data.message || '服务器错误',
        details: data.details || null
      };
    } else if (error.request) {
      // 网络错误
      return {
        status: 0,
        message: '网络连接错误，请检查网络设置',
        details: null
      };
    } else {
      // 其他错误
      return {
        status: -1,
        message: error.message || '未知错误',
        details: null
      };
    }
  }
}

// 创建单例实例
const subscriptionService = new SubscriptionService();

export default subscriptionService;