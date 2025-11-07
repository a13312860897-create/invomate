const axios = require('axios');

async function debugTimeZone() {
  try {
    console.log('🔍 调试时区和时间计算问题...');
    
    // 1. 检查系统时间
    console.log('\n1. 系统时间信息:');
    const now = new Date();
    console.log('当前UTC时间:', now.toISOString());
    console.log('当前本地时间:', now.toString());
    console.log('时区偏移:', now.getTimezoneOffset(), '分钟');
    
    // 计算当前月份（本地时间）
    const localCurrentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
    console.log('本地时间计算的当前月份:', localCurrentMonth);
    
    // 计算当前月份（UTC时间）
    const utcNow = new Date(now.toISOString());
    const utcCurrentMonth = utcNow.getUTCFullYear() + '-' + (utcNow.getUTCMonth() + 1).toString().padStart(2, '0');
    console.log('UTC时间计算的当前月份:', utcCurrentMonth);
    
    // 2. 检查发票的时间戳
    console.log('\n2. 检查发票的时间戳:');
    const authHeaders = {
      'Authorization': 'Bearer dev-mock-token',
      'Content-Type': 'application/json'
    };
    
    const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
      headers: authHeaders
    });
    
    if (invoicesResponse.data.success) {
      const invoices = invoicesResponse.data.data.invoices || invoicesResponse.data.data || [];
      console.log('发票总数:', invoices.length);
      
      if (invoices.length > 0) {
        console.log('\n前3张发票的时间信息:');
        invoices.slice(0, 3).forEach((inv, index) => {
          const createdAt = inv.createdAt || inv.issueDate;
          const date = new Date(createdAt);
          console.log(`  ${index + 1}. ${inv.invoiceNumber}:`);
          console.log(`     原始时间戳: ${createdAt}`);
          console.log(`     解析后UTC: ${date.toISOString()}`);
          console.log(`     解析后本地: ${date.toString()}`);
          console.log(`     UTC月份: ${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
          console.log(`     本地月份: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
      }
    }
    
    // 3. 测试API的月份处理
    console.log('\n3. 测试API的月份处理:');
    
    // 测试不指定月份（使用默认值）
    console.log('\n不指定月份（使用默认值）:');
    try {
      const defaultResponse = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data', {
        headers: authHeaders
      });
      
      if (defaultResponse.data.success) {
        const data = defaultResponse.data.data;
        console.log(`  使用的月份: ${data.monthInfo.month}`);
        console.log(`  收入趋势: ${data.revenueTrend.totalRevenue} (${data.revenueTrend.totalCount}张)`);
        console.log(`  状态分布: ${data.statusDistribution.totalInvoices}张发票`);
      }
    } catch (error) {
      console.error('  默认月份API错误:', error.message);
    }
    
    // 测试指定2025-10月
    console.log('\n指定2025-10月:');
    try {
      const octoberResponse = await axios.get('http://localhost:3002/api/dashboard/unified-chart-data?month=2025-10', {
        headers: authHeaders
      });
      
      if (octoberResponse.data.success) {
        const data = octoberResponse.data.data;
        console.log(`  使用的月份: ${data.monthInfo.month}`);
        console.log(`  收入趋势: ${data.revenueTrend.totalRevenue} (${data.revenueTrend.totalCount}张)`);
        console.log(`  状态分布: ${data.statusDistribution.totalInvoices}张发票`);
      }
    } catch (error) {
      console.error('  2025-10月API错误:', error.message);
    }
    
  } catch (error) {
    console.error('调试失败:', error.message);
  }
}

debugTimeZone();