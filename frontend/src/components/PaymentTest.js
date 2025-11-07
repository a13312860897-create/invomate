import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentTest = () => {
  const { user, updateUser } = useAuth();
  const subscriptionTimer = useSubscriptionTimer();
  const [loading, setLoading] = useState(false);

  const testPayment = async () => {
  console.log('=== Test payment button clicked ===');
    console.log('用户状态:', user);
    
    if (!user) {
  toast.error('Please log in first');
      return;
    }

    setLoading(true);

    try {
  console.log('Starting mock payment API call...');
      const response = await api.post('/paddle/mock-payment-success', {
        plan: 'professional',
        billingCycle: 'monthly',
        transactionId: `test_${Date.now()}`
      });

  console.log('Payment API response:', response.data);

      if (response.data.success) {
        const subscriptionData = response.data.subscription;
        
        const updatedUser = {
          ...user,
          subscription: subscriptionData.status,
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionData.endDate,
          paddleTransactionId: subscriptionData.transactionId
        };
        
        console.log('更新用户数据:', updatedUser);
        updateUser(updatedUser);
        
        // 刷新订阅状态
        if (subscriptionTimer.refreshSubscription) {
          await subscriptionTimer.refreshSubscription();
        }
        
  toast.success(`Payment successful! ${subscriptionData.daysRemaining} days remaining`);
      } else {
  toast.error('Payment failed');
      }
    } catch (error) {
  console.error('Payment error:', error);
  toast.error(`An error occurred during payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSubscriptionAPI = async () => {
    try {
  console.log('Testing subscription status API...');
      const response = await api.get('/paddle/subscription-status');
  console.log('Subscription status API response:', response.data);
  toast.success('Subscription status API call succeeded');
    } catch (error) {
  console.error('Subscription status API error:', error);
  toast.error(`Subscription status API error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow max-w-4xl mx-auto">
  <h2 className="text-xl font-bold mb-4">Payment Function Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 用户信息 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h3 className="font-semibold mb-2">用户信息</h3>
          <p><strong>邮箱:</strong> {user?.email || '未登录'}</p>
          <p><strong>当前订阅:</strong> {user?.subscription || 'free'}</p>
          <p><strong>订阅状态:</strong> {user?.subscriptionStatus || 'inactive'}</p>
          <p><strong>到期时间:</strong> {user?.subscriptionEndDate || '无'}</p>
          <p><strong>交易ID:</strong> {user?.paddleTransactionId || '无'}</p>
        </div>

        {/* 订阅计时器信息 */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <h3 className="font-semibold mb-2">订阅计时器状态</h3>
          <p><strong>订阅类型:</strong> {subscriptionTimer.subscriptionType}</p>
          <p><strong>订阅状态:</strong> {subscriptionTimer.subscriptionStatus}</p>
          <p><strong>剩余天数:</strong> {subscriptionTimer.daysRemaining}</p>
          <p><strong>是否过期:</strong> {subscriptionTimer.isExpired ? '是' : '否'}</p>
          <p><strong>是否专业版:</strong> {subscriptionTimer.isProfessional ? '是' : '否'}</p>
          <p><strong>加载状态:</strong> {subscriptionTimer.loading ? '加载中' : '已加载'}</p>
          {subscriptionTimer.error && (
            <p><strong>错误:</strong> {subscriptionTimer.error}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={testPayment}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
  {loading ? 'Processing...' : 'Test Payment'}
        </button>
        
        <button
          onClick={testSubscriptionAPI}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
  Test Subscription Status API
        </button>
      </div>
    </div>
  );
};

export default PaymentTest;