import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiCheck, FiStar, FiShield } from 'react-icons/fi';

const PaddlePricing = () => {
  const { user, api } = useAuth();
  const { theme } = useTheme();
  const { } = useTranslation(['common', 'pricing']);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  // 定价配置
  const pricingPlans = {
    monthly: {
      basic: { price: 0, originalPrice: 0 },
      premium: { price: 0, originalPrice: 59 }, // 第一次升级0€
      enterprise: { price: 99, originalPrice: 99 }
    },
    annual: {
      basic: { price: 0, originalPrice: 0 },
      premium: { price: 590, originalPrice: 708, savings: 118 }, // 年付正常价格
      enterprise: { price: 990, originalPrice: 1188, savings: 198 }
    }
  };

  // 检查用户是否已使用过试用
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const response = await api.get('/user/trial-status');
        setHasUsedTrial(response.data.hasUsedTrial);
      } catch (error) {
        console.error('检查试用状态失败:', error);
      }
    };

    if (user) {
      checkTrialStatus();
    }
  }, [user, api]);

  // 获取当前价格
  const getCurrentPrice = (plan) => {
    return isAnnual ? pricingPlans.annual[plan] : pricingPlans.monthly[plan];
  };

  // 获取月度价格
  const getMonthlyPrice = (plan) => {
    if (isAnnual) {
      return Math.round(pricingPlans.annual[plan].price / 12);
    }
    return pricingPlans.monthly[plan].price;
  };

  // 获取节省金额
  const getSavings = (plan) => {
    if (isAnnual && pricingPlans.annual[plan].savings) {
      return pricingPlans.annual[plan].savings;
    }
    return 0;
  };

  // 处理0€试用预演
  const handleTrialUpgrade = async (plan) => {
    if (hasUsedTrial) {
      toast.error('您已经使用过0€升级优惠');
      return;
    }

    setLoading(true);
    try {
      // 激活试用
      const response = await api.post('/user/activate-trial', {
        plan: plan,
        billingCycle: isAnnual ? 'annual' : 'monthly'
      });

      if (response.data.success) {
        toast.success('恭喜！您已成功激活0€升级，享受15天免费高级功能！');
        setHasUsedTrial(true);
        setShowTrialModal(true);
      }
    } catch (error) {
      console.error('激活试用失败:', error);
      toast.error('激活失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理正常支付
  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      const priceData = getCurrentPrice(plan);
      
      // 初始化Paddle支付
      if (window.Paddle) {
        window.Paddle.Checkout.open({
          product: plan === 'basic' ? 'basic_plan' : plan === 'premium' ? 'premium_plan' : 'enterprise_plan',
          email: user.email,
          country: 'US',
          postcode: '',
          allowQuantity: false,
          quantity: 1,
          frameTarget: 'self',
          frameInitialHeight: 450,
          frameStyle: 'width:100%; min-width:312px; background-color: transparent; border: none;',
          successCallback: (data) => {
            console.log('支付成功:', data);
            toast.success('支付成功！正在激活您的订阅...');
            // 更新用户订阅状态
            updateSubscriptionStatus(data);
          },
          closeCallback: () => {
            console.log('支付窗口已关闭');
            setLoading(false);
          }
        });
      } else {
        throw new Error('Paddle未加载');
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      toast.error('支付处理失败，请稍后重试');
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
      console.error('更新订阅状态失败:', error);
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
            选择适合您的方案
          </h1>
          <p className={`text-xl mb-8 max-w-3xl mx-auto transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-blue-100'
          }`}>
            专业的发票管理解决方案，助力您的业务增长
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
              月付
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
              年付
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                省20%
              </span>
            </button>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* 基础版 */}
          <div className={`rounded-2xl border-2 p-8 transition-all duration-200 hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                基础版
              </h3>
              <p className={`mb-6 transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                适合小型企业
              </p>
              <div className="mb-6">
                <span className={`text-4xl font-bold transition-colors duration-200 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  €{getMonthlyPrice('basic')}
                </span>
                <span className={`text-lg transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  /月
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
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? '处理中...' : '选择基础版'}
              </button>
            </div>
            
            <div className="mt-8">
              <h4 className={`font-semibold mb-4 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                功能包含：
              </h4>
              <ul className="space-y-3">
                {[
                  '每月20张发票',
                  '基础客户管理',
                  '标准模板',
                  '邮件支持'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="w-5 h-5 text-green-500 mr-3" />
                    <span className={`transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 高级版 - 推荐 */}
          <div className={`rounded-2xl border-2 p-8 relative transition-all duration-200 hover:shadow-xl ${
            theme === 'dark'
              ? 'bg-gray-800 border-blue-500 shadow-blue-500/20'
              : 'bg-white border-blue-500 shadow-blue-500/20'
          }`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <FiStar className="w-4 h-4 mr-1" />
                推荐
              </span>
            </div>
            
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                高级版
              </h3>
              <p className={`mb-6 transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                适合成长型企业
              </p>
              <div className="mb-6">
                {!hasUsedTrial && !isAnnual ? (
                  <>
                    <div className="flex items-center justify-center mb-2">
                      <span className={`text-2xl line-through transition-colors duration-200 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        €{getMonthlyPrice('premium')}
                      </span>
                      <span className={`text-4xl font-bold ml-3 text-green-500`}>
                        €0
                      </span>
                    </div>
                    <div className="text-sm text-green-600 font-medium mb-2">
                      首次升级特惠！
                    </div>
                    <div className={`text-xs transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      享受15天免费体验
                    </div>
                  </>
                ) : (
                  <>
                    <span className={`text-4xl font-bold transition-colors duration-200 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      €{getMonthlyPrice('premium')}
                    </span>
                    <span className={`text-lg transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      /月
                    </span>
                  </>
                )}
                {isAnnual && getSavings('premium') > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    年付节省 €{getSavings('premium')}
                  </div>
                )}
              </div>
              
              {!hasUsedTrial && !isAnnual ? (
                <button
                  onClick={() => handleTrialUpgrade('premium')}
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '处理中...' : '立即0€升级'}
                </button>
              ) : (
                <button
                  onClick={() => handlePayment('premium')}
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? '处理中...' : '选择高级版'}
                </button>
              )}
            </div>
            
            <div className="mt-8">
              <h4 className={`font-semibold mb-4 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                功能包含：
              </h4>
              <ul className="space-y-3">
                {[
                  '无限发票',
                  '高级客户管理',
                  '自定义模板',
                  '自动提醒',
                  '报表分析',
                  '优先支持'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="w-5 h-5 text-green-500 mr-3" />
                    <span className={`transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 企业版 */}
          <div className={`rounded-2xl border-2 p-8 transition-all duration-200 hover:shadow-lg ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-2 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                企业版
              </h3>
              <p className={`mb-6 transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                适合大型企业
              </p>
              <div className="mb-6">
                <span className={`text-4xl font-bold transition-colors duration-200 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  €{getMonthlyPrice('enterprise')}
                </span>
                <span className={`text-lg transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  /月
                </span>
                {isAnnual && getSavings('enterprise') > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    年付节省 €{getSavings('enterprise')}
                  </div>
                )}
              </div>
              <button
                onClick={() => handlePayment('enterprise')}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {loading ? '处理中...' : '选择企业版'}
              </button>
            </div>
            
            <div className="mt-8">
              <h4 className={`font-semibold mb-4 transition-colors duration-200 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                功能包含：
              </h4>
              <ul className="space-y-3">
                {[
                  '所有高级版功能',
                  '多用户协作',
                  'API集成',
                  '高级报表',
                  '专属客服',
                  '定制开发'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <FiCheck className="w-5 h-5 text-green-500 mr-3" />
                    <span className={`transition-colors duration-200 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
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
            安全保证
          </h3>
          <p className={`text-lg mb-6 max-w-2xl mx-auto transition-colors duration-200 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            我们采用银行级安全标准，确保您的数据安全。支持30天无理由退款，让您安心选择。
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <FiShield className="w-5 h-5 text-green-500 mr-2" />
              <span className={`transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                SSL加密
              </span>
            </div>
            <div className="flex items-center">
              <FiShield className="w-5 h-5 text-green-500 mr-2" />
              <span className={`transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                数据备份
              </span>
            </div>
            <div className="flex items-center">
              <FiShield className="w-5 h-5 text-green-500 mr-2" />
              <span className={`transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                30天退款
              </span>
            </div>
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
                升级成功！
              </h3>
              <p className={`mb-6 transition-colors duration-200 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                恭喜您成功激活0€升级优惠！现在您可以享受15天免费的高级版功能。
              </p>
              <button
                onClick={() => setShowTrialModal(false)}
                className="w-full py-3 px-6 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                开始使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaddlePricing;