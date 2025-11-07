import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  FiCreditCard, 
  FiDollarSign, 
  FiCalendar, 
  FiUser, 
  FiCheck, 
  FiLoader,
  FiAlertCircle,
  FiShield,
  FiX,
  FiFileText
} from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import { appendLocalBillingRecord } from '../../utils/billingRecord';

// Initialize Stripe only if we have a valid key
const isValidStripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY && 
  !process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY.includes('YourTestKeyHere');
const stripePromise = isValidStripeKey ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) : null;

const PaymentForm = ({ invoice, clientSecret, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setProcessing(true);

    try {
      // 检查是否为开发模式且使用占位符密钥
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isPlaceholderKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.includes('YourTestKeyHere');
      
      if (isDevelopment && isPlaceholderKey) {
        // 开发模式下使用模拟支付
        console.log('🔧 使用模拟支付 (开发模式)');
        
        // 模拟支付处理延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 从 clientSecret 中提取 paymentIntentId
        const paymentIntentId = clientSecret?.split('_secret_')[0];
        
        if (paymentIntentId) {
          // 创建模拟的成功支付意图
          const mockPaymentIntent = {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 5000,
            currency: 'eur',
            created: Math.floor(Date.now() / 1000)
          };
          
          onPaymentSuccess(mockPaymentIntent);
          return;
        } else {
          onPaymentError('无效的支付意图ID');
          return;
        }
      }

      // 生产模式下使用真实的 Stripe API
      if (!stripe || !elements) {
        onPaymentError('Stripe 未正确初始化');
        return;
      }

      if (paymentMethod === 'stripe') {
        const cardElement = elements.getElement(CardElement);
        
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: invoice.Client?.name || 'Client',
              email: invoice.Client?.email || ''
            }
          }
        });

        if (error) {
          onPaymentError(error.message);
        } else if (paymentIntent.status === 'succeeded') {
          onPaymentSuccess(paymentIntent);
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onPaymentError('支付处理时出错，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          支付方式
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('stripe')}
            className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              paymentMethod === 'stripe'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FiCreditCard />
            <span>信用卡/借记卡</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('paypal')}
            className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              paymentMethod === 'paypal'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            disabled
          >
            <span>PayPal</span>
            <span className="text-xs text-gray-500">(即将推出)</span>
          </button>
        </div>
      </div>

      {/* Stripe Card Element */}
      {paymentMethod === 'stripe' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            银行卡信息
          </label>
          {process.env.NODE_ENV === 'development' && process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.includes('YourTestKeyHere') ? (
            <div className="p-4 border border-blue-300 rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <FiShield />
                <span className="font-medium">开发模式 - 模拟支付</span>
              </div>
              <p className="text-sm text-blue-600 mb-3">
                当前为开发模式，将使用模拟支付。无需输入真实银行卡信息。
              </p>
              <div className="space-y-2 text-sm text-blue-600">
                <div>• 点击"确认支付"按钮即可完成模拟支付</div>
                <div>• 支付将在2秒后自动成功</div>
                <div>• 无需填写任何银行卡信息</div>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-gray-300 rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          processing || 
          paymentMethod !== 'stripe' || 
          (!(process.env.NODE_ENV === 'development' && process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.includes('YourTestKeyHere')) && !stripe)
        }
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <FiLoader className="animate-spin" />
            <span>正在处理支付...</span>
          </>
        ) : (
          <>
            <FiShield />
            <span>安全支付 {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'EUR' }).format(invoice.total)}</span>
          </>
        )}
      </button>
    </form>
  );
};

const PaymentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const billingAppendedRef = useRef(false);

  useEffect(() => {
    loadInvoiceDetails();
  }, [token]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getInvoiceByToken(token);
      if (response.success) {
        setInvoice(response.data.invoice);
        // Create payment intent for Stripe using payment token
        const paymentIntentResponse = await paymentService.createPaymentIntentByToken(token);
        if (paymentIntentResponse.success) {
          setClientSecret(paymentIntentResponse.data.clientSecret);
        }
      } else {
        setError('发票未找到或支付链接已过期');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('加载发票信息时出错');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Confirm payment on backend
      const response = await paymentService.confirmPayment({
        paymentIntentId: paymentIntent.id,
        invoiceId: invoice.id
      });
      
      if (response.success) {
        // 记录一次账单（发票支付成功，确保仅写入一次）
        if (!billingAppendedRef.current) {
          const amountCents = Math.round((invoice.total || 0) * 100);
          appendLocalBillingRecord({
            id: `inv-${invoice.id}-pi-${paymentIntent.id}`,
            amountCents,
            currency: 'EUR',
            description: '发票支付',
            invoiceNumber: invoice.invoiceNumber
          });
          billingAppendedRef.current = true;
        }
        setPaymentSuccess(true);
        // 3秒后跳转到成功页面
        setTimeout(() => {
          navigate('/payment/success');
        }, 3000);
      } else {
        setError('支付确认失败');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError('支付确认时出错');
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载发票信息...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">支付页面出错</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                loadInvoiceDetails();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              重新加载
            </button>
            <p className="text-sm text-gray-500">
              如果问题持续存在，请联系发票发送方
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">支付成功！</h2>
          <p className="text-gray-600 mb-4">
            您的支付已成功处理，发票 {invoice.invoiceNumber} 已标记为已付款。
          </p>
          <p className="text-sm text-gray-500">
            正在跳转到成功页面...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">发票支付</h1>
          <p className="text-gray-600">安全便捷的在线支付</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 发票信息 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">发票详情</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <FiUser className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">客户</p>
                  <p className="font-medium text-gray-900">{invoice.Client?.name}</p>
                  {invoice.Client?.company && (
                    <p className="text-sm text-gray-500">{invoice.Client.company}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">发票日期</p>
                  <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiDollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">发票编号</p>
                  <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiCalendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">到期日期</p>
                  <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* 发票项目 */}
            {invoice.InvoiceItems && invoice.InvoiceItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">发票项目</h3>
                <div className="space-y-2">
                  {invoice.InvoiceItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          数量: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 总金额 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">小计</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal || invoice.total)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">税费</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                <span>总计</span>
                <span className="text-green-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* 支付表单 */}
          <div className="p-6">
            {clientSecret ? (
              stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    invoice={invoice}
                    clientSecret={clientSecret}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <FiShield className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">支付功能暂时不可用</p>
                  <p className="text-sm text-gray-500">请联系管理员配置支付服务</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <FiLoader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">正在初始化支付...</p>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <FiShield className="mr-1" />
                您的支付信息受到 SSL 加密保护
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;