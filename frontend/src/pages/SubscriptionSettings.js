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
  FiAlertTriangle,
  FiStar,
  FiZap,
  FiAward,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiShield
} from 'react-icons/fi';
import subscriptionService from '../services/subscriptionService';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
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

  // Load subscription data
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load in steps to avoid whole-page errors when one fails
      let subData = null;
      let billData = null;
      let featData = null;
      const errors = [];

      try {
        subData = await subscriptionService.getCurrentSubscription();
      } catch (e) {
        console.error('Error loading current subscription:', e);
        errors.push('subscription');
      }

      try {
        billData = await subscriptionService.getBillingHistory();
      } catch (e) {
        console.error('Error loading billing history:', e);
        errors.push('billing');
      }

      try {
        featData = await subscriptionService.getSubscriptionFeatures();
      } catch (e) {
        console.error('Error loading subscription features:', e);
        errors.push('features');
      }

      // Normalize possible response shapes
      const normalizedSub = subData?.subscription || subData?.data || subData || null;
      const normalizedBilling = Array.isArray(billData)
        ? billData
        : Array.isArray(billData?.transactions)
          ? billData.transactions
          : Array.isArray(billData?.data)
            ? billData.data
            : [];
      const normalizedFeatures = featData?.features || featData?.data || featData || null;

      // For dev token, inject demo billing when history is empty for frontend verification
      const token = localStorage.getItem('token');
      const demoBilling = [
        {
          id: 'demo-tx-001',
          billedAt: new Date().toISOString(),
          description: 'Professional monthly subscription',
          status: 'paid',
          amount: 1870,
          currency: 'EUR',
          invoiceNumber: 'INV-DEMO-001',
          receiptUrl: null
        }
      ];

      // Local billing records (written by payment success page) for display when backend is unavailable
      let localBilling = [];
      try {
        const raw = localStorage.getItem('mockBillingHistory');
        localBilling = raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('Read local billing history failed:', e);
      }

      setSubscription(normalizedSub);
      setBillingHistory(
        normalizedBilling.length === 0 && token === 'dev-mock-token'
          ? (localBilling.length > 0 ? localBilling : demoBilling)
          : normalizedBilling
      );
      setFeatures(normalizedFeatures);

      // Only show full-page error when all failed
      if (errors.length === 3) {
        setError('Failed to load subscription information');
        toast.error('Failed to load subscription information');
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError(error.message || 'Failed to load subscription information');
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade subscription
  const handleUpgrade = async () => {
    try {
      navigate('/pricing');
    } catch (error) {
      console.error('Error navigating to pricing:', error);
      toast.error('Failed to navigate to pricing');
    }
  };

  // Sync subscription status
  const handleSyncSubscription = async () => {
    try {
      setSyncing(true);
      const result = await subscriptionService.syncSubscription();
      
      if (result.success) {
        toast.success('Subscription status synced successfully');
        await loadSubscriptionData(); // reload data
      } else {
        toast.error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      toast.error('Failed to sync subscription status');
    } finally {
      setSyncing(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      const result = await subscriptionService.cancelSubscription(cancelReason);
      
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        await loadSubscriptionData(); // reload data
      } else {
        toast.error(result.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  // Get plan config
  const getPlanConfig = () => {
    const planType = (subscription?.planType || subscriptionType || 'free')
      .replace(/^pro$/i, 'professional'); // 兼容后端可能返回的 'pro'

    if (planType === 'professional' || isProfessional) {
      return {
        name: 'Professional',
        icon: FiAward,
        color: 'blue',
        features: ['Unlimited invoices', 'Advanced reports', 'Priority support', 'Custom templates', 'API access']
      };
    }
    
    if (planType === 'basic' || isBasic) {
      return {
        name: 'Basic',
        icon: FiStar,
        color: 'green',
        features: ['50 invoices per month', 'Basic reports', 'Email support', 'Standard templates']
      };
    }
    
    if (isTrialActive) {
      return {
        name: 'Trial',
        icon: FiZap,
        color: 'orange',
        features: ['Try all features', '14-day free trial', 'Full product experience']
      };
    }
    
    return {
      name: 'Free',
      icon: FiShield,
      color: 'gray',
      features: ['5 invoices per month', 'Basic features', 'Community support']
    };
  };

  // Get subscription status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'Active', className: 'status-active', icon: FiCheck },
      cancelled: { text: 'Cancelled', className: 'status-cancelled', icon: FiX },
      past_due: { text: 'Past Due', className: 'status-past-due', icon: FiAlertTriangle },
      paused: { text: 'Paused', className: 'status-paused', icon: FiClock },
      trialing: { text: 'Trialing', className: 'status-trialing', icon: FiZap },
      trial: { text: 'Trialing', className: 'status-trialing', icon: FiZap },
      expired: { text: 'Expired', className: 'status-expired', icon: FiX },
      inactive: { text: 'Inactive', className: 'status-inactive', icon: FiAlertCircle },
      // Map transaction-related statuses to existing styles
      succeeded: { text: 'Succeeded', className: 'status-active', icon: FiCheck },
      paid: { text: 'Paid', className: 'status-active', icon: FiCheck },
      failed: { text: 'Failed', className: 'status-past-due', icon: FiAlertTriangle },
      refunded: { text: 'Refunded', className: 'status-cancelled', icon: FiRefreshCw },
      processing: { text: 'Processing', className: 'status-paused', icon: FiLoader },
      pending: { text: 'Pending', className: 'status-paused', icon: FiClock },
      completed: { text: 'Completed', className: 'status-active', icon: FiCheck }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;
    
    return (
      <span className={`status-badge ${config.className}`}>
        <IconComponent size={14} />
        {config.text}
      </span>
    );
  };

  // Format date
  const formatDate = (dateInput) => {
    if (!dateInput) return '-';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date-time (for billing history)
  const formatDateTime = (dateInput) => {
    if (!dateInput) return '-';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price
  const formatPrice = (amount, currency = 'EUR') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Paddle金额通常以分为单位
  };

  // Remaining time display
  const getRemainingTimeDisplay = () => {
    const remainingDays = getRemainingDays();
    if (remainingDays === null) return 'Calculating...';
    
    if (remainingDays === 0) return 'Due today';
    if (remainingDays < 0) return 'Expired';
    
    return `${remainingDays} days`;
  };

  if (loading) {
    return (
      <div className="subscription-settings">
        <div className="loading-container">
          <div className="loading-spinner">
            <FiRefreshCw className="spin" size={32} />
          </div>
          <p>Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-settings">
        <div className="error-container">
          <FiAlertTriangle size={48} className="error-icon" />
          <h3>Load failed</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadSubscriptionData}>
            <FiRefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const planConfig = getPlanConfig();
  const PlanIcon = planConfig.icon;
  const effectivePlanType = (subscription?.planType || subscriptionType || 'free').replace(/^pro$/i, 'professional');
  const expiryDate = getExpirationDate() || (subscription?.endDate ? new Date(subscription?.endDate) : null);
  const remainingDays = getRemainingDays();
  // 将激活状态与剩余时间挂钩：专业版且剩余天数>0即显示为已激活
  let effectiveStatus = (subscription?.status || subscriptionStatus || 'inactive').toLowerCase();
  if (effectivePlanType === 'professional') {
    if (typeof remainingDays === 'number') {
      effectiveStatus = remainingDays > 0 ? 'active' : (remainingDays === 0 ? 'active' : 'expired');
    } else if (expiryDate instanceof Date) {
      effectiveStatus = expiryDate.getTime() > Date.now() ? 'active' : 'expired';
    }
  }

  return (
    <div className="subscription-settings">
      {/* Page header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Subscription Management</h1>
          <p>Manage your subscription plan and billing information</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleSyncSubscription}
            disabled={syncing}
          >
            {syncing ? (
              <FiRefreshCw className="spin" size={16} />
            ) : (
              <FiRefreshCw size={16} />
            )}
            {syncing ? 'Syncing...' : 'Sync Status'}
          </button>
        </div>
      </div>

      {/* Subscription overview card */}
      <div className="subscription-overview-card">
        <div className="plan-header">
          <div className="plan-info">
            <div className={`plan-icon ${effectiveStatus === 'active' ? 'active' : effectiveStatus === 'expired' ? 'expired' : ''}`}>
              <PlanIcon size={24} />
            </div>
            <div className="plan-details">
              <h2 className="plan-name">{planConfig.name} Plan</h2>
              <div className="plan-status">
                {getStatusBadge(effectiveStatus)}
              </div>
            </div>
          </div>
          
          {(expiryDate || subscription?.endDate) && (
            <div className="time-info">
              <div className="time-label">Remaining Time</div>
              <div className="time-value">{getRemainingTimeDisplay()}</div>
              <div className="expiry-date">Expires: {formatDate(expiryDate || subscription?.endDate)}</div>
            </div>
          )}
        </div>

        <div className="plan-features">
          <h4>Your plan includes:</h4>
          <ul className="features-list">
            {planConfig.features.map((feature, index) => (
              <li key={index}>
                <FiCheck size={16} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="plan-actions">
          {(!subscription || effectivePlanType === 'free') && (
            <button 
              className="btn btn-primary btn-large"
              onClick={handleUpgrade}
            >
              <FiTrendingUp size={18} />
              Upgrade to paid plan
            </button>
          )}
          {/* 已按需求移除“更改计划”和“取消订阅”按钮 */}
        </div>
      </div>

      {/* Subscription details */}
      {subscription && (
        <div className="settings-card">
          <div className="card-header">
            <h3>
              <FiCreditCard size={20} />
              Subscription Details
            </h3>
          </div>
          
          <div className="subscription-details">
            <div className="detail-grid">
              {subscription?.amount && (
                <div className="detail-item">
                  <div className="detail-label">
                    <FiDollarSign size={16} />
                    Subscription Price
                  </div>
                  <div className="detail-value">
                    {formatPrice(subscription?.amount, subscription?.currency)} / {subscriptionService.formatBillingCycle(subscription?.billingCycle)}
                  </div>
                </div>
              )}
              
              {(subscription?.nextBillingDate || expiryDate) && effectiveStatus === 'active' && effectivePlanType !== 'free' && (
                <div className="detail-item">
                  <div className="detail-label">
                    <FiCalendar size={16} />
                    Next Billing
                  </div>
                  <div className="detail-value">
                    {formatDate(subscription?.nextBillingDate || expiryDate)}
                  </div>
                </div>
              )}
              
              <div className="detail-item">
                <div className="detail-label">
                  <FiUser size={16} />
                  Subscriber
                </div>
                <div className="detail-value">
                  {user?.firstName} {user?.lastName}
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-label">
                  <FiMail size={16} />
                  Billing Email
                </div>
                <div className="detail-value">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing history */}
      <div className="settings-card">
        <div className="card-header">
          <h3>
            <FiCreditCard size={20} />
            Billing History
          </h3>
        </div>
        
        <div className="billing-section">
          {billingHistory.length > 0 ? (
            <div className="billing-history">
              {billingHistory.map((transaction, index) => (
                <div key={transaction.id || index} className="billing-item">
                  <div className="billing-main">
                    <div className="billing-info">
                      <div className="billing-date">
                        <FiCalendar size={16} />
                        {formatDateTime(transaction.billedAt || transaction.createdAt)}
                      </div>
                      <div className="billing-description">
                        {transaction.description || 'Subscription Payment'}
                      </div>
                    </div>
                    
                    <div className="billing-status">
                      {getStatusBadge(transaction.status)}
                    </div>
                    
                    <div className="billing-amount">
                      {formatPrice(transaction.amount, transaction.currency)}
                    </div>
                  </div>
                  
                  <div className="billing-actions">
                    {transaction.receiptUrl && (
                      <a 
                        href={transaction.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-icon"
                        title="Download receipt"
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
              <h4>No billing history</h4>
              <p>Your billing records will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel subscription confirmation modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Cancellation</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="warning-box">
                <FiAlertTriangle size={24} />
                <div>
                  <h4>Are you sure you want to cancel your subscription?</h4>
                  <p>After cancellation you will lose access to paid features. The cancellation takes effect at the end of the current billing cycle; you can continue using paid features until then.</p>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cancelReason">Cancellation reason (optional)</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us why you’re cancelling to help us improve..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <FiRefreshCw className="spin" size={16} />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <FiX size={16} />
                    Confirm Cancellation
                  </>
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