/**
 * 数据一致性测试 - 混合筛选逻辑
 * 验证修复后的状态分布API与收入趋势API的数据一致性
 * 
 * 修复说明：
 * - 状态分布API现在使用混合筛选：已支付发票按支付月份，其他状态按创建月份
 * - 这确保了与收入趋势API的一致性，收入趋势API只统计指定月份支付的发票
 */

const DataService = require('../services/DataService');
const memoryDatabase = require('../config/memoryDatabase');

describe('数据一致性测试 - 混合筛选逻辑', () => {
  let dataService;
  const testUserId = 1;
  const testMonth = '2025-09';

  beforeEach(() => {
    // 初始化DataService实例
    dataService = new DataService(memoryDatabase);
    
    // 清空现有数据
    memoryDatabase.invoices.length = 0;
    
    // 创建能够测试混合筛选逻辑的测试数据
    const testInvoices = [
      // 2025年8月创建，9月支付的发票（应该被收入趋势统计，但不被状态分布的创建统计）
      {
        id: 1, userId: testUserId, invoiceNumber: 'INV-001',
        issueDate: '2025-08-15', createdAt: '2025-08-15',
        status: 'paid', paidDate: '2025-09-05', total: 5000
      },
      {
        id: 2, userId: testUserId, invoiceNumber: 'INV-002',
        issueDate: '2025-08-20', createdAt: '2025-08-20',
        status: 'paid', paidDate: '2025-09-10', total: 3000
      },
      
      // 2025年9月创建并支付的发票（应该被所有API统计）
      {
        id: 3, userId: testUserId, invoiceNumber: 'INV-003',
        issueDate: '2025-09-01', createdAt: '2025-09-01',
        status: 'paid', paidDate: '2025-09-15', total: 2000
      },
      {
        id: 4, userId: testUserId, invoiceNumber: 'INV-004',
        issueDate: '2025-09-10', createdAt: '2025-09-10',
        status: 'paid', paidDate: '2025-09-20', total: 1500
      },
      
      // 2025年9月创建但未支付的发票（只被状态分布统计）
      {
        id: 5, userId: testUserId, invoiceNumber: 'INV-005',
        issueDate: '2025-09-15', createdAt: '2025-09-15',
        status: 'pending', total: 4000
      },
      {
        id: 6, userId: testUserId, invoiceNumber: 'INV-006',
        issueDate: '2025-09-20', createdAt: '2025-09-20',
        status: 'draft', total: 2500
      }
    ];
    
    memoryDatabase.invoices.push(...testInvoices);
  });

  test('状态分布API与收入趋势API的已支付发票数量应该一致', async () => {
    // 获取状态分布数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
    const paidCountFromStatus = paidFromStatus ? paidFromStatus.count : 0;
    
    // 获取收入趋势数据
    const revenueTrend = await dataService.getRevenueTrend(testUserId, testMonth);
    
    // 验证已支付发票数量一致
    expect(paidCountFromStatus).toBe(4); // 8月创建9月支付的2张 + 9月创建9月支付的2张
    expect(revenueTrend.totalCount).toBe(4);
    expect(paidCountFromStatus).toBe(revenueTrend.totalCount);
  });

  test('状态分布API与收入趋势API的已支付发票金额应该一致', async () => {
    // 获取状态分布数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
    const paidAmountFromStatus = paidFromStatus ? paidFromStatus.amount : 0;
    
    // 获取收入趋势数据
    const revenueTrend = await dataService.getRevenueTrend(testUserId, testMonth);
    
    // 验证已支付发票金额一致
    const expectedAmount = 5000 + 3000 + 2000 + 1500; // 11500
    expect(paidAmountFromStatus).toBe(expectedAmount);
    expect(revenueTrend.totalRevenue).toBe(expectedAmount);
    expect(paidAmountFromStatus).toBe(revenueTrend.totalRevenue);
  });

  test('状态分布API与月度摘要API的已支付数据应该一致', async () => {
    // 获取状态分布数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
    
    // 获取月度摘要数据
    const summary = await dataService.getMonthlyInvoiceSummary(testUserId, testMonth);
    
    // 验证已支付数据一致
    expect(paidFromStatus.count).toBe(summary.paid.count);
    expect(paidFromStatus.amount).toBe(summary.paid.totalAmount);
  });

  test('收入趋势API与月度摘要API的已支付数据应该一致', async () => {
    // 获取收入趋势数据
    const revenueTrend = await dataService.getRevenueTrend(testUserId, testMonth);
    
    // 获取月度摘要数据
    const summary = await dataService.getMonthlyInvoiceSummary(testUserId, testMonth);
    
    // 验证已支付数据一致
    expect(revenueTrend.totalCount).toBe(summary.paid.count);
    expect(revenueTrend.totalRevenue).toBe(summary.paid.totalAmount);
  });

  test('数据一致性验证应该通过', async () => {
    // 执行数据一致性验证
    const validation = await dataService.validateDataConsistency(testUserId, testMonth);
    
    // 验证一致性检查结果
    expect(validation.isConsistent).toBe(true);
    expect(validation.issues).toHaveLength(0);
    expect(validation.validationNote).toContain('混合筛选逻辑');
  });

  test('状态分布应该包含混合筛选说明', async () => {
    // 获取状态分布数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    
    // 验证包含筛选说明
    expect(statusDistribution.filteringNote).toBeDefined();
    expect(statusDistribution.filteringNote).toContain('已支付发票按支付月份筛选');
    expect(statusDistribution.filteringNote).toContain('其他状态按创建月份筛选');
  });

  test('状态分布应该正确统计各种状态的发票', async () => {
    // 获取状态分布数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    
    // 验证各状态统计
    const statusMap = {};
    statusDistribution.distribution.forEach(item => {
      statusMap[item.status] = item.count;
    });
    
    expect(statusMap.paid).toBe(4);     // 4张已支付（8月创建9月支付2张 + 9月创建支付2张）
    expect(statusMap.pending).toBe(1);  // 1张待支付（9月创建）
    expect(statusMap.draft).toBe(1);    // 1张草稿（9月创建）
    expect(statusDistribution.totalInvoices).toBe(6); // 总计6张（混合筛选结果）
  });

  test('边界情况：没有数据时应该正确处理', async () => {
    // 清空所有数据
    memoryDatabase.invoices.length = 0;
    
    // 获取各API数据
    const statusDistribution = await dataService.getInvoiceStatusDistribution(testUserId, testMonth);
    const revenueTrend = await dataService.getRevenueTrend(testUserId, testMonth);
    const summary = await dataService.getMonthlyInvoiceSummary(testUserId, testMonth);
    
    // 验证空数据处理
    expect(statusDistribution.totalInvoices).toBe(0);
    expect(revenueTrend.totalCount).toBe(0);
    expect(revenueTrend.totalRevenue).toBe(0);
    expect(summary.paid.count).toBe(0);
    expect(summary.paid.totalAmount).toBe(0);
    
    // 验证数据一致性
    const validation = await dataService.validateDataConsistency(testUserId, testMonth);
    expect(validation.isConsistent).toBe(true);
  });
});

module.exports = {
  testName: '数据一致性测试 - 混合筛选逻辑',
  description: '验证修复后的状态分布API与收入趋势API的数据一致性'
};