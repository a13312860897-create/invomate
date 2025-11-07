import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import paddleService from '../services/paddleService';

const useSubscriptionTimer = () => {
  const { user, updateUser } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取计划名称
  const getPlanName = (planType) => {
    const planNames = {
      'free': 'Free Plan',
      'basic': 'Basic Plan', 
      'professional': 'Professional Plan',
      'enterprise': 'Enterprise Plan'
    };
    return planNames[planType] || 'Free Plan';
  };

  // 获取计划价格
  const getPlanPrice = (planType) => {
    const planPrices = {
      'free': 0,
      'basic': 9.99,
      'professional': 29.99,
      'enterprise': 99.99
    };
    return planPrices[planType] || 0;
  };

  // 计算剩余天数
  const calculateDaysRemaining = useCallback((endDate) => {
    if (!endDate) return 0;
    
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('=== calculateDaysRemaining ===');
    console.log('endDate:', endDate);
    console.log('now:', now);
    console.log('end:', end);
    console.log('diffTime:', diffTime);
    console.log('diffDays:', diffDays);
    console.log('result:', Math.max(0, diffDays));
    
    return Math.max(0, diffDays);
  }, []);

  // 检查订阅是否过期
  const checkIsExpired = useCallback((endDate) => {
    if (!endDate) return false;
    
    const now = new Date();
    const end = new Date(endDate);
    
    const isExpired = now > end;
    console.log('=== checkIsExpired ===');
    console.log('endDate:', endDate);
    console.log('now:', now);
    console.log('end:', end);
    console.log('isExpired:', isExpired);
    
    return isExpired;
  }, []);

  // 开发模式下的模拟订阅数据
  const getMockSubscriptionData = () => {
    const mockData = {
      subscription: 'professional', // 专业版订阅
      status: 'expired', // 已过期状态
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1天前过期
      startDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31天前开始
      planName: 'Professional Plan',
      price: 29.99,
      currency: 'EUR'
    };
    
    console.log('📊 getMockSubscriptionData: 生成已过期专业版模拟数据', mockData);
    
    return mockData;
  };

  // 获取订阅状态
  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      console.log('🚀 fetchSubscriptionStatus: 开始获取订阅状态');
      console.log('当前用户数据:', user);
      
      setLoading(true);
      setError(null);
      
      // 如果有用户数据且包含订阅信息，优先使用用户数据
      if (user && user.subscriptionEndDate) {
        console.log('✅ 使用AuthContext中的用户订阅数据');
        const userData = {
          subscription: user.subscription || 'professional',
          status: user.subscriptionStatus || 'expired',
          endDate: user.subscriptionEndDate,
          startDate: user.subscriptionStartDate || new Date().toISOString(),
          planName: getPlanName(user.subscription || 'professional'),
          price: getPlanPrice(user.subscription || 'professional'),
          currency: 'EUR'
        };
        
        console.log('📊 使用用户数据:', userData);
        setSubscriptionData(userData);
        
        // 检查是否过期
        const now = new Date();
        const endDate = new Date(userData.endDate);
        const expired = now > endDate;
        setIsExpired(expired);
        
        console.log('📅 过期检查:', { now, endDate, expired });
        setLoading(false);
        return;
      }
      
      // 开发模式下，如果没有用户数据，使用模拟数据
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 开发模式：用户无订阅数据，使用模拟订阅数据');
        const mockData = getMockSubscriptionData();
        setSubscriptionData(mockData);
        setIsExpired(false);
        setLoading(false);
        return;
      }
      
      // 如果没有用户，使用默认数据
      if (!user) {
        console.log('❌ fetchSubscriptionStatus: 用户未登录');
        const mockData = getMockSubscriptionData();
        setSubscriptionData(mockData);
        setIsExpired(false);
        setLoading(false);
        return;
      }
      
      console.log('当前用户数据:', {
        id: user.id,
        subscription: user.subscription,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate
      });
      
      setLoading(true);
      setError(null);
      
      console.log('=== 获取订阅状态 ===');
      console.log('用户数据:', user);
      
      // 优先从后端API获取最新的订阅状态（包含新的时限管理逻辑）
      try {
        const response = await paddleService.getSubscriptionStatus();
        console.log('从API获取的订阅状态:', response);
        
        // 构建标准化的订阅数据
         const subscriptionData = {
           subscription: response.subscription || response.subscriptionType || 'free',
           status: response.status || response.subscriptionStatus || 'inactive',
           endDate: response.endDate || response.subscriptionEndDate,
           startDate: response.startDate || response.subscriptionStartDate || new Date().toISOString(),
           planName: getPlanName(response.subscription || response.subscriptionType),
           price: getPlanPrice(response.subscription || response.subscriptionType),
           currency: response.currency || 'EUR',
           daysRemaining: response.daysRemaining || null,
           hasUsedTrial: response.hasUsedTrial || false
         };
        
        setSubscriptionData(subscriptionData);
        
        // 检查是否过期
        if (subscriptionData.endDate) {
          const now = new Date();
          const endDate = new Date(subscriptionData.endDate);
          const expired = now >= endDate;
          setIsExpired(expired);
          
          // 如果过期了且不是免费用户，更新用户状态
          if (expired && subscriptionData.subscription !== 'free') {
            await updateUserSubscription('free', 'inactive');
          }
        } else {
          setIsExpired(false);
        }
        
      } catch (apiError) {
        console.warn('Failed to fetch from API, using user data:', apiError);
        
        // 如果API调用失败，从用户数据中构建订阅信息
        const subscriptionType = user.subscription || user.subscriptionStatus || 'free';
        const subscriptionFromUser = {
          subscription: subscriptionType,
          status: user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date() ? 'active' : 'inactive',
          endDate: user.subscriptionEndDate,
          startDate: user.subscriptionStartDate || new Date().toISOString(),
          planName: getPlanName(subscriptionType),
          price: getPlanPrice(subscriptionType),
          currency: user.currency || 'EUR',
          daysRemaining: user.subscriptionEndDate ? calculateDaysRemaining(user.subscriptionEndDate) : null,
          hasUsedTrial: user.hasUsedTrial || false
        };
        
        setSubscriptionData(subscriptionFromUser);
        
        // 检查是否过期
        if (subscriptionFromUser.endDate) {
          const now = new Date();
          const endDate = new Date(subscriptionFromUser.endDate);
          const expired = now >= endDate;
          setIsExpired(expired);
          
          // 如果过期了，更新用户状态
          if (expired && subscriptionFromUser.subscription !== 'free') {
            await updateUserSubscription('free', 'inactive');
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  // 更新用户订阅状态
  const updateUserSubscription = useCallback(async (subscription, status) => {
    try {
      // 更新本地用户状态
      const updatedUser = {
        ...user,
        subscriptionStatus: subscription,
        subscriptionEndDate: subscription === 'free' ? null : subscriptionData?.endDate
      };
      
      updateUser(updatedUser);
      
      // 重新获取订阅状态以确保数据同步
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 100);
    } catch (err) {
      console.error('Failed to update user subscription:', err);
    }
  }, [user, subscriptionData, updateUser, fetchSubscriptionStatus]);

  // 更新订阅状态
  const updateSubscriptionState = useCallback((subscriptionData) => {
    console.log('=== updateSubscriptionState ===');
    console.log('输入的subscriptionData:', subscriptionData);
    
    if (!subscriptionData) {
      console.log('没有订阅数据，设置默认状态');
      setSubscriptionData(null);
      setIsExpired(false);
      return;
    }

    const endDate = subscriptionData.endDate || subscriptionData.subscriptionEndDate;
    const status = subscriptionData.status || subscriptionData.subscriptionStatus;
    const type = subscriptionData.subscription || subscriptionData.subscriptionType || subscriptionData.planType;

    console.log('解析的数据:');
    console.log('endDate:', endDate);
    console.log('status:', status);
    console.log('type:', type);

    const daysLeft = calculateDaysRemaining(endDate);
    const expired = checkIsExpired(endDate);

    console.log('计算结果:');
    console.log('daysLeft:', daysLeft);
    console.log('expired:', expired);

    setSubscriptionData(subscriptionData);
    setIsExpired(expired);

    console.log('状态更新完成');
  }, [calculateDaysRemaining, checkIsExpired]);

  // 处理订阅过期
  const handleExpiration = useCallback(async () => {
    setIsExpired(true);
    
    // 如果不是免费用户，将其降级为免费用户
    if (subscriptionData?.subscription !== 'free') {
      await updateUserSubscription('free', 'inactive');
    }
  }, [subscriptionData?.subscription, updateUserSubscription]);

  // 检查用户是否有活跃订阅
  const hasActiveSubscription = () => {
    if (!subscriptionData) {
      return false;
    }
    
    const { subscription, status, endDate } = subscriptionData;
    
    // 免费用户没有时间限制
    if (subscription === 'free') {
      return true;
    }
    
    // 专业版和企业版用户，检查订阅状态
    if (subscription === 'professional' || subscription === 'enterprise') {
      // 检查订阅状态
      if (status !== 'active' && status !== 'trial') {
        return false;
      }
      
      // 检查到期时间
      if (endDate) {
        const now = new Date();
        const end = new Date(endDate);
        return now < end;
      }
      
      // 如果没有结束日期，只要状态是active就认为有效
      return status === 'active';
    }
    
    // 基础版用户，检查订阅状态和到期时间
    if (status !== 'active' && status !== 'trial') {
      return false;
    }
    
    if (endDate) {
      const now = new Date();
      const end = new Date(endDate);
      return now < end;
    }
    
    return status === 'active';
  };

  // 获取剩余天数
  const getRemainingDays = () => {
    if (!subscriptionData?.endDate) return null;
    
    const now = new Date();
    const endDate = new Date(subscriptionData.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // 获取到期日期
  const getExpirationDate = () => {
    if (!subscriptionData?.endDate) return null;
    return new Date(subscriptionData.endDate);
  };

  // 检查是否需要显示警告
  const shouldShowWarning = (warningDays = 3) => {
    const remainingDays = getRemainingDays();
    return remainingDays !== null && remainingDays <= warningDays && remainingDays > 0;
  };

  // 检查是否可以使用功能
  const canUseFeature = (feature) => {
    if (!subscriptionData) {
      return false;
    }
    
    const { subscription } = subscriptionData;
    
    // 定义功能权限矩阵
    const featureMatrix = {
      'create_invoice': ['free', 'basic', 'professional', 'enterprise'],
      'unlimited_invoices': ['professional', 'enterprise'],
      'advanced_templates': ['professional', 'enterprise'],
      'integrations': ['professional', 'enterprise'],
      'analytics': ['professional', 'enterprise'],
      'priority_support': ['enterprise'],
      'custom_branding': ['enterprise']
    };
    
    const allowedPlans = featureMatrix[feature] || [];
    const hasActive = hasActiveSubscription();
    const result = allowedPlans.includes(subscription) && hasActive;
    
    return result;
  };

  // 获取发票限制
  const getInvoiceLimit = () => {
    if (!subscriptionData) return 0;
    
    const { subscription } = subscriptionData;
    
    const limits = {
      'free': 5,
      'basic': 50,
      'professional': -1, // 无限制
      'enterprise': -1    // 无限制
    };
    
    return limits[subscription] || 0;
  };

  // 监听用户数据变化，当用户数据更新时重新获取订阅状态
  useEffect(() => {
    console.log('🔄 useSubscriptionTimer: 用户数据变化检测');
    console.log('用户数据:', user);
    
    if (user) {
      console.log('✅ 触发订阅状态获取');
      fetchSubscriptionStatus();
    } else {
      console.log('❌ 跳过订阅状态获取 - 用户未登录');
    }
  }, [user, fetchSubscriptionStatus]); // 使用fetchSubscriptionStatus依赖

  // 定期检查订阅状态（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchSubscriptionStatus();
      }
    }, 5 * 60 * 1000); // 5分钟

    return () => clearInterval(interval);
  }, [user, fetchSubscriptionStatus]);

  return {
    subscription: subscriptionData,
    subscriptionStatus: subscriptionData?.status || 'inactive',
    subscriptionType: subscriptionData?.subscription || 'free',
    isTrialActive: subscriptionData?.status === 'trial',
    isProfessional: subscriptionData?.subscription === 'professional' && subscriptionData?.status === 'active',
    isBasic: subscriptionData?.subscription === 'basic',
    isExpired,
    daysRemaining: getRemainingDays(),
    expiryDate: getExpirationDate(),
    showWarning: shouldShowWarning(),
    loading,
    error,
    hasActiveSubscription: hasActiveSubscription(), // 修复：调用函数而不是返回函数本身
    remainingDays: getRemainingDays(),
    shouldShowWarning: shouldShowWarning(),
    hasFeature: canUseFeature,
    getInvoiceLimit,
    getRemainingDays,
    getExpirationDate,
    handleExpiration,
    refreshSubscription: fetchSubscriptionStatus
  };
};

export default useSubscriptionTimer;