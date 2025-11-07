const axios = require('axios');

// 简化测试Dashboard API连接
async function testDashboardConnection() {
  const baseURL = 'http://localhost:8080';

  try {
    console.log('=== 测试Dashboard API连接 ===\n');

    // 1. 测试服务器是否运行
    console.log('1. 测试服务器连接:');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('服务器状态:', healthResponse.data);
    console.log('');

    // 2. 测试登录获取有效token
    console.log('2. 测试登录获取token:');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('登录成功，获取到token');
      
      // 3. 使用有效token测试Dashboard API
      console.log('3. 测试Dashboard API (2025-11):');
      
      try {
        const statsResponse = await axios.get(`${baseURL}/api/dashboard/dashboard-stats`, {
          params: {
            period: 'monthly',
            month: '2025-11'
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Dashboard统计数据:', JSON.stringify(statsResponse.data, null, 2));
        
        const chartResponse = await axios.get(`${baseURL}/api/dashboard/stats`, {
          params: {
            period: 'monthly',
            month: '2025-11'
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Dashboard图表数据:', JSON.stringify(chartResponse.data, null, 2));
        
      } catch (apiError) {
        console.error('Dashboard API测试失败:', apiError.response?.data || apiError.message);
      }
      
    } else {
      console.log('登录失败:', loginResponse.data);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testDashboardConnection();