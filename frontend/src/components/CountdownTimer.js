import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './CountdownTimer.css';

const CountdownTimer = ({ 
  endDate, 
  subscriptionType = 'trial', 
  onExpired = () => {},
  showWarning = true,
  warningDays = 3 
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        onExpired();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, total: difference });
    };

    // 立即计算一次
    calculateTimeLeft();

    // 每秒更新
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpired]);

  if (!endDate) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="countdown-timer expired">
        <div className="countdown-content">
          <div className="countdown-icon">⏰</div>
          <div className="countdown-text">
            <h3>{t('countdown.expired.title')}</h3>
            <p>{t('countdown.expired.message')}</p>
          </div>
        </div>
      </div>
    );
  }

  const isWarningTime = showWarning && timeLeft.days <= warningDays;
  const timerClass = `countdown-timer ${subscriptionType} ${isWarningTime ? 'warning' : ''}`;

  return (
    <div className={timerClass}>
      <div className="countdown-header">
        <h3>
          {subscriptionType === 'trial' 
            ? t('countdown.trial.title') 
            : t('countdown.subscription.title')
          }
        </h3>
        {isWarningTime && (
          <div className="warning-badge">
            {t('countdown.warning.badge')}
          </div>
        )}
      </div>
      
      <div className="countdown-display">
        <div className="time-unit">
          <span className="time-value">{timeLeft.days}</span>
          <span className="time-label">{t('countdown.days')}</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-unit">
          <span className="time-value">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="time-label">{t('countdown.hours')}</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-unit">
          <span className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="time-label">{t('countdown.minutes')}</span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-unit">
          <span className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="time-label">{t('countdown.seconds')}</span>
        </div>
      </div>

      {isWarningTime && (
        <div className="countdown-warning">
          <p>{t('countdown.warning.message', { days: timeLeft.days })}</p>
        </div>
      )}

      <div className="countdown-footer">
        <p className="countdown-info">
          {subscriptionType === 'trial' 
            ? t('countdown.trial.info') 
            : t('countdown.subscription.info')
          }
        </p>
      </div>
    </div>
  );
};

export default CountdownTimer;