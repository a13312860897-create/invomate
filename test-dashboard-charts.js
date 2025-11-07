const axios = require('axios');

async function testDashboardCharts() {
  console.log('🔍 测试Dashboard图表API...\n');
  
  const BASE_URL = 'http://localhost:8080/api';
  const token = 'dev-mock-token'; // 使用开发模式的mock token
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. 测试统一图表数据API
    console.log('1. 测试统一图表数据API...');
    const chartResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data`, { headers });
    
    console.log('✅ API响应状态:', chartResponse.status);
    console.log('📊 响应数据结构:', JSON.stringify(chartResponse.data, null, 2));
    
    const data = chartResponse.data;
    
    if (data.success && data.data) {
      console.log('\n📈 状态分布数据:');
      if (data.data.statusDistribution) {
        console.log('- 总发票数:', data.data.statusDistribution.totalInvoices);
        console.log('- 分布数据:', data.data.statusDistribution.distribution);
      } else {
        console.log('❌ 缺少statusDistribution数据');
      }
      
      console.log('\n💰 收入趋势数据:');
      if (data.data.revenueTrend) {
        console.log('- 总收入:', data.data.revenueTrend.totalRevenue);
        console.log('- 趋势数据点数量:', data.data.revenueTrend.trendData?.length || 0);
      } else {
        console.log('❌ 缺少revenueTrend数据');
      }
    } else {
      console.log('❌ API响应格式错误');
    }
    
    // 2. 测试带月份参数的API
    console.log('\n2. 测试带月份参数的API...');
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式
    const monthlyResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data?month=${currentMonth}`, { headers });
    
    console.log('✅ 月度API响应状态:', monthlyResponse.status);
    console.log('📅 请求月份:', currentMonth);
    
    if (monthlyResponse.data.success && monthlyResponse.data.data) {
      const monthlyData = monthlyResponse.data.data;
      console.log('📊 月度状态分布:', monthlyData.statusDistribution?.totalInvoices || 0, '张发票');
      console.log('💰 月度收入:', monthlyData.revenueTrend?.totalRevenue || 0);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
  }
}

// 运行测试
testDashboardCharts().then(() => {
  console.log('\n✅ 测试完成');
}).catch(error => {
  console.error('💥 测试异常:', error);
});