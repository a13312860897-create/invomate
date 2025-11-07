import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpgradePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const plans = {
    free: {
      name: t('upgrade:plans.free.name'),
      price: 0,
      features: [
        t('upgrade:plans.free.feature1'),
        t('upgrade:plans.free.feature2'),
        t('upgrade:plans.free.feature3'),
        t('upgrade:plans.free.feature4')
      ],
      limitations: [
        t('upgrade:plans.free.limitation1'),
        t('upgrade:plans.free.limitation2'),
        t('upgrade:plans.free.limitation3')
      ]
    },
    pro: {
      name: t('upgrade:plans.pro.name'),
      monthlyPrice: 18.7,
      yearlyPrice: 187, // 2 months free
      features: [
        t('upgrade:plans.pro.feature1'),
        t('upgrade:plans.pro.feature2'),
        t('upgrade:plans.pro.feature3'),
        t('upgrade:plans.pro.feature4'),
        t('upgrade:plans.pro.feature5'),
        t('upgrade:plans.pro.feature6'),
        t('upgrade:plans.pro.feature7'),
        t('upgrade:plans.pro.feature8')
      ]
    },
    enterprise: {
      name: t('upgrade:plans.enterprise.name'),
      monthlyPrice: 39,
      yearlyPrice: 390, // 2 months free
      features: [
        t('upgrade:plans.enterprise.feature1'),
        t('upgrade:plans.enterprise.feature2'),
        t('upgrade:plans.enterprise.feature3'),
        t('upgrade:plans.enterprise.feature4'),
        t('upgrade:plans.enterprise.feature5'),
        t('upgrade:plans.enterprise.feature6'),
        t('upgrade:plans.enterprise.feature7'),
        t('upgrade:plans.enterprise.feature8'),
        t('upgrade:plans.enterprise.feature9'),
        t('upgrade:plans.enterprise.feature10')
      ]
    }
  };

  const getCurrentPrice = (plan) => {
    if (plan === 'free') return 0;
    const planData = plans[plan];
    return billingCycle === 'monthly' ? planData.monthlyPrice : planData.yearlyPrice;
  };

  const getMonthlyPrice = (plan) => {
    if (plan === 'free') return 0;
    const planData = plans[plan];
    return billingCycle === 'monthly' ? planData.monthlyPrice : Math.round(planData.yearlyPrice / 12);
  };

  const getSavings = (plan) => {
    if (plan === 'free' || billingCycle === 'monthly') return null;
    const planData = plans[plan];
    const monthlyCost = planData.monthlyPrice * 12;
    const yearlyCost = planData.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') {
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    try {
      // TODO: 集成Paddle支付处理逻辑
      console.log('升级计划:', selectedPlan, '计费周期:', billingCycle);
      // 暂时显示提示信息
      alert('支付功能正在开发中，请稍后再试');
    } catch (error) {
      console.error('Upgrade error:', error);
      alert(t('upgrade:errors.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const PlanCard = ({ planKey, isPopular = false }) => {
    const plan = plans[planKey];
    const isCurrentPlan = user?.subscription === planKey || (planKey === 'free' && !user?.subscription);
    const price = getCurrentPrice(planKey);
    const monthlyPrice = getMonthlyPrice(planKey);
    const savings = getSavings(planKey);

    return (
      <div className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 ${
        selectedPlan === planKey 
          ? 'border-blue-500 shadow-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${
        isPopular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}>
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              {t('upgrade:popular')}
            </span>
          </div>
        )}
        
        {isCurrentPlan && (
          <div className="absolute -top-4 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('upgrade:currentPlan')}
            </span>
          </div>
        )}

        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            
            <div className="mb-4">
              {planKey === 'free' ? (
                <div className="text-4xl font-bold text-gray-900">
                  {t('upgrade:free')}
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    €{monthlyPrice}
                    <span className="text-lg font-normal text-gray-500">/{t('upgrade:month')}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-gray-500">
                      {t('upgrade:billedYearly', { amount: price })}
                    </div>
                  )}
                  {savings && (
                    <div className="text-sm text-green-600 font-medium">
                      {t('upgrade:save', { amount: savings })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPlan(planKey)}
              disabled={isCurrentPlan}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                isCurrentPlan
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : selectedPlan === planKey
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isCurrentPlan 
                ? t('upgrade:currentPlan')
                : selectedPlan === planKey 
                ? t('upgrade:selected')
                : t('upgrade:select')
              }
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('upgrade:features')}</h4>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.limitations && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('upgrade:limitations')}</h4>
                <ul className="space-y-2">
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('upgrade:title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('upgrade:subtitle')}
          </p>
        </div>

        {/* 计费周期切换 */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('upgrade:monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('upgrade:yearly')}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <PlanCard planKey="free" />
          <PlanCard planKey="pro" isPopular={true} />
          <PlanCard planKey="enterprise" />
        </div>

        {/* 升级按钮 */}
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            disabled={loading || selectedPlan === (user?.subscription || 'free')}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
              loading || selectedPlan === (user?.subscription || 'free')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('upgrade:processing')}
              </div>
            ) : selectedPlan === (user?.subscription || 'free') ? (
              t('upgrade:currentPlan')
            ) : selectedPlan === 'free' ? (
              t('upgrade:backToFree')
            ) : (
              t('upgrade:upgradeNow')
            )}
          </button>
        </div>

        {/* 常见问题 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {t('upgrade:faq.title')}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('upgrade:faq.q1.question')}
              </h3>
              <p className="text-gray-600">
                {t('upgrade:faq.q1.answer')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('upgrade:faq.q2.question')}
              </h3>
              <p className="text-gray-600">
                {t('upgrade:faq.q2.answer')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('upgrade:faq.q3.question')}
              </h3>
              <p className="text-gray-600">
                {t('upgrade:faq.q3.answer')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('upgrade:faq.q4.question')}
              </h3>
              <p className="text-gray-600">
                {t('upgrade:faq.q4.answer')}
              </p>
            </div>
          </div>
        </div>

        {/* 安全保证 */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('upgrade:security.ssl')}
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM10 2a8 8 0 100 16 8 8 0 000-16zm0 11a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {t('upgrade:security.gdpr')}
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('upgrade:security.moneyBack')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;