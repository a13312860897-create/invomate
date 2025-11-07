import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { FiClock, FiUser, FiSettings, FiRefreshCw, FiPlay, FiTrash2 } from 'react-icons/fi';
import useSubscriptionTimer from '../hooks/useSubscriptionTimer';
import paddleService from '../services/paddleService';
import api from '../services/api';
import './SubscriptionTestPage.css';

const SubscriptionTestPage = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  
  const {
    subscription,
    isExpired,
    daysRemaining,
    expiryDate,
    showWarning,
    hasFeature,
    getInvoiceLimit,
    refreshSubscription
  } = useSubscriptionTimer();

  // 添加测试结果到列表
  const addTestResult = (action, success, message, data = null) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      action,
      success,
      message,
      data
    };
    setTestResults(prev => [result, ...prev]);
  };

  // 激活免费试用
  const handleActivateTrial = async () => {
    setLoading(true);
    try {
      const response = await paddleService.activateTrial();
      
      if (response.success) {
        // 更新用户数据
        await updateUser({
          ...user,
          subscriptionStatus: 'trial',
          subscriptionEndDate: response.subscription.endDate,
          trialUsed: true
        });
        
        // 刷新订阅状态
        await refreshSubscription();
        
        addTestResult(
          '激活免费试用',
          true,
          `试用激活成功！试用期至 ${new Date(response.subscription.endDate).toLocaleDateString()}，剩余 ${response.subscription.daysRemaining} 天`,
          response
        );
        toast.success('免费试用激活成功！');
      } else {
        addTestResult('激活免费试用', false, response.message || '激活失败');
        toast.error(response.message || '激活失败');
      }
    } catch (error) {
      console.error('激活试用失败:', error);
      addTestResult('激活免费试用', false, error.message);
      toast.error('激活试用失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟支付成功
  const handleMockPayment = async (planType = 'pro_monthly') => {
    setLoading(true);
    try {
      const response = await api.post('/paddle/mock-payment-success', {
        plan: 'professional',
        billingCycle: 'monthly',
        transactionId: `mock_${Date.now()}`
      });
      
      if (response.data.success) {
        // 更新用户数据
        await updateUser({
          ...user,
          subscription: 'professional', // 使用正确的计划类型
          subscriptionStatus: 'active', // 支付成功后状态为active
          subscriptionEndDate: response.data.subscription.endDate
        });
        
        // 刷新订阅状态
        await refreshSubscription();
        
        addTestResult(
          '模拟支付',
          true,
          `支付成功！订阅 ${planType}，剩余 ${response.data.subscription.daysRemaining} 天`,
          response.data
        );
        toast.success('支付模拟成功！');
      } else {
        addTestResult('模拟支付', false, response.data.message || '支付失败');
        toast.error(response.data.message || '支付失败');
      }
    } catch (error) {
      console.error('模拟支付失败:', error);
      addTestResult('模拟支付', false, error.message);
      toast.error('模拟支付失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置试用状态
  const handleResetTrial = async () => {
    setLoading(true);
    try {
      const response = await paddleService.resetTrialStatus();
      
      if (response.success) {
        // 更新用户数据
        await updateUser({
          ...user,
          subscriptionStatus: 'free',
          subscriptionEndDate: null,
          subscriptionType: null,
          trialUsed: false
        });
        
        // 刷新订阅状态
        await refreshSubscription();
        
        addTestResult('重置试用状态', true, '试用状态已重置', response.data);
        toast.success('试用状态已重置！');
      } else {
        addTestResult('重置试用状态', false, response.message || '重置失败');
        toast.error(response.message || '重置失败');
      }
    } catch (error) {
      console.error('重置试用失败:', error);
      addTestResult('重置试用状态', false, error.message);
      toast.error('重置试用失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取订阅状态
  const handleGetSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const response = await paddleService.getSubscriptionStatus();
      setSubscriptionData(response);
      
      addTestResult(
        '获取订阅状态',
        true,
        '订阅状态获取成功',
        response
      );
      toast.success('订阅状态获取成功！');
    } catch (error) {
      console.error('获取订阅状态失败:', error);
      addTestResult('获取订阅状态', false, error.message);
      toast.error('获取订阅状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 时间归零（强制过期）
  const handleForceExpire = async () => {
    setLoading(true);
    try {
      // 调用后端API强制过期订阅
      const response = await api.post('/paddle/force-expire');
      
      if (response.data.success) {
        // 更新前端用户状态
        await updateUser({
          ...user,
          subscriptionStatus: response.data.data.subscriptionStatus,
          subscriptionEndDate: response.data.data.subscriptionEndDate
        });
        
        // 刷新订阅状态
        await refreshSubscription();
        
        addTestResult(
          '时间归零',
          true,
          '剩余时间已设为0，订阅状态已过期（后端已同步）',
          response.data.data
        );
        toast.success('剩余时间已归零，订阅已过期！');
      } else {
        addTestResult('时间归零', false, response.data.message || '强制过期失败');
        toast.error(response.data.message || '强制过期失败');
      }
    } catch (error) {
      console.error('强制过期失败:', error);
      addTestResult('时间归零', false, error.message);
      toast.error('强制过期失败');
    } finally {
      setLoading(false);
    }
  };

  // 清空测试结果
  const clearTestResults = () => {
    setTestResults([]);
    toast.info('测试结果已清空');
  };



  return (
    <div className={`subscription-test-page ${isDarkMode ? 'dark' : ''}`}>
      <div className="test-container">
        <div className="test-header">
          <h1><FiSettings className="icon" /> 订阅时限管理测试</h1>
          <p>测试新的订阅时限管理系统功能</p>
        </div>

        {/* 当前订阅状态 */}
        <div className="status-section">
          <h2><FiUser className="icon" /> 当前订阅状态</h2>
          <div className="status-grid">
            <div className="status-card">
              <h3>用户信息</h3>
              <p><strong>用户ID:</strong> {user?.id}</p>
              <p><strong>邮箱:</strong> {user?.email}</p>
              <p><strong>试用已使用:</strong> {user?.trialUsed ? '是' : '否'}</p>
            </div>
            
            <div className="status-card">
              <h3>订阅详情</h3>
              <p><strong>状态:</strong> <span className={`status ${subscription?.status}`}>{subscription?.status || 'N/A'}</span></p>
              <p><strong>类型:</strong> {subscription?.type || 'N/A'}</p>
              <p><strong>计费周期:</strong> {subscription?.billingCycle || 'N/A'}</p>
              <p><strong>价格:</strong> {subscription?.price || 'N/A'}</p>
            </div>
            
            <div className="status-card">
              <h3>时间信息</h3>
              <p><strong>是否过期:</strong> <span className={isExpired ? 'expired' : 'active'}>{isExpired ? '是' : '否'}</span></p>
              <p><strong>剩余天数:</strong> {daysRemaining !== null ? `${daysRemaining} 天` : 'N/A'}</p>
              <p><strong>到期日期:</strong> {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>显示警告:</strong> {showWarning ? '是' : '否'}</p>
            </div>
            
            <div className="status-card">
              <h3>功能权限</h3>
              <p><strong>高级功能:</strong> {hasFeature('advanced') ? '✅' : '❌'}</p>
              <p><strong>导出功能:</strong> {hasFeature('export') ? '✅' : '❌'}</p>
              <p><strong>发票限制:</strong> {getInvoiceLimit()}</p>
            </div>
          </div>
        </div>

        {/* 测试操作 */}
        <div className="actions-section">
          <h2><FiPlay className="icon" /> 测试操作</h2>
          <div className="actions-grid">
            <button
              onClick={handleForceExpire}
              disabled={loading}
              className="test-button expire-button"
            >
              ⏰ 时间归零（强制过期）
            </button>
            
            <button 
              className="test-btn trial-btn"
              onClick={handleActivateTrial}
              disabled={loading || user?.trialUsed}
            >
              <FiClock className="icon" />
              激活免费试用
              {user?.trialUsed && <span className="disabled-text">(已使用)</span>}
            </button>
            
            <button 
              className="test-btn payment-btn"
              onClick={() => handleMockPayment('pro_monthly')}
              disabled={loading}
            >
              <FiPlay className="icon" />
              模拟月付支付（累加30天）
            </button>
            
            <button 
              className="test-btn status-btn"
              onClick={handleGetSubscriptionStatus}
              disabled={loading}
            >
              <FiRefreshCw className="icon" />
              获取订阅状态
            </button>
            
            <button 
              className="test-btn refresh-btn"
              onClick={refreshSubscription}
              disabled={loading}
            >
              <FiRefreshCw className="icon" />
              刷新订阅
            </button>
            
            <button 
              className="test-btn reset-btn"
              onClick={handleResetTrial}
              disabled={loading}
            >
              <FiTrash2 className="icon" />
              重置试用状态
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        <div className="results-section">
          <div className="results-header">
            <h2><FiClock className="icon" /> 测试结果</h2>
            <button 
              className="clear-btn"
              onClick={clearTestResults}
              disabled={testResults.length === 0}
            >
              <FiTrash2 className="icon" />
              清空结果
            </button>
          </div>
          
          <div className="results-list">
            {testResults.length === 0 ? (
              <div className="no-results">
                <p>暂无测试结果</p>
              </div>
            ) : (
              testResults.map(result => (
                <div key={result.id} className={`result-item ${result.success ? 'success' : 'error'}`}>
                  <div className="result-header">
                    <span className="result-action">{result.action}</span>
                    <span className="result-time">{result.timestamp}</span>
                  </div>
                  <div className="result-message">{result.message}</div>
                  {result.data && (
                    <details className="result-data">
                      <summary>详细数据</summary>
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* API 响应数据 */}
        {subscriptionData && (
          <div className="api-data-section">
            <h2><FiSettings className="icon" /> API 响应数据</h2>
            <div className="api-data">
              <pre>{JSON.stringify(subscriptionData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTestPage;