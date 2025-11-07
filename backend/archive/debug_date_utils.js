const DateUtils = require('./src/services/DateUtils');

function debugDateUtils() {
  console.log('🔍 调试DateUtils的月份计算逻辑...');
  
  // 1. 测试当前时间
  console.log('\n1. 当前时间测试:');
  const now = new Date();
  console.log('当前时间:', now.toString());
  console.log('当前UTC时间:', now.toISOString());
  console.log('DateUtils.getCurrentMonth():', DateUtils.getCurrentMonth());
  console.log('DateUtils.getMonthString(now):', DateUtils.getMonthString(now));
  
  // 2. 测试发票时间戳
  console.log('\n2. 发票时间戳测试:');
  const invoiceTimestamp = '2025-09-30T21:08:12.173Z';
  const invoiceDate = new Date(invoiceTimestamp);
  console.log('发票时间戳:', invoiceTimestamp);
  console.log('解析后的Date对象:', invoiceDate.toString());
  console.log('DateUtils.getMonthString(invoiceDate):', DateUtils.getMonthString(invoiceDate));
  
  // 3. 测试isDateInMonth方法
  console.log('\n3. isDateInMonth方法测试:');
  console.log('isDateInMonth(invoiceDate, "2025-09"):', DateUtils.isDateInMonth(invoiceDate, '2025-09'));
  console.log('isDateInMonth(invoiceDate, "2025-10"):', DateUtils.isDateInMonth(invoiceDate, '2025-10'));
  
  // 4. 测试本地时间月份计算
  console.log('\n4. 本地时间月份计算:');
  const localMonth = invoiceDate.getFullYear() + '-' + String(invoiceDate.getMonth() + 1).padStart(2, '0');
  console.log('本地时间月份:', localMonth);
  
  // 5. 测试UTC时间月份计算
  console.log('\n5. UTC时间月份计算:');
  const utcMonth = invoiceDate.getUTCFullYear() + '-' + String(invoiceDate.getUTCMonth() + 1).padStart(2, '0');
  console.log('UTC时间月份:', utcMonth);
  
  // 6. 比较不同的月份计算方法
  console.log('\n6. 月份计算方法比较:');
  console.log('toISOString().slice(0, 7):', invoiceDate.toISOString().slice(0, 7));
  console.log('本地时间计算:', localMonth);
  console.log('UTC时间计算:', utcMonth);
}

debugDateUtils();