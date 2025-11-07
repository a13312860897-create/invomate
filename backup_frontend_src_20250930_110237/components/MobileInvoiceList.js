import React from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit, FiDownload, FiTrash2, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const MobileInvoiceList = ({ invoices, onDelete, formatters }) => {
  const { t } = useTranslation(['common', 'invoices', 'routes']);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FiEdit, text: t('invoices:status.draft') },
      sent: { color: 'bg-blue-100 text-blue-800', icon: FiClock, text: t('invoices:status.sent') },
      paid: { color: 'bg-green-100 text-green-800', icon: FiCheck, text: t('invoices:status.paid') },
      overdue: { color: 'bg-red-100 text-red-800', icon: FiX, text: t('invoices:status.overdue') },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const handleDelete = (invoice) => {
    if (window.confirm(t('invoices:confirmDelete'))) {
      onDelete(invoice.id);
    }
  };

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="mobile-card touch-feedback">
          <div className="mobile-card-header">
            <div className="mobile-card-title">
              {invoice.invoiceNumber}
            </div>
            {getStatusBadge(invoice.status)}
          </div>
          
          <div className="mobile-card-content">
            <div className="mobile-card-item">
              <div className="mobile-card-label">{t('invoices:client')}</div>
              <div className="mobile-card-value">{invoice.Client?.name || 'N/A'}</div>
            </div>
            
            <div className="mobile-card-item">
              <div className="mobile-card-label">{t('invoices:amount')}</div>
              <div className="mobile-card-value">{formatters.formatCurrency(invoice.total)}</div>
            </div>
            
            <div className="mobile-card-item">
              <div className="mobile-card-label">{t('invoices:issueDate')}</div>
              <div className="mobile-card-value">{formatters.formatDate(invoice.issueDate)}</div>
            </div>
            
            <div className="mobile-card-item">
              <div className="mobile-card-label">{t('invoices:dueDate')}</div>
              <div className="mobile-card-value">{formatters.formatDate(invoice.dueDate)}</div>
            </div>
          </div>
          
          <div className="mobile-card-actions">
            <Link
              to={`/${t('routes:invoices')}/${invoice.id}`}
              className="btn btn-outline flex items-center justify-center"
            >
              <FiEye className="w-4 h-4 mr-2" />
              {t('common:view')}
            </Link>
            
            <Link
              to={`/${t('routes:invoices')}/${invoice.id}/${t('routes:edit')}`}
              className="btn btn-outline flex items-center justify-center"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              {t('common:edit')}
            </Link>
            
            <button
              onClick={() => window.open(`/api/invoices/${invoice.id}.pdf`, '_blank')}
              className="btn btn-outline flex items-center justify-center"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              PDF
            </button>
            
            <button
              onClick={() => handleDelete(invoice)}
              className="btn btn-outline text-red-600 hover:bg-red-50 flex items-center justify-center"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileInvoiceList;