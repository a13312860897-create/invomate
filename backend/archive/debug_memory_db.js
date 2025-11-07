const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 内存数据库状态检查 ===\n');

console.log('1. 内存数据库invoices数组长度:', memoryDb.invoices.length);
console.log('2. 所有发票详情:');
memoryDb.invoices.forEach((invoice, index) => {
  console.log(`  ${index + 1}. ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}`);
  console.log(`     状态: ${invoice.status}, 金额: ${invoice.total}`);
  console.log(`     用户ID: ${invoice.userId}`);
  console.log(`     创建时间: ${invoice.createdAt}`);
  console.log(`     发票日期: ${invoice.issueDate}`);
  if (invoice.paidDate) {
    console.log(`     支付日期: ${invoice.paidDate}`);
  }
  console.log('');
});

console.log('3. 按状态统计:');
const statusCount = {};
memoryDb.invoices.forEach(invoice => {
  const status = invoice.status || 'unknown';
  statusCount[status] = (statusCount[status] || 0) + 1;
});
Object.entries(statusCount).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}张`);
});

console.log('4. 按用户ID统计:');
const userCount = {};
memoryDb.invoices.forEach(invoice => {
  const userId = invoice.userId || 'unknown';
  userCount[userId] = (userCount[userId] || 0) + 1;
});
Object.entries(userCount).forEach(([userId, count]) => {
  console.log(`   用户${userId}: ${count}张`);
});

console.log('5. 2025年9月的发票:');
const septemberInvoices = memoryDb.invoices.filter(invoice => {
  if (invoice.createdAt) {
    const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
    return createdMonth === '2025-09';
  }
  return false;
});
console.log(`   2025年9月发票数量: ${septemberInvoices.length}`);
septemberInvoices.forEach(invoice => {
  console.log(`   - ${invoice.invoiceNumber}: ${invoice.status}, ${invoice.total}`);
});

console.log('\n=== 检查完成 ===');