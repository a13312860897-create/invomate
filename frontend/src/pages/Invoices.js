import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiChevronLeft, 
  FiChevronRight,
  FiMail,
  FiPrinter,
  FiEye,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import InvoiceGrid from '../components/InvoiceGrid';
import MobileInvoiceList from '../components/MobileInvoiceList';
import MarkAsPaidModal from '../components/MarkAsPaidModal';
import InvoiceExportModal from '../components/InvoiceExportModal';

const Invoices = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State variables
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [exportingInvoice, setExportingInvoice] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Debug logs
  console.log('=== Invoices Component Debug ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Invoices array:', invoices);
  console.log('Invoices count:', invoices.length);
  console.log('Total count:', totalCount);

  // Export actions - view, download PDF, send email, print
  const handleExport = useCallback(async (invoice) => {
    try {
      console.log('Export invoice:', invoice);
      // Open export modal
      setExportingInvoice(invoice);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  // Delete invoice handler
  const handleDelete = useCallback(async (invoiceId) => {
    try {
      console.log('Delete invoice:', invoiceId);
      // TODO: implement delete
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, []);

  // Status change handler
  const handleStatusChange = useCallback(async (invoiceId, newStatus) => {
    try {
      console.log('Status change:', invoiceId, newStatus);
      // TODO: implement status change
    } catch (error) {
      console.error('Status change failed:', error);
    }
  }, []);
  const testFetchInvoices = async () => {
    try {
      console.log('Testing API call...');
      const response = await api.get('/invoices');
      console.log('API test success:', response.data);
      console.log('Invoices data:', response.data.data?.invoices);
      console.log('Pagination:', response.data.data?.pagination);
    } catch (error) {
      console.error('API test failed:', error);
    }
  };

  // Fetch invoices function
  const fetchInvoices = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching invoices...');
      
      const params = {
        page: currentPage,
        limit: 6, // show 6 invoices per page
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await api.get('/invoices', { params });
      console.log('Fetch response:', response.data);
      
      // Backend response format: {success: true, data: {invoices: [...], pagination: {...}}}
      const data = response.data.data || response.data;
      setInvoices(data.invoices || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalItems || 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, searchTerm, statusFilter]);

  // Effect to handle URL parameters
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusFromUrl !== statusFilter) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  // Effect to fetch invoices
  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    if (user) {
      fetchInvoices();
    }
  }, [user, currentPage, searchTerm, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        fetchInvoices();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Display invoices (filtered)
  const displayInvoices = useMemo(() => {
    console.log('Computing displayInvoices, invoices:', invoices);
    return invoices;
  }, [invoices]);

  // Status badge component
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className="status-badge status-badge-green">{t('invoices:paid')}</span>;
      case 'pending':
        return <span className="status-badge status-badge-yellow">{t('invoices:pending')}</span>;
      case 'overdue':
        return <span className="status-badge status-badge-red">{t('invoices:overdue')}</span>;
      case 'draft':
        return <span className="status-badge status-draft">{t('invoices:draft')}</span>;
      case 'cancelled':
        return <span className="status-badge status-badge-gray">{t('invoices:cancelled')}</span>;
      default:
        return <span className="status-badge status-badge-gray">{status}</span>;
    }
  };

  // Handle mark as paid
  const handleConfirmMarkAsPaid = async () => {
    if (!selectedInvoice) return;
    
    try {
      await api.patch(`/invoices/${selectedInvoice.id}`, { status: 'paid' });
      setShowMarkAsPaidModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {t('common:error')}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
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
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={testFetchInvoices}
            className="btn btn-secondary text-sm"
          >
            Test API Call
          </button>
          <Link
            to={`/${t('routes:invoices')}/${t('routes:new')}`}
            className="btn btn-primary inline-flex items-center"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            {t('invoices:createInvoice')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('invoices:searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="all">{t('invoices:allStatuses')}</option>
              <option value="draft">{t('invoices:draft')}</option>
              <option value="pending">{t('invoices:pending')}</option>
              <option value="paid">{t('invoices:paid')}</option>
              <option value="overdue">{t('invoices:overdue')}</option>
              <option value="cancelled">{t('invoices:cancelled')}</option>
            </select>
            
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {displayInvoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <FiList className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('invoices:noInvoices')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('invoices:noInvoicesDescription')}
          </p>
          <div className="mt-6">
            <Link
              to={`/${t('routes:invoices')}/${t('routes:new')}`}
              className="btn btn-primary inline-flex items-center"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              {t('invoices:createInvoice')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <InvoiceGrid 
              invoices={displayInvoices}
              loading={false}
              onDelete={handleDelete}
              onExport={handleExport}
              onStatusChange={handleStatusChange}
              formatters={{
                formatDate: (date) => new Date(date).toLocaleDateString(),
                formatCurrency: (amount) => `€${amount}`
              }}
            />
          ) : (
            <MobileInvoiceList 
              invoices={displayInvoices}
              onDelete={handleDelete}
              onExport={handleExport}
              formatters={{
                formatDate: (date) => new Date(date).toLocaleDateString(),
                formatCurrency: (amount) => `€${amount}`
              }}
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
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
                    {t('common:showing')} <span className="font-medium">{(currentPage - 1) * 6 + 1}</span> {t('common:to')}{' '}
                    <span className="font-medium">{Math.min(currentPage * 6, totalCount)}</span> {t('common:of')}{' '}
                    <span className="font-medium">{totalCount}</span> {t('common:results')}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={`page-btn-${i}-${pageNum}`}
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

      {/* Export modal */}
      {exportingInvoice && (
        <InvoiceExportModal
          invoice={exportingInvoice}
          onClose={() => setExportingInvoice(null)}
        />
      )}
    </div>
  );
};

export default Invoices;