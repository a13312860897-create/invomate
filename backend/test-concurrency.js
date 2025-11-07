const axios = require('axios');

// 测试并发发票创建
async function testConcurrentInvoiceCreation() {
  console.log('开始测试并发发票创建...\n');
  
  const baseURL = 'http://localhost:8080';
  
  // 模拟用户登录获取token
  const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
    email: 'a133128860897@163.com',
    password: '123456'
  });
  
  console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
  
  if (!loginResponse.data.success) {
    console.error('登录失败:', loginResponse.data);
    return;
  }
  
  const token = loginResponse.data.token || loginResponse.data.data?.token;
  console.log('登录成功，获取到token:', token ? 'Token已获取' : 'Token为空');
  
  // 准备发票数据
  const invoiceData = {
    clientId: 1,
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    items: [
      {
        description: '测试服务',
        quantity: 1,
        unitPrice: 100,
        taxRate: 20,
        taxAmount: 20,
        total: 120
      }
    ],
    subtotal: 100,
    taxAmount: 20,
    total: 120,
    notes: '并发测试发票'
  };
  
  // 创建多个并发请求
  const concurrentRequests = [];
  const requestCount = 5;
  
  console.log(`创建 ${requestCount} 个并发请求...\n`);
  
  for (let i = 0; i < requestCount; i++) {
    const request = axios.post(`${baseURL}/api/invoices`, invoiceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      console.log(`请求 ${i + 1} 成功:`, {
        invoiceNumber: response.data.data.invoice.invoiceNumber,
        id: response.data.data.invoice.id
      });
      return { success: true, requestId: i + 1, data: response.data };
    }).catch(error => {
      console.log(`请求 ${i + 1} 失败:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        error: error.response?.data?.error
      });
      return { success: false, requestId: i + 1, error: error.response?.data || error.message };
    });
    
    concurrentRequests.push(request);
  }
  
  // 等待所有请求完成
  const results = await Promise.all(concurrentRequests);
  
  console.log('\n=== 测试结果汇总 ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`成功请求数: ${successful.length}`);
  console.log(`失败请求数: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n成功创建的发票编号:');
    successful.forEach(result => {
      console.log(`- 请求 ${result.requestId}: ${result.data.data.invoice.invoiceNumber}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n失败的请求:');
    failed.forEach(result => {
      console.log(`- 请求 ${result.requestId}: ${result.error.message || result.error}`);
    });
  }
  
  // 检查是否有重复的发票编号
  const invoiceNumbers = successful.map(r => r.data.data.invoice.invoiceNumber);
  const uniqueNumbers = [...new Set(invoiceNumbers)];
  
  if (invoiceNumbers.length === uniqueNumbers.length) {
    console.log('\n✅ 测试通过：没有重复的发票编号');
  } else {
    console.log('\n❌ 测试失败：发现重复的发票编号');
    console.log('所有编号:', invoiceNumbers);
    console.log('唯一编号:', uniqueNumbers);
  }
}

// 运行测试
testConcurrentInvoiceCreation().catch(error => {
  console.error('测试执行失败:', error);
});