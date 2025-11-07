const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 详细数据分析 ===');
console.log('内存数据库中总发票数:', memoryDb.invoices.length);

// 显示所有发票的详细信息
console.log('\n所有发票详情:');
memoryDb.invoices.forEach((invoice, index) => {
  console.log(`发票 ${index + 1}:`, {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    createdAt: invoice.createdAt,
    paidDate: invoice.paidDate,
    total: invoice.total,
    userId: invoice.userId
  });
});

// 分析两个API的筛选逻辑差异
const userId = 1;
const currentMonth = new Date().toISOString().slice(0, 7);
console.log('\n当前月份:', currentMonth);

// 发票状态分布API的逻辑
console.log('\n=== 发票状态分布API逻辑 ===');
let statusApiInvoices = memoryDb.invoices.filter(invoice => invoice.userId === userId);
console.log('用户发票总数:', statusApiInvoices.length);

statusApiInvoices = statusApiInvoices.filter(invoice => {
  if (invoice.createdAt) {
    const createdMonth = new Date(invoice.createdAt).toISOString().slice(0, 7);
    return createdMonth === currentMonth;
  }
  return false;
});
console.log('本月发票数量（按创建日期筛选）:', statusApiInvoices.length);

const statusCounts = {};
statusApiInvoices.forEach(invoice => {
  const status = invoice.status || 'draft';
  if (!statusCounts[status]) {
    statusCounts[status] = { count: 0, amount: 0 };
  }
  statusCounts[status].count++;
  statusCounts[status].amount += parseFloat(invoice.total) || 0;
});
console.log('状态分布API结果:', statusCounts);

// 本月收入趋势API的逻辑
console.log('\n=== 本月收入趋势API逻辑 ===');
let revenueApiInvoices = memoryDb.invoices.filter(inv => 
  inv.userId === userId && 
  inv.status === 'paid' && 
  inv.createdAt && 
  new Date(inv.createdAt).toISOString().slice(0, 7) === currentMonth
);
console.log('收入趋势API - 本月已支付发票数量:', revenueApiInvoices.length);
const totalRevenue = revenueApiInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
console.log('收入趋势API - 总收入:', totalRevenue);

// 检查是否有其他用户的发票
console.log('\n=== 用户分布检查 ===');
const userGroups = {};
memoryDb.invoices.forEach(invoice => {
  if (!userGroups[invoice.userId]) {
    userGroups[invoice.userId] = [];
  }
  userGroups[invoice.userId].push(invoice);
});
console.log('按用户分组的发票数量:', Object.keys(userGroups).map(userId => ({
  userId,
  count: userGroups[userId].length
})));

// 检查脚本运行时的内存数据库状态
console.log('\n=== 脚本运行时内存数据库状态检查 ===');
console.log('内存数据库实例:', typeof memoryDb);
console.log('发票数组长度:', memoryDb.invoices.length);
console.log('客户数组长度:', memoryDb.clients.length);
console.log('用户数组长度:', memoryDb.users.length);

// 检查是否有动态添加的发票
console.log('\n=== 动态发票检查 ===');
const now = new Date();
const recentInvoices = memoryDb.invoices.filter(invoice => {
  const createdAt = new Date(invoice.createdAt);
  const timeDiff = now - createdAt;
  return timeDiff < 24 * 60 * 60 * 1000; // 24小时内创建的发票
});
console.log('24小时内创建的发票数量:', recentInvoices.length);
recentInvoices.forEach(invoice => {
  console.log('最近发票:', {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    createdAt: invoice.createdAt,
    total: invoice.total
  });
});