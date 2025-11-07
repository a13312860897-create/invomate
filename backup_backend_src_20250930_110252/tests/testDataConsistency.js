const DataService = require('../services/DataService');
const memoryDb = require('../config/memoryDatabase');

/**
 * 创建测试发票数据（包含混合筛选逻辑测试场景）
 */
function createTestInvoices() {
  const testUserId = 1;
  const testInvoices = [
    // 8月创建，9月支付的发票
    {
      id: 1,
      userId: testUserId,
      clientId: 1,
      invoiceNumber: 'INV-2025-008-001',
      status: 'paid',
      total: 5000,
      createdAt: new Date('2025-08-15'),
      updatedAt: new Date('2025-09-05'),
      paidDate: new Date('2025-09-05'),
      issueDate: '2025-08-15',
      dueDate: '2025-09-15'
    },
    {
      id: 2,
      userId: testUserId,
      clientId: 2,
      invoiceNumber: 'INV-2025-008-002',
      status: 'paid',
      total: 3000,
      createdAt: new Date('2025-08-20'),
      updatedAt: new Date('2025-09-10'),
      paidDate: new Date('2025-09-10'),
      issueDate: '2025-08-20',
      dueDate: '2025-09-20'
    },
    // 9月创建并支付的发票
    {
      id: 3,
      userId: testUserId,
      clientId: 1,
      invoiceNumber: 'INV-2025-009-001',
      status: 'paid',
      total: 2000,
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-15'),
      paidDate: new Date('2025-09-15'),
      issueDate: '2025-09-01',
      dueDate: '2025-10-01'
    },
    {
      id: 4,
      userId: testUserId,
      clientId: 3,
      invoiceNumber: 'INV-2025-009-002',
      status: 'paid',
      total: 1500,
      createdAt: new Date('2025-09-10'),
      updatedAt: new Date('2025-09-20'),
      paidDate: new Date('2025-09-20'),
      issueDate: '2025-09-10',
      dueDate: '2025-10-10'
    },
    // 9月创建但未支付的发票
    {
      id: 5,
      userId: testUserId,
      clientId: 2,
      invoiceNumber: 'INV-2025-009-003',
      status: 'sent',
      total: 4000,
      createdAt: new Date('2025-09-15'),
      updatedAt: new Date('2025-09-15'),
      issueDate: '2025-09-15',
      dueDate: '2025-10-15'
    },
    {
      id: 6,
      userId: testUserId,
      clientId: 1,
      invoiceNumber: 'INV-2025-009-004',
      status: 'draft',
      total: 2500,
      createdAt: new Date('2025-09-25'),
      updatedAt: new Date('2025-09-25'),
      issueDate: '2025-09-25',
      dueDate: '2025-10-25'
    }
  ];

  // 清空现有数据并添加测试数据
  memoryDb.invoices.length = 0;
  memoryDb.invoices.push(...testInvoices);
  memoryDb.nextIds.invoices = testInvoices.length + 1;
}

async function runDataConsistencyTests() {
  console.log('=== 数据一致性测试（混合筛选逻辑） ===');
  
  // 创建测试数据
  createTestInvoices();
  console.log('✓ 测试数据创建完成，共', memoryDb.invoices.length, '张发票');
  
  // 传入memoryDb作为数据源
  const dataService = new DataService(memoryDb);
  const testUserId = 1;
  const testMonth = '2025-09';
  
  try {
    console.log('\n=== 测试1: 收入趋势API与月度摘要API的已支付数据一致性 ===');
    const [revenueTrend, summary] = await Promise.all([
      dataService.getRevenueTrend(testUserId, testMonth),
      dataService.getMonthlyInvoiceSummary(testUserId, testMonth)
    ]);
    
    console.log('收入趋势 - 已支付:', revenueTrend.totalCount, '张，金额:', revenueTrend.totalRevenue);
    console.log('月度摘要 - 已支付:', summary.paid.count, '张，金额:', summary.paid.totalAmount);
    
    const test1Pass = revenueTrend.totalRevenue === summary.paid.totalAmount && 
                      revenueTrend.totalCount === summary.paid.count;
    console.log('一致性检查:', test1Pass ? '✅ 通过' : '❌ 失败');
    
    console.log('\n=== 测试2: 状态分布API与收入趋势API的已支付数据一致性 ===');
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    const statusPaidData = statusDistribution.distribution.find(item => item.status === 'paid');
    const statusPaidCount = statusPaidData ? statusPaidData.count : 0;
    const statusPaidAmount = statusPaidData ? statusPaidData.amount : 0;
    
    console.log('状态分布 - 已支付:', statusPaidCount, '张，金额:', statusPaidAmount);
    console.log('收入趋势 - 已支付:', revenueTrend.totalCount, '张，金额:', revenueTrend.totalRevenue);
    
    const test2Pass = statusPaidCount === revenueTrend.totalCount && 
                      statusPaidAmount === revenueTrend.totalRevenue;
    console.log('一致性检查:', test2Pass ? '✅ 通过' : '❌ 失败');
    
    console.log('\n=== 测试3: 统一图表数据API内部一致性 ===');
    const chartData = await dataService.getUnifiedChartData(testUserId, testMonth);
    const chartStatusPaidData = chartData.statusDistribution.distribution.find(
      item => item.status === 'paid'
    );
    
    const test3Pass = chartStatusPaidData && 
                      chartStatusPaidData.count === chartData.revenueTrend.totalCount &&
                      chartStatusPaidData.amount === chartData.revenueTrend.totalRevenue;
    console.log('统一图表 - 状态分布已支付:', chartStatusPaidData ? chartStatusPaidData.count : 0, '张');
    console.log('统一图表 - 收入趋势:', chartData.revenueTrend.totalCount, '张');
    console.log('一致性检查:', test3Pass ? '✅ 通过' : '❌ 失败');
    
    console.log('\n=== 测试4: 数据一致性验证方法 ===');
    const validation = await dataService.validateDataConsistency(testUserId, testMonth);
    console.log('验证结果:', validation.isConsistent ? '✅ 通过' : '❌ 失败');
    if (validation.issues.length > 0) {
      console.log('发现问题:', validation.issues);
    }
    if (validation.validationNote) {
      console.log('验证说明:', validation.validationNote);
    }
    
    console.log('\n=== 测试结果汇总 ===');
    const allTestsPass = test1Pass && test2Pass && test3Pass && validation.isConsistent;
    console.log('所有测试结果:', allTestsPass ? '✅ 全部通过' : '❌ 存在失败');
    
    if (allTestsPass) {
      console.log('🎉 数据一致性修复成功！混合筛选逻辑工作正常！');
    } else {
      console.log('⚠️ 仍存在数据一致性问题，需要进一步调查');
    }
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runDataConsistencyTests();
}

module.exports = {
  createTestInvoices,
  runDataConsistencyTests
};