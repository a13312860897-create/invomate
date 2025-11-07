import React from 'react';
import InvoiceCard from './InvoiceCard';
import { FiDollarSign } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const InvoiceGrid = ({ 
  invoices, 
  loading, 
  onDelete, 
  onExport, 
  onStatusChange, 
  formatters 
}) => {
  const { t } = useTranslation(['invoices', 'common']);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-16 bg-gray-100 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-18"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
          <FiDollarSign className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {t('invoices:noInvoicesYet')}
        </h3>
        <p className="text-gray-500 mb-6">
          {t('invoices:getStartedByCreating')}
        </p>
        <a
          href="/invoices/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('common:createfirstinvoice')}
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onDelete={onDelete}
          onExport={onExport}
          onStatusChange={onStatusChange}
          formatters={formatters}
        />
      ))}
    </div>
  );
};

export default InvoiceGrid;