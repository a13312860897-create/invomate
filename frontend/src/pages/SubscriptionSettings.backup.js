import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiCreditCard, 
  FiCalendar, 
  FiDownload, 
  FiCheck, 
  FiX, 
  FiLoader, 
  FiAlertCircle,
  FiSettings,
  FiUser,
  FiMail,
  FiHeadphones,
  FiRefreshCw,
  FiAlertTriangle
} from 'react-icons/fi';
import subscriptionService from '../services/subscriptionService';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import SmartCountdownTimer from '../components/SmartCountdownTimer';
import '../styles/SubscriptionSettings.css';

const SubscriptionSettings = () => {
  const { t } = useTranslation(['common', 'subscription']);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 使用订阅计时器 hook
  const { 
    subscriptionStatus, 
    subscriptionType, 
    isTrialActive, 
    isProfessional,
    isBasic,
    getRemainingDays,
    getExpirationDate
  } = useSubscriptionTimer();
  
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // 加载订阅数据
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscriptionData, billingData, featuresData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getBillingHistory(),
        subscriptionService.getSubscriptionFeatures()
      ]);

      setSubscription(subscriptionData.subscription);
      setBillingHistory(billingData.transactions || []);
      setFeatures(featuresData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError(error.message || '加载订阅信息失败');
      toast.error('加载订阅信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 升级订阅
  const handleUpgrade = async () => {
    try {
      navigate('/pricing');
    } catch (error) {
      console.error('Error navigating to pricing:', error);
      toast.error('跳转到定价页面失败');
    }
  };

  // 同步订阅状态
  const handleSyncSubscription = async () => {
    try {
      setSyncing(true);
      const result = await subscriptionService.syncSubscription();
      
      if (result.success) {
        toast.success('订阅状态同步成功');
        await loadSubscriptionData(); // 重新加载数据
      } else {
        toast.error(result.message || '同步失败');
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      toast.error('同步订阅状态失败');
    } finally {
      setSyncing(false);
    }
  };

  // 取消订阅
  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const result = await subscriptionService.cancelSubscription(cancelReason);
      
      if (result.success) {
        toast.success('订阅取消成功');
        setShowCancelModal(false);
        setCancelReason('');
        await loadSubscriptionData(); // 重新加载数据
      } else {
        toast.error(result.message || '取消订阅失败');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('取消订阅失败');
    } finally {
      setCancelling(false);
    }
  };

  // 获取订阅状态徽章
  const getSubscriptionStatusBadge = (status, isActive) => {
    if (!subscription) {
      return <span className="status-badge status-inactive">未激活</span>;
    }

    const statusConfig = {
      active: { text: '活跃', className: 'status-active' },
      cancelled: { text: '已取消', className: 'status-cancelled' },
      past_due: { text: '逾期', className: 'status-past-due' },
      paused: { text: '暂停', className: 'status-paused' },
      trialing: { text: '试用中', className: 'status-trialing' },
      expired: { text: '已过期', className: 'status-expired' },
      inactive: { text: '未激活', className: 'status-inactive' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <span className={`status-badge ${config.className}`}>{config.text}</span>;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 格式化价格
  const formatPrice = (amount, currency = 'EUR') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Paddle金额通常以分为单位
  };

  if (loading) {
    return (
      <div className="subscription-settings">
        <div className="loading-container">
          <FiRefreshCw className="loading-spinner" size={32} />
          <p>加载订阅信息中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-settings">
        <div className="error-container">
          <FiAlertTriangle size={32} />
          <p>加载失败: {error}</p>
          <button className="btn-primary" onClick={loadSubscriptionData}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-settings">
      <div className="settings-header">
        <h1>订阅管理</h1>
        <p>管理您的订阅计划和账单信息</p>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={handleSyncSubscription}
            disabled={syncing}
          >
            {syncing ? (
              <FiRefreshCw className="loading-spinner" size={16} />
            ) : (
              <FiRefreshCw size={16} />
            )}
            {syncing ? '同步中...' : '同步状态'}
          </button>
        </div>
      </div>

      {/* 订阅详情 */}
      <div className="settings-card">
        <div className="card-header">
          <h2>订阅详情</h2>
        </div>
        
        <div className="subscription-details">
          {/* 订阅计划类型 - 突出显示 */}
          <div className="detail-row plan-type-row">
            <span className="label">当前计划</span>
            <span className="value plan-type">
              {subscription?.planType === 'professional' ? 'Professional' : 
               subscription?.planType === 'basic' ? 'Basic' : 'Free'}
              {subscription?.status && (
                <span className="status-indicator">
                  {getSubscriptionStatusBadge(subscription?.status, subscription?.status === 'active')}
                </span>
              )}
            </span>
          </div>

          {/* 简化的时间信息 - 一行显示 */}
          {subscription?.endDate && (
            <div className="detail-row time-info-row">
              <span className="label">剩余时长</span>
              <span className="value time-info">
                {subscription?.daysRemaining != null && subscription?.daysRemaining >= 0 ? (
                  subscription?.daysRemaining > 0 ? `${subscription?.daysRemaining} 天` : '今日到期'
                ) : (
                  '计算中...'
                )}
                <span className="expiry-date">
                  （到期：{formatDate(subscription?.endDate)}）
                </span>
              </span>
            </div>
          )}

          {/* 价格信息 */}
          {subscription?.amount && (
            <div className="detail-row">
              <span className="label">订阅价格</span>
              <span className="value">
                {formatPrice(subscription?.amount, subscription?.currency)} / {subscriptionService.formatBillingCycle(subscription?.billingCycle)}
              </span>
            </div>
          )}

          {/* 下次计费日期（仅对活跃订阅显示） */}
          {subscription?.endDate && subscription?.status === 'active' && subscription?.planType !== 'free' && (
            <div className="detail-row">
              <span className="label">下次计费</span>
              <span className="value">{formatDate(subscription?.endDate)}</span>
            </div>
          )}
        </div>

        <div className="card-actions">
          {(!subscription || subscription?.planType === 'free') && (
            <button 
              className="btn-primary"
              onClick={handleUpgrade}
            >
              <FiCreditCard size={16} />
              升级订阅
            </button>
          )}
          
          {subscription && subscription?.planType !== 'free' && subscription?.status === 'active' && (
            <>
              <button 
                className="btn-secondary"
                onClick={handleUpgrade}
              >
                更改计划
              </button>
              <button 
                className="btn-danger"
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
              >
                取消订阅
              </button>
            </>
          )}
        </div>
      </div>

      {/* 账单历史 */}
      <div className="settings-card">
        <div className="card-header">
          <h2>账单历史</h2>
        </div>
        
        {billingHistory.length > 0 ? (
          <div className="billing-history">
            {billingHistory.map((transaction, index) => (
              <div key={transaction.id || index} className="billing-item">
                <div className="billing-info">
                  <div className="billing-date">
                    {formatDate(transaction.billedAt || transaction.createdAt)}
                  </div>
                  <div className="billing-description">
                    {transaction.description || '订阅付款'}
                  </div>
                  <div className="billing-status">
                    <span className={`status-badge status-${transaction.status}`}>
                      {subscriptionService.formatSubscriptionStatus(transaction.status)}
                    </span>
                  </div>
                </div>
                <div className="billing-amount">
                  {formatPrice(transaction.amount, transaction.currency)}
                </div>
                <div className="billing-actions">
                  {transaction.receiptUrl && (
                    <a 
                      href={transaction.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-icon"
                      title="下载收据"
                    >
                      <FiDownload size={16} />
                    </a>
                  )}
                  {transaction.invoiceNumber && (
                    <span className="invoice-number">
                      #{transaction.invoiceNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiCreditCard size={48} />
            <p>暂无账单历史</p>
          </div>
        )}
      </div>

      {/* 取消订阅确认模态框 */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>确认取消订阅</h3>
            </div>
            <div className="modal-body">
              <p>您确定要取消当前订阅吗？取消后您将失去所有付费功能的访问权限。</p>
              
              <div className="form-group">
                <label htmlFor="cancelReason">取消原因（可选）</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请告诉我们您取消订阅的原因，这将帮助我们改进服务..."
                  rows={3}
                />
              </div>
              
              <div className="warning-box">
                <FiAlertTriangle size={20} />
                <span>订阅将在当前计费周期结束时生效，您可以继续使用付费功能直到那时。</span>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
              >
                保留订阅
              </button>
              <button 
                className="btn-danger"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <FiRefreshCw className="loading-spinner" size={16} />
                ) : (
                  '确认取消'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSettings;