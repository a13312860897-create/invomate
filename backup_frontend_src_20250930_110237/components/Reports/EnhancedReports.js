import React, { useState, useEffect } from 'react';
import {
  FiCalendar, FiDollarSign, FiUsers, FiFileText,
  FiTrendingUp, FiTrendingDown, FiBarChart, FiPieChart,
  FiFilter, FiRefreshCw, FiEye
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import reportService from '../../services/reportService';
import notificationService from '../../services/notificationService';
import { generateSmartTimeParams, divideDateRange } from '../../utils/timeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EnhancedReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('revenue');
  
  // 日期范围
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // 报告数据
  const [revenueReport, setRevenueReport] = useState({
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyData: [],
    growthRate: 0
  });
  
  const [clientReport, setClientReport] = useState({
    totalClients: 0,
    activeClients: 0,
    newClients: 0,
    topClients: [],
    clientGrowth: 0
  });
  
  const [taxReport, setTaxReport] = useState({
    totalTax: 0,
    taxByRate: [],
    quarterlyTax: [],
    vatSummary: {
      totalVAT: 0,
      vatCollected: 0,
      vatPending: 0
    }
  });
  
  const [invoiceReport, setInvoiceReport] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    averageAmount: 0,
    statusDistribution: []
  });
  
  // 图表数据
  const [clientChart, setClientChart] = useState({ labels: [], datasets: [] });
  const [taxChart, setTaxChart] = useState({ labels: [], datasets: [] });
  const [invoiceChart, setInvoiceChart] = useState({ labels: [], datasets: [] });

  // 监听日期范围变化，自动重新加载数据
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      console.log('Date range changed, loading reports:', dateRange);
      loadReports();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 生成智能时间参数
      const timeParams = generateSmartTimeParams(dateRange.startDate, dateRange.endDate);
      console.log('Smart time params:', timeParams);
      
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: timeParams.groupBy,
        nodeCount: 10 // 固定10个节点
      };
      
      console.log('Loading reports with params:', params);
      
      // 并行加载所有报告
      const [
        revenueData,
        clientData,
        taxData,
        invoiceData
      ] = await Promise.all([
        reportService.getRevenueReport(params),
        reportService.getClientReport(params),
        reportService.getTaxReport(params),
        reportService.getInvoiceStatusStats(params)
      ]);
      
      console.log('Revenue data received:', revenueData);
      console.log('Revenue monthlyData:', revenueData?.monthlyData);
      console.log('Revenue monthlyData length:', revenueData?.monthlyData?.length);
      
      setRevenueReport(revenueData);
      
      // 后端现在返回正确格式，直接使用
      setClientReport(clientData || {
        totalClients: 0,
        activeClients: 0,
        newClients: 0,
        topClients: [],
        clientGrowth: 0
      });
      
      setTaxReport(taxData);
      setInvoiceReport(invoiceData);
      
      // 设置图表数据
      updateCharts(revenueData, clientData, taxData, invoiceData);
      
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('加载报告数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCharts = (revenue, client, tax, invoice) => {
    // 客户增长图
    setClientChart({
      labels: client?.monthlyGrowth?.map(item => item.month) || [],
      datasets: [{
        label: '新客户',
        data: client?.monthlyGrowth?.map(item => item.count) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }]
    });
    
    // 税务分布图
    setTaxChart({
      labels: tax?.taxByRate?.map(item => `${item.rate}%`) || [],
      datasets: [{
        data: tax?.taxByRate?.map(item => item.amount) || [],
        backgroundColor: [
          '#EF4444',
          '#F59E0B',
          '#10B981',
          '#3B82F6',
          '#8B5CF6'
        ]
      }]
    });
    
    // 发票状态分布图
    setInvoiceChart({
      labels: invoice?.statusDistribution?.map(item => getStatusText(item.status)) || [],
      datasets: [{
        data: invoice?.statusDistribution?.map(item => item.count) || [],
        backgroundColor: [
          '#10B981', // 已支付
          '#F59E0B', // 待支付
          '#EF4444', // 逾期
          '#6B7280'  // 草稿
        ]
      }]
    });
  };

  // 获取收入趋势图表数据 - 与Dashboard保持一致的样式
  const getRevenueChartData = () => {
    const monthlyData = revenueReport.monthlyData || [];
    
    console.log('Revenue chart data:', monthlyData); // 调试日志
    console.log('Chart labels:', monthlyData.map(item => item.month || item.period || item.label || '未知'));
    console.log('Chart data values:', monthlyData.map(item => item.amount || item.revenue || item.totalRevenue || item.total || 0));
    
    const labels = monthlyData.map(item => item.month || item.period || item.label || '未知');
    const dataValues = monthlyData.map(item => item.amount || item.revenue || item.totalRevenue || item.total || 0);
    
    console.log('Final chart config:', { labels, dataValues });
    
    return {
      labels: labels,
      datasets: [
        {
          label: '收入金额',
          data: dataValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  // 获取收入趋势图表配置 - 与Dashboard保持一致
  const getRevenueChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `收入: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 10,
            color: '#6b7280'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6b7280',
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  };

  const formatCurrency = (amount) => {
    // 处理null、undefined、NaN等无效值
    if (amount === null || amount === undefined || isNaN(amount)) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(0);
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  const renderRevenueReport = () => (
    <div className="space-y-6">
      {/* 收入统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总收入</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport.totalRevenue)}</p>
              <p className={`text-sm ${revenueReport.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(revenueReport.growthRate)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已收金额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport.paidAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待收金额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport.pendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiTrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">逾期金额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport.overdueAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 收入趋势图 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">收入趋势</h3>
        </div>
        <div className="h-80">
          <Line 
            data={getRevenueChartData()}
            options={getRevenueChartOptions()}
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          * 图表显示收入趋势，X轴为时间段，Y轴为收入金额
        </div>
      </div>
    </div>
  );

  const renderClientReport = () => (
    <div className="space-y-6">
      {/* 客户统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总客户数</p>
              <p className="text-2xl font-bold text-gray-900">{clientReport.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃客户</p>
              <p className="text-2xl font-bold text-gray-900">{clientReport.activeClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">新客户</p>
              <p className="text-2xl font-bold text-gray-900">{clientReport.newClients}</p>
              <p className={`text-sm ${clientReport.clientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(clientReport.clientGrowth)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 客户增长图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">客户增长趋势</h3>
          </div>
          <div className="h-64">
            <Bar 
              data={clientChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 顶级客户 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">顶级客户</h3>
          <div className="space-y-3">
            {(clientReport.topClients || []).map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.invoiceCount} 张发票</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(client.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxReport = () => (
    <div className="space-y-6">
      {/* 税务统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总税额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(taxReport.totalTax)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已收VAT</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(taxReport.vatSummary?.vatCollected || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待收VAT</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(taxReport.vatSummary?.vatPending || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 税率分布图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">税率分布</h3>
          </div>
          <div className="h-64">
            <Doughnut 
              data={taxChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 季度税务汇总 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">季度税务汇总</h3>
          <div className="space-y-3">
            {(taxReport.quarterlyTax || []).map((quarter, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{quarter.quarter}</p>
                  <p className="text-xs text-gray-500">税额: {formatCurrency(quarter.taxAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(quarter.totalRevenue)}</p>
                  <p className="text-xs text-gray-500">收入</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoiceReport = () => (
    <div className="space-y-6">
      {/* 发票统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总发票数</p>
              <p className="text-2xl font-bold text-gray-900">{invoiceReport.totalInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">已支付</p>
              <p className="text-2xl font-bold text-gray-900">{invoiceReport.paidInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待支付</p>
              <p className="text-2xl font-bold text-gray-900">{invoiceReport.pendingInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">逾期</p>
              <p className="text-2xl font-bold text-gray-900">{invoiceReport.overdueInvoices || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">平均金额</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoiceReport.averageAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 发票状态分布图 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">发票状态分布</h3>
        </div>
        <div className="h-64">
          <Doughnut 
            data={invoiceChart}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'revenue', name: '收入报告', icon: FiDollarSign },
    { id: 'client', name: '客户报告', icon: FiUsers },
    { id: 'tax', name: '税务报告', icon: FiBarChart },
    { id: 'invoice', name: '发票报告', icon: FiFileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">报告中心</h1>
              <p className="mt-2 text-gray-600">查看详细的业务报告</p>
            </div>
            <button
              onClick={loadReports}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>
        </div>

        {/* 日期范围选择器 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <FiCalendar className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 报告内容 */}
        <div className="mb-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载报告数据...</p>
            </div>
          ) : (
            <>
              {activeTab === 'revenue' && renderRevenueReport()}
              {activeTab === 'client' && renderClientReport()}
              {activeTab === 'tax' && renderTaxReport()}
              {activeTab === 'invoice' && renderInvoiceReport()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedReports;