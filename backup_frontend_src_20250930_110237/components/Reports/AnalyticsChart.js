import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { Card, Select, Radio, Table, Spin, Alert } from 'antd';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;

const AnalyticsChart = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dimension, setDimension] = useState('customer');
  const [period, setPeriod] = useState('month');
  const [chartType, setChartType] = useState('bar');
  const [limit, setLimit] = useState(10);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reports/analytics?dimension=${dimension}&period=${period}&limit=${limit}`);
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(t('reports.analyticsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dimension, period, limit]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getChartData = () => {
    if (!analyticsData || !analyticsData.data) return null;

    const data = analyticsData.data;
    const labels = data.map(item => item.name);
    const revenues = data.map(item => item.totalRevenue);
    const invoiceCounts = data.map(item => item.invoiceCount);

    if (chartType === 'pie') {
      return {
        labels,
        datasets: [
          {
            label: t('reports.revenue'),
            data: revenues,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
              '#FF6384',
              '#C9CBCF',
              '#4BC0C0',
              '#FF6384'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      };
    }

    return {
      labels,
      datasets: [
        {
          label: t('reports.revenue'),
          data: revenues,
          backgroundColor: 'rgba(24, 144, 255, 0.6)',
          borderColor: '#1890ff',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: t('reports.invoiceCount'),
          data: invoiceCounts,
          backgroundColor: 'rgba(82, 196, 26, 0.6)',
          borderColor: '#52c41a',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const getBarChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: t(`reports.analyticsByDimension.${dimension}`),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label;
            const value = context.parsed.y;
            if (label === t('reports.revenue')) {
              return `${label}: ${formatCurrency(value)}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t(`reports.dimension.${dimension}`)
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: t('reports.revenue')
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: t('reports.invoiceCount')
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  });

  const getPieChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: t(`reports.analyticsByDimension.${dimension}`),
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  });

  const getTableColumns = () => {
    const baseColumns = [
      {
        title: t(`reports.dimension.${dimension}`),
        dataIndex: 'name',
        key: 'name',
        width: 200
      },
      {
        title: t('reports.totalRevenue'),
        dataIndex: 'totalRevenue',
        key: 'totalRevenue',
        render: (value) => formatCurrency(value),
        sorter: (a, b) => a.totalRevenue - b.totalRevenue,
        sortDirections: ['descend', 'ascend']
      },
      {
        title: t('reports.invoiceCount'),
        dataIndex: 'invoiceCount',
        key: 'invoiceCount',
        sorter: (a, b) => a.invoiceCount - b.invoiceCount,
        sortDirections: ['descend', 'ascend']
      }
    ];

    if (dimension === 'customer') {
      baseColumns.push(
        {
          title: t('reports.paidAmount'),
          dataIndex: 'paidAmount',
          key: 'paidAmount',
          render: (value) => formatCurrency(value || 0)
        },
        {
          title: t('reports.pendingAmount'),
          dataIndex: 'pendingAmount',
          key: 'pendingAmount',
          render: (value) => formatCurrency(value || 0)
        }
      );
    }

    if (dimension === 'status') {
      baseColumns.push({
        title: t('reports.avgAmount'),
        dataIndex: 'avgAmount',
        key: 'avgAmount',
        render: (value) => formatCurrency(value || 0)
      });
    }

    if (dimension === 'time') {
      baseColumns.push(
        {
          title: t('reports.paidCount'),
          dataIndex: 'paidCount',
          key: 'paidCount'
        },
        {
          title: t('reports.pendingCount'),
          dataIndex: 'pendingCount',
          key: 'pendingCount'
        }
      );
    }

    return baseColumns;
  };

  if (loading) {
    return (
      <Card title={t('reports.multidimensionalAnalysis')} className="mb-6">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={t('reports.multidimensionalAnalysis')} className="mb-6">
        <Alert
          message={t('common.error')}
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      title={t('reports.multidimensionalAnalysis')}
      className="mb-6"
      extra={
        <div className="flex gap-4">
          <Select
            value={dimension}
            onChange={setDimension}
            style={{ width: 120 }}
          >
            <Option value="customer">{t('reports.dimension.customer')}</Option>
            <Option value="status">{t('reports.dimension.status')}</Option>
            <Option value="time">{t('reports.dimension.time')}</Option>
          </Select>
          
          {dimension === 'time' && (
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 100 }}
            >
              <Option value="month">{t('reports.period.month')}</Option>
              <Option value="quarter">{t('reports.period.quarter')}</Option>
              <Option value="year">{t('reports.period.year')}</Option>
            </Select>
          )}
          
          <Select
            value={limit}
            onChange={setLimit}
            style={{ width: 80 }}
          >
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={20}>20</Option>
          </Select>
        </div>
      }
    >
      <div className="mb-4">
        <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <Radio.Button value="bar">{t('reports.barChart')}</Radio.Button>
          <Radio.Button value="pie">{t('reports.pieChart')}</Radio.Button>
          <Radio.Button value="table">{t('reports.table')}</Radio.Button>
        </Radio.Group>
      </div>

      {chartType === 'table' ? (
        <Table
          dataSource={analyticsData?.data || []}
          columns={getTableColumns()}
          rowKey="name"
          pagination={false}
          scroll={{ x: 800 }}
        />
      ) : (
        <div className="h-80 mb-4">
          {analyticsData && chartType === 'bar' && (
            <Bar data={getChartData()} options={getBarChartOptions()} />
          )}
          {analyticsData && chartType === 'pie' && (
            <Pie data={getChartData()} options={getPieChartOptions()} />
          )}
        </div>
      )}
      
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t('reports.totalItems')}</div>
            <div className="text-xl font-semibold text-blue-600">
              {analyticsData.summary.totalItems}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t('reports.totalRevenue')}</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(analyticsData.summary.totalRevenue)}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t('reports.totalInvoices')}</div>
            <div className="text-xl font-semibold text-purple-600">
              {analyticsData.summary.totalInvoices}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AnalyticsChart;