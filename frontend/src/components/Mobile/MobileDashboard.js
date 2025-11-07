import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiFileText, 
  FiClock, 
  FiTrendingUp,
  FiEye,
  FiSend,
  FiDownload,
  FiMoreVertical,
  FiPlus,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import MobileLayout from './MobileLayout';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../Common/LoadingSpinner';

const MobileDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { success, error: showErrorToast } = useToast();

  // 加载仪表板数据
  const loadDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        summary: {
          totalRevenue: 125680.50,
          totalInvoices: 156,
          pendingInvoices: 23,
          overdueInvoices: 8
        },
        recentInvoices: [
          {
            id: 'INV-2024-001',
            clientName: 'ABC公司',
            amount: 5680.00,
            status: 'paid',
            dueDate: '2024-01-15',
            createdAt: '2024-01-01'
          },
          {
            id: 'INV-2024-002',
            clientName: 'XYZ企业',
            amount: 3200.00,
            status: 'pending',
            dueDate: '2024-01-20',
            createdAt: '2024-01-05'
          },
          {
            id: 'INV-2024-003',
            clientName: '123有限公司',
            amount: 8900.00,
            status: 'overdue',
            dueDate: '2024-01-10',
            createdAt: '2023-12-28'
          }
        ],
        chartData: {
          revenue: [12000, 15000, 18000, 22000, 25000, 28000],
          invoices: [45, 52, 48, 61, 55, 67]
        }
      };

      setDashboardData(mockData);
    } catch (error) {
      showErrorToast('加载仪表板数据失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  // 处理刷新
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return '已支付';
      case 'pending': return '待支付';
      case 'overdue': return '已逾期';
      default: return '未知';
    }
  };

  // 格式化金额
  const formatCurrency = (amount) => {
    // 处理无效值，确保显示0而不是NaN
    const validAmount = (amount === undefined || amount === null || isNaN(amount)) ? 0 : amount;
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(validAmount);
  };

  // 统计卡片组件
  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg bg-${color}-50`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`flex items-center text-sm ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <FiTrendingUp className="w-4 h-4 mr-1" />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  // 发票列表项组件
  const InvoiceItem = ({ invoice }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{invoice.id}</h3>
          <p className="text-sm text-gray-600">{invoice.clientName}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
            {getStatusText(invoice.status)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>到期日: {invoice.dueDate}</span>
        <div className="flex space-x-2">
          <button className="p-1 text-gray-400 hover:text-blue-600">
            <FiEye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-green-600">
            <FiSend className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-purple-600">
            <FiDownload className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <FiMoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // 快捷操作组件
  const QuickActions = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">快捷操作</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('create-invoice')}
          className="flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          <span className="font-medium">创建发票</span>
        </button>
        <button
          onClick={() => onNavigate('invoices')}
          className="flex items-center justify-center p-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiFileText className="w-5 h-5 mr-2" />
          <span className="font-medium">查看全部</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <MobileLayout currentPage="dashboard" onNavigate={onNavigate}>
        <LoadingSpinner fullScreen text="正在加载仪表板数据..." />
      </MobileLayout>
    );
  }

  const headerActions = [
    {
      icon: FiRefreshCw,
      label: '刷新',
      onClick: handleRefresh,
      primary: false
    },
    {
      icon: FiFilter,
      label: '筛选',
      onClick: () => {},
      primary: false
    }
  ];

  return (
    <MobileLayout 
      currentPage="dashboard" 
      onNavigate={onNavigate}
      title="仪表板"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* 刷新指示器 */}
        {refreshing && (
          <div className="flex items-center justify-center py-2">
            <FiRefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-blue-600">正在刷新...</span>
          </div>
        )}

        {/* 时间段选择器 */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            { key: 'week', label: '本周' },
            { key: 'month', label: '本月' },
            { key: 'quarter', label: '本季度' },
            { key: 'year', label: '本年' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={FiDollarSign}
            title="总收入"
            value={formatCurrency(dashboardData.summary.totalRevenue)}
            change={12.5}
            color="green"
          />
          <StatCard
            icon={FiFileText}
            title="发票总数"
            value={dashboardData.summary.totalInvoices}
            change={8.2}
            color="blue"
          />
          <StatCard
            icon={FiClock}
            title="待支付"
            value={dashboardData.summary.pendingInvoices}
            change={-2.1}
            color="yellow"
          />
          <StatCard
            icon={FiTrendingUp}
            title="已逾期"
            value={dashboardData.summary.overdueInvoices}
            change={-15.3}
            color="red"
          />
        </div>

        {/* 快捷操作 */}
        <QuickActions />

        {/* 最近发票 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近发票</h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData.recentInvoices.map((invoice) => (
              <InvoiceItem key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>

        {/* 简化的图表区域 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">收入趋势</h3>
          <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-end justify-between p-4">
            {dashboardData.chartData.revenue.map((value, index) => (
              <div
                key={index}
                className="bg-blue-600 rounded-t"
                style={{
                  height: `${(value / Math.max(...dashboardData.chartData.revenue)) * 80}%`,
                  width: '12%'
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>6个月前</span>
            <span>现在</span>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileDashboard;