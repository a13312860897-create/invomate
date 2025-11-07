const axios = require('axios');

// 专门调试本月收入趋势API
async function debugMonthlyAPI() {
  try {
    const BASE_URL = 'http://localhost:3002/api';
    
    console.log('=== 调试本月收入趋势API ===');
    
    // 1. 登录获取token
    console.log('\n1. 登录中...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: 'Ddtb959322'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('登录成功');
    
    // 2. 调用本月收入趋势API
    console.log('\n2. 调用本月收入趋势API...');
    const monthlyResponse = await axios.get(`${BASE_URL}/dashboard/monthly-revenue-trend`, { headers });
    
    console.log('API响应:', JSON.stringify(monthlyResponse.data, null, 2));
    
    // 3. 分析chartData
    if (monthlyResponse.data.chartData) {
      console.log('\n3. 分析chartData:');
      monthlyResponse.data.chartData.forEach((item, index) => {
        console.log(`节点${index + 1}: ${item.period}, 收入: ${item.revenue}€, 数量: ${item.count}`);
      });
      
      const totalFromChart = monthlyResponse.data.chartData.reduce((sum, item) => sum + item.revenue, 0);
      const countFromChart = monthlyResponse.data.chartData.reduce((sum, item) => sum + item.count, 0);
      
      console.log(`\n图表数据汇总: 总收入 ${totalFromChart}€, 总数量 ${countFromChart}`);
      console.log(`API返回汇总: 总收入 ${monthlyResponse.data.totalRevenue}€, 总数量 ${monthlyResponse.data.totalCount}`);
    }
    
  } catch (error) {
    console.error('调试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

debugMonthlyAPI();