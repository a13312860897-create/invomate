import React, { useState, useEffect } from 'react';
import {
  FiCalendar, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiBarChart, FiPieChart,
  FiRefreshCw
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatDateInTimezone } from '../../utils/timezone';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import reportService from '../../services/reportService';
import { AdvancedFeaturesGuard } from '../SubscriptionGuard';
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures';
import SubscriptionExpiredModal from '../SubscriptionExpiredModal';
import useSubscriptionTimer from '../../hooks/useSubscriptionTimer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const EnhancedReports = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 改为月份选择模式
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 获取订阅状态
  const { isExpired } = useSubscriptionTimer();

  // 报告数据状态
  const [revenueReport, setRevenueReport] = useState(null);
  const [taxReport, setTaxReport] = useState(null);
  const [invoiceStatusReport, setInvoiceStatusReport] = useState(null);
  const [accountsReceivableReport, setAccountsReceivableReport] = useState(null);

  // 加载报告数据
  const loadReports = async () => {
    console.log('🔄 [loadReports] 开始加载报告数据...');
    console.log('🔄 [loadReports] selectedMonth:', selectedMonth);
    
    setLoading(true);
    setError('');
    
    try {
      // 根据选择的月份计算开始和结束日期
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]; // 月末日期
      
      console.log('📅 [loadReports] 日期范围:', { startDate, endDate });
      
      const [revenueData, taxData, statusData, receivableData] = await Promise.all([
        reportService.getRevenueReport({ 
          startDate, 
          endDate,
          groupBy: 'day', // 按天分组显示月度详细数据
          nodeCount: 31   // 最多31天
        }),
        reportService.getTaxReport({ startDate, endDate }),
        reportService.getInvoiceStatusOverview(startDate, endDate),
        reportService.getAccountsReceivableReport({ startDate, endDate })
      ]);

      console.log('📊 [loadReports] 获取到的数据:');
      console.log('  - revenueData:', revenueData);
      console.log('  - taxData:', taxData);
      console.log('  - statusData:', statusData);
      console.log('  - statusData.statusBreakdown:', statusData?.statusBreakdown);
      console.log('  - receivableData:', receivableData);

      setRevenueReport(revenueData);
      setTaxReport(taxData);
      setInvoiceStatusReport(statusData);
      setAccountsReceivableReport(receivableData);
      
      console.log('✅ [loadReports] 数据设置完成');
    } catch (err) {
      console.error('❌ [loadReports] Failed to load reports:', err);
      console.error('❌ [loadReports] Error details:', err.response?.data);
      setError('Failed to load report data, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // 渲染发票状态概览报告
  const renderInvoiceStatusReport = () => (
    <div className="space-y-6">
      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoiceStatusReport?.summary?.totalInvoices || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiBarChart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                €{(invoiceStatusReport?.summary?.totalAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoiceStatusReport?.summary?.avgProcessingTime || 0} days
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiRefreshCw className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(invoiceStatusReport?.summary?.collectionRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiTrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 月度趋势图表 - 占满整个横向空间 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends (12 Months)</h3>
        <div className="h-80">
          {invoiceStatusReport?.monthlyTrends?.length > 0 ? (
            <Line
              data={getInvoiceStatusTrendData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return value.toLocaleString();
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* 状态明细表格 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceStatusReport?.statusBreakdown ? (
                (() => {
                  let statusData = [];
                  
                  // 处理数组格式的数据（后端返回的格式）
                  if (Array.isArray(invoiceStatusReport.statusBreakdown)) {
                    statusData = invoiceStatusReport.statusBreakdown.filter(item => item.count > 0);
                  } 
                  // 处理对象格式的数据（兼容旧格式）
                  else if (typeof invoiceStatusReport.statusBreakdown === 'object') {
                    statusData = Object.entries(invoiceStatusReport.statusBreakdown)
                      .filter(([status, data]) => (data.count || 0) > 0)
                      .map(([status, data]) => ({
                        status: data.status || status,
                        count: data.count || 0,
                        amount: data.amount || 0
                      }));
                  }
                  
                  // 计算总数用于百分比计算
                  const totalCount = statusData.reduce((sum, item) => sum + (item.count || 0), 0);
                  
                  return statusData.map((item, index) => {
                    const percentage = totalCount > 0 ? ((item.count || 0) / totalCount * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={item.status || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(item.status)}`}></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{(item.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  });
                })()
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No status data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 获取发票状态趋势图数据
  const getInvoiceStatusTrendData = () => {
    console.log('getInvoiceStatusTrendData called');
    console.log('invoiceStatusReport:', invoiceStatusReport);
    console.log('monthlyTrends:', invoiceStatusReport?.monthlyTrends);
    
    if (!invoiceStatusReport?.monthlyTrends || invoiceStatusReport.monthlyTrends.length === 0) {
      console.log('No monthly trends data available');
      return { labels: [], datasets: [] };
    }

    const trends = invoiceStatusReport.monthlyTrends;
    
    // 根据数据结构判断是按天还是按月统计
    const isDailyData = trends[0]?.day !== undefined;
    
    let labels;
    if (isDailyData) {
      // 按天显示：显示日期（如 "Day 1", "Day 2", ...）
      labels = trends.map(trend => `Day ${trend.day}`);
    } else {
      // 按月显示：显示月份（英文）
      labels = trends.map(trend => {
        const date = new Date(trend.month + '-01');
        return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
      });
    }

    const datasets = [
      {
        label: 'Total Invoices',
        data: trends.map(trend => trend.totalCount || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Paid',
        data: trends.map(trend => trend.paid?.count || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1
      },
      {
        label: 'Overdue',
        data: trends.map(trend => trend.overdue?.count || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.1
      }
    ];

    console.log('Generated trend data:', { labels, datasets });
    return { labels, datasets };
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-blue-500',
      sent: 'bg-green-500',
      paid: 'bg-emerald-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-gray-500',
      pending: 'bg-purple-500'
    };
    return colorMap[status] || 'bg-gray-400';
  };

  // 监听月份选择变化
  useEffect(() => {
    loadReports();
  }, [selectedMonth]);

  // 获取收入趋势图表数据
  const getRevenueChartData = () => {
    console.log('🔍 [getRevenueChartData] 开始处理图表数据');
    console.log('🔍 [getRevenueChartData] revenueReport:', revenueReport);
    
    // 检查数据是否存在
    if (!revenueReport?.monthlyData || !Array.isArray(revenueReport.monthlyData)) {
      console.log('⚠️ [getRevenueChartData] 没有找到monthlyData，返回空图表');
      return { 
        labels: ['No Data'], 
        datasets: [{
          label: 'Revenue Amount',
          data: [0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    const monthlyData = revenueReport.monthlyData;
    console.log('📊 [getRevenueChartData] monthlyData长度:', monthlyData.length);
    console.log('📊 [getRevenueChartData] monthlyData内容:', monthlyData);
    
    // 如果没有数据，显示空状态
    if (monthlyData.length === 0) {
      console.log('⚠️ [getRevenueChartData] monthlyData为空数组');
      return { 
        labels: ['No Data'], 
        datasets: [{
          label: 'Revenue Amount',
          data: [0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }
    
    // 处理标签和数据
    const labels = monthlyData.map((item, index) => {
      // 优先使用segmentStart和segmentEnd
      if (item.segmentStart && item.segmentEnd) {
        const startDate = new Date(item.segmentStart);
        const endDate = new Date(item.segmentEnd);
        
        // 如果是同一天，只显示日期
        if (item.segmentStart === item.segmentEnd) {
          return startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        }
        
        // 显示日期范围
        return `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
      }
      
      // 使用period字段
      if (item.period) {
        return item.period;
      }
      
      // 使用month字段
      if (item.month) {
        return item.month;
      }
      
      // 兜底：使用索引
      return `Data Point ${index + 1}`;
    });
    
    const dataValues = monthlyData.map(item => {
      // 优先使用revenue字段，然后是amount，最后是total
      const value = parseFloat(item.revenue || item.amount || item.total || 0);
      console.log('📊 [getRevenueChartData] 数据项:', item, '提取值:', value);
      return value;
    });

    console.log('✅ [getRevenueChartData] 最终图表数据:');
    console.log('📊 [getRevenueChartData] labels:', labels);
    console.log('📊 [getRevenueChartData] dataValues:', dataValues);
    
    const chartData = {
      labels,
      datasets: [
        {
          label: 'Revenue Amount',
          data: dataValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }
      ]
    };
    
    return chartData;
  };

  // 获取收入趋势图表配置
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
              return `Revenue: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#666',
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 0,
            maxTicksLimit: 10
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Revenue'
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#666',
            font: {
              size: 11
            },
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };
  };

  // 获取税务分布图表数据
  const getTaxChartData = () => {
    console.log('🔍 [getTaxChartData] 开始处理税务图表数据');
    console.log('🔍 [getTaxChartData] taxReport:', taxReport);
    
    // 检查数据是否存在
    if (!taxReport?.taxByRate || !Array.isArray(taxReport.taxByRate)) {
      console.log('⚠️ [getTaxChartData] 没有找到taxByRate，返回空图表');
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          backgroundColor: ['#e5e7eb'],
          borderColor: ['#d1d5db'],
          borderWidth: 1
        }]
      };
    }

    const taxByRate = taxReport.taxByRate;
    console.log('📊 [getTaxChartData] taxByRate长度:', taxByRate.length);
    console.log('📊 [getTaxChartData] taxByRate内容:', taxByRate);
    
    // 如果没有数据，显示空状态
    if (taxByRate.length === 0) {
      console.log('⚠️ [getTaxChartData] taxByRate为空数组');
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          backgroundColor: ['#e5e7eb'],
          borderColor: ['#d1d5db'],
          borderWidth: 1
        }]
      };
    }

    // 处理标签和数据
    const labels = taxByRate.map(item => {
      const rate = parseFloat(item.rate || item.taxRate || 0);
      return `${rate}% Rate`;
    });
    
    const dataValues = taxByRate.map(item => {
      const value = parseFloat(item.amount || item.taxAmount || item.total || 0);
      console.log('📊 [getTaxChartData] 税务数据项:', item, '提取值:', value);
      return value;
    });

    // 生成颜色
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];

    console.log('✅ [getTaxChartData] 最终税务图表数据:');
    console.log('📊 [getTaxChartData] labels:', labels);
    console.log('📊 [getTaxChartData] dataValues:', dataValues);

    return {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors.slice(0, dataValues.length),
        borderColor: colors.slice(0, dataValues.length).map(color => color),
        borderWidth: 2,
        hoverOffset: 4
      }]
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
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
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
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport?.totalRevenue || 0)}</p>
              <p className={`text-sm ${(revenueReport?.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(revenueReport?.growthRate || 0)}
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
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport?.paidAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport?.pendingAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiTrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueReport?.overdueAmount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 收入趋势图 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
        </div>
        <div className="h-80">
          <Line 
            data={getRevenueChartData()}
            options={getRevenueChartOptions()}
          />
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          * Chart shows revenue trend, X-axis is time period, Y-axis is revenue amount
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
              <p className="text-sm font-medium text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(taxReport?.summary?.totalTax || taxReport?.totalTax || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Collected VAT</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(taxReport?.summary?.vatCollected || taxReport?.vatSummary?.vatCollected || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending VAT</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(taxReport?.summary?.vatPending || taxReport?.vatSummary?.vatPending || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 税率分布图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tax Rate Distribution</h3>
          </div>
          <div className="h-64">
            <Doughnut 
              data={getTaxChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = formatCurrency(context.parsed);
                        return `${label}: ${value}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 季度税务汇总 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Tax Summary</h3>
          <div className="space-y-3">
            {(!taxReport?.quarterlyTax || taxReport.quarterlyTax.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <p>No quarterly tax data</p>
              </div>
            ) : (
              taxReport.quarterlyTax.map((quarter, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{quarter.quarter || `Q${index + 1}`}</p>
                    <p className="text-xs text-gray-500">Tax: {formatCurrency(quarter.taxAmount || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(quarter.totalRevenue || 0)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染应收账款报告
  const renderAccountsReceivableReport = () => (
    <div className="space-y-6">
      {/* 应收账款汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiDollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Receivables</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accountsReceivableReport?.summary?.totalReceivables || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiTrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Receivables</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accountsReceivableReport?.summary?.currentReceivables || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiTrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Receivables</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accountsReceivableReport?.summary?.overdueReceivables || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiBarChart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(accountsReceivableReport?.summary?.collectionRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 应收账款趋势图 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Receivables Trend</h3>
          <div className="h-64">
            <Line
              data={getAccountsReceivableTrendData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                },
                interaction: {
                  intersect: false,
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 客户应收账款排行 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Clients by Receivables</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(!accountsReceivableReport?.clientReceivables || accountsReceivableReport.clientReceivables.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <p>No customer receivables data</p>
              </div>
            ) : (
              accountsReceivableReport.clientReceivables.slice(0, 10).map((client, index) => (
                <div key={client.clientId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{client.clientName}</p>
                    <p className="text-xs text-gray-500">{client.company || client.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Current: {formatCurrency(client.pendingAmount || 0)}
                      </span>
                      {(client.overdueAmount || 0) > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Overdue: {formatCurrency(client.overdueAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency((client.pendingAmount || 0) + (client.overdueAmount || 0))}
                    </p>
                    <p className="text-xs text-gray-500">{client.invoiceCount || 0} invoices</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 获取应收账款趋势图表数据
  const getAccountsReceivableTrendData = () => {
    if (!accountsReceivableReport?.monthlyTrend || !Array.isArray(accountsReceivableReport.monthlyTrend)) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data',
          data: [0],
          borderColor: '#e5e7eb',
          backgroundColor: 'rgba(229, 231, 235, 0.1)',
          tension: 0.1
        }]
      };
    }

    const monthlyData = accountsReceivableReport.monthlyTrend;
    
    // 优化月份标签显示，显示年月格式
    const labels = monthlyData.map(item => {
      if (item.month) {
        const date = new Date(item.month + '-01');
        return date.toLocaleDateString('en-GB', { 
          year: 'numeric', 
          month: 'short' 
        });
      }
      return '';
    });
    
    console.log('📊 [Accounts Receivable] 月度趋势数据:', monthlyData);
    console.log('📊 [Accounts Receivable] 标签:', labels);
    
    return {
      labels,
      datasets: [
        {
          label: 'Total Receivables',
          data: monthlyData.map(item => parseFloat(item.totalAmount || 0)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Paid Amount',
          data: monthlyData.map(item => parseFloat(item.paidAmount || 0)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: 'Pending Amount',
          data: monthlyData.map(item => parseFloat(item.pendingAmount || 0)),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1
        },
        {
          label: 'Overdue Amount',
          data: monthlyData.map(item => parseFloat(item.overdueAmount || 0)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        }
      ]
    };
  };

  const tabs = [
    { id: 'revenue', name: 'Revenue Report', icon: FiDollarSign },
    { id: 'tax', name: 'Tax Report', icon: FiBarChart },
    { id: 'invoice-status', name: 'Invoice Status', icon: FiPieChart }
  ];

  return (
    <>
      <AdvancedFeaturesGuard>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 头部 */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Report Center</h1>
                  <p className="mt-2 text-gray-600">View detailed business reports</p>
                </div>
                <button
                  onClick={loadReports}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
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
                      Select Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
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
                  <p className="text-gray-600">Loading report data...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'revenue' && renderRevenueReport()}
                  {activeTab === 'tax' && renderTaxReport()}
                  {activeTab === 'accounts-receivable' && renderAccountsReceivableReport()}
                  {activeTab === 'invoice-status' && renderInvoiceStatusReport()}
                </>)}
            </div>
          </div>
        </div>
      </AdvancedFeaturesGuard>
      {/* 订阅到期模态框 - 只在真正过期时显示 */}
      {isExpired && (
        <SubscriptionExpiredModal
          isVisible={true}
          onRenew={() => window.location.href = '/pricing'}
          showBackground={true}
        />
      )}
    </>
  );
};

export default EnhancedReports;