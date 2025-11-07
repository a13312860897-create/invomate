const DateUtils = require('../DateUtils');

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
function testGetDateString() {
  console.log('测试 getDateString...');
  
  // 测试字符串日期解析
  const date1 = DateUtils.getDateString('2024-01-15');
  assertEqual(date1, '2024-01-15', '应该返回正确的日期字符串');
  
  // 测试Date对象
  const inputDate = new Date('2024-01-15');
  const date2 = DateUtils.getDateString(inputDate);
  assertEqual(date2, '2024-01-15', '应该返回正确的日期字符串');
  
  console.log('✓ getDateString 测试通过');
}

function testGetMonthRange() {
  console.log('测试 getMonthRange...');
  
  const range = DateUtils.getMonthRange('2024-01');
  
  assert(range.hasOwnProperty('startDate'), '应该包含startDate属性');
  assert(range.hasOwnProperty('endDate'), '应该包含endDate属性');
  assert(range.startDate instanceof Date, 'startDate应该是Date对象');
  assert(range.endDate instanceof Date, 'endDate应该是Date对象');
  
  assertEqual(range.startDate.getFullYear(), 2024, '开始年份应该正确');
  assertEqual(range.startDate.getMonth(), 0, '开始月份应该正确');
  assertEqual(range.startDate.getDate(), 1, '开始日期应该是1号');
  
  assertEqual(range.endDate.getFullYear(), 2024, '结束年份应该正确');
  assertEqual(range.endDate.getMonth(), 0, '结束月份应该正确');
  assertEqual(range.endDate.getDate(), 31, '结束日期应该是31号');
  
  console.log('✓ getMonthRange 测试通过');
}

function testIsDateInMonth() {
  console.log('测试 isDateInMonth...');
  
  const date1 = new Date('2024-01-15');
  const date2 = new Date('2024-02-15');
  
  assert(DateUtils.isDateInMonth(date1, '2024-01'), '2024-01-15应该在2024-01月内');
  assert(!DateUtils.isDateInMonth(date2, '2024-01'), '2024-02-15不应该在2024-01月内');
  
  console.log('✓ isDateInMonth 测试通过');
}

function testGetDaysInMonth() {
  console.log('测试 getDaysInMonth...');
  
  const days1 = DateUtils.getDaysInMonth('2024-01');
  assertEqual(days1, 31, '2024年1月应该有31天');
  
  const days2 = DateUtils.getDaysInMonth('2024-02');
  assertEqual(days2, 29, '2024年2月应该有29天（闰年）');
  
  const days3 = DateUtils.getDaysInMonth('2023-02');
  assertEqual(days3, 28, '2023年2月应该有28天（非闰年）');
  
  console.log('✓ getDaysInMonth 测试通过');
}

function testGenerateTimePoints() {
  console.log('测试 generateTimePoints...');
  
  const points = DateUtils.generateTimePoints('2024-01', 10);
  
  assert(Array.isArray(points), '应该返回数组');
  assertEqual(points.length, 10, '应该有10个时间点');
  
  points.forEach((point, index) => {
    assert(point instanceof Date, `时间点${index}应该是Date对象`);
    assert(DateUtils.isDateInMonth(point, '2024-01'), `时间点${index}应该在2024-01月内`);
  });
  
  console.log('✓ generateTimePoints 测试通过');
}

function testGetInvoicePaymentDate() {
  console.log('测试 getInvoicePaymentDate...');
  
  const invoice1 = {
    paidAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-15')
  };
  
  const invoice2 = {
    updatedAt: new Date('2024-01-15')
  };
  
  const date1 = DateUtils.getInvoicePaymentDate(invoice1);
  assertEqual(date1.getTime(), invoice1.paidAt.getTime(), '应该优先使用paidAt');
  
  const date2 = DateUtils.getInvoicePaymentDate(invoice2);
  assertEqual(date2.getTime(), invoice2.updatedAt.getTime(), '应该使用updatedAt作为备选');
  
  console.log('✓ getInvoicePaymentDate 测试通过');
}

function testGetInvoiceCreationDate() {
  console.log('测试 getInvoiceCreationDate...');
  
  const invoice = {
    createdAt: new Date('2024-01-10')
  };
  
  const date = DateUtils.getInvoiceCreationDate(invoice);
  assertEqual(date.getTime(), invoice.createdAt.getTime(), '应该返回createdAt');
  
  console.log('✓ getInvoiceCreationDate 测试通过');
}

// 运行所有测试
function runAllTests() {
  console.log('开始运行 DateUtils 测试套件...\n');
  
  try {
    testGetDateString();
    testGetMonthRange();
    testIsDateInMonth();
    testGetDaysInMonth();
    testGenerateTimePoints();
    testGetInvoicePaymentDate();
    testGetInvoiceCreationDate();
    
    console.log('\n✅ 所有 DateUtils 测试通过!');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    return false;
  }
}

module.exports = { runAllTests };