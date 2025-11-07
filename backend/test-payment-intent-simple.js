const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const token = '4a569d72b6f8564da4561b9344e79329d9ee8ef8e52e9f0d426e03d28410d4d1';

async function testPaymentIntent() {
  console.log('=== 测试支付意图创建 ===\n');

  try {
    console.log(`使用令牌: ${token}`);
    
    const response = await axios.post(
      `${BASE_URL}/invoices/payment/${token}/payment-intent`
    );

    console.log('✅ 支付意图创建成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ 支付意图创建失败:');
    console.log(`   状态码: ${error.response?.status}`);
    console.log(`   错误信息: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('   完整响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPaymentIntent();