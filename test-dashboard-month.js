const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testDashboardMonth() {
  try {
    console.log('=== 测试Dashboard月份显示修复 ===\n');

    // 测试统计数据API
    console.log('1. 测试统计数据API (应该显示2025-10月份)');
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats?month=2025-10`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('统计数据响应:', JSON.stringify(statsResponse.data, null, 2));

    // 测试统一图表数据API
    console.log('\n2. 测试统一图表数据API (应该显示2025-10月份)');
    const chartResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data?month=2025-10`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('图表数据响应:', JSON.stringify(chartResponse.data, null, 2));

    // 验证数据是否包含10月份的发票
    if (chartResponse.data.success) {
      const { revenueTrend, statusDistribution } = chartResponse.data.data;
      
      console.log('\n3. 验证收入趋势数据:');
      console.log('- 总收入:', revenueTrend.totalRevenue);
      console.log('- 总发票数:', revenueTrend.totalCount);
      console.log('- 趋势数据点数:', revenueTrend.trendData?.length || 0);
      
      if (revenueTrend.trendData && revenueTrend.trendData.length > 0) {
        console.log('- 前几个数据点:');
        revenueTrend.trendData.slice(0, 5).forEach((point, index) => {
          console.log(`  ${index + 1}. ${point.label || point.date}: €${point.revenue} (${point.count}张发票)`);
        });
      }

      console.log('\n4. 验证状态分布数据:');
      console.log('- 总发票数:', statusDistribution.totalInvoices);
      console.log('- 状态分布:');
      if (statusDistribution.distribution) {
        statusDistribution.distribution.forEach(item => {
          console.log(`  ${item.status}: ${item.count}张`);
        });
      }
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testDashboardMonth();