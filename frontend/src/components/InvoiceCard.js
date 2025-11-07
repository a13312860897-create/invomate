import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiDownload, FiCalendar, FiUser, FiDollarSign, FiLink } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import PaymentLinkGenerator from './Payment/PaymentLinkGenerator';

const InvoiceCard = ({ 
  invoice, 
  onDelete, 
  onExport, 
  onStatusChange, 
  formatters 
}) => {
  const { t } = useTranslation(['invoices', 'common']);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600', 
        label: t('invoices:draft'),
        icon: '📝'
      },
      sent: { 
        className: 'bg-blue-600 text-white border-blue-700 dark:bg-blue-500 dark:text-white dark:border-blue-400', 
        label: t('invoices:sent'),
        icon: '📤'
      },
      paid: { 
        className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-200 dark:border-green-600', 
        label: t('invoices:paid'),
        icon: '✅'
      },
      overdue: { 
        className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-800 dark:text-red-200 dark:border-red-600', 
        label: t('invoices:overdue'),
        icon: '⚠️'
      },
      cancelled: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', 
        label: t('invoices:cancelled'),
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const isOverdue = () => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Invoice header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {invoice.invoiceNumber}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <FiUser className="mr-1 h-4 w-4" />
              <span>{invoice.Client?.name || 'N/A'}</span>
              {invoice.Client?.company && (
                <span className="ml-2 text-gray-400">
                  ({invoice.Client.company})
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(invoice.status)}
            {isOverdue() && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                {t('invoices:overdue')}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiDollarSign className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">{t('invoices:total')}</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              {formatters.formatCurrency(invoice.total)}
            </span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {t('invoices:totalTax')}: {formatters.formatCurrency(invoice.taxAmount)}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <div className="text-gray-600">{t('invoices:issueDate')}</div>
              <div className="font-medium">
                {formatters.formatDate(invoice.issueDate)}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
            <div>
              <div className="text-gray-600">{t('invoices:dueDate')}</div>
              <div className={`font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
                {formatters.formatDate(invoice.dueDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onExport(invoice)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiDownload className="mr-1 h-4 w-4" />
            {t('common:export')}
          </button>

          {invoice.status !== 'paid' && (
            <>
              <button
                onClick={() => onStatusChange(invoice.id, 'paid')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                ✅ {t('invoices:markAsPaid')}
              </button>

              <button
                onClick={() => setShowPaymentLinkModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FiLink className="mr-1 h-4 w-4" />
                Payment Link
              </button>
            </>
          )}

          <button
            onClick={() => onDelete(invoice.id)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiTrash2 className="mr-1 h-4 w-4" />
            {t('common:delete')}
          </button>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{t('invoices:notes')}: </span>
            {invoice.notes}
          </div>
        </div>
      )}

      {/* Payment link modal */}
      {showPaymentLinkModal && (
        <PaymentLinkGenerator
          invoice={invoice}
          onClose={() => setShowPaymentLinkModal(false)}
          onSuccess={(paymentLink) => {
            console.log('Payment link generated:', paymentLink);
            // 可以在这里添加成功提示
          }}
        />
      )}
    </div>
  );
};

export default InvoiceCard;