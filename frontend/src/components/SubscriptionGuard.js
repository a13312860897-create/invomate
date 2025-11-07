import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import './SubscriptionGuard.css';

const SubscriptionGuard = ({ 
  children, 
  feature = 'create_invoice',
  fallbackComponent = null,
  showUpgradePrompt = true,
  blockAccess = false 
}) => {
  const { t } = useTranslation(['subscription', 'common']);
  const {
    subscriptionData,
    isExpired,
    loading,
    hasActiveSubscription,
    hasFeature: canUseFeature,
    getInvoiceLimit,
    handleExpiration
  } = useSubscriptionTimer();

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="subscription-guard-loading">
        <div className="loading-spinner"></div>
        <p>{t('common:loading')}</p>
      </div>
    );
  }

  // 检查是否可以使用该功能
  const canAccess = canUseFeature(feature);
  const invoiceLimit = getInvoiceLimit();

  // 如果订阅已过期且需要阻止访问，不在这里显示提示框
  // 让SubscriptionExpiredModal来处理过期情况
  if (isExpired && blockAccess) {
    // 返回null，让页面正常渲染，由SubscriptionExpiredModal来显示过期提示
    return (
      <div className="subscription-guard-wrapper">
        {children}
      </div>
    );
  }

  // 如果不能访问该功能且订阅已过期，也让SubscriptionExpiredModal处理
  if (!canAccess && isExpired) {
    return (
      <div className="subscription-guard-wrapper">
        {children}
      </div>
    );
  }

  // 如果不能访问该功能，也让SubscriptionExpiredModal处理
  // 不再显示旧版的upgrade_required提示
  if (!canAccess) {
    // 如果提供了自定义的fallback组件
    if (fallbackComponent) {
      return fallbackComponent;
    }

    // 让页面正常渲染，由SubscriptionExpiredModal来显示过期提示
    return (
      <div className="subscription-guard-wrapper">
        {children}
      </div>
    );
  }
  return (
    <div className="subscription-guard-wrapper">
      {/* 渲染子组件 */}
      {children}
    </div>
  );
};

// 高阶组件版本
export const withSubscriptionGuard = (WrappedComponent, options = {}) => {
  return function SubscriptionGuardedComponent(props) {
    return (
      <SubscriptionGuard {...options}>
        <WrappedComponent {...props} />
      </SubscriptionGuard>
    );
  };
};

// 特定功能的守卫组件
export const InvoiceCreationGuard = ({ children }) => (
  <SubscriptionGuard
    feature="create_invoice"
    blockAccess={true}
    showUpgradePrompt={true}
  >
    {children}
  </SubscriptionGuard>
);

export const UnlimitedInvoicesGuard = ({ children }) => (
  <SubscriptionGuard
    feature="unlimited_invoices"
    blockAccess={false}
    showUpgradePrompt={true}
  >
    {children}
  </SubscriptionGuard>
);

export const AdvancedFeaturesGuard = ({ children }) => (
  <SubscriptionGuard
    feature="advanced_templates"
    blockAccess={false}
    showUpgradePrompt={true}
  >
    {children}
  </SubscriptionGuard>
);

export default SubscriptionGuard;