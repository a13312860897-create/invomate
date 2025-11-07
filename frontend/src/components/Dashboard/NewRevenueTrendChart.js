import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { getCurrentDisplayMonth } from '../../utils/dateUtils';

const NewRevenueTrendChart = ({ refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartData, setChartData] = useState(null);

  const fetchRevenueTrend = async () => {
    try {
      setLoading(true);
      setError(null);
      setChartData(null);

      const token = localStorage.getItem('token') || 'dev-mock-token';
      const currentMonth = getCurrentDisplayMonth();

      console.log('🔍 NewRevenueTrendChart: Fetching revenue trend data for month:', currentMonth);

      // 使用 api 服务而不是直接 fetch
      const api = (await import('../../services/api')).default;
      const response = await api.get(`/dashboard/unified-chart-data?month=${currentMonth}`);

      const result = response.data;
      console.log('📊 NewRevenueTrendChart: API response:', result);

      if (result.success && result.data && result.data.revenueTrend) {
        const revenueTrend = result.data.revenueTrend;
        console.log('💰 Revenue trend data:', revenueTrend);

        // 检查是否有趋势数据
        if (revenueTrend.trendData && Array.isArray(revenueTrend.trendData) && revenueTrend.trendData.length > 0) {
          // 确保每个数据点都有唯一的标签
          const labels = revenueTrend.trendData.map((item, index) => {
            // 使用日期对象来生成更准确的标签
            if (item.date) {
              const dateObj = new Date(item.date);
              const month = dateObj.getMonth() + 1;
              const day = dateObj.getDate();
              return `${month}/${day}`;
            }
            return item.time || `Point ${index + 1}`;
          });
          const data = revenueTrend.trendData.map(item => item.revenue || 0);

          console.log('📈 Chart labels:', labels);
          console.log('📈 Chart data:', data);

          setChartData({ labels, data });
        } else {
          // 如果没有趋势数据，创建一个默认的数据点
          console.log('⚠️ No trend data available, creating default data point');
          const totalRevenue = revenueTrend.totalRevenue || 0;
          const currentDate = new Date();
          const defaultLabel = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
          
          setChartData({ 
            labels: [defaultLabel], 
            data: [totalRevenue] 
          });
        }
      } else {
        console.log('❌ Invalid API response format');
        setError('Unable to get revenue trend data');
      }
    } catch (err) {
      console.error('❌ NewRevenueTrendChart error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueTrend();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (chartData && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const maxValue = Math.max(...chartData.data, 0);
      const minValue = 0;
      const range = maxValue - minValue;
      const desiredTicks = 7;
      let stepSize = Math.ceil(range / (desiredTicks - 1)) || 20; // 默认20如果为0
      let suggestedMax = stepSize * (desiredTicks - 1);
      if (maxValue > suggestedMax) {
        stepSize = Math.ceil(maxValue / (desiredTicks - 1));
        suggestedMax = stepSize * (desiredTicks - 1);
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        console.log('🎨 Creating chart with data:', chartData);
        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Monthly Revenue',
              data: chartData.data,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              tension: 0.3,
              fill: true,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                position: 'top',
                display: true
              },
              tooltip: { 
                mode: 'index', 
                intersect: false,
                callbacks: {
                  label: function(context) {
                    return `Revenue: €${context.parsed.y.toFixed(2)}`;
                  }
                }
              }
            },
            scales: {
              y: { 
                beginAtZero: true,
                min: minValue,
                max: suggestedMax,
                ticks: {
                  stepSize: stepSize,
                  callback: function(value) {
                    return '€' + value.toFixed(0);
                  }
                }
              },
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date'
                }
              }
            }
          }
        });
      } else {
        setError('Unable to get chart context');
      }
    }
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Revenue Trend
        </h3>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Revenue Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="w-8 h-8 mr-2" />
          <div>
            <p className="font-medium">Data loading failed</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchRevenueTrend}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Revenue Trend
        </h3>
        <button
          onClick={fetchRevenueTrend}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
      <div className="h-64 relative">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default NewRevenueTrendChart;