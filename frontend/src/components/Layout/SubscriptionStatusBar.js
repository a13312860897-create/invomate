import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiStar, FiZap, FiAward, FiClock } from 'react-icons/fi';
import useSubscriptionTimer from '../../hooks/useSubscriptionTimer';

const SubscriptionStatusBar = () => {
  const { t } = useTranslation(['subscription', 'common']);
  const { 
    subscriptionStatus, 
    subscriptionType, 
    isTrialActive, 
    isProfessional,
    isBasic,
    getRemainingDays 
  } = useSubscriptionTimer();

  // 如果是免费用户且没有试用，不显示状态条
  if (subscriptionType === 'free' && !isTrialActive) {
    return null;
  }

  const getStatusConfig = () => {
    if (isProfessional) {
      return {
        icon: FiAward,
        text: t('subscription:professional_plan'),
        bgColor: 'bg-blue-900',
        textColor: 'text-orange-400',
        iconColor: 'text-orange-400',
        borderColor: 'border-orange-500'
      };
    }
    
    if (isBasic) {
      return {
        icon: FiStar,
        text: t('subscription:basic_plan'),
        subText: t('subscription:basic_features'),
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-white',
        iconColor: 'text-blue-200'
      };
    }
    
    if (isTrialActive) {
      const remainingDays = getRemainingDays();
      return {
        icon: FiZap,
        text: t('subscription:trial_active'),
        subText: t('subscription:trial_remaining', { days: remainingDays }),
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        textColor: 'text-white',
        iconColor: 'text-green-200'
      };
    }

    return null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className="px-4 pb-4">
      <div className={`
        ${config.bgColor} 
        ${config.textColor}
        ${config.borderColor ? `border-2 ${config.borderColor}` : ''}
        rounded-lg p-3 shadow-sm
      `}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {config.text}
            </div>
            <div className="text-xs opacity-90 truncate">
              {config.subText}
            </div>
          </div>
          {isTrialActive && (
            <div className="flex-shrink-0 ml-2">
              <FiClock className="h-4 w-4 opacity-75" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusBar;