import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiClock, FiAlertTriangle, FiCheck, FiInbox } from 'react-icons/fi';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';

const TrialCountdown = ({ size = 'normal' }) => {
  const { t } = useTranslation();
  const { 
    subscription, 
    subscriptionType, 
    subscriptionStatus,
    isExpired, 
    daysRemaining, 
    expiryDate,
    showWarning,
    hasActiveSubscription,
    loading 
  } = useSubscriptionTimer();

  // 添加详细调试日志
  console.log('🎯 TrialCountdown 组件数据:', {
    subscription,
    subscriptionType,
    subscriptionStatus,
    isExpired,
    daysRemaining,
    expiryDate,
    hasActiveSubscription,
    loading
  });
  
  console.log('🔍 TrialCountdown 详细分析:', {
    'subscription存在': !!subscription,
    'subscriptionType值': subscriptionType,
    'isExpired值': isExpired,
    'daysRemaining值': daysRemaining,
    'daysRemaining类型': typeof daysRemaining,
    'hasActiveSubscription值': hasActiveSubscription,
    'hasActiveSubscription类型': typeof hasActiveSubscription,
    'expiryDate': expiryDate ? expiryDate.toString() : 'null'
  });

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className={`flex items-center text-gray-400 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        <FiClock className={`mr-1 animate-spin ${size === 'small' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span className="font-medium">Loading...</span>
      </div>
    );
  }

  // 如果没有订阅数据，显示默认状态
  if (!subscription) {
    return (
      <div className={`flex items-center text-gray-500 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        <FiInbox className={`mr-1 ${size === 'small' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <span className="font-medium">Free</span>
      </div>
    );
  }

  // 获取显示文本和样式
  const getDisplayInfo = () => {
    console.log('🔧 getDisplayInfo 判断逻辑:', {
      subscriptionType,
      daysRemaining,
      'daysRemaining类型': typeof daysRemaining,
      'daysRemaining是否为null': daysRemaining === null,
      isExpired,
      hasActiveSubscription
    });

    // 免费用户
    if (subscriptionType === 'free') {
      console.log('✅ 判断结果: 免费版');
      return {
        text: 'Free',
        icon: FiInbox,
        className: 'text-gray-500',
        showDays: false
      };
    }

    // 优先检查剩余天数 - 如果有剩余天数且大于0，显示正常状态
    // 注意：daysRemaining可能是null，需要先检查是否为数字
    if (typeof daysRemaining === 'number' && daysRemaining > 0) {
      const planNames = {
        'trial': 'Trial',
        'basic': 'Basic',
        'professional': 'Professional',
        'enterprise': 'Enterprise'
      };

      const planName = planNames[subscriptionType] || '订阅';
      
      // 根据剩余天数确定颜色
      let className = 'text-green-600'; // 默认绿色
      if (daysRemaining <= 3) {
        className = 'text-red-600'; // 3天内红色
      } else if (daysRemaining <= 7) {
        className = 'text-orange-600'; // 7天内橙色
      }

      console.log('✅ 判断结果: 有剩余天数', { planName, daysRemaining, className });
      return {
        text: planName,
        icon: FiClock,
        className,
        showDays: true,
        daysText: `${daysRemaining} days remaining`
      };
    }

    // 已过期或无剩余天数
    if (isExpired || (typeof daysRemaining === 'number' && daysRemaining <= 0)) {
      console.log('✅ 判断结果: 订阅已过期');
      return {
        text: 'Subscription expired',
        icon: FiAlertTriangle,
        className: 'text-red-600',
        showDays: false
      };
    }

    // 如果daysRemaining是null但订阅状态是active，可能是数据加载问题
    if (daysRemaining === null && hasActiveSubscription) {
      console.log('✅ 判断结果: 订阅激活但天数未知');
      const planNames = {
        'trial': 'Trial',
        'basic': 'Basic',
        'professional': 'Professional',
        'enterprise': 'Enterprise'
      };
      const planName = planNames[subscriptionType] || '订阅';
      
      return {
        text: planName,
        icon: FiCheck,
        className: 'text-green-600',
        showDays: false
      };
    }

    // 非活跃状态（作为最后的fallback）
    console.log('✅ 判断结果: 订阅未激活');
    return {
      text: 'Subscription inactive',
      icon: FiAlertTriangle,
      className: 'text-gray-400',
      showDays: false
    };
  };

  const displayInfo = getDisplayInfo();
  const IconComponent = displayInfo.icon;

  return (
    <div className={`flex items-center ${displayInfo.className} ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
      <IconComponent className={`mr-1 ${size === 'small' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <span className="font-medium">
        {displayInfo.text}
        {displayInfo.showDays && (
          <span className="ml-1 font-normal">
            {displayInfo.daysText}
          </span>
        )}
      </span>
    </div>
  );
};

export default TrialCountdown;