const memoryDb = require('./src/config/memoryDatabase');

console.log('🔍 检查当前内存数据库状态...');

// 获取所有发票
const allInvoices = memoryDb.findAllInvoices();
console.log(`📊 总发票数量: ${allInvoices.length}`);

console.log('\n📋 所有发票详情:');
allInvoices.forEach((invoice, index) => {
  console.log(`发票 ${index + 1}:`);
  console.log(`  - ID: ${invoice.id}`);
  console.log(`  - 用户ID: ${invoice.userId}`);
  console.log(`  - 金额: ${invoice.totalAmount || invoice.total || invoice.amount}`);
  console.log(`  - 状态: ${invoice.status}`);
  console.log(`  - 创建日期: ${invoice.createdAt ? (typeof invoice.createdAt === 'string' ? invoice.createdAt.slice(0, 10) : invoice.createdAt.toISOString().slice(0, 10)) : '未设置'}`);
  console.log(`  - 支付日期: ${invoice.paidDate ? (typeof invoice.paidDate === 'string' ? invoice.paidDate.slice(0, 10) : invoice.paidDate.toISOString().slice(0, 10)) : '未设置'}`);
  console.log(`  - 到期日期: ${invoice.dueDate ? (typeof invoice.dueDate === 'string' ? invoice.dueDate.slice(0, 10) : invoice.dueDate.toISOString().slice(0, 10)) : '未设置'}`);
  console.log('---');
});

// 统计状态分布
const statusCount = {};
allInvoices.forEach(invoice => {
  statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
});

console.log('\n📈 发票状态分布:');
Object.entries(statusCount).forEach(([status, count]) => {
  console.log(`  ${status}: ${count} 张`);
});

// 检查已支付发票
const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
console.log(`\n💰 已支付发票数量: ${paidInvoices.length}`);

paidInvoices.forEach((invoice, index) => {
  console.log(`已支付发票 ${index + 1}:`);
  console.log(`  - ID: ${invoice.id}`);
  console.log(`  - 金额: ${invoice.totalAmount || invoice.total || invoice.amount}`);
  console.log(`  - paidDate类型: ${typeof invoice.paidDate}`);
  console.log(`  - paidDate值: ${invoice.paidDate}`);
  console.log('---');
});