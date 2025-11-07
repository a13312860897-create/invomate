const DataService = require('./src/services/DataService');
const memoryDb = require('./src/config/memoryDatabase');

// 创建测试发票数据
function createTestInvoices() {
  console.log('创建测试发票数据...');
  
  // 清除现有发票
  memoryDb.invoices = [];
  
  // 创建8月份发票（10张）
  for (let i = 1; i <= 10; i++) {
    const invoice = {
      id: i,
      invoiceNumber: `INV-2025-08-${String(i).padStart(3, '0')}`,
      userId: 1,
      clientId: 1,
      total: 1000 + i * 100,
      status: i <= 3 ? 'paid' : (i <= 6 ? 'pending' : 'overdue'),
      createdAt: new Date(2025, 7, i), // 8月
      issueDate: new Date(2025, 7, i),
      dueDate: new Date(2025, 8, i),
      paidDate: i <= 3 ? new Date(2025, 7, i + 5) : null // 已支付的发票在8月支付
    };
    memoryDb.invoices.push(invoice);
  }
  
  // 创建9月份发票（15张）
  for (let i = 1; i <= 15; i++) {
    const invoice = {
      id: i + 10,
      invoiceNumber: `INV-2025-09-${String(i).padStart(3, '0')}`,
      userId: 1,
      clientId: 1,
      total: 1500 + i * 150,
      status: i <= 5 ? 'paid' : (i <= 9 ? 'pending' : 'overdue'),
      createdAt: new Date(2025, 8, i), // 9月
      issueDate: new Date(2025, 8, i),
      dueDate: new Date(2025, 9, i),
      paidDate: i <= 5 ? new Date(2025, 8, i + 10) : null // 已支付的发票在9月支付
    };
    memoryDb.invoices.push(invoice);
  }
  
  console.log(`✅ 创建了 ${memoryDb.invoices.length} 张测试发票`);
}

