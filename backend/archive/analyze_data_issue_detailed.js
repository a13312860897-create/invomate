const { getDatabase } = require('./src/config/dbFactory');
const { Invoice, Client } = require('./src/models');

async function analyzeDataIssueDetailed() {
  try {
    console.log('=== 详细数据不一致问题分析 ===\n');
    
    // 1. 检查数据库模式
    const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE;
    console.log('1. 数据库模式:', isMemoryMode ? '内存模式' : 'PostgreSQL模式');
    
    // 2. 获取所有发票数据
    const allInvoices = await Invoice.findAll({
      where: { userId: 1 },
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`\n2. 总发票数量: ${allInvoices.length}`);
    console.log('所有发票详情:');
    allInvoices.forEach((invoice, index) => {
      const createdAt = new Date(invoice.createdAt);
      const issueDate = new Date(invoice.issueDate);
      const paidDate = invoice.paidDate ? new Date(invoice.paidDate) : null;
      
      console.log(`  ${index + 1}. ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}`);
      console.log(`     状态: ${invoice.status}, 金额: ${invoice.total}`);
      console.log(`     创建时间: ${createdAt.toISOString()}`);
      console.log(`     发票日期: ${issueDate.toISOString()}`);
      if (paidDate) {
        console.log(`     支付日期: ${paidDate.toISOString()}`);
      }
      console.log('');
    });
    
    // 3. 模拟发票状态分布API的逻辑
    console.log('\n3. 发票状态分布API逻辑分析:');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log(`   当前时间: ${currentDate.toISOString()}`);
    console.log(`   筛选条件: ${currentYear}年${currentMonth}月`);
    
    // 按createdAt筛选当前月份的发票
    const currentMonthInvoices = allInvoices.filter(invoice => {
      const createdAt = new Date(invoice.createdAt);
      return createdAt.getFullYear() === currentYear && 
             createdAt.getMonth() + 1 === currentMonth;
    });
    
    console.log(`   当前月份发票数量: ${currentMonthInvoices.length}`);
    
    // 统计状态分布
    const statusDistribution = {};
    currentMonthInvoices.forEach(invoice => {
      if (!statusDistribution[invoice.status]) {
        statusDistribution[invoice.status] = { count: 0, amount: 0 };
      }
      statusDistribution[invoice.status].count++;
      statusDistribution[invoice.status].amount += parseFloat(invoice.total);
    });
    
    console.log('   状态分布结果:');
    Object.entries(statusDistribution).forEach(([status, data]) => {
      console.log(`     ${status}: ${data.count}张, 金额: ${data.amount}`);
    });
    
    // 4. 模拟本月收入趋势API的逻辑
    console.log('\n4. 本月收入趋势API逻辑分析:');
    
    // 筛选当前月份且状态为paid的发票
    const paidInvoicesThisMonth = currentMonthInvoices.filter(invoice => 
      invoice.status === 'paid'
    );
    
    console.log(`   已支付发票数量: ${paidInvoicesThisMonth.length}`);
    
    let totalRevenue = 0;
    paidInvoicesThisMonth.forEach((invoice, index) => {
      totalRevenue += parseFloat(invoice.total);
      console.log(`     ${index + 1}. ${invoice.invoiceNumber}: ${invoice.total}`);
    });
    
    console.log(`   总收入: ${totalRevenue}`);
    
    // 5. 对比分析
    console.log('\n5. 数据对比分析:');
    const statusPaidCount = statusDistribution['paid'] ? statusDistribution['paid'].count : 0;
    const statusPaidAmount = statusDistribution['paid'] ? statusDistribution['paid'].amount : 0;
    
    console.log(`   发票状态分布API - 已支付发票: ${statusPaidCount}张, 金额: ${statusPaidAmount}`);
    console.log(`   本月收入趋势API - 已支付发票: ${paidInvoicesThisMonth.length}张, 金额: ${totalRevenue}`);
    
    if (statusPaidCount !== paidInvoicesThisMonth.length || statusPaidAmount !== totalRevenue) {
      console.log('   ❌ 数据不一致！');
    } else {
      console.log('   ✅ 数据一致');
    }
    
    // 6. 检查服务器启动时创建的测试数据
    console.log('\n6. 服务器启动时的测试数据分析:');
    
    // 检查是否有create-test-invoices.js创建的发票
    const testInvoiceNumbers = [
      'INV-2025-009-001', 'INV-2025-009-002', 'INV-2025-009-003', 
      'INV-2025-009-004', 'INV-2025-009-007'
    ];
    
    const testInvoices = allInvoices.filter(invoice => 
      testInvoiceNumbers.includes(invoice.invoiceNumber)
    );
    
    console.log(`   测试脚本创建的9月发票数量: ${testInvoices.length}`);
    testInvoices.forEach(invoice => {
      console.log(`     ${invoice.invoiceNumber}: ${invoice.status}, ${invoice.total}`);
    });
    
    // 7. 检查内存数据库初始化的发票
    const memoryInitInvoices = allInvoices.filter(invoice => 
      invoice.invoiceNumber === 'INV-001' || invoice.invoiceNumber === 'INV-002'
    );
    
    console.log(`\n   内存数据库初始化发票数量: ${memoryInitInvoices.length}`);
    memoryInitInvoices.forEach(invoice => {
      console.log(`     ${invoice.invoiceNumber}: ${invoice.status}, ${invoice.total}`);
    });
    
    // 8. 检查动态创建的发票（最近24小时）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInvoices = allInvoices.filter(invoice => {
      const createdAt = new Date(invoice.createdAt);
      return createdAt > oneDayAgo && 
             !testInvoiceNumbers.includes(invoice.invoiceNumber) &&
             invoice.invoiceNumber !== 'INV-001' && 
             invoice.invoiceNumber !== 'INV-002';
    });
    
    console.log(`\n   最近24小时动态创建的发票数量: ${recentInvoices.length}`);
    recentInvoices.forEach(invoice => {
      console.log(`     ${invoice.invoiceNumber}: ${invoice.status}, ${invoice.total}, 创建时间: ${new Date(invoice.createdAt).toISOString()}`);
    });
    
    console.log('\n=== 分析完成 ===');
    
  } catch (error) {
    console.error('分析过程中发生错误:', error);
  }
}

// 运行分析
analyzeDataIssueDetailed().then(() => {
  console.log('详细分析完成');
  process.exit(0);
}).catch(error => {
  console.error('分析失败:', error);
  process.exit(1);
});