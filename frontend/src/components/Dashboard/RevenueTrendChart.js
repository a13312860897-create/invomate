import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
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
import dashboardService from '../../services/dashboardService';
import { logApiRequest, logApiResponse, logDataTransformation, logChartRender, logError } from '../../utils/chartMonitor';

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
  const { t } = useTranslation(['dashboard', 'common']);
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

  const loadRevenueTrend = async () => {
    const requestId = logApiRequest('/dashboard/unified-chart-data');
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardService.getMonthlyRevenueTrend();
      
      logApiResponse(requestId, response);
      
      if (response.data.success) {
        const { revenueTrend, monthInfo } = response.data.data;
        
        // 记录原始数据
        logDataTransformation('RevenueTrendChart', response.data, revenueTrend, 'extract_revenue_trend');
        
        setMonthInfo(monthInfo);
        setTotalRevenue(revenueTrend.totalRevenue || 0);
        setTotalCount(revenueTrend.totalCount || 0);
        
        const trendData = revenueTrend.trendData || [];
        
        if (trendData && trendData.length > 0) {
          // 生成标签
          const labels = trendData.map(item => {
            if (item.label) {
              return item.label;
            } else if (item.date) {
              const date = new Date(item.date);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            } else if (item.time) {
              return item.time;
            }
            return 'N/A';
          });
          
          // 生成数据
          const dataValues = trendData.map(item => item.revenue || 0);
          
          // 记录数据转换
          logDataTransformation('RevenueTrendChart', trendData, { labels, data: dataValues }, 'format_chart_data');
          
          const chartConfig = {
            labels: labels,
            datasets: [
              {
                label: t('dashboard:dailyRevenue'),
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
          
          // 记录图表渲染
          logChartRender('RevenueTrendChart', chartConfig, chartOptions);
          
          setChartData(chartConfig);
        } else {
          setChartData(null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to get data');
      }
    } catch (err) {
      console.error('Failed to load revenue trend:', err);
      logError('RevenueTrendChart', err, { context: 'loadRevenueTrend' });
      logApiResponse(requestId, null, err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueTrend();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('dashboard:date')
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        title: {
          display: true,
          text: t('dashboard:revenue')
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
            return `${t('dashboard:revenue')}: ${formatCurrency(context.parsed.y)}`;
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
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard:revenueTrend')}</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <FiRefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('dashboard:loading')}</span>
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
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard:revenueTrend')}</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={loadRevenueTrend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('dashboard:retry')}
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
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard:revenueTrend')}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiCalendar className="w-4 h-4" />
          <span>{monthInfo.month}</span>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-blue-600 font-medium">{t('dashboard:totalRevenueThisMonth')}</p>
          <p className="text-xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-green-600 font-medium">{t('dashboard:paidInvoicesCount')}</p>
          <p className="text-xl font-bold text-green-900">{totalCount} {t('dashboard:invoicesUnit')}</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 mb-4">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {t('dashboard:noRevenueData')}
          </div>
        )}
      </div>
      
      {/* Description */}
      <div className="mt-4 text-xs text-gray-500">
        * {t('dashboard:chartDescription')}
      </div>
    </div>
  );
};

export default RevenueTrendChart;