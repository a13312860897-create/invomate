const axios = require('axios');

async function testTaxReport() {
  try {
    console.log('测试税务报告API...');
    
    const response = await axios.get('http://localhost:8080/api/reports/tax', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('API响应状态:', response.status);
    console.log('\n=== 税务报告数据 ===');
    console.log('Period:', response.data.period);
    
    console.log('\n=== Summary ===');
    console.log('Total Subtotal:', response.data.summary?.totalSubtotal);
    console.log('Total Tax:', response.data.summary?.totalTax);
    console.log('Total Amount:', response.data.summary?.totalAmount);
    console.log('Invoice Count:', response.data.summary?.invoiceCount);
    console.log('VAT Collected:', response.data.summary?.vatCollected);
    console.log('VAT Pending:', response.data.summary?.vatPending);
    
    console.log('\n=== Tax By Rate ===');
    if (response.data.taxByRate && response.data.taxByRate.length > 0) {
      response.data.taxByRate.forEach((item, index) => {
        console.log(`Tax Rate ${index + 1}:`);
        console.log('  - Rate:', item.rate, '%');
        console.log('  - Tax Rate:', item.taxRate, '%');
        console.log('  - Amount:', item.amount);
        console.log('  - Tax Amount:', item.taxAmount);
        console.log('  - Subtotal:', item.subtotal);
        console.log('  - Count:', item.count);
      });
    } else {
      console.log('没有税率分布数据');
    }
    
    console.log('\n=== Quarterly Tax ===');
    if (response.data.quarterlyTax && response.data.quarterlyTax.length > 0) {
      response.data.quarterlyTax.forEach((quarter, index) => {
        console.log(`Quarter ${index + 1}:`);
        console.log('  - Quarter:', quarter.quarter);
        console.log('  - Total Revenue:', quarter.totalRevenue);
        console.log('  - Tax Amount:', quarter.taxAmount);
      });
    } else {
      console.log('没有季度税务数据');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testTaxReport();