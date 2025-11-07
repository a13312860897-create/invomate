const DataService = require('./src/services/DataService');
const memoryDb = require('./src/config/memoryDatabase');

// 创建测试数据
function createTestData() {
  console.log('创建测试数据...');
  
  // 清空现有数据
  memoryDb.invoices.length = 0;
  
  // 创建9月份的测试发票
  const testInvoices = [
    // 9月创建，9月支付的发票
    { id: 1, userId: 1, status: 'paid', total: 1000, createdAt: new Date('2025-09-01'), paidAt: new Date('2025-09-05') },
    { id: 2, userId: 1, status: 'paid', total: 2000, createdAt: new Date('2025-09-02'), paidAt: new Date('2025-09-06') },
    
    // 9月创建，未支付的发票
    { id: 3, userId: 1, status: 'pending', total: 1500, createdAt: new Date('2025-09-03') },
    { id: 4, userId: 1, status: 'draft', total: 800, createdAt: new Date('2025-09-04') },
    
    // 8月创建，9月支付的发票（这些不应该被计入9月的收入趋势）
    { id: 5, userId: 1, status: 'paid', total: 5000, createdAt: new Date('2025-08-15'), paidAt: new Date('2025-09-10') },
    { id: 6, userId: 1, status: 'paid', total: 3000, createdAt: new Date('2025-08-20'), paidAt: new Date('2025-09-15') },
  ];
  
  // 添加到内存数据库
  testInvoices.forEach(invoice => {
    memoryDb.invoices.push(invoice);
  });
  
  console.log(`已创建 ${testInvoices.length} 张测试发票`);
  return testInvoices;
}

async function verifyFix() {
  console.log('=== 验证数据一致性修复 ===\n');
  
  // 创建测试数据
  const testInvoices = createTestData();
  
  // 初始化DataService
  const memoryDataSource = {
    type: 'memory',
    invoices: memoryDb.invoices
  };
  const dataService = new DataService(memoryDataSource);
  
  const userId = 1;
  const monthString = '2025-09';
  
  console.log('1. 原始数据分析:');
  console.log(`总发票数: ${testInvoices.length}`);
  
  // 按创建月份分组
  const createdInSeptember = testInvoices.filter(inv => {
    const createdAt = new Date(inv.createdAt);
    return createdAt.getFullYear() === 2025 && createdAt.getMonth() === 8; // 9月是索引8
  });
  
  const paidInSeptember = testInvoices.filter(inv => {
    if (inv.status !== 'paid' || !inv.paidAt) return false;
    const paidAt = new Date(inv.paidAt);
    return paidAt.getFullYear() === 2025 && paidAt.getMonth() === 8;
  });
  
  console.log(`9月创建的发票: ${createdInSeptember.length} 张`);
  console.log(`9月支付的发票: ${paidInSeptember.length} 张`);
  
  // 9月创建且已支付的发票
  const createdAndPaidInSeptember = createdInSeptember.filter(inv => inv.status === 'paid');
  console.log(`9月创建且已支付的发票: ${createdAndPaidInSeptember.length} 张`);
  console.log(`9月创建且已支付的总金额: ${createdAndPaidInSeptember.reduce((sum, inv) => sum + inv.total, 0)}`);
  
  console.log('\n2. API方法测试:');
  
  try {
    // 测试getRevenueTrend（修复后应该按创建月份筛选）
    const revenueTrend = await dataService.getRevenueTrend(userId, monthString);
    console.log('getRevenueTrend结果:');
    console.log(`  总收入: ${revenueTrend.totalRevenue}`);
    console.log(`  总数量: ${revenueTrend.totalCount}`);
    console.log(`  已支付发票数: ${revenueTrend.paidInvoices.length}`);
    
    // 测试getInvoiceStatusDistribution
    const statusDistribution = await dataService.getInvoiceStatusDistribution(userId, monthString);
    console.log('getInvoiceStatusDistribution结果:');
    console.log(`  总发票数: ${statusDistribution.totalInvoices}`);
    console.log(`  总金额: ${statusDistribution.summary.totalAmount}`);
    
    // 查找已支付发票的统计
    const paidDistribution = statusDistribution.distribution.find(d => d.status === 'paid');
    if (paidDistribution) {
      console.log(`  已支付发票数: ${paidDistribution.count}`);
      console.log(`  已支付金额: ${paidDistribution.amount}`);
    }
    
    console.log('\n3. 数据一致性检查:');
    
    // 检查已支付发票数量是否一致
    const revenueCount = revenueTrend.totalCount;
    const statusCount = paidDistribution ? paidDistribution.count : 0;
    
    console.log(`收入趋势中的已支付发票数: ${revenueCount}`);
    console.log(`状态分布中的已支付发票数: ${statusCount}`);
    
    if (revenueCount === statusCount) {
      console.log('✅ 已支付发票数量一致');
    } else {
      console.log('❌ 已支付发票数量不一致');
    }
    
    // 检查已支付金额是否一致
    const revenueAmount = revenueTrend.totalRevenue;
    const statusAmount = paidDistribution ? paidDistribution.amount : 0;
    
    console.log(`收入趋势中的总收入: ${revenueAmount}`);
    console.log(`状态分布中的已支付金额: ${statusAmount}`);
    
    if (revenueAmount === statusAmount) {
      console.log('✅ 已支付金额一致');
    } else {
      console.log('❌ 已支付金额不一致');
    }
    
    console.log('\n4. 详细发票信息:');
    console.log('收入趋势返回的已支付发票:');
    revenueTrend.paidInvoices.forEach(inv => {
      console.log(`  ID: ${inv.id}, 金额: ${inv.total}, 状态: ${inv.status}`);
    });
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行验证
verifyFix().then(() => {
  console.log('\n=== 验证完成 ===');
}).catch(error => {
  console.error('验证失败:', error);
});