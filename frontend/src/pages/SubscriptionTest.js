import React from 'react';
import { useAuth } from '../context/AuthContext';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import TrialCountdown from '../components/TrialCountdown';

const SubscriptionTest = () => {
  const { user } = useAuth();
  const subscriptionData = useSubscriptionTimer();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">订阅状态测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 用户信息 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">用户信息 (AuthContext)</h2>
          <div className="space-y-2 text-sm">
            <div><strong>ID:</strong> {user?.id}</div>
            <div><strong>姓名:</strong> {user?.name}</div>
            <div><strong>邮箱:</strong> {user?.email}</div>
            <div><strong>订阅类型:</strong> {user?.subscription || '未设置'}</div>
            <div><strong>订阅状态:</strong> {user?.subscriptionStatus || '未设置'}</div>
            <div><strong>过期时间:</strong> {user?.subscriptionEndDate || '未设置'}</div>
            <div><strong>交易ID:</strong> {user?.paddleTransactionId || '未设置'}</div>
          </div>
        </div>

        {/* 订阅计时器信息 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">订阅计时器 (useSubscriptionTimer)</h2>
          <div className="space-y-2 text-sm">
            <div><strong>订阅数据:</strong> {subscriptionData.subscription ? '已加载' : '未加载'}</div>
            <div><strong>订阅类型:</strong> {subscriptionData.subscriptionType || '未设置'}</div>
            <div><strong>订阅状态:</strong> {subscriptionData.subscriptionStatus || '未设置'}</div>
            <div><strong>是否过期:</strong> {subscriptionData.isExpired ? '是' : '否'}</div>
            <div><strong>剩余天数:</strong> {subscriptionData.daysRemaining || '未计算'}</div>
            <div><strong>过期日期:</strong> {subscriptionData.expiryDate ? subscriptionData.expiryDate.toLocaleDateString() : '未设置'}</div>
            <div><strong>显示警告:</strong> {subscriptionData.showWarning ? '是' : '否'}</div>
            <div><strong>有活跃订阅:</strong> {subscriptionData.hasActiveSubscription ? '是' : '否'}</div>
          </div>
        </div>

        {/* TrialCountdown 组件显示 */}
        <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">TrialCountdown 组件显示</h2>
          <div className="flex items-center space-x-4">
            <div>
              <strong>正常大小:</strong>
              <TrialCountdown size="normal" />
            </div>
            <div>
              <strong>小尺寸:</strong>
              <TrialCountdown size="small" />
            </div>
          </div>
        </div>

        {/* 调试信息 */}
        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">调试信息</h2>
          <div className="text-xs">
            <div><strong>完整用户对象:</strong></div>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
            <div className="mt-3"><strong>完整订阅数据:</strong></div>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(subscriptionData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTest;