const DataService = require('./src/services/DataService');
const memoryDb = require('./src/config/memoryDatabase');

// 创建数据服务实例
const dataSource = {
  type: 'memory',
  invoices: memoryDb.invoices
};
const dataService = new DataService(dataSource);

async function debugDataServiceMethods() {
  try {
    console.log('=== 调试DataService方法差异 ===');
    
    const userId = 1;
    const month = '2025-09';
    
    // 1. 重新创建测试数据
    console.log('\n1. 重新创建测试数据...');
    memoryDb.invoices.length = 0; // 清空现有数据
    
    // 创建9月份的测试发票
    const testInvoices = [
      // 9月创建，已支付
      { id: 1, userId: 1, invoiceNumber: 'INV-001', total: 5000, status: 'paid', createdAt: '2025-09-05', paidDate: '2025-09-10' },
      { id: 2, userId: 1, invoiceNumber: 'INV-002', total: 3000, status: 'paid', createdAt: '2025-09-08', paidDate: '2025-09-12' },
      { id: 3, userId: 1, invoiceNumber: 'INV-003', total: 7000, status: 'paid', createdAt: '2025-09-15', paidDate: '2025-09-20' },
      
      // 9月创建，未支付
      { id: 4, userId: 1, invoiceNumber: 'INV-004', total: 2000, status: 'pending', createdAt: '2025-09-10' },
      { id: 5, userId: 1, invoiceNumber: 'INV-005', total: 4000, status: 'draft', createdAt: '2025-09-12' },
      { id: 6, userId: 1, invoiceNumber: 'INV-006', total: 1500, status: 'sent', createdAt: '2025-09-18' },
      
      // 8月创建，9月支付
      { id: 7, userId: 1, invoiceNumber: 'INV-007', total: 6000, status: 'paid', createdAt: '2025-08-25', paidDate: '2025-09-05' },
      { id: 8, userId: 1, invoiceNumber: 'INV-008', total: 8000, status: 'paid', createdAt: '2025-08-28', paidDate: '2025-09-08' }
    ];
    
    memoryDb.invoices.push(...testInvoices);
    console.log('创建了', testInvoices.length, '张测试发票');
    
    // 2. 调用getRevenueTrend方法
    console.log('\n2. 调用getRevenueTrend方法...');
    const revenueTrend = await dataService.getRevenueTrend(userId, month);
    console.log('收入趋势结果:');
    console.log('- 总收入:', revenueTrend.totalRevenue);
    console.log('- 总数量:', revenueTrend.totalCount);
    console.log('- 已支付发票数量:', revenueTrend.paidInvoices.length);
    console.log('- 已支付发票详情:');
    revenueTrend.paidInvoices.forEach(inv => {
      console.log(`  ID: ${inv.id}, 金额: ${inv.total}, 创建日期: ${testInvoices.find(t => t.id === inv.id)?.createdAt}, 支付日期: ${inv.paymentDate}`);
    });
    
    // 3. 调用getInvoiceStatusDistribution方法
    console.log('\n3. 调用getInvoiceStatusDistribution方法...');
    const statusDistribution = await dataService.getInvoiceStatusDistribution(userId, month);
    console.log('状态分布结果:');
    console.log('- 总发票数:', statusDistribution.totalInvoices);
    console.log('- 分布详情:');
    statusDistribution.distribution.forEach(item => {
      console.log(`  ${item.label}(${item.status}): ${item.count}张, ${item.amount}元`);
    });
    
    // 4. 分析差异
    console.log('\n4. 分析差异...');
    const paidFromRevenue = revenueTrend.paidInvoices;
    const paidFromStatus = statusDistribution.distribution.find(d => d.status === 'paid');
    
    console.log('收入趋势中的已支付发票:', paidFromRevenue.length, '张，总金额:', revenueTrend.totalRevenue);
    console.log('状态分布中的已支付发票:', paidFromStatus?.count || 0, '张，总金额:', paidFromStatus?.amount || 0);
    
    // 5. 检查筛选逻辑
    console.log('\n5. 检查筛选逻辑...');
    
    // 手动筛选9月创建的发票
    const septemberCreated = testInvoices.filter(inv => 
      inv.userId === userId && inv.createdAt.startsWith('2025-09')
    );
    console.log('9月创建的发票:', septemberCreated.length, '张');
    septemberCreated.forEach(inv => {
      console.log(`  ID: ${inv.id}, 状态: ${inv.status}, 金额: ${inv.total}, 创建: ${inv.createdAt}, 支付: ${inv.paidDate || 'N/A'}`);
    });
    
    // 从9月创建的发票中筛选已支付的
    const septemberCreatedPaid = septemberCreated.filter(inv => inv.status === 'paid');
    console.log('9月创建且已支付的发票:', septemberCreatedPaid.length, '张');
    const septemberCreatedPaidAmount = septemberCreatedPaid.reduce((sum, inv) => sum + inv.total, 0);
    console.log('9月创建且已支付的总金额:', septemberCreatedPaidAmount);
    
    // 6. 检查内存数据库状态
    console.log('\n6. 检查内存数据库状态...');
    console.log('内存数据库中的发票总数:', memoryDb.invoices.length);
    console.log('用户1的发票数:', memoryDb.invoices.filter(inv => inv.userId === 1).length);
    console.log('9月创建的发票数:', memoryDb.invoices.filter(inv => inv.createdAt.startsWith('2025-09')).length);
    
  } catch (error) {
    console.error('调试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

debugDataServiceMethods();