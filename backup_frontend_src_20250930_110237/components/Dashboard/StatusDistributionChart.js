import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { FiPieChart, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusDistributionChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [monthInfo, setMonthInfo] = useState({});
  const [statusStats, setStatusStats] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // 状态配置
  const statusConfig = {
    'draft': { 
      label: '草稿', 
      color: '#6b7280', 
      bgColor: '#f3f4f6' 
    },
    'sent': { 
      label: '已发送', 
      color: '#3b82f6', 
      bgColor: '#dbeafe' 
    },
    'paid': { 
      label: '已付款', 
      color: '#10b981', 
      bgColor: '#d1fae5' 
    },
    'overdue': { 
      label: '逾期', 
      color: '#ef4444', 
      bgColor: '#fee2e2' 
    },
    'pending': { 
      label: '待付款', 
      color: '#f59e0b', 
      bgColor: '#fef3c7' 
    }
  };

  // 格式化货币
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // 加载状态分布数据
  const loadStatusDistribution = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      console.log('📊 加载发票状态分布数据，月份:', currentMonth);
      
      const response = await api.get('/dashboard/unified-chart-data', {
        params: { month: currentMonth }
      });
      
      console.log('📊 统一API响应:', response.data);
      
      if (response.data.success) {
        const { statusDistribution, monthInfo: monthData } = response.data.data;
        
        setMonthInfo(monthData);
        setStatusStats(statusDistribution.distribution);
        setTotalInvoices(statusDistribution.totalInvoices);
        
        // 过滤掉数量为0的状态
        const validDistribution = statusDistribution.distribution.filter(item => item.count > 0);
        
        if (validDistribution.length > 0) {
          const chartConfig = {
            labels: validDistribution.map(item => statusConfig[item.status]?.label || item.status),
            datasets: [
              {
                data: validDistribution.map(item => item.count),
                backgroundColor: validDistribution.map(item => statusConfig[item.status]?.color || '#6b7280'),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8
              }
            ]
          };
          
          setChartData(chartConfig);
          console.log('📊 图表数据设置完成:', chartConfig);
        } else {
          setChartData(null);
        }
      } else {
        throw new Error(response.data.message || '获取数据失败');
      }
    } catch (err) {
      console.error('📊 加载发票状态分布失败:', err);
      setError(err.response?.data?.message || err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusDistribution();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            const statusItem = statusStats[context.dataIndex];
            const amount = statusItem ? formatCurrency(statusItem.amount) : '€0';
            return [
              `${context.label}: ${context.parsed} 张 (${percentage}%)`,
              `金额: ${amount}`
            ];
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FiPieChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">发票状态分布</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <FiRefreshCw className="w-4 h-4 animate-spin" />
            <span>加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FiPieChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">发票状态分布</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={loadStatusDistribution}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FiPieChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">发票状态分布</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiCalendar className="w-4 h-4" />
          <span>{monthInfo.month}</span>
        </div>
      </div>
      
      {/* 总计信息 */}
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-600">本月发票总数</p>
        <p className="text-2xl font-bold text-gray-900">{totalInvoices} 张</p>
      </div>
      
      {/* 图表 */}
      <div className="h-64 mb-6">
        {chartData ? (
          <Doughnut data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            本月暂无发票数据
          </div>
        )}
      </div>
      
      {/* 详细统计 */}
      {statusStats.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">详细统计</h4>
          {statusStats.map((item, index) => (
            <div key={item.status} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusConfig[item.status]?.color || '#6b7280' }}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {statusConfig[item.status]?.label || item.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">{item.count} 张</span>
                <div className="text-xs text-gray-500">{formatCurrency(item.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 说明文字 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        * 图表显示本月各状态发票的数量分布，数据来源于统一API
      </div>
    </div>
  );
};

export default StatusDistributionChart;