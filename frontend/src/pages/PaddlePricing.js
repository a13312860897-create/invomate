import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { appendLocalBillingRecord } from '../utils/billingRecord';
import { FiCheck, FiStar, FiShield } from 'react-icons/fi';
import api from '../services/api';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';

const PaddlePricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation(['common', 'pricing']);
  const { refreshSubscription } = useSubscriptionTimer();
  
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const paymentAppendedRef = useRef(false);

  // 定价方案配置 - 使用真实的沙盒测试产品ID
  const pricingPlans = {
    free_trial: {
      name: 'free_trial',
      monthly: { price: 0, productId: null },
      annual: { price: 0, productId: null }
    },
    basic: {
      name: 'basic',
      monthly: { price: 18.70, productId: 'pro_01k8fvwxgq48qv7smd2e5k3rhz', priceId: 'pri_01k8fvwxgq48qv7smd2e5k3rhz' },
      annual: { price: 187.00, productId: 'pro_01k8fvwxgq48qv7smd2e5k3rhz', priceId: 'pri_01k8fvwxgq48qv7smd2e5k3rhy' }
    },
    professional: {
      name: 'professional',
      monthly: { price: 37.40, productId: 'pro_01k8fvwxgq48qv7smd2e5k3ria', priceId: 'pri_01k8fvwxgq48qv7smd2e5k3rib' },
      annual: { price: 374.00, productId: 'pro_01k8fvwxgq48qv7smd2e5k3ria', priceId: 'pri_01k8fvwxgq48qv7smd2e5k3ric' }
    },
    enterprise: {
      name: 'enterprise',
      monthly: { price: 39.00, productId: null },
      annual: { price: 390.00, productId: null }
    }
  };

  // 检查试用状态
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const response = await api.get('/paddle/trial-status');
        setHasUsedTrial(response.data.hasUsedTrial || false);
      } catch (error) {
        console.error('Failed to check trial status:', error);
      }
    };

    if (user) {
      checkTrialStatus();
    }
  }, [user, api]);

  // 检查URL参数中的支付状态
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');
    
    if (success === 'true') {
      console.log('Detected payment success URL parameter');
      toast.success('Payment successful! Subscription activated');
      // 此处不再记录账单，统一由 PaymentSuccessPage 或 handlePayment 处理
      // 清除URL参数
      navigate('/pricing', { replace: true });
    } else if (cancelled === 'true') {
      console.log('检测到支付取消URL参数');
      toast.info('Payment cancelled');
      // 清除URL参数
      navigate('/pricing', { replace: true });
    }
  }, [location.search, navigate]);

  // 初始化 Paddle
  useEffect(() => {
    const initializePaddle = async () => {
      try {
        // 使用 paddleService 动态加载 Paddle SDK
        const paddleService = await import('../services/paddleService');
        const paddle = await paddleService.default.loadPaddle();
        
        // 获取 Client Token，如果没有配置则使用测试值
        const clientToken = process.env.REACT_APP_PADDLE_CLIENT_TOKEN || 'test_7d279f61a3499fed520f7cd8c08';
        const environment = process.env.REACT_APP_PADDLE_ENVIRONMENT || 'sandbox';
        
        // 配置 Paddle - 使用正确的 Initialize 参数
        if (paddle && paddle.Initialize) {
          paddle.Initialize({
            token: clientToken
          });

          console.log(`Paddle initialized successfully with client token: ${clientToken.substring(0, 20)}... (environment: ${environment})`);
          
          // 如果使用的是默认测试值，给出提示
          if (clientToken === 'test_7d279f61a3499fed520f7cd8c08') {
      console.warn('Using default test Client Token; update to real value after Paddle approval');
          }
        } else {
          console.error('Paddle SDK loaded but Initialize method not found');
        }
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
        // 即使初始化失败，也不阻止页面正常显示
      }
    };

    initializePaddle();
  }, []);

  // 获取当前价格
  const getCurrentPrice = (plan) => {
    return isAnnual ? pricingPlans.annual[plan] : pricingPlans.monthly[plan];
  };

  // 获取月度价格
  const getMonthlyPrice = (plan) => {
    if (plan === 'free_trial') return 0;
    const planConfig = pricingPlans[plan];
    if (!planConfig) return 0;
    
    if (isAnnual) {
      return (planConfig.annual.price / 12).toFixed(2);
    }
    return planConfig.monthly.price.toFixed(2);
  };

  // 获取年付节省金额
  const getSavings = (plan) => {
    if (plan === 'free_trial') return 0;
    const planConfig = pricingPlans[plan];
    if (!planConfig) return 0;
    
    const monthlyTotal = planConfig.monthly.price * 12;
    const annualPrice = planConfig.annual.price;
    return (monthlyTotal - annualPrice).toFixed(2);
  };

  // 处理试用升级
  const handleTrialUpgrade = async (plan) => {
    if (hasUsedTrial) {
      toast.error(t('pricing:messages.trial_already_used'));
      return;
    }

    setLoading(true);
    try {
      // 调用后端API来激活免费试用（使用新的时限管理系统）
      const response = await api.post('/paddle/activate-trial', {
        plan: plan || 'professional' // 默认激活专业版试用
      });
      
      if (response.data.success) {
        // 更新用户数据
        const updatedUser = {
          ...user,
          subscription: response.data.subscription,
          subscriptionStatus: response.data.subscriptionStatus,
          subscriptionEndDate: response.data.subscriptionEndDate,
          hasUsedTrial: response.data.hasUsedTrial
        };
        
        updateUser(updatedUser);
        
        // 刷新订阅状态
        setTimeout(async () => {
          await refreshSubscription();
        }, 500);
        
        const daysRemaining = response.data.daysRemaining || 14;
      toast.success(`Trial activated successfully! You have ${daysRemaining} days of Professional trial`);
        setHasUsedTrial(true);
        
        // 重定向到仪表板
        navigate('/dashboard');
      } else {
        toast.error(response.data.message || t('pricing:messages.activation_failed'));
      }
    } catch (error) {
      console.error('Trial activation failed:', error);
      const errorMessage = error.response?.data?.message || t('pricing:messages.activation_failed');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理支付 - 切换为真实支付结账流程
  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      // 选择计费周期
      const billingCycle = isAnnual ? 'yearly' : 'monthly';

      // 成功/取消回调地址（前端路由）
      const origin = window.location.origin;
      const successUrl = `${origin}/payment-success`;
      const cancelUrl = `${origin}/pricing?cancelled=true`;
      // 若开启前端纯 mock，直接跳转到成功页，避免任何后端/沙盒配置
      const mockEnabled = process.env.REACT_APP_PADDLE_MOCK === 'true';
      if (mockEnabled) {
        const mockTransactionId = `txn_mock_${Date.now()}`;
        const successWithParams = `${successUrl}?transaction_id=${mockTransactionId}&plan=${plan}&billing=${billingCycle}`;
        window.location.href = successWithParams;
        return;
      }
      // 根据环境选择调用路径：开发环境优先后端，生产可使用 Netlify Functions
      const useNetlifyFunctions = process.env.REACT_APP_USE_NETLIFY_FUNCTIONS === 'true';
      let checkoutUrl;

      if (useNetlifyFunctions) {
        // 使用 Netlify Functions
        const functionUrl = '/.netlify/functions/paddle-create-transaction';
        const resp = await fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billingCycle, successUrl, cancelUrl })
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Netlify function failed to create transaction');
        }

        const linkResp = await resp.json();
        checkoutUrl = linkResp.checkoutUrl || linkResp.url || linkResp?.data?.checkout?.url;
      } else {
        // 使用后端 API 创建支付链接（开发环境）
        try {
          const resp = await api.post('/paddle/create-payment-link', {
            plan,
            billingCycle,
            successUrl,
            cancelUrl
          });
          const linkResp = resp.data || {};
          checkoutUrl = linkResp.checkoutUrl || linkResp.url || linkResp?.data?.checkout?.url;
        } catch (error) {
          // 若后端未配置 Paddle，则在开发环境尝试 mock 兜底
          const allowMock = process.env.REACT_APP_PADDLE_MOCK === 'true' || process.env.NODE_ENV !== 'production';
          if (allowMock) {
            try {
              const mockResp = await api.post('/paddle/create-payment-link-mock', {
                plan,
                billingCycle,
                successUrl,
                cancelUrl
              });
              const linkResp = mockResp.data || {};
              checkoutUrl = linkResp.checkoutUrl || linkResp.url;
            } catch (mockError) {
              const msg = mockError.response?.data?.error || mockError.message || 'Mock 支付创建失败';
              throw new Error(msg);
            }
          } else {
            const msg = error.response?.data?.error || error.message || '支付创建失败';
            throw new Error(msg);
          }
        }
      }

      if (!checkoutUrl) {
        throw new Error('未获取到结账链接');
      }

      // 打开Paddle结账
      const paddleService = (await import('../services/paddleService')).default;
      await paddleService.openCheckout(checkoutUrl);
    } catch (error) {
      console.error('创建真实支付链接失败:', error);
      const msg = error.response?.data?.error || error.message || '支付创建失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 更新订阅状态
  const updateSubscriptionStatus = async (paymentData) => {
    try {
      await api.post('/user/update-subscription', {
        subscriptionId: paymentData.checkout.id,
        plan: paymentData.product.name,
        status: 'active'
      });
      
      // 刷新用户数据
      window.location.reload();
    } catch (error) {
      console.error('Failed to update subscription status:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800' 
        : 'bg-gray-50'
    }`}>
      {/* 页面标题区域 */}
      <div className={`py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-gray-900 via-blue-900 to-gray-800'
          : 'bg-gradient-to-r from-blue-600 to-purple-600'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-200 ${
            theme === 'dark' ? 'text-white' : 'text-white'
          }`}>
            {t('pricing:title')}
          </h1>
          <p className={`text-xl mb-8 max-w-3xl mx-auto transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-blue-100'
          }`}>
            {t('pricing:subtitle')}
          </p>
          

        </div>
      </div>

      {/* 计费周期切换 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex justify-center mb-12`}>
          <div className={`p-1 rounded-lg border transition-colors duration-200 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                !isAnnual
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-600 text-white shadow-md'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing:billing.monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 relative ${
                isAnnual
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-600 text-white shadow-md'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing:billing.annual')}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('pricing:billing.save_percent')}
              </span>
            </button>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* 基础版 - 已激活 */}
          <div className={`rounded-2xl border p-6 transition-all duration-200 opacity-80 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600'
              : 'bg-gradient-to-br from-slate-50 to-white border-slate-300'
          }`}>
            <div className="text-center">
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {t('pricing:plans.free_trial.name')}
              </h3>
              <p className={`mb-4 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {t('pricing:plans.free_trial.description')}
              </p>
              <div className="mb-4">
                <span className={`text-2xl font-bold transition-colors duration-200 ${
                  theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  FREE
                </span>
                <span className={`text-sm transition-colors duration-200 block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  for 14 days
                </span>
              </div>
              <div className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-green-500 text-white text-center text-sm opacity-90">
                Activated
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className={`font-medium mb-3 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {t('pricing:features.title')}
              </h4>
              <ul className="space-y-2">
                {t('pricing:plans.free_trial.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="w-4 h-4 text-green-500 mr-2 opacity-80" />
                    <span className={`text-sm transition-colors duration-200 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 专业版 - 推荐 */}
          <div className={`rounded-2xl border-2 p-10 transition-all duration-200 hover:shadow-2xl relative transform hover:scale-105 border-orange-500 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 shadow-orange-500/20'
              : 'bg-gradient-to-br from-slate-50 to-white shadow-orange-500/20'
          }`}>
            {/* 推荐标签 */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg border-2 border-orange-500">
                Recommended
              </div>
            </div>
            
            <div className="text-center">
              <h3 className={`text-3xl font-bold mb-3 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('pricing:plans.basic.name')}
              </h3>
              <p className={`mb-8 text-lg transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {t('pricing:plans.basic.description')}
              </p>
              <div className="mb-8">
                <span className={`text-5xl font-bold transition-colors duration-200 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  €{getMonthlyPrice('basic')}
                </span>
                <span className={`text-xl transition-colors duration-200 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {t('pricing:billing.per_month')}
                </span>
                {isAnnual && getSavings('basic') > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    年付节省 €{getSavings('basic')}
                  </div>
                )}
              </div>
              <button
                onClick={() => handlePayment('basic')}
                disabled={loading}
                className="w-full py-4 px-8 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg font-semibold text-lg transition-all duration-200 hover:from-slate-800 hover:to-slate-900 hover:shadow-lg transform hover:scale-105 border-2 border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
            
            <div className="mt-10">
              <h4 className={`font-bold mb-6 text-lg transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('pricing:features.title')}
              </h4>
              <ul className="space-y-4">
                {t('pricing:plans.basic.features', { returnObjects: true }).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="w-6 h-6 text-orange-500 mr-4 flex-shrink-0" />
                    <span className={`text-lg transition-colors duration-200 ${
                      theme === 'dark' ? 'text-slate-200' : 'text-gray-700'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>



          {/* Enterprise Edition - Coming Soon */}
          <div className={`rounded-2xl border p-6 transition-all duration-200 opacity-60 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Enterprise Edition
              </h3>
              <p className={`mb-4 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Complete solution for large enterprises
              </p>
              <div className="mb-4">
                <span className={`text-2xl font-bold transition-colors duration-200 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  €{getMonthlyPrice('enterprise')}
                </span>
                <span className={`text-sm transition-colors duration-200 block ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t('pricing:billing.per_month')}
                </span>
                {isAnnual && getSavings('enterprise') > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    年付节省 €{getSavings('enterprise')}
                  </div>
                )}
              </div>
              <button
                disabled={true}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 cursor-not-allowed ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-500 border border-gray-600'
                    : 'bg-gray-200 text-gray-400 border border-gray-300'
                }`}
              >
                Coming Soon
              </button>
            </div>
            
            <div className="mt-6">
              <h4 className={`font-medium mb-3 text-sm transition-colors duration-200 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {t('pricing:features.title')}
              </h4>
              <ul className="space-y-2">
                {[
                  "Everything in Professional",
                  "Advanced integrations",
                  "Custom workflows",
                  "Dedicated account manager",
                  "24/7 priority support",
                  "Custom SLA"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className={`w-4 h-4 mr-2 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm transition-colors duration-200 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 安全保证 */}
        <div className={`mt-16 text-center p-8 rounded-2xl transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200'
        }`}>
          <FiShield className={`w-12 h-12 mx-auto mb-4 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-500'
          }`} />
          <h3 className={`text-2xl font-bold mb-4 transition-colors duration-200 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t('pricing:security.title')}
          </h3>
          <p className={`text-lg mb-6 max-w-2xl mx-auto transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('pricing:security.description')}
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            {t('pricing:security.features', { returnObjects: true }).map((feature, index) => (
              <div key={index} className="flex items-center">
                <FiShield className="w-5 h-5 text-green-500 mr-2" />
                <span className={`transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 0€试用成功模态框 */}
      {showTrialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-8 transition-colors duration-200 ${
            theme === 'dark'
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-green-500" />
              </div>
              <h3 className={`text-2xl font-bold mb-4 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {t('pricing:modal.success_title')}
              </h3>
              <p className={`mb-6 transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('pricing:modal.success_message')}
              </p>
              <button
                onClick={() => setShowTrialModal(false)}
                className="w-full py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                {t('pricing:buttons.start_using')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaddlePricing;