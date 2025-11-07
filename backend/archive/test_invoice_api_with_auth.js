const axios = require('axios');

async function testInvoiceAPIWithAuth() {
  try {
    console.log('🔍 测试发票API端点（带认证）...');
    
    // 使用开发模式的模拟token
    console.log('\n1. 使用开发模式模拟token');
    
    // 设置认证头
    const authHeaders = {
      'Authorization': 'Bearer dev-mock-token',
      'Content-Type': 'application/json'
    };
    
    // 测试获取发票列表
    console.log('\n2. 测试获取发票列表 (GET /api/invoices)');
    const response = await axios.get('http://localhost:3002/api/invoices', {
      headers: authHeaders
    });
    
    console.log('✅ API响应状态:', response.status);
    console.log('📊 返回的发票数量:', response.data.invoices ? response.data.invoices.length : 0);
    
    if (response.data.invoices && response.data.invoices.length > 0) {
      console.log('📋 前5张发票信息:');
      response.data.invoices.slice(0, 5).forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.invoiceNumber} - ${invoice.status} - €${invoice.amount} - ${invoice.issueDate}`);
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
      
      // 检查十月份发票
      const octoberInvoices = response.data.invoices.filter(invoice => {
        const issueDate = new Date(invoice.issueDate);
        return issueDate.getMonth() === 9 && issueDate.getFullYear() === 2024; // 10月是索引9
      });
      
      console.log(`\n📅 十月份发票数量: ${octoberInvoices.length} 张`);
      
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

testInvoiceAPIWithAuth();