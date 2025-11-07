const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function testAccountsReceivableAPI() {
  try {
    console.log('🚀 开始测试 Accounts Receivable API...');
    
    // 1. 登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 2. 调用 Accounts Receivable API
    console.log('📊 正在获取 Accounts Receivable 数据...');
    const response = await axios.get(`${API_BASE_URL}/reports/accounts-receivable`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API调用成功');
    console.log('📊 响应状态:', response.status);
    
    const data = response.data;
    console.log('\n📈 Accounts Receivable 数据结构:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🔍 数据结构分析:');
    console.log('- summary:', data.summary ? '✅ 存在' : '❌ 不存在');
    console.log('- clientReceivables:', data.clientReceivables ? `✅ 存在 (${data.clientReceivables.length}项)` : '❌ 不存在');
    console.log('- monthlyTrend:', data.monthlyTrend ? `✅ 存在 (${data.monthlyTrend.length}项)` : '❌ 不存在');
    
    if (data.summary) {
      console.log('\n📈 Summary数据:');
      console.log('- totalReceivables:', data.summary.totalReceivables);
      console.log('- currentReceivables:', data.summary.currentReceivables);
      console.log('- overdueReceivables:', data.summary.overdueReceivables);
      console.log('- paidAmount:', data.summary.paidAmount);
      console.log('- collectionRate:', data.summary.collectionRate);
    }
    
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      console.log('\n📊 Monthly Trend数据:');
      data.monthlyTrend.forEach((trend, index) => {
        console.log(`- ${trend.month}: 总计${trend.totalAmount}€, 已支付${trend.paidAmount}€, 待收${trend.pendingAmount}€, 逾期${trend.overdueAmount}€`);
      });
      
      console.log(`\n📅 月度趋势数据覆盖范围: ${data.monthlyTrend.length}个月`);
      console.log(`📅 最早月份: ${data.monthlyTrend[0]?.month}`);
      console.log(`📅 最新月份: ${data.monthlyTrend[data.monthlyTrend.length - 1]?.month}`);
    }
    
    console.log('\n✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAccountsReceivableAPI();