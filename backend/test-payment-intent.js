const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testPaymentIntentCreation() {
  console.log('=== 测试支付意图创建 ===\n');

  try {
    // 1. 登录获取token
    console.log('1. 登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 获取发票列表
    console.log('\n2. 获取发票列表...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const invoices = invoicesResponse.data.data.invoices;
    console.log(`✅ 找到 ${invoices.length} 个发票`);

    // 3. 找到未支付发票
    const unpaidInvoice = invoices.find(inv => inv.status !== 'paid');
    if (!unpaidInvoice) {
      throw new Error('没有找到未支付发票');
    }

    console.log(`✅ 找到未支付发票: ${unpaidInvoice.invoiceNumber}`);

    // 4. 生成支付链接
    console.log('\n3. 生成支付链接...');
    const paymentLinkResponse = await axios.post(
      `${BASE_URL}/invoices/${unpaidInvoice.id}/generate-payment-link`,
      { paymentMethod: 'stripe' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const paymentData = paymentLinkResponse.data.data;
    console.log('✅ 支付链接生成成功!');
    console.log(`   令牌: ${paymentData.token}`);

    // 5. 测试支付意图创建API
    console.log('\n4. 测试支付意图创建...');
    try {
      const paymentIntentResponse = await axios.post(
        `${BASE_URL}/invoices/payment/${paymentData.token}/payment-intent`
      );

      if (paymentIntentResponse.data.success) {
        console.log('✅ 支付意图创建成功!');
        console.log(`   Client Secret: ${paymentIntentResponse.data.data.clientSecret ? '已生成' : '未生成'}`);
        console.log(`   Payment Intent ID: ${paymentIntentResponse.data.data.paymentIntentId || '未生成'}`);
      } else {
        console.log('❌ 支付意图创建失败:', paymentIntentResponse.data.message);
      }
    } catch (paymentIntentError) {
      console.log('❌ 支付意图创建API调用失败:');
      console.log(`   状态码: ${paymentIntentError.response?.status}`);
      console.log(`   错误信息: ${paymentIntentError.response?.data?.message || paymentIntentError.message}`);
      
      if (paymentIntentError.response?.data) {
        console.log('   完整响应:', JSON.stringify(paymentIntentError.response.data, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response?.data) {
      console.error('   错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPaymentIntentCreation();