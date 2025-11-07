import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiCreditCard, FiCheckCircle, FiXCircle, FiClock, FiArrowLeft, FiInfo } from 'react-icons/fi';

// Stripe公钥（将在实际应用中从环境变量获取）
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'test_publishable_key'); // 模拟占位符，无敏感模式

// 支付表单组件
const PaymentForm = ({ invoice, onSuccess, onFailure }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const { t } = useTranslation(['common']);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js尚未加载
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 创建支付意图
      const { data } = await axios.post('/api/payments/create-payment-intent', {
        invoiceId: invoice.id,
        amount: invoice.total,
        currency: invoice.currency || 'EUR',
        description: `支付发票 ${invoice.invoiceNumber}`
      });

      const { clientSecret, paymentIntentId } = data;

      // 确认支付
      const cardElement = elements.getElement(CardElement);
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: invoice.clientName,
          },
        },
      });

      if (paymentError) {
        setPaymentError(paymentError.message);
        // 通知后端支付失败
        await axios.post('/api/payments/handle-payment-failure', {
          paymentIntentId,
          failureReason: paymentError.message
        });
        onFailure(paymentError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // 通知后端支付成功
        await axios.post('/api/payments/confirm-payment', {
          paymentIntentId
        });
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('common:error');
      setPaymentError(errorMessage);
      onFailure(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('payment.paymentinformation')}</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('payment.creditcardinformation')}
          </label>
          <div className="border border-gray-300 rounded-md p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {paymentError}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">{t('payment.paymentamount')}</p>
            <p className="text-xl font-bold text-gray-900">
              {invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '£'}{invoice.total}
            </p>
          </div>
          
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              !stripe || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? t('payment.processing') : t('payment.paynow')}
          </button>
        </div>
      </div>
    </form>
  );
};

// 支付页面组件
const Payment = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const { t } = useTranslation(['common', 'routes']);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoice(response.data);
        
        // 获取支付历史
        const historyResponse = await axios.get('/api/payments/history', {
          params: { invoiceId }
        });
        setPaymentHistory(historyResponse.data.payments);
        
        // 检查支付状态
        if (response.data.status === 'paid') {
          setPaymentStatus('paid');
        }
      } catch (error) {
        toast.error(t('payments:fetchInvoiceFailed'));
        console.error(t('payments:fetchInvoiceError'), error);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handlePaymentSuccess = () => {
    setPaymentStatus('paid');
    toast.success(t('payments:paymentSuccess'));
    
    // 刷新发票信息
    const fetchUpdatedInvoice = async () => {
      try {
        const response = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoice(response.data);
        
        // 获取更新后的支付历史
        const historyResponse = await axios.get('/api/payments/history', {
          params: { invoiceId }
        });
        setPaymentHistory(historyResponse.data.payments);
      } catch (error) {
        console.error(t('payments:fetchUpdatedInvoiceError'), error);
      }
    };
    
    fetchUpdatedInvoice();
  };

  const handlePaymentFailure = (errorMessage) => {
    setPaymentStatus('failed');
    toast.error(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiXCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{t('common:error')}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/${t('routes:invoices')}`)}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-2" /> 返回发票列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/${t('routes:invoices')}/${invoiceId}`)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-2" /> 返回发票详情
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{t('payment.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('invoicenumber')}: {invoice.invoiceNumber}
          </p>
        </div>

        <div className="p-6">
          {/* 发票信息 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('payment.paymentinformation')}</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('invoicenumber')}:</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('issuedate')}:</span>
                    <span>{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('duedate')}:</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('status')}:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status === 'draft' && t('draft')}
                      {invoice.status === 'sent' && t('sent')}
                      {invoice.status === 'paid' && t('paid')}
                      {invoice.status === 'overdue' && t('overdue')}
                      {invoice.status === 'cancelled' && t('cancelled')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('clients.title')}</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('clients.name')}:</span>
                    <span className="font-medium">{invoice.Client?.name || '未知客户'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t('clients.company')}:</span>
                    <span>{invoice.Client?.company || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">VAT号码:</span>
                <span>{invoice.Client?.vatNumber || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{t('payment.paymentamount')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '£'}{invoice.total}
                  </p>
                </div>
                
                {paymentStatus === 'paid' && (
                  <div className="flex items-center text-green-600">
                    <FiCheckCircle className="mr-2" />
                    <span className="font-medium">{t('paid')}</span>
                  </div>
                )}
                
                {paymentStatus === 'failed' && (
                  <div className="flex items-center text-red-600">
                    <FiXCircle className="mr-2" />
                    <span className="font-medium">{t('payment.errors.paymentfailed')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 支付状态提示 */}
          {invoice.status === 'paid' && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {t('payment.messages.paymentfailed')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* 支付表单 */}
          {invoice.status !== 'paid' && (
            <Elements stripe={stripePromise}>
              <PaymentForm 
                invoice={{
                  ...invoice,
                  clientName: invoice.Client?.name || '未知客户'
                }} 
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
              />
            </Elements>
          )}
          
          {/* 支付历史 */}
          {paymentHistory.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('payment.paymenthistory')}</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('payment.paymentid')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('payment.amount')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('payment.status')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('payment.paymenttime')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.paymentIntentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.currency === 'USD' ? '$' : payment.currency === 'EUR' ? '€' : '£'}{payment.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status === 'pending' && t('payment.paymentstatus.pending')}
                            {payment.status === 'succeeded' && t('payment.paymentstatus.succeeded')}
                            {payment.status === 'failed' && t('payment.paymentstatus.failed')}
                            {payment.status === 'canceled' && t('payment.paymentstatus.canceled')}
                            {payment.status === 'refunded' && t('payment.paymentstatus.refunded')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* 安全提示 */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiInfo className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                {t('payment.securitynoticetext')}
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;