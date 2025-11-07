const crypto = require('crypto');

// Paddle Webhook处理函数
exports.handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const signature = event.headers['paddle-signature'];
    const body = event.body;
    
    // Webhook密钥（从环境变量获取）
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET || 'ntfset_01k8fvwxgq48qv7smd2e5k3rhz';
    
    // 验证Webhook签名
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid Paddle webhook signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const webhookData = JSON.parse(body);
    console.log('Paddle webhook received:', webhookData.event_type);

    // 处理不同的Webhook事件
    switch (webhookData.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(webhookData);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(webhookData);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(webhookData);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(webhookData);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event_type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// 验证Webhook签名
function verifyWebhookSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Paddle使用HMAC-SHA256签名
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// 处理交易完成事件
async function handleTransactionCompleted(data) {
  console.log('Transaction completed:', data.data.id);
  
  // 获取自定义数据
  const customData = data.data.custom_data;
  if (customData && customData.userId) {
    // 这里你需要调用你的后端API来更新用户订阅状态
    // 或者直接操作数据库（如果使用无服务器数据库）
    
    const updateData = {
      userId: customData.userId,
      plan: customData.plan,
      billingType: customData.billingType,
      transactionId: data.data.id,
      status: 'active'
    };
    
    // 调用后端API更新用户订阅
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/api/paddle/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
      
      console.log('Subscription updated successfully');
    } catch (error) {
      console.error('Failed to update subscription:', error);
      // 这里可以实现重试逻辑或错误通知
    }
  }
}

// 处理订阅创建事件
async function handleSubscriptionCreated(data) {
  console.log('Subscription created:', data.data.id);
  // 实现订阅创建逻辑
}

// 处理订阅更新事件
async function handleSubscriptionUpdated(data) {
  console.log('Subscription updated:', data.data.id);
  // 实现订阅更新逻辑
}

// 处理订阅取消事件
async function handleSubscriptionCanceled(data) {
  console.log('Subscription canceled:', data.data.id);
  // 实现订阅取消逻辑
}