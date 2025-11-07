import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueTrendChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [monthInfo, setMonthInfo] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 格式化货币
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // 加载收入趋势数据
  const loadRevenueTrend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      console.log('📈 加载收入趋势数据，月份:', currentMonth);
      
      const response = await api.get('/dashboard/unified-chart-data', {
        params: { month: currentMonth }
      });
      
      console.log('📈 统一API响应:', response.data);
      
      if (response.data.success) {
        const { revenueTrend, monthInfo: monthData } = response.data.data;
        
        setMonthInfo(monthData);
        setTotalRevenue(revenueTrend.totalRevenue);
        setTotalCount(revenueTrend.totalCount);
        
        // 构建图表数据
        const trendData = revenueTrend.trendData || [];
        
        if (trendData.length > 0) {
          const chartConfig = {
            labels: trendData.map(item => {
              const date = new Date(item.date);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            datasets: [
              {
                label: '累计收入',
                data: trendData.map(item => item.cumulativeRevenue),
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
          
          setChartData(chartConfig);
          console.log('📈 图表数据设置完成:', chartConfig);
        } else {
          setChartData(null);
        }
      } else {
        throw new Error(response.data.message || '获取数据失败');
      }
    } catch (err) {
      console.error('📈 加载收入趋势失败:', err);
      setError(err.response?.data?.message || err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueTrend();
  }, []);

  const chartOptions = {
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
            return `累计收入: ${formatCurrency(context.parsed.y)}`;
          },
          afterLabel: function(context) {
            const dataIndex = context.dataIndex;
            const trendData = chartData?.datasets[0]?.data || [];
            if (dataIndex > 0) {
              const currentValue = trendData[dataIndex];
              const previousValue = trendData[dataIndex - 1];
              const dailyIncrease = currentValue - previousValue;
              if (dailyIncrease > 0) {
                return `当日增长: ${formatCurrency(dailyIncrease)}`;
              }
            }
            return null;
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
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#6b7280',
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">收入趋势</h3>
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
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">收入趋势</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={loadRevenueTrend}
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
          <FiTrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">收入趋势</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiCalendar className="w-4 h-4" />
          <span>{monthInfo.month}</span>
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">本月总收入</p>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">已支付发票</p>
          <p className="text-xl font-bold text-green-900">{totalCount} 张</p>
        </div>
      </div>
      
      {/* 图表 */}
      <div className="h-64 mb-4">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            本月暂无收入数据
          </div>
        )}
      </div>
      
      {/* 说明文字 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        * 图表显示本月收入趋势，X轴为时间段，Y轴为累计收入金额，数据来源于统一API
      </div>
    </div>
  );
};

export default RevenueTrendChart;