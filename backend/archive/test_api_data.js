const axios = require('axios');

async function testAPIs() {
  const baseURL = 'http://localhost:3002/api';
  
  // 先登录获取token
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('登录成功，获取到token');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 测试收入趋势图API - 2025年9月
    console.log('\n=== 测试收入趋势图API (2025年9月) ===');
    const revenueResponse = await axios.get(`${baseURL}/dashboard/monthly-revenue-trend?year=2025&month=9`, { headers });
    console.log('收入趋势图数据:', JSON.stringify(revenueResponse.data, null, 2));
    
    // 测试发票状态分布API - 2025年9月
    console.log('\n=== 测试发票状态分布API (2025年9月) ===');
    const statusResponse = await axios.get(`${baseURL}/dashboard/invoice-status-distribution?year=2025&month=9`, { headers });
    console.log('发票状态分布数据:', JSON.stringify(statusResponse.data, null, 2));
    
    // 统计已支付发票数量
    const paidInvoicesFromRevenue = revenueResponse.data.data.reduce((sum, item) => sum + item.invoiceCount, 0);
    const paidInvoicesFromStatus = statusResponse.data.data.find(item => item.status === 'paid')?.count || 0;
    
    console.log('\n=== 数据一致性检查 ===');
    console.log(`收入趋势图显示的已支付发票数量: ${paidInvoicesFromRevenue}`);
    console.log(`发票状态分布显示的已支付发票数量: ${paidInvoicesFromStatus}`);
    console.log(`数据是否一致: ${paidInvoicesFromRevenue === paidInvoicesFromStatus ? '✅ 是' : '❌ 否'}`);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testAPIs();