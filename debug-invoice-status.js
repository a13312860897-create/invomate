const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function testInvoiceStatusAPI() {
  try {
    console.log('🔍 测试Invoice Status Overview API...');
    
    // 1. 登录获取token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('登录响应:', loginResponse.data);
    console.log('✅ 登录成功，获取到token:', token ? 'Yes' : 'No');
    
    // 2. 调用Invoice Status Overview API
    const statusResponse = await axios.get(`${API_BASE_URL}/reports/invoice-status-overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Invoice Status Overview API调用成功');
    console.log('📊 响应状态:', statusResponse.status);
    console.log('📊 响应数据结构:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // 3. 检查数据结构
    const data = statusResponse.data;
    
    console.log('\n🔍 数据结构分析:');
    console.log('- summary:', data.summary ? '✅ 存在' : '❌ 缺失');
    console.log('- statusBreakdown:', data.statusBreakdown ? `✅ 存在 (${data.statusBreakdown.length}项)` : '❌ 缺失');
    console.log('- monthlyTrends:', data.monthlyTrends ? `✅ 存在 (${data.monthlyTrends.length}项)` : '❌ 缺失');
    
    if (data.summary) {
      console.log('\n📈 Summary数据:');
      console.log('- totalInvoices:', data.summary.totalInvoices);
      console.log('- totalAmount:', data.summary.totalAmount);
      console.log('- avgProcessingTime:', data.summary.avgProcessingTime);
      console.log('- collectionRate:', data.summary.collectionRate);
    }
    
    if (data.statusBreakdown && data.statusBreakdown.length > 0) {
      console.log('\n📊 Status Breakdown:');
      data.statusBreakdown.forEach(status => {
        console.log(`- ${status.status}: ${status.count}个, ${status.amount}€, ${status.percentage.toFixed(1)}%`);
      });
    }
    
    if (data.monthlyTrends && data.monthlyTrends.length > 0) {
      console.log('\n📈 Monthly Trends:');
      data.monthlyTrends.forEach(trend => {
        console.log(`- ${trend.month}: 总计${trend.paid?.count || 0}个已支付发票`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    console.error('完整错误:', error);
  }
}

testInvoiceStatusAPI();