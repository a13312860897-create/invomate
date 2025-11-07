import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  FiCreditCard, 
  FiDollarSign, 
  FiUser, 
  FiCheck, 
  FiLoader,
  FiAlertCircle,
  FiShield,
  FiArrowLeft,
  FiFileText
} from 'react-icons/fi';

// Initialize Stripe only if we have a valid key
const isValidStripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY && 
  !process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY.includes('YourTestKeyHere');
const stripePromise = isValidStripeKey ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) : null;

const TestPaymentForm = ({ onPaymentSuccess, onPaymentError }) => {
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
        
        // 创建模拟的成功支付意图
        const mockPaymentIntent = {
          id: 'pi_mock_' + Date.now(),
          status: 'succeeded',
          amount: 10000, // $100.00
          currency: 'usd'
        };
        
        onPaymentSuccess(mockPaymentIntent);
      } else {
        // 真实的 Stripe 支付流程
        if (!stripe || !elements) {
          throw new Error('Stripe 未正确加载');
        }

        const cardElement = elements.getElement(CardElement);
        
        // 这里应该从后端获取 clientSecret
        // 为了测试，我们模拟一个错误或成功
        throw new Error('需要配置真实的 Stripe 密钥才能进行真实支付');
      }
    } catch (error) {
      console.error('支付错误:', error);
      onPaymentError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 检查是否为开发模式
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isPlaceholderKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.includes('YourTestKeyHere');
  const isDevMode = isDevelopment && isPlaceholderKey;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 支付方式选择 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiCreditCard className="mr-2" />
          选择支付方式
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={paymentMethod === 'stripe'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <FiCreditCard className="mr-2 text-blue-600" />
            <span className="font-medium">信用卡/借记卡</span>
            {isDevMode && (
              <span className="ml-auto text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                模拟模式
              </span>
            )}
          </label>
        </div>
      </div>

      {/* 卡片信息输入 */}
      {paymentMethod === 'stripe' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            卡片信息
          </h3>
          
          {isDevMode ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <FiShield className="text-green-600 mr-2" />
                <span className="font-medium text-green-800">模拟支付模式</span>
              </div>
              <p className="text-sm text-green-700">
                当前处于开发模式，无需输入真实银行卡信息。
                点击"立即支付"按钮后，支付将在2秒后自动成功。
              </p>
            </div>
          ) : (
            <div className="p-4 border border-gray-300 rounded-lg">
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
          )}
        </div>
      )}

      {/* 支付按钮 */}
      <button
        type="submit"
        disabled={processing || (!isDevMode && (!stripe || paymentMethod === 'stripe'))}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center ${
          processing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {processing ? (
          <>
            <FiLoader className="animate-spin mr-2" />
            处理中...
          </>
        ) : (
          <>
            <FiDollarSign className="mr-2" />
            立即支付 $100.00
          </>
        )}
      </button>

      {isDevMode && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            💡 开发模式提示：这是一个模拟支付，不会产生真实费用
          </p>
        </div>
      )}
    </form>
  );
};

const TestPaymentPage = () => {
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, error
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 模拟发票数据
  const mockInvoice = {
    id: 'TEST-001',
    amount: 100.00,
    currency: 'USD',
    description: '测试发票支付',
    clientName: '测试客户',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
  };

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('✅ 支付成功:', paymentIntent);
    setPaymentResult(paymentIntent);
    setPaymentStatus('success');
  };

  const handlePaymentError = (error) => {
    console.error('❌ 支付失败:', error);
    setErrorMessage(error);
    setPaymentStatus('error');
  };

  const resetPayment = () => {
    setPaymentStatus('pending');
    setPaymentResult(null);
    setErrorMessage('');
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FiCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h2>
            <p className="text-gray-600 mb-6">
              您的支付已成功处理
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">支付详情</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">支付ID:</span>
                  <span className="font-mono">{paymentResult?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">金额:</span>
                  <span>${(paymentResult?.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">状态:</span>
                  <span className="text-green-600 font-semibold">{paymentResult?.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={resetPayment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                再次测试支付
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FiAlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">支付失败</h2>
            <p className="text-gray-600 mb-4">
              支付过程中出现了问题
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={resetPayment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                重试支付
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiFileText className="mr-3 text-blue-600" />
                测试支付页面
              </h1>
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="mr-1" />
                返回
              </button>
            </div>
          </div>

          {/* 发票信息 */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">发票信息</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">发票号:</span>
                <span className="ml-2 font-semibold">{mockInvoice.id}</span>
              </div>
              <div>
                <span className="text-gray-600">客户:</span>
                <span className="ml-2 font-semibold">{mockInvoice.clientName}</span>
              </div>
              <div>
                <span className="text-gray-600">金额:</span>
                <span className="ml-2 font-semibold text-green-600">
                  ${mockInvoice.amount.toFixed(2)} {mockInvoice.currency}
                </span>
              </div>
              <div>
                <span className="text-gray-600">到期日:</span>
                <span className="ml-2 font-semibold">{mockInvoice.dueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 支付表单 */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FiShield className="mr-2 text-green-600" />
              安全支付
            </h2>
          </div>
          
          <div className="px-6 py-6">
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <TestPaymentForm
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
            )}
          </div>
        </div>

        {/* 安全提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiShield className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">安全保障</p>
              <p>
                您的支付信息通过SSL加密传输，我们不会存储您的银行卡信息。
                {process.env.NODE_ENV === 'development' && ' 当前为开发模式，支付为模拟操作。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentPage;