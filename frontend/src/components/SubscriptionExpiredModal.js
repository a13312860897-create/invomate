import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import './SubscriptionExpiredModal.css';

const SubscriptionExpiredModal = ({ 
  isVisible = true,
  onRenew = null,
  customMessage = null,
  showBackground = true 
}) => {
  const { t } = useTranslation(['subscription', 'common']);
  const {
    subscriptionData,
    subscriptionType,
    remainingDays,
    getExpirationDate
  } = useSubscriptionTimer();

  if (!isVisible) return null;

  const expirationDate = getExpirationDate();
  const isExpired = remainingDays === 0 || (expirationDate && new Date() >= expirationDate);

  const handleRenewClick = () => {
    if (onRenew) {
      onRenew();
    } else {
      // 默认跳转到定价页面
      window.location.href = '/pricing';
    }
  };

  const handleBackToDashboard = () => {
    // 跳转到主页dashboard
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* 背景遮罩层 */}
      <div className={`subscription-expired-modal-backdrop ${showBackground ? 'with-background' : ''}`}>
        <div className="modal-overlay" />
      </div>
      
      {/* 模态框内容层 */}
      <div className="subscription-expired-modal-content">
        <div className="modal-content">
          {/* 锁定图标 */}
          <div className="modal-icon">
            <div className="lock-icon">
              🔒
            </div>
          </div>

        {/* 标题 */}
        <h2 className="modal-title">
          {isExpired 
            ? t('subscription:expired.title', 'Subscription expired') 
            : t('subscription:expiring_soon.title', 'Subscription expiring soon')
          }
        </h2>

        {/* 消息内容 */}
        <div className="modal-message">
          {customMessage || (
            <div>
              <p className="primary-message">
                {isExpired 
                  ? t('subscription:expired.invoice_creation_blocked', 'Your subscription has expired; invoice creation is blocked. Please renew to continue using the service.')
                  : t('subscription:expiring_soon.message', 'Your subscription is expiring soon. Please renew to avoid service interruption.')
                }
              </p>
              
              {/* 订阅详情 */}
              <div className="subscription-details">
                <div className="detail-item">
                  <span className="label">{t('subscription:current_plan', 'Current plan')}:</span>
                  <span className="value plan-name">
                    {subscriptionType === 'professional' ? t('subscription:plans.professional', 'Professional') :
                     subscriptionType === 'basic' ? t('subscription:plans.basic', 'Basic') :
                     t('subscription:plans.free', 'Free')}
                  </span>
                </div>
                
                {expirationDate && (
                  <div className="detail-item">
                    <span className="label">
                      {isExpired ? t('subscription:expired_on', 'Expired on') : t('subscription:expires_on', 'Expires on')}:
                    </span>
                    <span className="value expiry-date">
                      {expirationDate.toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
                
                {!isExpired && remainingDays !== null && (
                  <div className="detail-item">
                    <span className="label">{t('subscription:days_remaining', 'Days remaining')}:</span>
                    <span className={`value days-remaining ${remainingDays <= 3 ? 'urgent' : ''}`}>
                      {remainingDays} {t('common:days', 'days')}
                    </span>
                  </div>
                )}
              </div>

              {/* 功能限制说明 */}
              <div className="restrictions-info">
                <h4>{t('subscription:restrictions.title', 'Current limitations')}:</h4>
                <ul className="restrictions-list">
                  <li>{t('subscription:restrictions.no_invoice_creation', '• Cannot create new invoices')}</li>
                  <li>{t('subscription:restrictions.limited_access', '• Some features are restricted')}</li>
                  <li>{t('subscription:restrictions.no_support', '• No priority support')}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="modal-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={handleRenewClick}
          >
            <span className="btn-icon">⭐</span>
            {t('subscription:renew_now', 'Renew now')}
          </button>
          
          <Link 
            to="/subscription" 
            className="btn btn-secondary"
          >
            {t('subscription:view_subscription', 'View subscription details')}
          </Link>
          
          <button 
            className="btn btn-link"
            onClick={handleBackToDashboard}
          >
            {t('common:back_to_dashboard', 'Back to dashboard')}
          </button>
        </div>

        {/* 底部说明 */}
        <div className="modal-footer">
          <p className="footer-text">
            {t('subscription:renewal_help', 'Please renew your subscription to continue using all features.')}
          </p>
        </div>

        {/* 无关闭按钮 - 这是关键特性 */}
        {/* 故意不提供关闭按钮，强制用户处理订阅问题 */}
        </div>
      </div>
    </>
  );
};

export default SubscriptionExpiredModal;