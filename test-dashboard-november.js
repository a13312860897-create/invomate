const axios = require('axios');

// 测试Dashboard是否正确显示11月份数据
async function testDashboardNovember() {
  const baseURL = 'http://localhost:8080';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTczMDA3NzI5MX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

  try {
    console.log('=== 测试Dashboard 11月份数据显示 ===\n');

    // 1. 测试统计数据API (2025年11月)
    console.log('1. 测试Dashboard统计数据API (2025-11):');
    const statsResponse = await axios.get(`${baseURL}/api/dashboard/dashboard-stats`, {
      params: {
        period: 'monthly',
        month: '2025-11'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('统计数据响应:', JSON.stringify(statsResponse.data, null, 2));
    console.log(`- 总收入: ${statsResponse.data.totalRevenue}`);
    console.log(`- 总发票数: ${statsResponse.data.totalInvoices}`);
    console.log(`- 待处理发票数: ${statsResponse.data.pendingInvoices}`);
    console.log('');

    // 2. 测试统一图表数据API (2025年11月)
    console.log('2. 测试Dashboard统一图表数据API (2025-11):');
    const chartResponse = await axios.get(`${baseURL}/api/dashboard/stats`, {
      params: {
        period: 'monthly',
        month: '2025-11'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('图表数据响应:', JSON.stringify(chartResponse.data, null, 2));
    console.log(`- 总收入: ${chartResponse.data.totalRevenue}`);
    console.log(`- 总发票数: ${chartResponse.data.totalInvoices}`);
    console.log(`- 收入趋势数据点数: ${chartResponse.data.revenueTrend?.data?.length || 0}`);
    console.log('');

    // 3. 检查发票数据中是否有11月份的发票
    console.log('3. 检查发票数据中的11月份发票:');
    const invoicesResponse = await axios.get(`${baseURL}/api/invoices`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const invoices = invoicesResponse.data;
    console.log(`总发票数: ${invoices.length}`);
    
    // 筛选11月份的发票（按支付日期）
    const novemberInvoices = invoices.filter(invoice => {
      if (!invoice.paidDate) return false;
      const paidDate = new Date(invoice.paidDate);
      return paidDate.getFullYear() === 2025 && paidDate.getMonth() === 10; // 11月是索引10
    });
    
    console.log(`11月份已支付发票数: ${novemberInvoices.length}`);
    
    if (novemberInvoices.length > 0) {
      const totalAmount = novemberInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);
      console.log(`11月份总收入: ${totalAmount}`);
      console.log('11月份发票详情:');
      novemberInvoices.forEach(inv => {
        console.log(`  - ID: ${inv.id}, 金额: ${inv.totalAmount || inv.total}, 支付日期: ${inv.paidDate}`);
      });
    } else {
      console.log('没有找到11月份的已支付发票');
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testDashboardNovember();