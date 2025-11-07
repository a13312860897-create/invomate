const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('=== 测试仪表板API ===\n');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'a133128860897@163.com',
      password: 'Ddtb959322'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. 测试仪表板统计API
    console.log('2. 测试仪表板统计API...');
    const statsResponse = await axios.get('http://localhost:3002/api/dashboard/stats', { headers });
    console.log('仪表板统计数据:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // 3. 测试发票状态分布API
    console.log('\n3. 测试发票状态分布API...');
    const statusResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', { headers });
    console.log('发票状态分布数据:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // 4. 测试收入趋势API
    console.log('\n4. 测试收入趋势API...');
    const revenueResponse = await axios.get('http://localhost:3002/api/dashboard/monthly-revenue-trend?year=2025&month=9', { headers });
    console.log('收入趋势数据:');
    console.log(JSON.stringify(revenueResponse.data, null, 2));
    
    // 5. 获取所有发票进行对比
    console.log('\n5. 获取所有发票进行对比...');
    const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', { headers });
    const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.data || invoicesResponse.data;
    
    console.log(`获取到 ${invoices.length} 张发票`);
    
    // 统计发票状态
    const statusCount = {};
    let totalAmount = 0;
    let paidAmount = 0;
    
    invoices.forEach(invoice => {
      statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
      totalAmount += parseFloat(invoice.amount || 0);
      if (invoice.status === 'paid') {
        paidAmount += parseFloat(invoice.amount || 0);
      }
    });
    
    console.log('\n=== 发票统计对比 ===');
    console.log('从发票列表统计:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}张`);
    });
    console.log(`总金额: ${totalAmount}€`);
    console.log(`已支付金额: ${paidAmount}€`);
    
    // 查找高价值发票
    const highValueInvoices = invoices.filter(invoice => parseFloat(invoice.amount) >= 100000);
    console.log(`\n高价值发票（≥100,000€）: ${highValueInvoices.length}张`);
    if (highValueInvoices.length > 0) {
      highValueInvoices.forEach(invoice => {
        console.log(`  ID: ${invoice.id}, 金额: ${invoice.amount}€, 状态: ${invoice.status}, 日期: ${invoice.invoiceDate}`);
      });
    }
    
  } catch (error) {
    console.error('API错误:', error.message);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
  }
}

testDashboardAPI();