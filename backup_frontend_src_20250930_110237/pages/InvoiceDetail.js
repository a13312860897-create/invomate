import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiPrinter, FiCheck, FiX, FiMail, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import InvoiceHeader from '../components/InvoiceHeader';


const InvoiceDetail = () => {
  const { id } = useParams();
  const { user, api } = useAuth();
  const { t } = useTranslation(['common', 'routes']);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailMethod, setEmailMethod] = useState('smtp');
  const [showEmailOptions, setShowEmailOptions] = useState(false);
  
  // {t('invoicedetail:useEffectForInvoice')}
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/invoices/${id}`);
        // 修复：正确处理后端返回的数据结构 { success: true, data: { invoice } }
        setInvoice(response.data.data?.invoice || response.data);
        setError(null);
      } catch (err) {
        setError(t('common:error'));
        console.error('Failed to fetch invoice', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, api, t]);
  
  // {t('invoicedetail:useEffectForClickOutside')}
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmailOptions && !event.target.closest('.relative')) {
        setShowEmailOptions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmailOptions]);
  
  // {t('invoicedetail:handleStatusChange')}
  const handleStatusChange = async (status) => {
    try {
      await api.put(`/invoices/${id}`, { status });
      setInvoice({ ...invoice, status });
    } catch (err) {
      setError(t('common:error'));
      console.error('Failed to update status', err);
    }
  };
  
  // {t('invoicedetail:handleDownloadPDF')}
  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(t('common:error'));
      console.error('Failed to download PDF', err);
    }
  };
  
  // {t('invoicedetail:handleSendReminder')}
  const handleSendReminder = async () => {
    try {
      await api.post(`/api/email/send-invoice/${id}`, { method: 'smtp' });
      alert(t('common:success'));
    } catch (err) {
      setError(t('common:error'));
      console.error('Failed to send email', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        alert(`${t('common:error')}: ${err.response.data.message}`);
      } else {
        alert('Email configuration error');
      }
    }
  };
  
  // {t('invoicedetail:handleUploadProof')}
  const handleUploadProof = () => {
    // {t('invoicedetail:implementUploadProofLogic')}
    alert('Upload proof functionality coming soon');
  };
  
  // {t('invoicedetail:handleSendEmail')}
  const handleSendEmail = async (method = emailMethod) => {
    try {
      await api.post(`/api/email/send-invoice/${id}`, { method });
      alert(t('common:success'));
      
      // Update status if draft
      if (invoice.status === 'draft') {
        handleStatusChange('sent');
      }
    } catch (err) {
      setError(t('common:error'));
      console.error('Failed to send email', err);
      
      // Show detailed error
      if (err.response && err.response.data && err.response.data.message) {
        alert(`${t('common:error')}: ${err.response.data.message}`);
      } else {
        alert('Email configuration error');
      }
    }
  };
  
  // {t('invoicedetail:formatDate')}
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency with proper fallback
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'EUR',
    }).format(numAmount);
  };
  
  // {t('invoicedetail:getStatusBadge')}
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="status-badge status-badge-gray">{t('draft')}</span>;
      case 'sent':
        return <span className="status-badge status-badge-blue">{t('sent')}</span>;
      case 'paid':
        return <span className="status-badge status-badge-green">{t('paid')}</span>;
      case 'overdue':
        return <span className="status-badge status-badge-red">{t('overdue')}</span>;
      case 'cancelled':
        return <span className="status-badge status-badge-gray">{t('cancelled')}</span>;
      default:
        return <span className="status-badge status-badge-gray">{status}</span>;
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="mt-4 text-gray-500">{t('common:loading')}</p>
      </div>
    );
  }
  
  if (error || !invoice) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiX className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Invoice not found'}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-16 md:pb-0"> {/* {t('invoicedetail:addBottomPaddingForMobile')} */}
      <div className="mb-6">
        <Link
          to={`/${t('routes:invoices')}`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t('common:back')}
        </Link>
      </div>
      
      {/* {t('invoicedetail:useNewInvoiceHeaderComponent')} */}
      <InvoiceHeader 
        invoice={invoice}
        onSendReminder={handleSendReminder}
        onDownloadPDF={handleDownloadPDF}
        onUploadProof={handleUploadProof}
      />
      
      <div className="bg-white shadow rounded-lg overflow-hidden mt-4">
        {/* {t('invoicedetail:invoiceContent')} */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* {t('invoicedetail:companyInfo')} */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">From</h4>
              <div className="text-sm text-gray-700">
                {user?.logo && (
                  <div className="mb-3">
                    <img 
                      src={`http://localhost:5000/${user.logo}`} 
                      alt="Company Logo" 
                      className="h-16 w-auto max-w-xs object-contain"
                    />
                  </div>
                )}
                <p className="font-medium">{user?.companyName || user?.firstName + ' ' + user?.lastName}</p>
                <p>{user?.email}</p>
                <p>{user?.phone}</p>
                <p>{user?.address}</p>
              </div>
            </div>
            
            {/* {t('invoicedetail:clientInfo')} */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">To</h4>
              <div className="text-sm text-gray-700">
                <p className="font-medium">{invoice.Client?.name}</p>
                {invoice.Client?.company && <p>{invoice.Client.company}</p>}
                {invoice.Client?.vatNumber && <p>VAT: {invoice.Client.vatNumber}</p>}
                <p>{invoice.Client?.phone}</p>
                <p>{invoice.Client?.address}</p>
              </div>
            </div>
          </div>
          
          {/* {t('invoicedetail:invoiceItems')} */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Items</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.InvoiceItems && Array.isArray(invoice.InvoiceItems) && invoice.InvoiceItems.length > 0 ? (
                    invoice.InvoiceItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.taxRate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t('invoicedetail.noitemsfound')}
                      </td>
                    </tr>
                  )}
                  
                  {/* {t('invoicedetail:summaryRow')} */}
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Subtotal</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Tax</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.taxAmount)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* {t('invoicedetail:notes')} */}
          {invoice.notes && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
              <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {invoice.notes}
              </div>
            </div>
          )}
          
          
        </div>
        
        {/* {t('invoicedetail:footerActions')} */}
        <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-3">
            {invoice.status !== 'cancelled' && (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => handleStatusChange('cancelled')}
              >
                <FiX className="-ml-1 mr-2 h-5 w-5" />
{t('common:cancel')}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            {invoice.status === 'draft' && (
              <Link
                to={`/${t('routes:invoices')}/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiEdit className="-ml-1 mr-2 h-5 w-5" />
{t('common:edit')}
              </Link>
            )}
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => window.print()}
            >
              <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;