import api from './api';

class PaddleService {
  constructor() {
    // 使用统一的api服务，确保认证和配置一致
    this.apiClient = api;
  }

  // 获取定价计划
  async getPricingPlans() {
    try {
      const response = await this.apiClient.get('/paddle/pricing-plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }
  }

  // 创建支付链接
  async createPaymentLink(planData) {
    try {
      const response = await this.apiClient.post('/paddle/create-payment-link', planData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw error;
    }
  }

  // 激活免费试用
  async activateTrial(trialData) {
    try {
      const response = await this.apiClient.post('/paddle/activate-trial', trialData);
      return response.data;
    } catch (error) {
      console.error('Error activating trial:', error);
      throw error;
    }
  }

  // 获取用户订阅状态（使用新的时限管理系统）
  async getSubscriptionStatus() {
    try {
      const response = await this.apiClient.get('/paddle/subscription-status');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }

  // 模拟支付成功（测试用）
  async mockPaymentSuccess(planData) {
    try {
      const response = await this.apiClient.post('/paddle/mock-payment-success', planData);
      return response.data;
    } catch (error) {
      console.error('Error in mock payment success:', error);
      throw error;
    }
  }

  // 重置试用状态（测试用）
  async resetTrialStatus() {
    try {
      const response = await this.apiClient.post('/paddle/reset-trial-status');
      return response.data;
    } catch (error) {
      console.error('Error resetting trial status:', error);
      throw error;
    }
  }

  // 取消订阅
  async cancelSubscription() {
    try {
      const response = await this.apiClient.post('/paddle/cancel-subscription');
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // 获取计费历史
  async getBillingHistory() {
    try {
      const response = await this.apiClient.get('/paddle/billing-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }

  // 检查功能访问权限
  async checkFeatureAccess(feature) {
    try {
      const response = await this.apiClient.get(`/paddle/check-feature/${feature}`);
      return response.data;
    } catch (error) {
      console.error('Error checking feature access:', error);
      throw error;
    }
  }

  // 加载Paddle SDK
  loadPaddle() {
    return new Promise((resolve, reject) => {
      if (window.Paddle) {
        resolve(window.Paddle);
        return;
      }

      // 动态加载Paddle.js
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      
      script.onload = () => {
        if (window.Paddle) {
          resolve(window.Paddle);
        } else {
          reject(new Error('Paddle failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Paddle script'));
      };
      
      document.head.appendChild(script);
    });
  }

  // 初始化Paddle Checkout (保持向后兼容)
  initializePaddleCheckout() {
    return this.loadPaddle();
  }

  // 打开Paddle Checkout
  async openCheckout(checkoutUrl) {
    try {
      // 若无链接则报错
      if (!checkoutUrl) {
        throw new Error('No checkout URL provided');
      }

      const paddle = await this.initializePaddleCheckout();
      
      // 直接跳转到checkout URL
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error opening Paddle checkout:', error);
      throw error;
    }
  }
}

export default new PaddleService();