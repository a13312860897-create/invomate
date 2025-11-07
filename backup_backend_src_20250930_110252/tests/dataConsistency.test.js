const DataService = require('../services/DataService');
const memoryDb = require('../config/memoryDatabase');

/**
 * 数据一致性自动化测试用例
 * 验证所有API之间的数据一致性
 */
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

describe('数据一致性测试', () => {
  let dataService;
  const testUserId = 1;
  const testMonth = '2025-09';

  beforeEach(() => {
    // 初始化DataService实例
    dataService = new DataService();
    
    // 确保内存数据库有测试数据
    if (memoryDb.invoices.length === 0) {
      // 创建测试发票数据
      createTestInvoices();
    }
  });
  /**
   * 测试收入趋势API和月度摘要API的数据一致性
   */
  test('收入趋势API与月度摘要API的已支付数据应该一致', async () => {
    const [revenueTrend, summary] = await Promise.all([
      dataService.getRevenueTrend(testUserId, testMonth),
      dataService.getMonthlyInvoiceSummary(testUserId, testMonth)
    ]);

    // 验证已支付发票的总收入一致
    expect(revenueTrend.totalRevenue).toBe(summary.paid.totalAmount);
    
    // 验证已支付发票的数量一致
    expect(revenueTrend.totalCount).toBe(summary.paid.count);
    
    console.log(`✓ 收入趋势总额: ${revenueTrend.totalRevenue}, 摘要已支付总额: ${summary.paid.totalAmount}`);
    console.log(`✓ 收入趋势数量: ${revenueTrend.totalCount}, 摘要已支付数量: ${summary.paid.count}`);
  });

  /**
   * 测试状态分布API和收入趋势API的已支付数据一致性（混合筛选逻辑）
   */
  test('状态分布API与收入趋势API的已支付数据应该一致（混合筛选逻辑）', async () => {
    const [statusDistribution, revenueTrend] = await Promise.all([
      dataService.getInvoiceStatusDistribution(testUserId, testMonth),
      dataService.getRevenueTrend(testUserId, testMonth)
    ]);

    // 获取状态分布中的已支付数据
    const statusPaidData = statusDistribution.distribution.find(
      item => item.status === 'paid'
    );
    
    // 验证已支付发票的数量一致（都按支付月份筛选）
    const statusPaidCount = statusPaidData ? statusPaidData.count : 0;
    expect(statusPaidCount).toBe(revenueTrend.totalCount);
    
    // 验证已支付发票的金额一致（都按支付月份筛选）
    const statusPaidAmount = statusPaidData ? statusPaidData.amount : 0;
    expect(statusPaidAmount).toBe(revenueTrend.totalRevenue);
    
    console.log(`✓ 状态分布已支付数量: ${statusPaidCount}, 收入趋势数量: ${revenueTrend.totalCount}`);
    console.log(`✓ 状态分布已支付金额: ${statusPaidAmount}, 收入趋势金额: ${revenueTrend.totalRevenue}`);
  });

  /**
   * 测试统一图表数据API的内部一致性（混合筛选逻辑）
   */
  test('统一图表数据API内部数据应该一致（混合筛选逻辑）', async () => {
    const chartData = await dataService.getUnifiedChartData(testUserId, testMonth);

    // 验证状态分布和收入趋势中已支付数据的一致性
    const statusPaidData = chartData.statusDistribution.distribution.find(
      item => item.status === 'paid'
    );
    
    if (statusPaidData) {
      // 已支付发票现在都按支付月份筛选，应该一致
      expect(statusPaidData.count).toBe(chartData.revenueTrend.totalCount);
      expect(statusPaidData.amount).toBe(chartData.revenueTrend.totalRevenue);
      
      console.log(`✓ 状态分布中已支付: 数量=${statusPaidData.count}, 金额=${statusPaidData.amount}`);
      console.log(`✓ 收入趋势: 数量=${chartData.revenueTrend.totalCount}, 金额=${chartData.revenueTrend.totalRevenue}`);
    }

    // 验证月份信息一致
    expect(chartData.statusDistribution.month).toBe(testMonth);
    expect(chartData.revenueTrend.month).toBe(testMonth);
  });

  /**
   * 测试数据一致性验证方法本身
   */
  test('数据一致性验证方法应该正确识别一致性问题', async () => {
    const validationResult = await dataService.validateDataConsistency(testUserId, testMonth);

    // 验证返回结构
    expect(validationResult).toHaveProperty('month', testMonth);
    expect(validationResult).toHaveProperty('isConsistent');
    expect(validationResult).toHaveProperty('issues');
    expect(validationResult).toHaveProperty('data');
    expect(validationResult).toHaveProperty('checkedAt');

    // 验证数据包含所有必要的API结果
    expect(validationResult.data).toHaveProperty('statusDistribution');
    expect(validationResult.data).toHaveProperty('revenueTrend');
    expect(validationResult.data).toHaveProperty('summary');

    console.log(`✓ 数据一致性: ${validationResult.isConsistent ? '一致' : '不一致'}`);
    if (validationResult.issues.length > 0) {
      console.log('发现的问题:');
      validationResult.issues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.message}`);
      });
    }
  });

  /**
   * 测试边界情况：空数据月份
   */
  test('空数据月份的一致性验证', async () => {
    const emptyMonth = '2025-12'; // 假设12月没有数据
    
    const validationResult = await dataService.validateDataConsistency(testUserId, emptyMonth);
    
    // 空数据应该是一致的
    expect(validationResult.isConsistent).toBe(true);
    expect(validationResult.issues).toHaveLength(0);
    
    // 验证所有API都返回空结果
    expect(validationResult.data.statusDistribution.totalInvoices).toBe(0);
    expect(validationResult.data.revenueTrend.totalRevenue).toBe(0);
    expect(validationResult.data.summary.created.count).toBe(0);
    expect(validationResult.data.summary.paid.count).toBe(0);
  });

  /**
   * 性能测试：验证API响应时间
   */
  test('API响应时间应该在合理范围内', async () => {
    const startTime = Date.now();
    
    await Promise.all([
      dataService.getInvoiceStatusDistribution(testUserId, testMonth),
      dataService.getRevenueTrend(testUserId, testMonth),
      dataService.getMonthlyInvoiceSummary(testUserId, testMonth),
      dataService.getUnifiedChartData(testUserId, testMonth)
    ]);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 所有API调用应该在1秒内完成
    expect(responseTime).toBeLessThan(1000);
    
    console.log(`✓ 所有API响应时间: ${responseTime}ms`);
  });
});

module.exports = {
  createTestInvoices
};