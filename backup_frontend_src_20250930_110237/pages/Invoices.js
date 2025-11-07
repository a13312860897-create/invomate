import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiDownload, FiEye, FiEdit, FiTrash2, FiCheck, FiX, FiClock, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import MobileInvoiceList from '../components/MobileInvoiceList';
import MarkAsPaidModal from '../components/MarkAsPaidModal';


const Invoices = () => {
  const { user, api } = useAuth();
  const { t, i18n } = useTranslation(['common', 'invoices', 'routes']);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const itemsPerPage = 10;
  
  // {t('invoices:useEffectForInvoices')}
  useEffect(() => {
    fetchInvoices();
  }, [currentPage, searchTerm, statusFilter]);
  
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await api.get(`/invoices?${params}`);
      // 后端返回格式: {success: true, data: {invoices: [...], pagination: {...}}}
      const data = response.data.data;
      setInvoices(data?.invoices || []);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotalCount(data?.pagination?.totalCount || 0);
      setError(null);
    } catch (err) {
      console.error(t('invoices:errorFetchingInvoices'), err);
      setError(t('invoices:errorLoadingInvoices'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, itemsPerPage, api, t]);
  
  // {t('invoices:handleDeleteInvoice')}
  const handleDeleteInvoice = async (id) => {
    if (window.confirm(t('invoices:deleteConfirmation'))) {
      try {
        await api.delete(`/invoices/${id}`);
        setInvoices(invoices.filter(invoice => invoice.id !== id));
      } catch (err) {
        console.error(t('invoices:errorDeletingInvoice'), err);
      }
    }
  };
  
  // {t('invoices:handleStatusChange')}
  const handleStatusChange = async (id, status) => {
    if (status === 'paid') {
      // 对于标记为已支付，显示确认模态框
      const invoice = invoices.find(inv => inv.id === id);
      setSelectedInvoice(invoice);
      setShowMarkAsPaidModal(true);
    } else {
      // 其他状态变更直接处理
      try {
        await api.put(`/invoices/${id}`, { status });
        setInvoices(invoices.map(invoice => 
          invoice.id === id ? { ...invoice, status } : invoice
        ));
      } catch (err) {
        console.error(t('invoices:errorUpdatingStatus'), err);
      }
    }
  };

  // 处理确认标记为已支付
  const handleConfirmMarkAsPaid = async (paymentData) => {
    try {
      await api.put(`/invoices/${selectedInvoice.id}`, { 
        status: 'paid',
        paidDate: paymentData.paidDate,
        paymentMethod: paymentData.paymentMethod,
        paymentNotes: paymentData.notes
      });
      setInvoices(invoices.map(invoice => 
        invoice.id === selectedInvoice.id ? { 
          ...invoice, 
          status: 'paid',
          paidDate: paymentData.paidDate,
          paymentMethod: paymentData.paymentMethod
        } : invoice
      ));
      setSelectedInvoice(null);
    } catch (err) {
      console.error(t('invoices:errorUpdatingStatus'), err);
    }
  };
  
  // 使用防抖优化搜索性能
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      fetchInvoices();
    }
  }, [debouncedSearchTerm, fetchInvoices]);
  
  // 服务端已处理过滤，直接使用invoices
  const displayInvoices = invoices;
  
  // 使用useMemo优化格式化函数
  const formatters = useMemo(() => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'pt' ? 'pt-BR' : 'en-US';
    
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // 修复货币格式化，使用欧洲地区设置以确保显示€符号
    const currencyFormatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
    
    return {
      formatDate: (dateString) => dateFormatter.format(new Date(dateString)),
      formatCurrency: (amount) => currencyFormatter.format(amount)
    };
  }, [i18n.language]);
  
  // {t('invoices:getStatusBadge')}
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="status-badge status-badge-gray">{t('invoices:draft')}</span>;
      case 'sent':
        return <span className="status-badge status-badge-blue">{t('invoices:sent')}</span>;
      case 'paid':
        return <span className="status-badge status-badge-green">{t('invoices:paid')}</span>;
      case 'overdue':
        return <span className="status-badge status-badge-red">{t('invoices:overdue')}</span>;
      case 'cancelled':
        return <span className="status-badge status-badge-gray">{t('invoices:cancelled')}</span>;
      default:
        return <span className="status-badge status-badge-gray">{status}</span>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('invoices:title')}
            {totalCount > 0 && (
              <span className="ml-2 text-lg font-normal text-gray-500">
                ({totalCount} {totalCount === 1 ? t('invoices:invoice') : t('invoices:invoices')})
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount > 0 
              ? `${t('invoices:showing')} ${invoices.length} ${t('invoices:of')} ${totalCount} ${t('invoices:invoices')}`
              : t('invoices:subtitle')
            }
          </p>
        </div>
        <Link
          to={`/${t('routes:invoices')}/${t('routes:new')}`}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          {t('invoices:create')}
        </Link>
      </div>
      
      {/* {t('invoices:filters')} */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input-with-icon w-full"
              placeholder={t('invoices:search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3">
            <div className="relative">
              <select
                className="form-input appearance-none pr-12"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('invoices:allStatuses')}</option>
                <option value="draft">{t('invoices:draft')}</option>
                <option value="sent">{t('invoices:sent')}</option>
                <option value="paid">{t('invoices:paid')}</option>
                <option value="overdue">{t('invoices:overdue')}</option>
                <option value="cancelled">{t('invoices:cancelled')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <button className="btn btn-secondary flex items-center">
              <FiDownload className="mr-2 h-4 w-4" />
              {t('invoices:export')}
            </button>
          </div>
        </div>
      </div>
      
      {/* {t('invoices:errorMessage')} */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* {t('invoices:loadingState')} */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          <p className="mt-4 text-gray-500">{t('invoices:loading')}</p>
        </div>
      ) : (
        <>
          {/* {t('invoices:emptyState')} */}
          {invoices.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                <FiDollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('invoices:noInvoicesYet')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('invoices:getStartedByCreating')}</p>
              <div className="mt-6 flex justify-center">
                <Link
                  to={`/${t('routes:invoices')}/${t('routes:new')}`}
                  className="btn btn-primary inline-flex items-center"
                >
                  <FiPlus className="mr-2 h-4 w-4" />
                  {t('invoices:create')}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* {t('invoices:invoiceList')} */}
              {/* 移动端卡片布局 */}
              <div className="block md:hidden">
                 <MobileInvoiceList 
                   invoices={displayInvoices} 
                   onDelete={handleDeleteInvoice}
                   formatters={formatters}
                 />
               </div>
              
              {/* 桌面端表格布局 */}
              <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoices:number')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoices:client')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoices:issueDate')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoices:dueDate')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoices:amount')}</th>
      
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common:actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayInvoices.length > 0 ? (
                        displayInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{invoice.Client?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatters.formatDate(invoice.issueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatters.formatDate(invoice.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatters.formatCurrency(invoice.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <Link
                                  to={`/${t('routes:invoices')}/${invoice.id}`}
                                  className="text-gray-600 hover:text-gray-900"
                                  title={t('invoices:view')}
                                >
                                  <FiEye className="h-5 w-5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-gray-600 hover:text-red-600"
                                  title={t('invoices:delete')}
                                >
                                  <FiTrash2 className="h-5 w-5" />
                                </button>
                                {invoice.status !== 'paid' && (
                                  <button
                                    onClick={() => handleStatusChange(invoice.id, 'paid')}
                                    className="text-gray-600 hover:text-green-600"
                                    title={t('invoices:markAsPaid')}
                                  >
                                    <FiCheck className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            {t('invoices:noMatch')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页组件 */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common:previous')}
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common:next')}
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          {t('common:showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common:to')}{' '}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> {t('common:of')}{' '}
                          <span className="font-medium">{totalCount}</span> {t('common:results')}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiChevronLeft className="h-5 w-5" />
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      
      <MarkAsPaidModal
        isOpen={showMarkAsPaidModal}
        onClose={() => {
          setShowMarkAsPaidModal(false);
          setSelectedInvoice(null);
        }}
        onConfirm={handleConfirmMarkAsPaid}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default Invoices;