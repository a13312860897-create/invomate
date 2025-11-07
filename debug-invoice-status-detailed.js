const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function debugInvoiceStatusDetailed() {
  try {
    console.log('🔍 开始详细调试 Invoice Status 数据传输...\n');

    // 1. 登录获取 token
    console.log('1. 登录获取 token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });

    if (loginResponse.status !== 200) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }

    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到 token');
    console.log('Token 长度:', token ? token.length : 'undefined');
    console.log('Token 前20字符:', token ? token.substring(0, 20) + '...' : 'undefined');

    // 2. 调用 invoice-status-overview API
    console.log('\n2. 调用 /api/reports/invoice-status-overview API...');
    const apiResponse = await axios.get(`${BASE_URL}/api/reports/invoice-status-overview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API 调用成功');
    console.log('📊 API 响应状态:', apiResponse.status);
    console.log('📊 API 响应数据结构:');
    console.log(JSON.stringify(apiResponse.data, null, 2));

    // 3. 详细检查各个数据字段
    const data = apiResponse.data;
    
    console.log('\n3. 详细检查数据字段:');
    
    // 检查 summary
    console.log('\n📋 Summary 数据:');
    if (data.summary) {
      console.log('  ✅ summary 字段存在');
      console.log('  - totalInvoices:', data.summary.totalInvoices);
      console.log('  - totalAmount:', data.summary.totalAmount);
      console.log('  - avgProcessingTime:', data.summary.avgProcessingTime);
      console.log('  - collectionRate:', data.summary.collectionRate);
    } else {
      console.log('  ❌ summary 字段不存在');
    }

    // 检查 statusBreakdown
    console.log('\n📊 StatusBreakdown 数据:');
    if (data.statusBreakdown) {
      console.log('  ✅ statusBreakdown 字段存在');
      console.log('  - 数据类型:', typeof data.statusBreakdown);
      console.log('  - 是否为对象:', typeof data.statusBreakdown === 'object');
      console.log('  - 是否为数组:', Array.isArray(data.statusBreakdown));
      console.log('  - 内容:', JSON.stringify(data.statusBreakdown, null, 4));
      
      if (typeof data.statusBreakdown === 'object' && !Array.isArray(data.statusBreakdown)) {
        const entries = Object.entries(data.statusBreakdown);
        console.log('  - 状态数量:', entries.length);
        entries.forEach(([status, statusData]) => {
          console.log(`    ${status}: count=${statusData.count}, amount=${statusData.amount}`);
        });
      }
    } else {
      console.log('  ❌ statusBreakdown 字段不存在');
    }

    // 检查 monthlyTrends
    console.log('\n📈 MonthlyTrends 数据:');
    if (data.monthlyTrends) {
      console.log('  ✅ monthlyTrends 字段存在');
      console.log('  - 数据类型:', typeof data.monthlyTrends);
      console.log('  - 是否为数组:', Array.isArray(data.monthlyTrends));
      console.log('  - 数组长度:', data.monthlyTrends.length);
      console.log('  - 内容:', JSON.stringify(data.monthlyTrends, null, 4));
    } else {
      console.log('  ❌ monthlyTrends 字段不存在');
    }

    // 4. 模拟前端数据处理
    console.log('\n4. 模拟前端数据处理:');
    
    // 模拟 reportService.getInvoiceStatusOverview 的返回
    const processedData = {
      summary: data.summary,
      statusBreakdown: data.statusBreakdown,
      monthlyTrends: data.monthlyTrends,
      statusDetails: data.statusDetails || data.statusBreakdown
    };

    console.log('📦 处理后的数据结构:');
    console.log(JSON.stringify(processedData, null, 2));

    // 5. 检查前端渲染条件
    console.log('\n5. 检查前端渲染条件:');
    
    // 检查状态分布饼图渲染条件
    console.log('\n🥧 状态分布饼图渲染条件:');
    const statusBreakdownExists = processedData.statusBreakdown && typeof processedData.statusBreakdown === 'object';
    console.log('  - statusBreakdown 存在且为对象:', statusBreakdownExists);
    
    if (statusBreakdownExists) {
      const statusEntries = Object.entries(processedData.statusBreakdown);
      const hasValidData = statusEntries.some(([status, data]) => (data.count || 0) > 0);
      console.log('  - 有有效数据 (count > 0):', hasValidData);
      console.log('  - 状态条目:', statusEntries.map(([status, data]) => `${status}: ${data.count || 0}`));
    }

    // 检查月度趋势图渲染条件
    console.log('\n📈 月度趋势图渲染条件:');
    const monthlyTrendsExists = processedData.monthlyTrends && Array.isArray(processedData.monthlyTrends);
    console.log('  - monthlyTrends 存在且为数组:', monthlyTrendsExists);
    console.log('  - 数组长度 > 0:', monthlyTrendsExists && processedData.monthlyTrends.length > 0);

    // 检查状态明细表格渲染条件
    console.log('\n📋 状态明细表格渲染条件:');
    const statusBreakdownForTable = processedData.statusBreakdown && typeof processedData.statusBreakdown === 'object';
    console.log('  - statusBreakdown 存在且为对象:', statusBreakdownForTable);
    
    if (statusBreakdownForTable) {
      const validEntries = Object.entries(processedData.statusBreakdown)
        .filter(([status, data]) => (data.count || 0) > 0);
      console.log('  - 有效条目数量:', validEntries.length);
      console.log('  - 有效条目:', validEntries.map(([status, data]) => `${status}: ${data.count || 0}`));
    }

    console.log('\n✅ Invoice Status 数据调试完成');

  } catch (error) {
    console.error('❌ 调试过程中出现错误:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.response) {
      console.error('📄 错误响应状态:', error.response.status);
      console.error('📄 错误响应数据:', error.response.data);
    }
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

debugInvoiceStatusDetailed();