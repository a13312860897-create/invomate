import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiLink, 
  FiCopy, 
  FiShare2, 
  FiMail, 
  FiCheck, 
  FiLoader,
  FiCreditCard,
  FiDollarSign
} from 'react-icons/fi';
import paymentService from '../../services/paymentService';

const PaymentLinkGenerator = ({ invoice, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [copied, setCopied] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(invoice?.Client?.email || '');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const generatePaymentLink = async () => {
    setLoading(true);
    try {
      const response = await paymentService.generatePaymentLink(invoice.id, paymentMethod);
      if (response.success) {
        setPaymentLink(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (error) {
      console.error('Error generating payment link:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!paymentLink) return;
    
    const success = await paymentService.copyPaymentLink(paymentLink.paymentUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sharePaymentLink = async () => {
    if (!paymentLink) return;
    
    await paymentService.sharePaymentLink(paymentLink.paymentUrl, {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total
    });
  };

  const sendByEmail = async () => {
    if (!paymentLink || !emailRecipient) return;
    
    setSendingEmail(true);
    try {
      await paymentService.sendPaymentLinkByEmail(
        invoice.id,
        paymentLink.paymentUrl,
        emailRecipient,
        emailMessage
      );
      // Show success message
    } catch (error) {
      console.error('Error sending email:', error);
      // Handle error
    } finally {
      setSendingEmail(false);
    }
  };

  const paymentMethods = [
    { value: 'stripe', label: 'Stripe', icon: FiCreditCard },
    { value: 'paypal', label: 'PayPal', icon: FiDollarSign }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('payment.generateLink')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Invoice Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('invoice.number')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('invoice.client')}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invoice.Client?.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('invoice.total')}:
              </span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                {invoice.total}€
              </span>
            </div>
          </div>

          {!paymentLink ? (
            <>
              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('payment.method')}
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <label
                        key={method.value}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <IconComponent className="mr-2 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">
                          {method.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePaymentLink}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    {t('payment.generating')}
                  </>
                ) : (
                  <>
                    <FiLink className="mr-2" />
                    {t('payment.generateLink')}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Generated Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('payment.linkGenerated')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentLink.paymentUrl}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
                    title={t('payment.copyLink')}
                  >
                    {copied ? (
                      <FiCheck className="text-green-600" />
                    ) : (
                      <FiCopy className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('payment.linkExpires')}: {new Date(paymentLink.expiresAt).toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={sharePaymentLink}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                >
                  <FiShare2 className="mr-2" />
                  {t('payment.shareLink')}
                </button>
              </div>

              {/* Email Section */}
              <div className="border-t dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('payment.sendByEmail')}
                </h4>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder={t('payment.recipientEmail')}
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <textarea
                    placeholder={t('payment.customMessage')}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={sendByEmail}
                    disabled={!emailRecipient || sendingEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    {sendingEmail ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        {t('payment.sendingEmail')}
                      </>
                    ) : (
                      <>
                        <FiMail className="mr-2" />
                        {t('payment.sendEmail')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkGenerator;