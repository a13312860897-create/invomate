const axios = require('axios');

async function debugMonthMismatch() {
  try {
    console.log('🔍 调试月份不匹配问题...');
    
    const authHeaders = {
      'Authorization': 'Bearer dev-mock-token',
      'Content-Type': 'application/json'
    };
    
    // 1. 检查发票数据的创建月份
    console.log('\n1. 检查发票数据的创建月份:');
    const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
      headers: authHeaders
    });
    
    if (invoicesResponse.data.success) {
      const invoices = invoicesResponse.data.data.invoices || invoicesResponse.data.data || [];
      console.log('发票总数:', invoices.length);
      
      // 按月份统计
      const monthCounts = {};
      invoices.forEach(inv => {
        const date = new Date(inv.createdAt || inv.issueDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });
      console.log('按月份统计:', monthCounts);
      
      // 按状态和月份统计
      const statusMonthCounts = {};
      invoices.forEach(inv => {
        const date = new Date(inv.createdAt || inv.issueDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const key = `${monthKey}-${inv.status}`;
        statusMonthCounts[key] = (statusMonthCounts[key] || 0) + 1;
      });
      console.log('按月份和状态统计:', statusMonthCounts);
    }
    
    // 2. 测试不同月份的图表API
    console.log('\n2. 测试不同月份的图表API:');
    
    const testMonths = ['2025-09', '2025-10'];
    
    for (const month of testMonths) {
      console.log(`\n测试月份: ${month}`);
      try {
        const chartResponse = await axios.get(`http://localhost:3002/api/dashboard/unified-chart-data?month=${month}`, {
          headers: authHeaders
        });
        
        if (chartResponse.data.success) {
          const data = chartResponse.data.data;
          console.log(`  收入趋势 - 总收入: ${data.revenueTrend.totalRevenue}, 总数量: ${data.revenueTrend.totalCount}`);
          console.log(`  状态分布 - 总发票数: ${data.statusDistribution.totalInvoices}`);
          
          // 显示已支付发票的详细信息
          const paidDistribution = data.statusDistribution.distribution.find(d => d.status === 'paid');
          if (paidDistribution) {
            console.log(`  已支付发票 - 数量: ${paidDistribution.count}, 金额: ${paidDistribution.amount}`);
          }
        }
      } catch (error) {
        console.error(`  ${month} 月份API错误:`, error.message);
      }
    }
    
    // 3. 获取当前系统时间
    console.log('\n3. 系统时间信息:');
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
    console.log('当前系统月份:', currentMonth);
    console.log('当前系统时间:', now.toISOString());
    
  } catch (error) {
    console.error('调试失败:', error.message);
  }
}

debugMonthMismatch();