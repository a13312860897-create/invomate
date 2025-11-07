const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDataInconsistency() {
  console.log('=== 数据一致性深度分析 ===\n');
  
  try {
    // 获取所有发票
    const allInvoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('总发票数:', allInvoices.length);
    
    // 按状态分组
    const statusGroups = {};
    allInvoices.forEach(invoice => {
      if (!statusGroups[invoice.status]) {
        statusGroups[invoice.status] = [];
      }
      statusGroups[invoice.status].push(invoice);
    });
    
    console.log('\n=== 按状态分组 ===');
    Object.keys(statusGroups).forEach(status => {
      const invoices = statusGroups[status];
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      console.log(`${status}: ${invoices.length}张, 总金额: ${totalAmount}`);
    });
    
    // 分析已支付发票的支付日期
    const paidInvoices = statusGroups['paid'] || [];
    console.log('\n=== 已支付发票支付日期分析 ===');
    console.log('已支付发票总数:', paidInvoices.length);
    
    const currentMonth = '2025-09';
    let paidInCurrentMonth = 0;
    let paidInCurrentMonthAmount = 0;
    
    paidInvoices.forEach(invoice => {
      const paidAt = invoice.paidAt ? new Date(invoice.paidAt) : null;
      const updatedAt = new Date(invoice.updatedAt);
      const paymentDate = paidAt || updatedAt;
      
      const paymentMonth = paymentDate.toISOString().slice(0, 7);
      
      console.log(`发票 ${invoice.invoiceNumber}: 支付日期=${paymentDate.toISOString().slice(0, 10)}, 月份=${paymentMonth}, 金额=${invoice.total}`);
      
      if (paymentMonth === currentMonth) {
        paidInCurrentMonth++;
        paidInCurrentMonthAmount += invoice.total || 0;
      }
    });
    
    console.log(`\n当月(${currentMonth})已支付发票: ${paidInCurrentMonth}张, 金额: ${paidInCurrentMonthAmount}`);
    
    // 分析创建日期
    console.log('\n=== 按创建月份分析 ===');
    const creationMonthGroups = {};
    allInvoices.forEach(invoice => {
      const creationMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
      if (!creationMonthGroups[creationMonth]) {
        creationMonthGroups[creationMonth] = [];
      }
      creationMonthGroups[creationMonth].push(invoice);
    });
    
    Object.keys(creationMonthGroups).sort().forEach(month => {
      const invoices = creationMonthGroups[month];
      const statusCounts = {};
      invoices.forEach(inv => {
        statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
      });
      console.log(`${month}: 总计${invoices.length}张, 状态分布:`, statusCounts);
    });
    
    // 重点分析当前月份的数据
    console.log(`\n=== 当前月份(${currentMonth})详细分析 ===`);
    const currentMonthInvoices = creationMonthGroups[currentMonth] || [];
    console.log(`当月创建的发票: ${currentMonthInvoices.length}张`);
    
    currentMonthInvoices.forEach(invoice => {
      const createdAt = new Date(invoice.createdAt).toISOString().slice(0, 10);
      const paidAt = invoice.paidAt ? new Date(invoice.paidAt).toISOString().slice(0, 10) : 'null';
      const updatedAt = new Date(invoice.updatedAt).toISOString().slice(0, 10);
      
      console.log(`  发票 ${invoice.invoiceNumber}: 状态=${invoice.status}, 创建=${createdAt}, 支付=${paidAt}, 更新=${updatedAt}, 金额=${invoice.total}`);
    });
    
  } catch (error) {
    console.error('分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDataInconsistency();