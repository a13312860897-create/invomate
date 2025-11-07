// 测试前端API调用的月份参数问题
console.log('=== 前端API调用月份参数测试 ===');

// 模拟前端的月份计算方式
const now = new Date();

// 1. RevenueTrendChart.js 使用的方式（本地时间）
const frontendMonth = now.toISOString().slice(0, 7);
console.log('前端计算的月份 (toISOString):', frontendMonth);

// 2. 后端现在使用的方式（UTC时间）
const backendMonth = now.getUTCFullYear() + '-' + (now.getUTCMonth() + 1).toString().padStart(2, '0');
console.log('后端计算的月份 (UTC):', backendMonth);

// 3. 本地时间计算
const localMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
console.log('本地时间计算的月份:', localMonth);

console.log('\n=== 时间详情 ===');
console.log('当前本地时间:', now.toString());
console.log('当前UTC时间:', now.toUTCString());
console.log('当前ISO时间:', now.toISOString());

console.log('\n=== 月份比较 ===');
console.log('前端月份 === 后端月份:', frontendMonth === backendMonth);
console.log('前端月份 === 本地月份:', frontendMonth === localMonth);

// 4. 测试API调用
const testApiCall = async () => {
  console.log('\n=== 测试API调用 ===');
  
  try {
    const fetch = require('node-fetch');
    
    // 测试不带月份参数的调用（使用后端默认值）
    console.log('测试1: 不带月份参数');
    const response1 = await fetch('http://localhost:3002/api/dashboard/unified-chart-data', {
      headers: {
        'Authorization': 'Bearer dev-mock-token',
        'Content-Type': 'application/json'
      }
    });
    const result1 = await response1.json();
    console.log('不带月份参数的响应:', {
      success: result1.success,
      monthInfo: result1.data?.monthInfo,
      revenueTotalRevenue: result1.data?.revenueTrend?.totalRevenue,
      statusTotalInvoices: result1.data?.statusDistribution?.totalInvoices
    });
    
    // 测试带前端计算月份参数的调用
    console.log('\n测试2: 带前端计算月份参数');
    const response2 = await fetch(`http://localhost:3002/api/dashboard/unified-chart-data?month=${frontendMonth}`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token',
        'Content-Type': 'application/json'
      }
    });
    const result2 = await response2.json();
    console.log('带前端月份参数的响应:', {
      success: result2.success,
      monthInfo: result2.data?.monthInfo,
      revenueTotalRevenue: result2.data?.revenueTrend?.totalRevenue,
      statusTotalInvoices: result2.data?.statusDistribution?.totalInvoices
    });
    
    // 测试带后端计算月份参数的调用
    console.log('\n测试3: 带后端计算月份参数');
    const response3 = await fetch(`http://localhost:3002/api/dashboard/unified-chart-data?month=${backendMonth}`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token',
        'Content-Type': 'application/json'
      }
    });
    const result3 = await response3.json();
    console.log('带后端月份参数的响应:', {
      success: result3.success,
      monthInfo: result3.data?.monthInfo,
      revenueTotalRevenue: result3.data?.revenueTrend?.totalRevenue,
      statusTotalInvoices: result3.data?.statusDistribution?.totalInvoices
    });
    
  } catch (error) {
    console.error('API调用失败:', error.message);
  }
};

testApiCall();