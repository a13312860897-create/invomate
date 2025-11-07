const memoryDatabase = require('./src/config/memoryDatabase');

console.log('🔍 调试发票数据结构...');

// 获取内存数据库实例
const memoryDb = memoryDatabase;

console.log('\n📊 内存数据库中的发票数据:');
console.log('发票总数:', memoryDb.invoices.length);

if (memoryDb.invoices.length > 0) {
  console.log('\n前5张发票的详细信息:');
  memoryDb.invoices.slice(0, 5).forEach((invoice, index) => {
    console.log(`\n发票 ${index + 1}:`);
    console.log('  ID:', invoice.id);
    console.log('  用户ID:', invoice.userId);
    console.log('  状态:', invoice.status);
    console.log('  总金额:', invoice.total);
    console.log('  创建日期:', invoice.createdAt);
    console.log('  支付日期:', invoice.paidDate);
    console.log('  到期日期:', invoice.dueDate);
    console.log('  发票编号:', invoice.invoiceNumber);
  });
  
  console.log('\n📈 按状态统计:');
  const statusCounts = {};
  memoryDb.invoices.forEach(invoice => {
    const status = invoice.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  console.log(statusCounts);
  
  console.log('\n📅 按月份统计 (创建日期):');
  const monthCounts = {};
  memoryDb.invoices.forEach(invoice => {
    if (invoice.createdAt) {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    }
  });
  console.log(monthCounts);
  
  console.log('\n💰 按月份统计收入 (已支付发票):');
  const paidInvoices = memoryDb.invoices.filter(inv => inv.status === 'paid');
  console.log('已支付发票数量:', paidInvoices.length);
  
  if (paidInvoices.length > 0) {
    const revenueByMonth = {};
    paidInvoices.forEach(invoice => {
      const paymentDate = invoice.paidDate || invoice.createdAt;
      if (paymentDate) {
        const date = new Date(paymentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + parseFloat(invoice.total || 0);
      }
    });
    console.log(revenueByMonth);
  }
}