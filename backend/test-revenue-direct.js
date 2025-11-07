const memoryDb = require('./src/config/memoryDatabase');

async function testRevenueLogic() {
  try {
    console.log('🔍 直接测试Revenue逻辑...');
    
    const userId = 1;
    const startDate = '2025-10-01';
    const endDate = '2025-11-30';
    const groupBy = 'month';
    const nodeCount = 6;
    
    console.log('参数:', { userId, startDate, endDate, groupBy, nodeCount });
    
    // 获取所有已支付发票
    const allInvoices = memoryDb.findAllInvoices().filter(inv => 
      inv.userId === userId && inv.status === 'paid'
    );
    
    console.log('找到已支付发票:', allInvoices.length);
    console.log('已支付发票详情:', allInvoices.map(inv => ({
      id: inv.id,
      status: inv.status,
      paidDate: inv.paidDate,
      totalAmount: inv.totalAmount || inv.total,
      amount: inv.amount
    })));
    
    // 过滤日期范围
    let filteredInvoices = allInvoices;
    if (startDate || endDate) {
      filteredInvoices = allInvoices.filter(inv => {
        if (!inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        console.log('检查发票:', inv.id, 'paidDate:', paidDate, 'startDate:', new Date(startDate), 'endDate:', new Date(endDate));
        if (startDate && paidDate < new Date(startDate)) return false;
        if (endDate && paidDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    console.log('过滤后发票:', filteredInvoices.length);
    console.log('过滤后发票详情:', filteredInvoices.map(inv => ({
      id: inv.id,
      paidDate: inv.paidDate,
      totalAmount: inv.totalAmount || inv.total,
      amount: inv.amount
    })));
    
    // 智能分组逻辑
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const segmentDays = Math.ceil(totalDays / parseInt(nodeCount));
    
    console.log('日期范围分析:', { totalDays, segmentDays, nodeCount });
    
    const groupedData = {};
    
    // 生成时间段
    for (let i = 0; i < parseInt(nodeCount); i++) {
      const segmentStart = new Date(start);
      segmentStart.setDate(start.getDate() + (i * segmentDays));
      
      const segmentEnd = new Date(start);
      segmentEnd.setDate(start.getDate() + ((i + 1) * segmentDays) - 1);
      
      if (i === parseInt(nodeCount) - 1 || segmentEnd > end) {
        segmentEnd.setTime(end.getTime());
      }
      
      if (i === 0) {
        segmentStart.setTime(start.getTime());
      }
      
      let period;
      switch (groupBy) {
        case 'day':
          period = segmentStart.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekNum = Math.floor(segmentStart.getTime() / (7 * 24 * 60 * 60 * 1000));
          period = `${segmentStart.getFullYear()}-W${weekNum % 52 + 1}`;
          break;
        case 'quarter':
          const quarter = Math.floor(segmentStart.getMonth() / 3) + 1;
          period = `${segmentStart.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          period = segmentStart.getFullYear().toString();
          break;
        default: // month
          period = segmentStart.toISOString().slice(0, 7);
      }
      
      if (!groupedData[period]) {
        groupedData[period] = { 
          revenue: 0, 
          invoiceCount: 0, 
          total: 0,
          segmentStart: segmentStart.toISOString().slice(0, 10),
          segmentEnd: segmentEnd.toISOString().slice(0, 10)
        };
      }
    }
    
    // 将发票数据分组到时间段
    filteredInvoices.forEach(invoice => {
      const paidDate = new Date(invoice.paidDate);
      const amount = parseFloat(invoice.totalAmount || invoice.total || invoice.amount || 0);
      
      // 找到对应的时间段
      for (const [period, data] of Object.entries(groupedData)) {
        const segmentStart = new Date(data.segmentStart);
        const segmentEnd = new Date(data.segmentEnd);
        segmentEnd.setHours(23, 59, 59, 999); // 包含整天
        
        if (paidDate >= segmentStart && paidDate <= segmentEnd) {
          data.revenue += amount;
          data.total += amount;
          data.invoiceCount += 1;
          console.log(`发票 ${invoice.id} (${amount}) 分配到时间段 ${period}`);
          break;
        }
      }
    });
    
    // 转换为数组格式
    const monthlyData = Object.entries(groupedData).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      total: data.total,
      invoiceCount: data.invoiceCount,
      segmentStart: data.segmentStart,
      segmentEnd: data.segmentEnd
    }));
    
    console.log('\n📊 最终Revenue数据:');
    console.log(JSON.stringify({ monthlyData }, null, 2));
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

testRevenueLogic();