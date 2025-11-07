const axios = require('axios');
require('dotenv').config();

// 配置
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8080/api/paddle/webhook/test';
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || 'test_secret';

/**
 * 生成Paddle webhook签名
 */
function generatePaddleSignature(payload, timestamp) {
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp};v1=${signature}`;
}

/**
 * 发送测试webhook
 */
async function sendTestWebhook(eventType, eventData) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      event_type: eventType,
      data: eventData
    });
    
    const signature = generatePaddleSignature(payload, timestamp);
    
    const response = await axios.post(WEBHOOK_URL, {
      event_type: eventType,
      data: eventData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Paddle-Signature': signature
      }
    });
    
    console.log(`Webhook sent successfully for event: ${eventType}`);
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending webhook for event ${eventType}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 测试订阅创建事件
 */
async function testSubscriptionCreated() {
  const eventData = {
    id: 'sub_123456789',
    status: 'active',
    customer_id: 'cus_123456789',
    items: [
      {
        price: {
          id: 'pri_123456789',
          product_id: 'pro_123456789',
          description: '专业版 - 月付',
          amount: 3000,
          currency: 'EUR'
        },
        quantity: 1
      }
    ],
    current_period: {
      start: '2023-01-01T00:00:00Z',
      end: '2023-02-01T00:00:00Z'
    },
    custom_data: {
      userId: 1
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };
  
  return sendTestWebhook('subscription.created', eventData);
}

/**
 * 测试订阅激活事件
 */
async function testSubscriptionActivated() {
  const eventData = {
    id: 'sub_123456789',
    status: 'active',
    customer_id: 'cus_123456789',
    items: [
      {
        price: {
          id: 'pri_123456789',
          product_id: 'pro_123456789',
          description: '专业版 - 月付',
          amount: 3000,
          currency: 'EUR'
        },
        quantity: 1
      }
    ],
    current_period: {
      start: '2023-01-01T00:00:00Z',
      end: '2023-02-01T00:00:00Z'
    },
    custom_data: {
      userId: 1
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };
  
  return sendTestWebhook('subscription.activated', eventData);
}

/**
 * 测试订阅更新事件
 */
async function testSubscriptionUpdated() {
  const eventData = {
    id: 'sub_123456789',
    status: 'active',
    customer_id: 'cus_123456789',
    items: [
      {
        price: {
          id: 'pri_987654321',
          product_id: 'pro_123456789',
          description: '专业版 - 年付',
          amount: 30000,
          currency: 'EUR'
        },
        quantity: 1
      }
    ],
    current_period: {
      start: '2023-01-01T00:00:00Z',
      end: '2024-01-01T00:00:00Z'
    },
    custom_data: {
      userId: 1
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };
  
  return sendTestWebhook('subscription.updated', eventData);
}

/**
 * 测试订阅取消事件
 */
async function testSubscriptionCancelled() {
  const eventData = {
    id: 'sub_123456789',
    status: 'cancelled',
    customer_id: 'cus_123456789',
    items: [
      {
        price: {
          id: 'pri_987654321',
          product_id: 'pro_123456789',
          description: '专业版 - 年付',
          amount: 30000,
          currency: 'EUR'
        },
        quantity: 1
      }
    ],
    current_period: {
      start: '2023-01-01T00:00:00Z',
      end: '2024-01-01T00:00:00Z'
    },
    custom_data: {
      userId: 1
    },
    cancellation_effective_date: '2023-01-15T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-10T00:00:00Z'
  };
  
  return sendTestWebhook('subscription.cancelled', eventData);
}

/**
 * 测试订阅逾期事件
 */
async function testSubscriptionPastDue() {
  const eventData = {
    id: 'sub_123456789',
    status: 'past_due',
    customer_id: 'cus_123456789',
    items: [
      {
        price: {
          id: 'pri_987654321',
          product_id: 'pro_123456789',
          description: '专业版 - 年付',
          amount: 30000,
          currency: 'EUR'
        },
        quantity: 1
      }
    ],
    current_period: {
      start: '2023-01-01T00:00:00Z',
      end: '2024-01-01T00:00:00Z'
    },
    custom_data: {
      userId: 1
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-10T00:00:00Z'
  };
  
  return sendTestWebhook('subscription.past_due', eventData);
}

/**
 * 测试支付成功事件
 */
async function testPaymentSucceeded() {
  const eventData = {
    id: 'pay_123456789',
    amount: 3000,
    currency: 'EUR',
    status: 'completed',
    customer_id: 'cus_123456789',
    subscription_id: 'sub_123456789',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };
  
  return sendTestWebhook('payment.succeeded', eventData);
}

/**
 * 测试支付失败事件
 */
async function testPaymentFailed() {
  const eventData = {
    id: 'pay_123456789',
    amount: 3000,
    currency: 'EUR',
    status: 'failed',
    customer_id: 'cus_123456789',
    subscription_id: 'sub_123456789',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    error: {
      code: 'card_declined',
      message: 'The card was declined'
    }
  };
  
  return sendTestWebhook('payment.failed', eventData);
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('Running all Paddle webhook tests...\n');
  
  try {
    await testSubscriptionCreated();
    console.log('✅ Subscription created test passed\n');
    
    await testSubscriptionActivated();
    console.log('✅ Subscription activated test passed\n');
    
    await testSubscriptionUpdated();
    console.log('✅ Subscription updated test passed\n');
    
    await testSubscriptionCancelled();
    console.log('✅ Subscription cancelled test passed\n');
    
    await testSubscriptionPastDue();
    console.log('✅ Subscription past due test passed\n');
    
    await testPaymentSucceeded();
    console.log('✅ Payment succeeded test passed\n');
    
    await testPaymentFailed();
    console.log('✅ Payment failed test passed\n');
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  }
}

// 如果直接运行此脚本，则运行所有测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  sendTestWebhook,
  testSubscriptionCreated,
  testSubscriptionActivated,
  testSubscriptionUpdated,
  testSubscriptionCancelled,
  testSubscriptionPastDue,
  testPaymentSucceeded,
  testPaymentFailed,
  runAllTests
};