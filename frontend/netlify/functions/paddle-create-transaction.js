const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const isMock = process.env.PADDLE_MOCK === 'true';
  if (isMock) {
    try {
      const { plan, billingCycle = 'monthly', successUrl } = JSON.parse(event.body || '{}');
      const txId = `mock_${Date.now()}`;
      const success = successUrl || 'http://localhost:8888/payment-success';
      const checkoutUrl = `${success.replace(/\/$/, '')}/../mock-checkout.html?plan=${encodeURIComponent(plan || 'basic')}&billing=${encodeURIComponent(billingCycle)}&success=${encodeURIComponent(success)}&transaction_id=${encodeURIComponent(txId)}`;
      return {
        statusCode: 200,
        body: JSON.stringify({ checkoutUrl, transactionId: txId })
      };
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body for mock mode' })
      };
    }
  }

  try {
    const { plan, billingCycle = 'monthly', successUrl, cancelUrl } = JSON.parse(event.body || '{}');

    const environment = process.env.PADDLE_ENVIRONMENT || 'production';
    const apiBase = environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
    const apiKey = process.env.PADDLE_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'PADDLE_API_KEY not configured' })
      };
    }

    // Map plan/billing to price_id via environment variables
    const priceMap = {
      basic: {
        monthly: process.env.PADDLE_BASIC_MONTHLY_PRICE_ID,
        yearly: process.env.PADDLE_BASIC_YEARLY_PRICE_ID
      },
      professional: {
        monthly: process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
        yearly: process.env.PADDLE_PRO_YEARLY_PRICE_ID
      }
    };

    const priceId = (priceMap[plan] && priceMap[plan][billingCycle]) || process.env.PADDLE_PRICE_ID || null;
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing price_id for requested plan/cycle' })
      };
    }

    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: 'automatic',
      custom_data: { plan, billing_cycle: billingCycle },
      checkout: {
        success_url: successUrl,
        cancel_url: cancelUrl
      }
    };

    const resp = await axios.post(`${apiBase}/transactions`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Paddle-Version': '1'
      },
      timeout: 30000
    });

    const tx = resp.data?.data || resp.data;
    const checkoutUrl = tx?.checkout?.url || tx?.checkout_url;

    if (!checkoutUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No checkout URL returned from Paddle' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ checkoutUrl, transactionId: tx?.id })
    };
  } catch (error) {
    const errData = error.response?.data;
    const code = errData?.error?.code;
    const detail = errData?.error?.detail || error.message;
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create transaction', code, details: detail })
    };
  }
};