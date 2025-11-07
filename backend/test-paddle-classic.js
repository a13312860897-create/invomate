require('dotenv').config();
const axios = require('axios');

async function testPaddleClassicAPI() {
  const apiKey = process.env.PADDLE_API_KEY;
  const vendorId = process.env.PADDLE_VENDOR_ID;
  
  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  console.log('🏢 Vendor ID:', vendorId);
  
  // Paddle Classic API使用不同的认证方式
  const classicAPI = axios.create({
    baseURL: 'https://sandbox-vendors.paddle.com/api/2.0',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 测试获取产品列表 (Paddle Classic)
  try {
    console.log('📦 测试Paddle Classic - 获取产品列表...');
    const response = await classicAPI.post('/product/get_products', {
      vendor_id: vendorId,
      vendor_auth_code: apiKey
    });
    console.log('✅ Paddle Classic 产品列表获取成功:', response.data);
  } catch (error) {
    console.log('❌ Paddle Classic 产品列表获取失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }

  // 测试创建支付链接 (Paddle Classic)
  try {
    console.log('\n💳 测试Paddle Classic - 创建支付链接...');
    const response = await classicAPI.post('/product/generate_pay_link', {
      vendor_id: vendorId,
      vendor_auth_code: apiKey,
      title: '测试发票支付',
      webhook_url: 'https://your-domain.com/webhook',
      prices: ['CNY:100.00'],
      custom_message: 'invoice_id:test-invoice-001'
    });
    console.log('✅ Paddle Classic 支付链接创建成功:', response.data);
  } catch (error) {
    console.log('❌ Paddle Classic 支付链接创建失败:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
}

testPaddleClassicAPI().catch(console.error);