import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useUnifiedData } from '../../contexts/UnifiedDataContext';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import dashboardService from '../../services/dashboardService';
import { invoiceService } from '../../services/invoiceService';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../DesignSystem';
import LoadingSpinner from '../Common/LoadingSpinner';
import KpiCards from './KpiCards';
import RevenueTrendChart from './RevenueTrendChart';
import StatusDistributionChart from './StatusDistributionChart';
import SimpleStatusDistributionChart from './SimpleStatusDistributionChart';
import NewRevenueTrendChart from './NewRevenueTrendChart';
import NotificationCenter from './NotificationCenter';
// 删除不存在的组件导入
// 删除不存在的组件导入
import { ToastContainer } from '../Common/Toast';
import ErrorBoundary from '../Common/ErrorBoundary';
import MobileDashboard from '../Mobile/MobileDashboard';
import CountdownTimer from '../CountdownTimer';

import { FiRefreshCw, FiEye, FiSend, FiEdit, FiTrash2, FiBell, FiDollarSign, FiFileText, FiUsers, FiTrendingUp, FiAlertCircle, FiAlertTriangle, FiCheck } from 'react-icons/fi';

const EnhancedDashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showErrorToast, toasts, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isMobile, setIsMobile] = useState(false);

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 仪表盘数据
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidAmount: 0
  });
  
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState({ labels: [], datasets: [] });
  const [notifications, setNotifications] = useState([]);
const [refreshKey, setRefreshKey] = useState(0);


  // 快速操作状态
  const [markingPaid, setMarkingPaid] = useState({});

  useEffect(() => {
    // Set test user authentication info
    if (!authService.isAuthenticated()) {
      localStorage.setItem('token', 'dev-mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }));
    }
    
    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps 

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行加载所有数据（移除冗余日志）
      const [
        statsData,
        dashboardStatsData,
        distributionData,
        trendData,
        notificationsData
      ] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getDashboardStats(),
        dashboardService.getInvoiceStatusDistribution(),
        dashboardService.getMonthlyRevenueTrend(),
        dashboardService.getNotifications()
      ]);

      setStats(statsData);

      // 从dashboard stats中提取最近发票和逾期发票数据
      const dashboardData = dashboardStatsData?.data || {};

      // 计算逾期发票（从最近发票中筛选状态为overdue的）
      const overdueInvoices = (dashboardData.recentInvoices || []).filter(invoice => 
        invoice.status === 'overdue'
      );
      setOverdueInvoices(overdueInvoices);

      setNotifications(notificationsData?.notifications || []);

      // Set status distribution data
      const statusLabels = {
        'draft': 'Draft',
        'sent': 'Sent', 
        'paid': 'Paid',
        'overdue': 'Overdue',
        'pending': 'Pending'
      };

      // 修复数据格式问题 - 后端返回的是 { distribution: [...] } 格式
      const distributionArray = distributionData?.distribution || [];

      setStatusDistribution({
        labels: distributionArray.map(item => statusLabels[item.status] || item.status),
        datasets: [{
          data: distributionArray.map(item => item.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#FF9F40',
            '#4BC0C0'
          ]
        }]
      });

    } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data: ' + err.message);
        showErrorToast('加载仪表板数据失败，请稍后重试');
      } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };



  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setMarkingPaid({ ...markingPaid, [invoiceId]: true });
      await dashboardService.markInvoiceAsPaid(invoiceId);
      
      // 刷新相关数据
      const [statsData, dashboardStatsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getDashboardStats()
      ]);
      
      setStats(statsData);
      
      // 从dashboard stats中提取最近发票和逾期发票数据
      const dashboardData = dashboardStatsData?.data || {};
      
      // 计算逾期发票（从最近发票中筛选状态为overdue的）
      const overdueInvoices = (dashboardData.recentInvoices || []).filter(invoice => 
        invoice.status === 'overdue'
      );
      setOverdueInvoices(overdueInvoices);
      setRefreshKey(prev => prev + 1);
      success('发票已成功标记为已支付');
      
    } catch (err) {
      setError('Failed to mark as paid: ' + err.message);
      showErrorToast('标记发票为已支付失败，请重试');
    } finally {
      setMarkingPaid({ ...markingPaid, [invoiceId]: false });
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await dashboardService.sendInvoice(invoiceId);
      // 刷新最近发票数据
      const dashboardStatsData = await dashboardService.getDashboardStats();
      const dashboardData = dashboardStatsData?.data || {};
      setRefreshKey(prev => prev + 1);
      success('发票已成功发送');
    } catch (err) {
      setError('Failed to send invoice: ' + err.message);
      showErrorToast('发送发票失败，请重试');
    }
  };

  // 删除冗余的exportReport函数

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  // 如果是移动设备，使用移动端专用组件
  if (isMobile) {
    return <MobileDashboard onNavigate={onNavigate} />;
  }

  if (loading) {
      return <LoadingSpinner fullScreen text="正在加载仪表板数据..." />;
    }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.firstName || 'User'}
                </h1>
                <p className="mt-2 text-gray-600">Here's your monthly business overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <FiAlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 min-h-[120px] border border-gray-100">
            <div className="flex items-start">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex-shrink-0">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 min-h-[120px] border border-gray-100">
            <div className="flex items-start">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex-shrink-0">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 break-words leading-tight">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 min-h-[120px] border border-gray-100">
            <div className="flex items-start">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex-shrink-0">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900 break-words leading-tight">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 min-h-[120px] border border-gray-100">
            <div className="flex items-start">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex-shrink-0">
                <FiTrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 min-h-[120px] border border-gray-100">
            <div className="flex items-start">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex-shrink-0">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.overdueAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 新的简化图表组件 */}
          <SimpleStatusDistributionChart />
          <NewRevenueTrendChart refreshTrigger={refreshKey} />
        </div>

        {/* 通知中心 */}
        <div className="mb-8">
          <NotificationCenter
            notifications={notifications.map(n => ({
              ...n,
              timestamp: n.createdAt
            }))}
            onDismiss={(id) => {
              console.log('Dismiss notification:', id);
            }}
            onDelete={async (id) => {
              console.log('Delete notification:', id);
              try {
                // 调用后端API删除通知
                const response = await fetch(`/api/notifications/${id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  // 从通知列表中删除指定的通知
                  setNotifications(prev => prev.filter(notification => notification.id !== id));
                  success('通知已删除');
                } else {
                  showErrorToast('删除通知失败');
                }
              } catch (error) {
                console.error('删除通知失败:', error);
                showErrorToast('删除通知失败');
              }
            }}
          />
        </div>

      </div>
      
      </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ErrorBoundary>
    );
};

export default EnhancedDashboard;