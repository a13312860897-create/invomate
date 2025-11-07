/**
 * 统一的订阅时间管理服务
 * 解决试用期重置问题，提供简洁可靠的时间累加逻辑
 */

class SubscriptionTimeManager {
  /**
   * 统一的时间累加方法
   * @param {Date|string|null} currentEndDate - 当前到期时间
   * @param {number} millisecondsToAdd - 要添加的毫秒数
   * @returns {Date} 新的到期时间
   */
  static addTime(currentEndDate, millisecondsToAdd) {
    const now = new Date();
    
    // 确定基准时间：如果当前订阅未过期，从当前到期时间开始；否则从现在开始
    let baseDate;
    if (currentEndDate && new Date(currentEndDate) > now) {
      baseDate = new Date(currentEndDate);
      console.log(`📅 基于现有到期时间累加: ${baseDate.toISOString()}`);
    } else {
      baseDate = now;
      console.log(`📅 基于当前时间开始: ${baseDate.toISOString()}`);
    }
    
    // 累加时间
    const newEndDate = new Date(baseDate.getTime() + millisecondsToAdd);
    console.log(`📅 累加后的新到期时间: ${newEndDate.toISOString()}`);
    
    return newEndDate;
  }

  /**
   * 激活试用期 - 添加14天
   * @param {Object} user - 用户对象
   * @returns {Date} 新的到期时间
   */
  static activateTrial(user) {
    console.log('🎯 激活试用期 - 添加14天');
    const trialDays = 14;
    const millisecondsToAdd = trialDays * 24 * 60 * 60 * 1000;
    return this.addTime(user.subscriptionEndDate, millisecondsToAdd);
  }

  /**
   * 购买订阅 - 根据计费周期添加时间
   * @param {Object} user - 用户对象
   * @param {string} plan - 订阅计划 (professional, etc.)
   * @param {string} billingCycle - 计费周期 (monthly/yearly)
   * @returns {Date} 新的到期时间
   */
  static purchaseSubscription(user, plan, billingCycle) {
    console.log(`🎯 购买订阅 - 计划: ${plan}, 周期: ${billingCycle}`);
    
    let millisecondsToAdd;
    if (billingCycle === 'yearly') {
      // 添加365天
      millisecondsToAdd = 365 * 24 * 60 * 60 * 1000;
      console.log('📅 添加365天 (年度订阅)');
    } else {
      // 添加30天 (月度订阅)
      millisecondsToAdd = 30 * 24 * 60 * 60 * 1000;
      console.log('📅 添加30天 (月度订阅)');
    }
    
    return this.addTime(user.subscriptionEndDate, millisecondsToAdd);
  }

  /**
   * 计算剩余天数
   * @param {Date|string} endDate - 到期时间
   * @returns {number} 剩余天数
   */
  static getDaysRemaining(endDate) {
    if (!endDate) return 0;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    
    if (diffTime <= 0) return 0;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 检查订阅是否过期
   * @param {Date|string} endDate - 到期时间
   * @returns {boolean} 是否过期
   */
  static isExpired(endDate) {
    if (!endDate) return true;
    return new Date(endDate) <= new Date();
  }

  /**
   * 获取订阅状态
   * @param {Object} user - 用户对象
   * @returns {Object} 订阅状态信息
   */
  static getSubscriptionStatus(user) {
    const daysRemaining = this.getDaysRemaining(user.subscriptionEndDate);
    const isExpired = this.isExpired(user.subscriptionEndDate);
    
    return {
      plan: user.subscriptionPlan || 'free',
      status: isExpired ? 'expired' : 'active',
      endDate: user.subscriptionEndDate,
      daysRemaining,
      isExpired
    };
  }
}

module.exports = SubscriptionTimeManager;