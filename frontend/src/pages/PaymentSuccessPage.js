import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { appendLocalBillingRecord } from '../utils/billingRecord';
import { 
  FiCheckCircle, 
  FiCreditCard, 
  FiCalendar, 
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import paddleService from '../services/paddleService';
import './PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation(['common', 'subscription']);
  
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const appendedRef = useRef(false);

  // 生成并保存本地账单记录（用于测试/前端演示）
  const appendSuccessBilling = () => {
    const PRICE_CENTS = 1870; // €18.70
    const currency = 'EUR';
    const description = '专业版月度订阅';
    const id = transactionId ? `tx-${transactionId}` : undefined;
    appendLocalBillingRecord({ id, amountCents: PRICE_CENTS, currency, description });
  };

  // 从URL参数获取支付信息
  const transactionId = searchParams.get('transaction_id');
  const subscriptionId = searchParams.get('subscription_id');
  const planType = searchParams.get('plan');
  const billingCycle = searchParams.get('billing');

  useEffect(() => {
    handlePaymentSuccess();
  }, [transactionId, subscriptionId]);

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      setProcessingPayment(true);

      // 如果有交易ID，处理支付成功
      if (transactionId) {
        console.log('Processing payment success for transaction:', transactionId);
        
        // 等待一段时间让webhook处理完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 刷新用户信息以获取最新的订阅状态
        await refreshUser();
        
        // 获取最新的订阅状态
        const subscriptionData = await paddleService.getSubscriptionStatus();
        setSubscription(subscriptionData);
        // 购买成功生成本地账单记录（仅执行一次，避免StrictMode重复）
        if (!appendedRef.current) {
          appendSuccessBilling();
          appendedRef.current = true;
        }
        
        // 显示成功消息
        toast.success(t('subscription.payment.success'));
      } else {
        // 没有交易ID，直接获取当前订阅状态
        const subscriptionData = await paddleService.getSubscriptionStatus();
        setSubscription(subscriptionData);
        // 无交易ID时不追加账单记录，避免与其他入口重复写入
      }
    } catch (err) {
      console.error('Error processing payment success:', err);
      setError(err.message);
      toast.error(t('subscription.payment.error'));
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  const getPlanDisplayName = (planName) => {
    const planNames = {
      'basic': t('subscription.plans.basic'),
      'professional': t('subscription.plans.professional'),
      'free_trial': t('subscription.plans.trial')
    };
    return planNames[planName] || planName;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContinue = () => {
    // 根据订阅类型导航到不同页面
    if (subscription?.subscription === 'trial') {
      navigate('/dashboard?welcome=trial');
    } else {
      navigate('/dashboard?welcome=subscription');
    }
  };

  const handleViewSubscription = () => {
    navigate('/subscription');
  };

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="loading-section">
            <FiRefreshCw className="loading-spinner" size={48} />
            <h2>{processingPayment ? t('subscription.payment.processing') : t('common.loading')}</h2>
            <p>{t('subscription.payment.processing_description')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="error-section">
            <FiAlertCircle size={48} className="error-icon" />
            <h2>{t('subscription.payment.error_title')}</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/subscription')}
              >
                {t('subscription.view_subscription')}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                {t('common.back_to_dashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <div className="success-container">
        {/* 成功图标和标题 */}
        <div className="success-header">
          <div className="success-icon">
            <FiCheckCircle size={64} />
          </div>
          <h1>{t('subscription.payment.success_title')}</h1>
          <p>{t('subscription.payment.success_description')}</p>
        </div>

        {/* 订阅详情卡片 */}
        {subscription && (
          <div className="subscription-card">
            <div className="card-header">
              <FiCreditCard size={24} />
              <h3>{t('subscription.your_subscription')}</h3>
            </div>
            
            <div className="subscription-details">
              <div className="detail-item">
                <span className="label">{t('subscription.plan_type')}</span>
                <span className="value plan-name">
                  {getPlanDisplayName(subscription.subscription)}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="label">{t('subscription.status')}</span>
                <span className={`value status-badge status-${subscription.status}`}>
                  {subscription.status === 'active' && t('subscription.status.active')}
                  {subscription.status === 'trial' && t('subscription.status.trial')}
                  {subscription.status === 'cancelled' && t('subscription.status.cancelled')}
                </span>
              </div>
              
              {subscription.endDate && (
                <div className="detail-item">
                  <span className="label">
                    <FiCalendar size={16} />
                    {subscription.status === 'trial' 
                      ? t('subscription.trial_ends')
                      : t('subscription.next_billing')
                    }
                  </span>
                  <span className="value">{formatDate(subscription.endDate)}</span>
                </div>
              )}

              {subscription.limits && (
                <div className="detail-item">
                  <span className="label">{t('subscription.features')}</span>
                  <span className="value">
                    {subscription.limits.maxInvoices 
                      ? `${subscription.limits.maxInvoices} ${t('subscription.invoices_per_month')}`
                      : t('subscription.unlimited_invoices')
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 下一步操作 */}
        <div className="next-steps">
          <h3>{t('subscription.payment.next_steps')}</h3>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>{t('subscription.payment.step1_title')}</h4>
                <p>{t('subscription.payment.step1_description')}</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>{t('subscription.payment.step2_title')}</h4>
                <p>{t('subscription.payment.step2_description')}</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>{t('subscription.payment.step3_title')}</h4>
                <p>{t('subscription.payment.step3_description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="success-actions">
          <button 
            className="btn-primary"
            onClick={handleContinue}
          >
            {t('subscription.payment.start_using')}
            <FiArrowRight size={16} />
          </button>
          <button 
            className="btn-secondary"
            onClick={handleViewSubscription}
          >
            {t('subscription.view_subscription')}
          </button>
        </div>

        {/* 支持信息 */}
        <div className="support-info">
          <p>{t('subscription.payment.support_text')}</p>
          <a href="mailto:support@example.com" className="support-link">
            {t('subscription.payment.contact_support')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;