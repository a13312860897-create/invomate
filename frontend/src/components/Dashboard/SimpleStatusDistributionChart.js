import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { getCurrentDisplayMonth } from '../../utils/dateUtils';

const SimpleStatusDistributionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status color mapping - consistent with backend
  const STATUS_COLORS = {
    'paid': '#10b981',      // Green - Paid
    'pending': '#f59e0b',   // Orange - Pending
    'overdue': '#ef4444',   // Red - Overdue
    'draft': '#6b7280',     // Gray - Draft
    'sent': '#3b82f6',      // Blue - Sent (consistent with backend)
    'cancelled': '#9ca3af'  // Light gray - Cancelled
  };

  // Status label mapping - consistent with backend
  const STATUS_LABELS = {
    'paid': 'Paid',      // Fixed: consistent with backend
    'pending': 'Pending',
    'overdue': 'Overdue',
    'draft': 'Draft',
    'sent': 'Sent',      // Added: backend supported status
    'cancelled': 'Cancelled'
  };

  const statusLabels = useMemo(() => STATUS_LABELS, []);

  // 创建默认的状态分布数据（所有状态为0）
  const createDefaultStatusData = useCallback(() => {
    return Object.keys(statusLabels).map(status => ({
      name: statusLabels[status],
      value: 0,
      status: status
    }));
  }, [statusLabels]);

  const fetchStatusDistribution = useCallback(async () => {
    console.log('🔍 SimpleStatusDistributionChart: Starting to get status distribution data');
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || 'dev-mock-token';
      console.log('🔑 SimpleStatusDistributionChart: Using token:', token);
      
      // Use dynamic month calculation
      const currentMonth = getCurrentDisplayMonth();
      
      // 使用 api 服务而不是直接 fetch
      const api = (await import('../../services/api')).default;
      
      const response = await api.get(`/dashboard/unified-chart-data?month=${currentMonth}`);
      
      const result = response.data;
      
      if (result.success && result.data && result.data.statusDistribution) {
        const statusDistribution = result.data.statusDistribution;
        
        let chartData = [];
        
        // 检查数据格式并处理
        if (statusDistribution.distribution && Array.isArray(statusDistribution.distribution)) {
          chartData = statusDistribution.distribution.map(item => ({
            name: statusLabels[item.status] || item.status,
            value: item.count || 0,
            status: item.status,
            percentage: item.percentage || '0.0'
          }));
        } else if (Array.isArray(statusDistribution)) {
          chartData = statusDistribution.map(item => ({
            name: statusLabels[item.status] || item.status,
            value: item.count || 0,
            status: item.status,
            percentage: item.percentage || '0.0'
          }));
        } else {
          // Try to parse other possible data formats
          if (statusDistribution.statusCounts) {
            // If there's statusCounts object
            const totalCount = Object.values(statusDistribution.statusCounts).reduce((sum, count) => sum + count, 0);
            chartData = Object.entries(statusDistribution.statusCounts).map(([status, count]) => ({
              name: statusLabels[status] || status,
              value: count || 0,
              status: status,
              percentage: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0'
            }));
          } else if (statusDistribution.paid !== undefined || statusDistribution.pending !== undefined) {
            // 如果是直接的状态计数对象
            const entries = Object.entries(statusDistribution)
              .filter(([key]) => ['paid', 'pending', 'overdue', 'draft', 'sent'].includes(key));
            const totalCount = entries.reduce((sum, [, count]) => sum + (count || 0), 0);
            chartData = entries.map(([status, count]) => ({
              name: statusLabels[status] || status,
              value: count || 0,
              status: status,
              percentage: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0'
            }));
          }
        }
        
        // If no data, use default status distribution data
        if (chartData.length === 0) {
          chartData = createDefaultStatusData();
        }
        
        setData(chartData);
      } else {
        // Even if API response format is incorrect, show default data
        setData(createDefaultStatusData());
      }
    } catch (error) {
      console.error('SimpleStatusDistributionChart: Failed to get data:', error);
      // Even if data retrieval fails, show default data instead of error
      setData(createDefaultStatusData());
      setError(null); // Clear error state, show default data
    } finally {
      setLoading(false);
    }
  }, [statusLabels, createDefaultStatusData]);

  useEffect(() => {
    fetchStatusDistribution();

    // Remove the interval to prevent flickering
    // const interval = setInterval(() => {
    //   fetchStatusDistribution();
    // }, 60000);
    // return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">Quantity: {data.value}</p>
          <p className="text-green-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-purple-500" />
            Invoice Status Distribution
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-purple-500" />
            Invoice Status Distribution
          </h3>
          <button
            onClick={fetchStatusDistribution}
            className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="w-8 h-8 mr-2" />
          <div>
            <p className="font-medium">Data loading failed</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 移除原来的无数据显示逻辑，因为现在总是有默认数据
  // if (!data || data.length === 0) {
  //   return (
  //     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
  //       <div className="flex items-center justify-between mb-4">
  //         <h3 className="text-lg font-semibold text-gray-900 flex items-center">
  //           <PieChartIcon className="w-5 h-5 mr-2 text-purple-500" />
  //           发票状态分布
  //         </h3>
  //       </div>
  //       <div className="flex items-center justify-center h-64 text-gray-500">
  //         <div className="text-center">
  //           <PieChartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
  //           <p>暂无发票数据</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <PieChartIcon className="w-5 h-5 mr-2 text-purple-500" />
          Invoice Status Distribution
        </h3>
        <button
          onClick={fetchStatusDistribution}
          className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-gray-900">{data.reduce((sum, item) => sum + item.value, 0)}</p>
        <p className="text-sm text-gray-600">Total Invoices</p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Shows the quantity distribution of invoices in various statuses</p>
      </div>
    </div>
  );
};

export default SimpleStatusDistributionChart;