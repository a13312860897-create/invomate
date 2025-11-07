import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const EnhancedInvoiceActions = ({ 
  invoice,
  formData,
  client,
  user,
  onPrint,
  loading = false,
  disabled = false
}) => {
  const { t } = useTranslation(['invoices', 'common']);
  const [actionLoading, setActionLoading] = useState({
    print: false
  });

  // 处理打印
  const handlePrint = async () => {
    if (disabled) return;
    
    setActionLoading(prev => ({ ...prev, print: true }));
    try {
      await onPrint();
      toast.success('Print job sent');
    } catch (error) {
      toast.error('Print failed');
      console.error('Print error:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, print: false }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('invoices:actions.title')}
        </h3>
        
        {/* 基本操作按钮 */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onPrint}
            disabled={disabled || actionLoading.print || loading}
            className="flex items-center justify-center px-4 py-3 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading.print ? 'Printing...' : 'Export'}
          </button>
        </div>
      </div>


    </>
  );
};

export default EnhancedInvoiceActions;