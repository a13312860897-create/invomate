import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiDollarSign, 
  FiUser, 
  FiFileText,
  FiAlertTriangle,
  FiEye,
  FiEdit,
  FiDownload
} from 'react-icons/fi';
import dashboardService from '../services/dashboardService';
import api from '../services/api';

const OverdueInvoicesDetails = () => {
  const navigate = useNavigate();
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  const loadOverdueInvoices = async () => {
    try {
      setLoading(true);
      // 使用统一的dashboard stats API获取发票数据，然后筛选逾期发票
      const response = await api.get('/invoices/stats/dashboard');
      const data = response.data?.data || {};
      
      // 从最近发票中筛选逾期发票
      const recentInvoices = data.recentInvoices || [];
      const overdueInvoices = recentInvoices.filter(invoice => invoice.status === 'overdue');
      
      setOverdueInvoices(overdueInvoices);
    } catch (error) {
      console.error('Error loading overdue invoices:', error);
      setError('加载逾期发票失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverdueStatus = (days) => {
    if (days <= 7) return { text: '轻微逾期', color: 'text-yellow-600 bg-yellow-100' };
    if (days <= 30) return { text: '中度逾期', color: 'text-orange-600 bg-orange-100' };
    return { text: '严重逾期', color: 'text-red-600 bg-red-100' };
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handleEditInvoice = (invoiceId) => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await dashboardService.markAsPaid(invoiceId);
      loadOverdueInvoices(); // 重新加载数据
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">加载失败</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadOverdueInvoices}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            返回仪表盘
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">逾期发票详情</h1>
              <p className="text-gray-600 mt-2">
                共 {overdueInvoices.length} 张逾期发票，总金额 {formatCurrency(
                  overdueInvoices.reduce((sum, invoice) => sum + (invoice.amount || invoice.total || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 逾期发票列表 */}
        {overdueInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无逾期发票</h3>
            <p className="text-gray-600">所有发票都按时支付，太棒了！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overdueInvoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.dueDate);
              const overdueStatus = getOverdueStatus(daysOverdue);
              
              return (
                <div key={invoice.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            发票 #{invoice.invoiceNumber}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FiUser className="mr-1" />
                            {invoice.clientName || invoice.Client?.name || '未知客户'}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${overdueStatus.color}`}>
                          {overdueStatus.text}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(invoice.amount || invoice.total || 0)}
                        </div>
                        <div className="text-sm text-red-600 font-medium">
                          逾期 {daysOverdue} 天
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-2" />
                        <span>开票日期: {formatDate(invoice.issueDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-2" />
                        <span>到期日期: {formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiDollarSign className="mr-2" />
                        <span>状态: {invoice.status}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEye className="mr-1" />
                        查看
                      </button>
                      <button
                        onClick={() => handleEditInvoice(invoice.id)}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FiEdit className="mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <FiDollarSign className="mr-1" />
                        标记已付
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverdueInvoicesDetails;