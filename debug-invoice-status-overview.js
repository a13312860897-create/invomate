const axios = require('axios');

async function testInvoiceStatusOverviewAPI() {
  try {
    console.log('=== 测试 Invoice Status Overview API ===');
    
    // 1. 登录获取token
    console.log('\n1. 登录...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✓ 登录成功');
      const token = loginResponse.data.data.token;
      console.log('Token获取成功:', token ? '有效' : '无效');
      
      // 2. 调用 Invoice Status Overview API
      console.log('\n2. 调用 Invoice Status Overview API...');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const apiResponse = await axios.get('http://localhost:8080/api/reports/invoice-status-overview', {
        headers
      });
      
      console.log('✓ API调用成功');
      console.log('状态码:', apiResponse.status);
      
      const data = apiResponse.data;
      console.log('\n=== API响应数据结构 ===');
      console.log('完整响应:', JSON.stringify(data, null, 2));
      
      // 检查关键数据字段
      console.log('\n=== 关键数据字段检查 ===');
      console.log('summary:', data.summary ? '存在' : '不存在');
      if (data.summary) {
        console.log('  - totalInvoices:', data.summary.totalInvoices);
        console.log('  - totalAmount:', data.summary.totalAmount);
        console.log('  - avgProcessingTime:', data.summary.avgProcessingTime);
        console.log('  - collectionRate:', data.summary.collectionRate);
      }
      
      console.log('statusBreakdown:', data.statusBreakdown ? '存在' : '不存在');
      if (data.statusBreakdown) {
        console.log('  - 长度:', data.statusBreakdown.length);
        console.log('  - 内容:', data.statusBreakdown);
      }
      
      console.log('monthlyTrends:', data.monthlyTrends ? '存在' : '不存在');
      if (data.monthlyTrends) {
        console.log('  - 长度:', data.monthlyTrends.length);
        console.log('  - 内容:', data.monthlyTrends);
      }
      
      console.log('period:', data.period);
      
    } else {
      console.log('✗ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testInvoiceStatusOverviewAPI();