const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugDashboardDetailed() {
  try {
    console.log('=== 详细调试Dashboard API ===\n');

    // 1. 先获取所有发票数据
    console.log('1. 获取所有发票数据...');
    const allInvoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });

    const invoices = allInvoicesResponse.data.data.invoices;
    console.log(`总发票数: ${invoices.length}`);
    
    // 显示已支付发票的详细信息
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    console.log(`\n已支付发票数: ${paidInvoices.length}`);
    paidInvoices.forEach(inv => {
      console.log(`- ID: ${inv.id}, 金额: ${inv.totalAmount || inv.total}, 支付日期: ${inv.paidDate}`);
    });

    // 2. 测试2025-10月份的统计数据
    console.log('\n2. 测试2025-10月份统计数据...');
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats?month=2025-10`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('统计数据:', JSON.stringify(statsResponse.data, null, 2));

    // 3. 测试2025-10月份的图表数据
    console.log('\n3. 测试2025-10月份图表数据...');
    const chartResponse = await axios.get(`${BASE_URL}/dashboard/unified-chart-data?month=2025-10`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('图表数据:', JSON.stringify(chartResponse.data, null, 2));

    // 4. 直接测试Reports API
    console.log('\n4. 测试Reports Revenue API (2025-10月)...');
    const reportsResponse = await axios.get(`${BASE_URL}/reports/revenue?startDate=2025-10-01&endDate=2025-10-31&period=daily`, {
      headers: {
        'Authorization': 'Bearer dev-mock-token'
      }
    });
    console.log('Reports API响应:', JSON.stringify(reportsResponse.data, null, 2));

    console.log('\n=== 调试完成 ===');

  } catch (error) {
    console.error('调试失败:', error.response?.data || error.message);
  }
}

debugDashboardDetailed();