async function debugDataInconsistency() {
  console.log('=== 数据不一致性调试分析 ===\n');

  try {
    // 1. 创建测试数据
    createTestInvoices();
    
    // 2. 创建内存数据源对象
    const memoryDataSource = {
      type: 'memory',
      invoices: memoryDb.invoices
    };
    
    // 3. 初始化DataService
    const dataService = new DataService(memoryDataSource);
    
    // 4. 获取所有发票数据
    console.log('1. 获取所有发票数据:');
    const allInvoices = memoryDb.invoices;
    console.log(`   总发票数: ${allInvoices.length}`);
    
    // 5. 按状态分组统计
    console.log('\n2. 按状态分组统计:');
    const statusGroups = {};
    allInvoices.forEach(invoice => {
      const status = invoice.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(invoice);
    });
    
    Object.entries(statusGroups).forEach(([status, invoices]) => {
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      console.log(`   ${status}: ${invoices.length}张, 总金额: ${totalAmount}`);
    });
    
    // 6. 分析getRevenueTrend方法
    console.log('\n3. 分析getRevenueTrend方法 (2025年9月):');
    try {
      const revenueTrend = await dataService.getRevenueTrend(1, '2025-09');
      console.log(`   已支付发票数量: ${revenueTrend.totalCount}`);
      console.log(`   已支付总金额: ${revenueTrend.totalRevenue}`);
      console.log(`   筛选逻辑: 按支付月份筛选已支付发票`);
    } catch (error) {
      console.log(`   获取收入趋势失败: ${error.message}`);
      console.log(`   已支付发票数量: 0`);
      console.log(`   已支付总金额: 0`);
      console.log(`   筛选逻辑: 按支付月份筛选已支付发票`);
    }
    
    // 7. 分析getInvoiceStatusDistribution方法
    console.log('\n4. 分析getInvoiceStatusDistribution方法 (2025年9月):');
    try {
      const statusDistribution = await dataService.getInvoiceStatusDistribution(1, '2025-09');
      console.log(`   总发票数: ${statusDistribution.totalInvoices}`);
      console.log(`   已支付发票数量: ${statusDistribution.summary.paid.count}`);
      console.log(`   已支付总金额: ${statusDistribution.summary.paid.amount}`);
      console.log(`   筛选逻辑: 按创建月份筛选所有发票，然后按状态分组`);
    } catch (error) {
      console.log(`   获取发票数据失败: ${error.message}`);
      console.log(`   总发票数: 0`);
      console.log(`   已支付发票数量: 0`);
      console.log(`   已支付总金额: 0`);
      console.log(`   筛选逻辑: 按创建月份筛选所有发票，然后按状态分组`);
    }
    
    // 8. 手动验证筛选逻辑
    console.log('\n5. 手动验证筛选逻辑:');
    
    // 按支付月份筛选已支付发票 (getRevenueTrend的逻辑)
    const paidByPaymentMonth = allInvoices.filter(invoice => {
      if (invoice.status !== 'paid' || !invoice.paidDate) return false;
      const paidDate = new Date(invoice.paidDate);
      return paidDate.getFullYear() === 2025 && paidDate.getMonth() === 8; // 9月是索引8
    });
    
    console.log(`   按支付月份筛选的已支付发票: ${paidByPaymentMonth.length}张`);
    console.log(`   总金额: ${paidByPaymentMonth.reduce((sum, inv) => sum + (inv.total || 0), 0)}`);
    
    // 按创建月份筛选所有发票，然后取已支付的 (getInvoiceStatusDistribution的逻辑)
    const createdInMonth = allInvoices.filter(invoice => {
      if (!invoice.createdAt) return false;
      const createdDate = new Date(invoice.createdAt);
      return createdDate.getFullYear() === 2025 && createdDate.getMonth() === 8; // 9月是索引8
    });
    
    const paidFromCreatedInMonth = createdInMonth.filter(invoice => invoice.status === 'paid');
    
    console.log(`   按创建月份筛选的所有发票: ${createdInMonth.length}张`);
    console.log(`   其中已支付的发票: ${paidFromCreatedInMonth.length}张`);
    console.log(`   已支付总金额: ${paidFromCreatedInMonth.reduce((sum, inv) => sum + (inv.total || 0), 0)}`);
    
    // 9. 结论
    console.log('\n6. 数据不一致的根本原因:');
    console.log('   - getRevenueTrend: 按支付月份筛选已支付发票');
    console.log('   - getInvoiceStatusDistribution: 按创建月份筛选所有发票');
    console.log('   - 这两种不同的筛选逻辑导致了数据不一致');
    
    // 10. 详细分析每张发票
    console.log('\n7. 详细分析每张发票:');
    allInvoices.forEach((invoice, index) => {
      console.log(`   发票${index + 1}: ID=${invoice.id}, 状态=${invoice.status}`);
      console.log(`     创建时间: ${invoice.createdAt}`);
      console.log(`     支付时间: ${invoice.paidDate || '未支付'}`);
      console.log(`     金额: ${invoice.total}`);
      
      const createdDate = new Date(invoice.createdAt);
      const isCreatedInSept = createdDate.getFullYear() === 2025 && createdDate.getMonth() === 8;
      
      let isPaidInSept = false;
      if (invoice.paidDate) {
        const paidDate = new Date(invoice.paidDate);
        isPaidInSept = paidDate.getFullYear() === 2025 && paidDate.getMonth() === 8;
      }
      
      console.log(`     创建于9月: ${isCreatedInSept}, 支付于9月: ${isPaidInSept}`);
      console.log('');
    });
    
    // 11. 数据不一致性的具体表现
    console.log('\n8. 数据不一致性的具体表现:');
    console.log('   这解释了为什么在统一API测试中会出现：');
    console.log('   - 收入趋势显示的已支付发票数量和金额');
    console.log('   - 与状态分布显示的已支付发票数量和金额不一致');
    console.log('   - 因为它们使用了不同的筛选条件（支付月份 vs 创建月份）');
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  }
}

debugDataInconsistency();