const axios = require('axios');

// 测试统一图表数据API的数据一致性
async function testUnifiedAPI() {
  try {
    const testMonth = '2025-09';
    
    // 使用开发模式的模拟token
    const token = 'dev-mock-token';
    console.log('使用开发模式模拟token');
    console.log('测试月份:', testMonth);
    
    // 调用统一图表数据API
    console.log('调用统一图表数据API...');
    const response = await axios.get(`http://localhost:3002/api/dashboard/unified-chart-data?month=${testMonth}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const { revenueTrend, statusDistribution, monthInfo } = response.data.data;
      
      console.log('\n=== 月份信息 ===');
      console.log('月份:', monthInfo.month);
      console.log('年份:', monthInfo.year);
      console.log('月数:', monthInfo.monthNumber);
      
      console.log('\n=== 收入趋势数据 ===');
      console.log('总收入:', revenueTrend.totalRevenue);
      console.log('总数量:', revenueTrend.totalCount);
      console.log('时间点数量:', revenueTrend.timePoints.length);
      console.log('时间点示例:', revenueTrend.timePoints.slice(0, 3));
      
      console.log('\n=== 发票状态分布数据 ===');
      console.log('总发票数:', statusDistribution.totalInvoices);
      console.log('状态分布:');
      statusDistribution.distribution.forEach(item => {
        console.log(`  ${item.status}: ${item.count} 张, ${item.amount} 元`);
      });
      
      console.log('\n=== 数据一致性检查 ===');
      
      // 检查已支付发票数量是否一致
      const paidFromRevenue = revenueTrend.totalCount;
      const paidFromStatus = statusDistribution.distribution.find(item => item.status === 'paid')?.count || 0;
      
      console.log('收入趋势中的已支付发票数:', paidFromRevenue);
      console.log('状态分布中的已支付发票数:', paidFromStatus);
      
      if (paidFromRevenue === paidFromStatus) {
        console.log('✅ 已支付发票数量一致');
      } else {
        console.log('❌ 已支付发票数量不一致');
      }
      
      // 检查已支付发票金额是否一致
      const revenueFromTrend = revenueTrend.totalRevenue;
      const revenueFromStatus = statusDistribution.distribution.find(item => item.status === 'paid')?.amount || 0;
      
      console.log('收入趋势中的总收入:', revenueFromTrend);
      console.log('状态分布中的已支付金额:', revenueFromStatus);
      
      if (revenueFromTrend === revenueFromStatus) {
        console.log('✅ 已支付金额一致');
      } else {
        console.log('❌ 已支付金额不一致');
      }
      
      // 检查总发票数
      const totalFromStatus = statusDistribution.totalInvoices;
      const sumFromDistribution = statusDistribution.distribution.reduce((sum, item) => sum + item.count, 0);
      
      console.log('状态分布总数:', totalFromStatus);
      console.log('分布项目总和:', sumFromDistribution);
      
      if (totalFromStatus === sumFromDistribution) {
        console.log('✅ 发票总数计算一致');
      } else {
        console.log('❌ 发票总数计算不一致');
      }
      
      console.log('\n=== 测试完成 ===');
      
    } else {
      console.error('API调用失败:', response.data.message);
    }
    
  } catch (error) {
    console.error('测试失败详情:');
    console.error('错误消息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求失败，无响应');
    } else {
      console.error('请求配置错误');
    }
  }
}

// 运行测试
testUnifiedAPI();