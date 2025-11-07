import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiCheck, FiCalendar, FiCreditCard } from 'react-icons/fi';

const MarkAsPaidModal = ({ isOpen, onClose, onConfirm, invoice }) => {
  const { t } = useTranslation(['invoices', 'common']);
  const [paymentData, setPaymentData] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(paymentData);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('invoices:markAsPaid')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              {t('invoices:confirmMarkAsPaid', { 
                invoiceNumber: invoice?.invoiceNumber,
                amount: invoice?.amount 
              })}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              {t('invoices:paidDate')}
            </label>
            <input
              type="date"
              name="paidDate"
              value={paymentData.paidDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCreditCard className="inline mr-2" />
              {t('invoices:paymentMethod')}
            </label>
            <select
              name="paymentMethod"
              value={paymentData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="bank_transfer">{t('invoices:paymentMethods.bankTransfer')}</option>
              <option value="credit_card">{t('invoices:paymentMethods.creditCard')}</option>
              <option value="cash">{t('invoices:paymentMethods.cash')}</option>
              <option value="check">{t('invoices:paymentMethods.check')}</option>
              <option value="online_payment">{t('invoices:paymentMethods.onlinePayment')}</option>
              <option value="other">{t('invoices:paymentMethods.other')}</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('invoices:notes')} ({t('common:optional')})
            </label>
            <textarea
              name="notes"
              value={paymentData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('invoices:notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
            >
              <FiCheck className="mr-2 h-4 w-4" />
              {t('invoices:confirmPayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkAsPaidModal;