const axios = require('axios');

async function testInvoiceAPI() {
  try {
    console.log('🔍 测试发票API端点...');
    
    // 测试获取发票列表
    console.log('\n1. 测试获取发票列表 (GET /api/invoices)');
    const response = await axios.get('http://localhost:3002/api/invoices');
    
    console.log('✅ API响应状态:', response.status);
    console.log('📊 返回的发票数量:', response.data.invoices ? response.data.invoices.length : 0);
    
    if (response.data.invoices && response.data.invoices.length > 0) {
      console.log('📋 前3张发票信息:');
      response.data.invoices.slice(0, 3).forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.invoiceNumber} - ${invoice.status} - €${invoice.amount}`);
      });
      
      // 按状态统计
      const statusCounts = {};
      response.data.invoices.forEach(invoice => {
        statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
      });
      
      console.log('\n📈 发票状态统计:');
      Object.keys(statusCounts).forEach(status => {
        console.log(`  ${status}: ${statusCounts[status]} 张`);
      });
    } else {
      console.log('⚠️  没有返回发票数据');
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testInvoiceAPI();