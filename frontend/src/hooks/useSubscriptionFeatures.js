import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';

// 默认功能限制（免费用户 - 14天试用期）
const DEFAULT_FEATURES = {
  invoiceLimit: -1, // 无限制，改为时间限制
  clientLimit: -1, // 无限制，改为时间限制
  customTemplates: true, // 试用期内可用
  advancedReports: true, // 试用期内可用
  apiAccess: true, // 试用期内可用
  prioritySupport: false,
  exportFormats: ['pdf', 'excel', 'csv'], // 试用期内可用更多格式
  storageLimit: -1, // 无限制，改为时间限制
  teamMembers: -1 // 无限制，改为时间限制
};

// 订阅计划功能配置
const PLAN_FEATURES = {
  basic: {
    invoiceLimit: 50,
    clientLimit: 100,
    customTemplates: true,
    advancedReports: false,
    apiAccess: false,
    prioritySupport: false,
    exportFormats: ['pdf', 'excel'],
    storageLimit: 1000, // 1GB
    teamMembers: 3
  },
  pro: {
    invoiceLimit: 500,
    clientLimit: 1000,
    customTemplates: true,
    advancedReports: true,
    apiAccess: true,
    prioritySupport: true,
    exportFormats: ['pdf', 'excel', 'csv'],
    storageLimit: 10000, // 10GB
    teamMembers: 10
  },
  enterprise: {
    invoiceLimit: -1, // 无限制
    clientLimit: -1, // 无限制
    customTemplates: true,
    advancedReports: true,
    apiAccess: true,
    prioritySupport: true,
    exportFormats: ['pdf', 'excel', 'csv', 'xml'],
    storageLimit: -1, // 无限制
    teamMembers: -1 // 无限制
  }
};

export const useSubscriptionFeatures = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载订阅信息和功能权限
  useEffect(() => {
    const loadSubscriptionFeatures = async () => {
      if (!user) {
        setFeatures(DEFAULT_FEATURES);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 获取当前订阅
        const currentSubscription = await subscriptionService.getCurrentSubscription();
        setSubscription(currentSubscription);

        // 获取功能权限
        const userFeatures = await subscriptionService.getSubscriptionFeatures();
        setFeatures(userFeatures || DEFAULT_FEATURES);

      } catch (err) {
        console.error('Failed to load subscription features:', err);
        setError(err.message);
        // 出错时使用默认功能
        setFeatures(DEFAULT_FEATURES);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptionFeatures();
  }, [user]);

  // 检查是否可以使用某个功能
  const canUseFeature = (featureName) => {
    if (loading) return false;
    
    switch (featureName) {
      case 'customTemplates':
        return features.customTemplates;
      case 'advancedReports':
        return features.advancedReports;
      case 'apiAccess':
        return features.apiAccess;
      case 'prioritySupport':
        return features.prioritySupport;
      default:
        return true;
    }
  };

  // 检查是否达到使用限制
  const isLimitReached = (limitType, currentCount) => {
    if (loading) return false;
    
    const limit = features[limitType];
    if (limit === -1) return false; // 无限制
    
    return currentCount >= limit;
  };

  // 获取剩余配额
  const getRemainingQuota = (limitType, currentCount) => {
    const limit = features[limitType];
    if (limit === -1) return -1; // 无限制
    
    return Math.max(0, limit - currentCount);
  };

  // 检查是否支持导出格式
  const supportsExportFormat = (format) => {
    return features.exportFormats?.includes(format) || false;
  };

  // 获取升级建议
  const getUpgradeRecommendation = (requiredFeature) => {
    if (!subscription || subscription.status === 'active') {
      // 根据需要的功能推荐合适的计划
      if (requiredFeature === 'advancedReports' || requiredFeature === 'apiAccess') {
        return 'pro';
      }
      if (requiredFeature === 'customTemplates') {
        return 'basic';
      }
    }
    return null;
  };

  // 刷新订阅信息
  const refreshSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 同步订阅状态
      await subscriptionService.syncSubscription();
      
      // 重新获取订阅信息
      const currentSubscription = await subscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);

      // 重新获取功能权限
      const userFeatures = await subscriptionService.getFeatures();
      setFeatures(userFeatures || DEFAULT_FEATURES);

      return true;
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 获取功能使用提示
  const getFeatureHint = (featureName) => {
    const hints = {
      customTemplates: '自定义发票模板让您的品牌更专业',
      advancedReports: '高级报告帮助您深入了解业务数据',
      apiAccess: 'API 访问让您集成第三方系统',
      prioritySupport: '优先技术支持确保问题快速解决'
    };
    
    return hints[featureName] || '';
  };

  return {
    // 状态
    features,
    subscription,
    loading,
    error,
    
    // 功能检查方法
    canUseFeature,
    isLimitReached,
    getRemainingQuota,
    supportsExportFormat,
    
    // 辅助方法
    getUpgradeRecommendation,
    getFeatureHint,
    refreshSubscription,
    
    // 便捷属性
    isActive: subscription?.status === 'active',
    isPro: subscription?.planType === 'pro',
    isEnterprise: subscription?.planType === 'enterprise',
    hasActiveSubscription: subscription && ['active', 'trialing'].includes(subscription.status)
  };
};

export default useSubscriptionFeatures;