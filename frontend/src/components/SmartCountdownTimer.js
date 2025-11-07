import React from 'react';
import { useTranslation } from 'react-i18next';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import CountdownTimer from './CountdownTimer';

const SmartCountdownTimer = ({ 
  showWarning = true,
  warningDays = 3,
  onExpired = () => {},
  compact = false 
}) => {
  const { t } = useTranslation();
  const { 
    subscriptionStatus, 
    subscriptionType, 
    isTrialActive, 
    isProfessional,
    isBasic,
    getRemainingDays,
    getExpirationDate
  } = useSubscriptionTimer();

  // 如果是免费用户且没有试用，不显示倒计时
  if (subscriptionType === 'free' && !isTrialActive) {
    return null;
  }

  // 如果订阅已过期，显示过期提示
  if (subscriptionStatus === 'expired') {
    return (
      <div className={`inline-flex items-center px-3 py-2 rounded-lg bg-red-100 text-red-800 text-sm font-medium ${compact ? 'text-xs px-2 py-1' : ''}`}>
        <span className="mr-2">⏰</span>
        {t('subscription.expired')}
      </div>
    );
  }

  const expirationDate = getExpirationDate();
  const remainingDays = getRemainingDays();

  // 如果没有到期日期，不显示倒计时
  if (!expirationDate) {
    return null;
  }

  // 紧凑模式：只显示剩余天数
  if (compact) {
    const isWarningTime = showWarning && remainingDays <= warningDays;
    const bgColor = isWarningTime ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${bgColor}`}>
        <span className="mr-1">⏱️</span>
        {remainingDays > 0 ? (
          <span>{remainingDays} {t('common.days_remaining')}</span>
        ) : (
          <span>{t('subscription.expires_today')}</span>
        )}
      </div>
    );
  }

  // 完整模式：使用原始CountdownTimer组件
  return (
    <CountdownTimer
      endDate={expirationDate}
      subscriptionType={isTrialActive ? 'trial' : subscriptionType}
      onExpired={onExpired}
      showWarning={showWarning}
      warningDays={warningDays}
    />
  );
};

export default SmartCountdownTimer;