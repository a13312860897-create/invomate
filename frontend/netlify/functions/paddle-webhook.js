const crypto = require('crypto');

// 解析 paddle-signature 头部，格式类似："t=timestamp; h1=signature"
function parsePaddleSignatureHeader(signatureHeader) {
  if (!signatureHeader || typeof signatureHeader !== 'string') return null;
  const parts = signatureHeader.split(';').map(s => s.trim());
  const map = {};
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k && v) map[k] = v;
  }
  return { t: map.t, h1: map.h1 };
}

// 验证Webhook签名（HMAC-SHA256 原始请求体）
function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;
  const parsed = parsePaddleSignatureHeader(signatureHeader);
  if (!parsed || !parsed.h1) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(parsed.h1, 'hex'), Buffer.from(expected, 'hex'));
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// Paddle Webhook处理函数
exports.handler = async (event) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const signatureHeader = event.headers['paddle-signature'] || event.headers['Paddle-Signature'];
    const rawBody = event.body || '';

    // Webhook密钥（从环境变量获取）
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    // 验证Webhook签名
    if (!verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      console.error('Invalid Paddle webhook signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const payload = JSON.parse(rawBody);
    console.log('Paddle webhook received:', payload.event_type);

    // 将已校验的事件安全转发到后端进行统一处理
    const backendBase = process.env.BACKEND_URL || process.env.RENDER_BACKEND_URL;
    if (!backendBase) {
      console.warn('BACKEND_URL not configured; acknowledging webhook without forwarding');
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, forwarded: false })
      };
    }

    const forwardResp = await fetch(`${backendBase}/api/paddle/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 告知后端此请求已在边缘完成签名验证
        'X-Paddle-Verified': 'true'
      },
      body: rawBody
    });

    if (!forwardResp.ok) {
      const text = await forwardResp.text().catch(() => '');
      console.error('Forwarding webhook failed:', forwardResp.status, text);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Upstream webhook handler failed' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, forwarded: true })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};