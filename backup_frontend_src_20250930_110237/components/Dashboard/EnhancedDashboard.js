import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiUsers, FiFileText, FiTrendingUp,
  FiMail, FiBell, FiBarChart,
  FiEye, FiSend, FiCheck, FiAlertCircle, FiCalendar, FiRefreshCw,
  FiDownload, FiPieChart, FiArrowRight
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import notificationService from '../../services/notificationService';
import reportService from '../../services/reportService';
import authService from '../../services/authService';
import RevenueTrendChart from './RevenueTrendChart';
import StatusDistributionChart from './StatusDistributionChart';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 仪表盘数据
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidAmount: 0
  });
  
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState({ labels: [], datasets: [] });
  const [notifications, setNotifications] = useState([]);


  
  // 快速操作状态
  const [markingPaid, setMarkingPaid] = useState({});

  useEffect(() => {
    // 设置测试用户认证信息
    if (!authService.isAuthenticated()) {
      localStorage.setItem('token', 'dev-mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: '测试用户'
      }));
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== 开始加载仪表盘数据 ===');
      console.log('用户认证状态:', authService.isAuthenticated());
      console.log('用户token:', authService.getToken());
      console.log('当前用户:', authService.getCurrentUser());
      
      console.log('=== 开始并行请求所有数据 ===');
      console.log('即将调用的接口:');
      console.log('1. getStats()');
      console.log('2. getDashboardStats()');
      console.log('3. getInvoiceStatusDistribution()');
      console.log('4. getMonthlyRevenueTrend()');
      console.log('5. getNotifications() <-- 重点关注');
      
      // 并行加载所有数据
      const [
        statsData,
        dashboardStatsData,
        distributionData,
        trendData,
        notificationsData
      ] = await Promise.all([
        dashboardService.getStats().then(data => {
          console.log('✅ Stats数据获取成功:', data);
          return data;
        }).catch(err => {
          console.error('❌ Stats数据获取失败:', err);
          throw err;
        }),
        dashboardService.getDashboardStats().then(data => {
          console.log('✅ Dashboard stats数据获取成功:', data);
          return data;
        }).catch(err => {
          console.error('❌ Dashboard stats数据获取失败:', err);
          throw err;
        }),
        dashboardService.getInvoiceStatusDistribution().then(data => {
          console.log('✅ Status distribution数据获取成功:', data);
          return data;
        }).catch(err => {
          console.error('❌ Status distribution数据获取失败:', err);
          throw err;
        }),
        dashboardService.getMonthlyRevenueTrend().then(data => {
          console.log('✅ Monthly revenue trend数据获取成功:', data);
          return data;
        }).catch(err => {
          console.error('❌ Monthly revenue trend数据获取失败:', err);
          throw err;
        }),
        dashboardService.getNotifications().then(data => {
          console.log('🔔 ✅ Notifications数据获取成功:', data);
          console.log('🔔 通知数据详情:', JSON.stringify(data, null, 2));
          return data;
        }).catch(err => {
          console.error('🔔 ❌ Notifications数据获取失败:', err);
          console.error('🔔 错误详情:', err.message);
          console.error('🔔 错误堆栈:', err.stack);
          throw err;
        })
      ]);
      
      console.log('=== 所有数据获取完成 ===');
      console.log('🔔 最终通知数据:', notificationsData);
      console.log('📊 Dashboard stats数据:', dashboardStatsData);
      
      setStats(statsData);
      
      // 从dashboard stats中提取最近发票和逾期发票数据
      const dashboardData = dashboardStatsData?.data || {};
      setRecentInvoices(dashboardData.recentInvoices || []);
      
      // 计算逾期发票（从最近发票中筛选状态为overdue的）
      const overdueInvoices = (dashboardData.recentInvoices || []).filter(invoice => 
        invoice.status === 'overdue'
      );
      setOverdueInvoices(overdueInvoices);
      
      setNotifications(notificationsData?.notifications || []);
      
      console.log('🔔 设置到状态的通知数据:', notificationsData?.notifications || []);
      
      // 设置客户分析数据
        
      // 设置状态分布数据
      const statusLabels = {
        'draft': '草稿',
        'sent': '已发送', 
        'paid': '已付款',
        'overdue': '逾期',
        'pending': '待付款'
      };

      // 修复数据格式问题 - 后端返回的是 { distribution: [...] } 格式
      const distributionArray = distributionData?.distribution || [];
      console.log('📊 状态分布数据:', distributionArray);

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
      console.error('加载仪表盘数据失败:', err);
      setError('加载仪表盘数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
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
      setRecentInvoices(dashboardData.recentInvoices || []);
      
      // 计算逾期发票（从最近发票中筛选状态为overdue的）
      const overdueInvoices = (dashboardData.recentInvoices || []).filter(invoice => 
        invoice.status === 'overdue'
      );
      setOverdueInvoices(overdueInvoices);
      
    } catch (err) {
      setError('标记为已支付失败: ' + err.message);
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
      setRecentInvoices(dashboardData.recentInvoices || []);
    } catch (err) {
      setError('发送发票失败: ' + err.message);
    }
  };

  const exportReport = async (type) => {
    try {
      const blob = await reportService.exportInvoicesCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('导出报告失败: ' + err.message);
    }
  };

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
      case 'paid': return '已支付';
      case 'pending': return '待支付';
      case 'overdue': return '逾期';
      case 'draft': return '草稿';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载仪表盘数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                欢迎回来，{user?.firstName || '用户'}
              </h1>
              <p className="mt-2 text-gray-600">这是您的月度业务概览</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportReport('csv')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                导出报告
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 min-h-[120px]">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <FiDollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">总收入</p>
                <p className="text-xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 min-h-[120px]">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">发票总数</p>
                <p className="text-xl font-bold text-gray-900 break-words leading-tight">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 min-h-[120px]">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">客户总数</p>
                <p className="text-xl font-bold text-gray-900 break-words leading-tight">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 min-h-[120px]">
            <div className="flex items-start">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <FiTrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">待收金额</p>
                <p className="text-xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 min-h-[120px]">
            <div className="flex items-start">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-2">逾期金额</p>
                <p className="text-xl font-bold text-gray-900 break-words leading-tight">{formatCurrency(stats.overdueAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 发票状态分布 */}
          <StatusDistributionChart />
          
          {/* 本月收入趋势 */}
          <RevenueTrendChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 最近发票 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">最近发票</h3>
            </div>
            <div className="p-6">
              {recentInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无发票数据</p>
              ) : (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiFileText className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              #{invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.Client?.name || invoice.Client?.company || invoice.clientName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.total)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                              title="发送发票"
                            >
                              <FiSend className="w-4 h-4" />
                            </button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <button
                              onClick={() => handleMarkAsPaid(invoice.id)}
                              disabled={markingPaid[invoice.id]}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="标记为已支付"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 逾期通知面板 - 简洁版 */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-500" />
                  逾期提醒
                </h3>
                <button
                  onClick={() => navigate('/overdue-invoices')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  查看详情
                </button>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{notification.message}</span>
                    {notification.count && (
                      <span className="text-sm font-medium text-red-600">{notification.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EnhancedDashboard;