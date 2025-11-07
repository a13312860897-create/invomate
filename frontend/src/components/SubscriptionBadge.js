import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiAward, FiStar, FiZap } from 'react-icons/fi';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import './SubscriptionBadge.css';

const SubscriptionBadge = ({ showText = true, size = 'medium' }) => {
  const { t } = useTranslation(['subscription', 'common']);
  const { 
    subscriptionStatus, 
    subscriptionType, 
    isTrialActive, 
    isProfessional,
    isBasic,
    getRemainingDays 
  } = useSubscriptionTimer();

  // 如果是免费用户，不显示徽章
  if (subscriptionType === 'free' && !isTrialActive) {
    return null;
  }

  const getBadgeConfig = () => {
    if (isProfessional) {
      return {
        icon: FiAward,
        text: t('subscription:professional_plan'),
        className: 'subscription-badge-professional',
        bgColor: 'bg-blue-900', // 深蓝色背景与页面一致
        textColor: 'text-orange-400', // 橙色文字
        iconColor: 'text-orange-400', // 橙色图标
        borderColor: 'border-orange-400' // 橙色边框
      };
    }
    
    if (isBasic) {
      return {
        icon: FiStar,
        text: t('subscription:basic_plan'),
        className: 'subscription-badge-basic',
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-white',
        iconColor: 'text-blue-200'
      };
    }
    
    if (isTrialActive) {
      const remainingDays = getRemainingDays();
      return {
        icon: FiZap,
        text: t('subscription:trial_remaining', { days: remainingDays }),
        className: 'subscription-badge-trial',
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        textColor: 'text-white',
        iconColor: 'text-green-200'
      };
    }

    return null;
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const IconComponent = config.icon;
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  return (
    <div className={`
      subscription-badge 
      ${config.className} 
      ${config.bgColor} 
      ${config.borderColor ? config.borderColor : ''}
      ${config.borderColor ? 'border-2' : ''}
      ${sizeClasses[size]}
      inline-flex items-center rounded-full font-medium shadow-sm
      ${config.textColor}
    `}>
      <IconComponent className={`${iconSizes[size]} ${config.iconColor} mr-1.5`} />
      {showText && (
        <span className="whitespace-nowrap">
          {config.text}
        </span>
      )}
    </div>
  );
};

export default SubscriptionBadge;