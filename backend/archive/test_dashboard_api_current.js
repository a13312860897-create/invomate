const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('=== 测试仪表板API ===');
    
    // 测试仪表板数据API
    const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard/data', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('仪表板API响应状态:', dashboardResponse.status);
    console.log('仪表板API数据:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // 测试收入趋势API
    console.log('\n=== 测试收入趋势API ===');
    const revenueResponse = await axios.get('http://localhost:3001/api/dashboard/revenue-trends', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('收入趋势API响应状态:', revenueResponse.status);
    console.log('收入趋势API数据:', JSON.stringify(revenueResponse.data, null, 2));
    
    // 测试发票状态分布API
    console.log('\n=== 测试发票状态分布API ===');
    const statusResponse = await axios.get('http://localhost:3001/api/dashboard/invoice-status-distribution', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('发票状态分布API响应状态:', statusResponse.status);
    console.log('发票状态分布API数据:', JSON.stringify(statusResponse.data, null, 2));
    
    // 分析数据一致性
    console.log('\n=== 数据一致性分析 ===');
    
    if (dashboardResponse.data && dashboardResponse.data.invoiceStatusDistribution) {
      const statusDist = dashboardResponse.data.invoiceStatusDistribution;
      console.log('仪表板中的发票状态分布:');
      Object.keys(statusDist).forEach(status => {
        console.log(`  ${status}: ${statusDist[status].count}张, ${statusDist[status].amount}€`);
      });
    }
    
    if (dashboardResponse.data && dashboardResponse.data.revenueTrends) {
      const revenueTrends = dashboardResponse.data.revenueTrends;
      console.log('\n仪表板中的收入趋势:');
      revenueTrends.forEach(trend => {
        console.log(`  ${trend.month}: ${trend.revenue}€`);
      });
    }
    
  } catch (error) {
    console.error('测试仪表板API时出错:', error.message);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testDashboardAPI();