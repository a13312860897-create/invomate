const InvoiceFilterService = require('../InvoiceFilterService');

// 模拟发票数据
const mockInvoices = [
  {
    id: '1',
    userId: 'user1',
    amount: 1000,
    status: 'paid',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    paidAt: new Date('2024-01-20')
  },
  {
    id: '2',
    userId: 'user1',
    amount: 2000,
    status: 'pending',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    userId: 'user1',
    amount: 1500,
    status: 'overdue',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '4',
    userId: 'user2',
    amount: 500,
    status: 'paid',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-15'),
    paidAt: new Date('2024-01-15')
  }
];

// 简单的断言函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`断言失败: ${message}. 期望: ${expected}, 实际: ${actual}`);
  }
}

// 测试函数
function testFilterPaidInvoicesByPaymentMonth() {
  console.log('测试 filterPaidInvoicesByPaymentMonth...');
  
  const result = InvoiceFilterService.filterPaidInvoicesByPaymentMonth(mockInvoices, '2024-01');
  
  assert(Array.isArray(result), '结果应该是数组');
  assert(result.every(invoice => invoice.status === 'paid'), '所有发票都应该是已支付状态');
  
  console.log('✓ filterPaidInvoicesByPaymentMonth 测试通过');
}

function testFilterInvoicesByCreationMonth() {
  console.log('测试 filterInvoicesByCreationMonth...');
  
  const result = InvoiceFilterService.filterInvoicesByCreationMonth(mockInvoices, '2024-01');
  
  assert(Array.isArray(result), '应该返回数组');
  
  result.forEach(invoice => {
    const createdAt = new Date(invoice.createdAt);
    assert(createdAt.getFullYear() === 2024, '年份应该是2024');
    assert(createdAt.getMonth() === 0, '月份应该是1月');
  });
  
  console.log('✓ filterInvoicesByCreationMonth 测试通过');
}

function testFilterByStatus() {
  console.log('测试 filterByStatus...');
  
  const paidInvoices = InvoiceFilterService.filterByStatus(mockInvoices, 'paid');
  assert(paidInvoices.length === 2, '应该有2张已支付发票');
  assert(paidInvoices.every(invoice => invoice.status === 'paid'), '所有发票都应该是已支付状态');
  
  const pendingInvoices = InvoiceFilterService.filterByStatus(mockInvoices, 'pending');
  assert(pendingInvoices.length === 1, '应该有1张待处理发票');
  assert(pendingInvoices[0].status === 'pending', '发票状态应该是pending');
  
  console.log('✓ filterByStatus 测试通过');
}

function testFilterByUserId() {
  console.log('测试 filterByUserId...');
  
  const user1Invoices = InvoiceFilterService.filterByUserId(mockInvoices, 'user1');
  assert(user1Invoices.length === 3, '用户1应该有3张发票');
  assert(user1Invoices.every(invoice => invoice.userId === 'user1'), '所有发票都应该属于用户1');
  
  const user2Invoices = InvoiceFilterService.filterByUserId(mockInvoices, 'user2');
  assert(user2Invoices.length === 1, '用户2应该有1张发票');
  assert(user2Invoices[0].userId === 'user2', '发票应该属于用户2');
  
  console.log('✓ filterByUserId 测试通过');
}

function testCombineFilters() {
  console.log('测试 combineFilters...');
  
  const filters = [
    (invoices) => InvoiceFilterService.filterByUserId(invoices, 'user1'),
    (invoices) => InvoiceFilterService.filterByStatus(invoices, 'paid')
  ];
  
  const result = InvoiceFilterService.combineFilters(mockInvoices, filters);
  
  assert(result.length === 1, '应该有1张符合条件的发票');
  assert(result[0].userId === 'user1', '发票应该属于用户1');
  assert(result[0].status === 'paid', '发票状态应该是已支付');
  
  console.log('✓ combineFilters 测试通过');
}

function testCalculateTotalAmount() {
  console.log('测试 calculateTotalAmount...');
  
  const total = InvoiceFilterService.calculateTotalAmount(mockInvoices);
  assertEqual(total, 5000, '总金额应该是5000');
  
  const paidInvoices = InvoiceFilterService.filterByStatus(mockInvoices, 'paid');
  const paidTotal = InvoiceFilterService.calculateTotalAmount(paidInvoices);
  assertEqual(paidTotal, 1500, '已支付发票总金额应该是1500');
  
  console.log('✓ calculateTotalAmount 测试通过');
}

function testGroupByStatus() {
  console.log('测试 groupByStatus...');
  
  const grouped = InvoiceFilterService.groupByStatus(mockInvoices);
  
  assert(grouped.hasOwnProperty('paid'), '应该包含paid分组');
  assert(grouped.hasOwnProperty('pending'), '应该包含pending分组');
  assert(grouped.hasOwnProperty('overdue'), '应该包含overdue分组');
  
  assertEqual(grouped.paid.length, 2, 'paid分组应该有2张发票');
  assertEqual(grouped.pending.length, 1, 'pending分组应该有1张发票');
  assertEqual(grouped.overdue.length, 1, 'overdue分组应该有1张发票');
  
  console.log('✓ groupByStatus 测试通过');
}

function testGetStatusStatistics() {
  console.log('测试 getStatusStatistics...');
  
  const stats = InvoiceFilterService.getStatusStatistics(mockInvoices);
  
  assert(Array.isArray(stats), '应该返回数组');
  assert(stats.length > 0, '统计数据不应该为空');
  
  const paidStats = stats.find(stat => stat.status === 'paid');
  assert(paidStats !== undefined, '应该包含paid状态统计');
  assertEqual(paidStats.count, 2, 'paid状态应该有2张发票');
  assertEqual(paidStats.amount, 1500, 'paid状态总金额应该是1500');
  
  console.log('✓ getStatusStatistics 测试通过');
}

function testGenerateRevenueTrendData() {
  console.log('测试 generateRevenueTrendData...');
  
  const paidInvoices = InvoiceFilterService.filterByStatus(mockInvoices, 'paid');
  const trendData = InvoiceFilterService.generateRevenueTrendData(paidInvoices, '2024-01', 10);
  
  assert(Array.isArray(trendData), '应该返回数组');
  assertEqual(trendData.length, 10, '应该有10个数据点');
  
  trendData.forEach((point, index) => {
    assert(point.hasOwnProperty('date'), `数据点${index}应该包含date属性`);
    assert(point.hasOwnProperty('revenue'), `数据点${index}应该包含revenue属性`);
    assert(typeof point.revenue === 'number', `数据点${index}的revenue应该是数字`);
  });
  
  console.log('✓ generateRevenueTrendData 测试通过');
}

// 运行所有测试
function runAllTests() {
  console.log('开始运行 InvoiceFilterService 测试套件...\n');
  
  try {
    testFilterPaidInvoicesByPaymentMonth();
    testFilterInvoicesByCreationMonth();
    testFilterByStatus();
    testFilterByUserId();
    testCombineFilters();
    testCalculateTotalAmount();
    testGroupByStatus();
    testGetStatusStatistics();
    testGenerateRevenueTrendData();
    
    console.log('\n✅ 所有 InvoiceFilterService 测试通过!');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    return false;
  }
}

module.exports = { runAllTests };