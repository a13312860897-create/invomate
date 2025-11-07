/**
 * DataService 测试套件
 */

const DataService = require('../DataService');

// 模拟数据
const mockInvoices = [
  {
    id: 1,
    userId: 'user1',
    amount: 1000,
    status: 'paid',
    createdAt: '2024-01-15T10:00:00Z',
    paidAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 2,
    userId: 'user1',
    amount: 2000,
    status: 'pending',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 3,
    userId: 'user2',
    amount: 1500,
    status: 'paid',
    createdAt: '2024-01-05T10:00:00Z',
    paidAt: '2024-01-25T10:00:00Z'
  }
];

// 模拟数据源
const mockDataSource = {
  type: 'memory',
  invoices: mockInvoices
};

// 创建DataService实例
const dataService = new DataService(mockDataSource);

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
async function testGetAllInvoices() {
  console.log('测试 getAllInvoices...');
  
  // 测试获取用户1的所有发票
  const result1 = await dataService.getAllInvoices('user1');
  assert(result1.length >= 0, '应该返回发票数组');
  
  // 测试不存在的用户
  const result2 = await dataService.getAllInvoices('nonexistent');
  assert(result2.length === 0, '不存在的用户应该返回空数组');
  
  console.log('✓ getAllInvoices 测试通过');
}

async function testGetInvoiceStatusDistribution() {
  console.log('测试 getInvoiceStatusDistribution...');
  
  const result = await dataService.getInvoiceStatusDistribution('user1', '2024-01');
  
  assert(result.hasOwnProperty('distribution'), '结果应该包含distribution属性');
  assert(result.hasOwnProperty('totalInvoices'), '结果应该包含totalInvoices属性');
  assert(result.hasOwnProperty('month'), '结果应该包含month属性');
  assertEqual(result.month, '2024-01', '月份应该正确');
  
  const distribution = result.distribution;
  assert(Array.isArray(distribution), 'distribution应该是数组');
  
  console.log('✓ getInvoiceStatusDistribution 测试通过');
}

async function testGetRevenueTrend() {
  console.log('测试 getRevenueTrend...');
  
  const result = await dataService.getRevenueTrend('user1', '2024-01');
  
  assert(result.hasOwnProperty('trendPoints'), '结果应该包含trendPoints属性');
  assert(result.hasOwnProperty('totalRevenue'), '结果应该包含totalRevenue属性');
  assert(result.hasOwnProperty('month'), '结果应该包含month属性');
  assertEqual(result.month, '2024-01', '月份应该正确');
  
  const trendPoints = result.trendPoints;
  assert(Array.isArray(trendPoints), 'trendPoints应该是数组');
  
  console.log('✓ getRevenueTrend 测试通过');
}

async function testGetUnifiedChartData() {
  console.log('测试 getUnifiedChartData...');
  
  const result = await dataService.getUnifiedChartData('user1', '2024-01');
  
  assert(result.hasOwnProperty('revenueTrend'), '结果应该包含revenueTrend属性');
  assert(result.hasOwnProperty('statusDistribution'), '结果应该包含statusDistribution属性');
  assert(result.hasOwnProperty('month'), '结果应该包含month属性');
  assertEqual(result.month, '2024-01', '月份应该正确');
  
  console.log('✓ getUnifiedChartData 测试通过');
}

async function testGetMonthlyInvoiceSummary() {
  console.log('测试 getMonthlyInvoiceSummary...');
  
  const result = await dataService.getMonthlyInvoiceSummary('user1', '2024-01');
  
  assert(result.hasOwnProperty('totalInvoices'), '结果应该包含totalInvoices属性');
  assert(result.hasOwnProperty('totalRevenue'), '结果应该包含totalRevenue属性');
  assert(result.hasOwnProperty('pendingInvoices'), '结果应该包含pendingInvoices属性');
  assert(result.hasOwnProperty('overdueInvoices'), '结果应该包含overdueInvoices属性');
  assert(result.hasOwnProperty('month'), '结果应该包含month属性');
  assertEqual(result.month, '2024-01', '月份应该正确');
  
  console.log('✓ getMonthlyInvoiceSummary 测试通过');
}

async function testValidateDataConsistency() {
  console.log('测试 validateDataConsistency...');
  
  const result = await dataService.validateDataConsistency('user1', '2024-01');
  
  assert(result.hasOwnProperty('isConsistent'), '结果应该包含isConsistent属性');
  assert(result.hasOwnProperty('details'), '结果应该包含details属性');
  assert(typeof result.isConsistent === 'boolean', 'isConsistent应该是布尔值');
  
  console.log('✓ validateDataConsistency 测试通过');
}

// 运行所有测试
async function runAllTests() {
  console.log('开始运行 DataService 测试套件...\n');
  
  try {
    await testGetAllInvoices();
    await testGetInvoiceStatusDistribution();
    await testGetRevenueTrend();
    await testGetUnifiedChartData();
    await testGetMonthlyInvoiceSummary();
    await testValidateDataConsistency();
    
    console.log('\n✅ 所有 DataService 测试通过!');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    return false;
  }
}

module.exports = { runAllTests };