import React from 'react';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures';
import './FeatureGate.css';

const FeatureGate = ({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true,
  upgradeText = '升级解锁',
  onUpgrade 
}) => {
  const { canUseFeature, getUpgradeRecommendation, getFeatureHint } = useSubscriptionFeatures();

  // 如果可以使用该功能，直接渲染子组件
  if (canUseFeature(feature)) {
    return children;
  }

  // 如果提供了自定义fallback，使用它
  if (fallback) {
    return fallback;
  }

  // 默认的升级提示组件
  const recommendedPlan = getUpgradeRecommendation(feature);
  const hint = getFeatureHint(feature);

  return (
    <div className="feature-gate">
      <div className="feature-gate-content">
        <div className="feature-gate-icon">
          <FiLock size={24} />
        </div>
        <div className="feature-gate-text">
          <h3>需要升级订阅</h3>
          {hint && <p>{hint}</p>}
        </div>
        {showUpgrade && (
          <button 
            className="feature-gate-upgrade"
            onClick={() => onUpgrade?.(recommendedPlan)}
          >
            {upgradeText}
            <FiArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// 使用限制组件
export const UsageLimit = ({ 
  limitType, 
  currentCount, 
  showUpgrade = true,
  onUpgrade 
}) => {
  const { 
    features, 
    isLimitReached, 
    getRemainingQuota, 
    getUpgradeRecommendation 
  } = useSubscriptionFeatures();

  const limit = features[limitType];
  const remaining = getRemainingQuota(limitType, currentCount);
  const isReached = isLimitReached(limitType, currentCount);

  if (limit === -1) {
    return null; // 无限制，不显示
  }

  const percentage = (currentCount / limit) * 100;
  const recommendedPlan = getUpgradeRecommendation();

  return (
    <div className={`usage-limit ${isReached ? 'limit-reached' : ''}`}>
      <div className="usage-limit-header">
        <span className="usage-limit-label">
          {getLimitLabel(limitType)}
        </span>
        <span className="usage-limit-count">
          {currentCount} / {limit}
        </span>
      </div>
      
      <div className="usage-limit-bar">
        <div 
          className="usage-limit-progress"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isReached && showUpgrade && (
        <div className="usage-limit-upgrade">
          <span>已达到使用限制</span>
          <button 
            className="btn-upgrade-small"
            onClick={() => onUpgrade?.(recommendedPlan)}
          >
            升级
          </button>
        </div>
      )}
      
      {!isReached && remaining <= 2 && (
        <div className="usage-limit-warning">
          还剩 {remaining} 个配额
        </div>
      )}
    </div>
  );
};

// 功能提示组件
export const FeatureHint = ({ feature, children }) => {
  const { canUseFeature, getFeatureHint } = useSubscriptionFeatures();

  if (canUseFeature(feature)) {
    return children;
  }

  const hint = getFeatureHint(feature);

  return (
    <div className="feature-hint">
      <div className="feature-hint-icon">
        <FiLock size={16} />
      </div>
      <span>{hint}</span>
    </div>
  );
};

// 辅助函数
const getLimitLabel = (limitType) => {
  const labels = {
    invoiceLimit: '发票数量',
    clientLimit: '客户数量',
    storageLimit: '存储空间',
    teamMembers: '团队成员'
  };
  
  return labels[limitType] || limitType;
};

export default FeatureGate;