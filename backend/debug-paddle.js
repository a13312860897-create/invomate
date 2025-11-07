require('dotenv').config();
const axios = require('axios');

async function debugPaddleAPI() {
  const apiKey = process.env.PADDLE_API_KEY;
  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  
  const api = axios.create({
    baseURL: 'https://sandbox-api.paddle.com',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Paddle-Version': '1'
    }
  });

  // 首先测试获取产品列表
  try {
    console.log('📦 测试获取产品列表...');
    const productsResponse = await api.get('/products');
    console.log('✅ 产品列表获取成功:', productsResponse.data);
  } catch (error) {
    console.log('❌ 产品列表获取失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }

  // 测试创建交易
  try {
    console.log('\n💳 测试创建交易...');
    const transactionData = {
      items: [{
        price: {
          description: "测试发票支付",
          name: "发票 #INV-001",
          billing_cycle: null,
          unit_price: {
            amount: "10000",
            currency_code: "CNY"
          }
        },
        quantity: 1
      }],
      collection_mode: "automatic",
      currency_code: "CNY",
      custom_data: {
        invoice_id: "test-invoice-001"
      }
    };
    
    console.log('请求数据:', JSON.stringify(transactionData, null, 2));
    const response = await api.post('/transactions', transactionData);
    console.log('✅ 交易创建成功:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ 交易创建失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
}

debugPaddleAPI().catch(console.error);