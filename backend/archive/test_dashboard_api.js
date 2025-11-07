const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🔍 测试Dashboard API端点...');
    
    // 设置认证头
    const authHeaders = {
      'Authorization': 'Bearer dev-mock-token',
      'Content-Type': 'application/json'
    };
    
    // 测试Dashboard统计数据
    console.log('\n1. 测试Dashboard统计数据 (GET /api/dashboard/stats)');
    const statsResponse = await axios.get('http://localhost:3002/api/dashboard/stats', {
      headers: authHeaders
    });
    
    console.log('✅ 统计API响应状态:', statsResponse.status);
    console.log('📊 统计数据:', JSON.stringify(statsResponse.data, null, 2));
    
    // 测试统一图表数据
    console.log('\n2. 测试统一图表数据 (GET /api/dashboard/unified-chart-data)');
    const chartResponse = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data', {
      headers: authHeaders
    });
    
    console.log('✅ 图表API响应状态:', chartResponse.status);
    console.log('📈 图表数据:', JSON.stringify(chartResponse.data, null, 2));
    
    // 测试今日统计
    console.log('\n3. 测试今日统计 (GET /api/dashboard/today-stats)');
    const todayResponse = await axios.get('http://localhost:3002/api/dashboard/today-stats', {
      headers: authHeaders
    });
    
    console.log('✅ 今日统计API响应状态:', todayResponse.status);
    console.log('📋 今日统计数据:', JSON.stringify(todayResponse.data, null, 2));
    
    // 测试Dashboard主页数据
    console.log('\n4. 测试Dashboard主页数据 (GET /api/dashboard/)');
    const dashboardResponse = await axios.get('http://localhost:3002/api/dashboard/', {
      headers: authHeaders
    });
    
    console.log('✅ Dashboard主页API响应状态:', dashboardResponse.status);
    console.log('🏠 Dashboard主页数据:', JSON.stringify(dashboardResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Dashboard API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDashboardAPI();