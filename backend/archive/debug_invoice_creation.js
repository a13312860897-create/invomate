const axios = require('axios');

async function debugInvoiceCreation() {
  try {
    console.log('=== 调试发票创建过程 ===\n');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'a133128860897@163.com',
      password: 'Ddtb959322'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功，获取到token');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. 获取用户的客户端列表
    console.log('\n2. 获取客户端列表...');
    const clientsResponse = await axios.get('http://localhost:3002/api/clients', { headers });
    console.log('客户端API响应:', JSON.stringify(clientsResponse.data, null, 2));
    
    const clients = clientsResponse.data.data?.clients || clientsResponse.data.clients || clientsResponse.data || [];
    console.log(`✓ 找到 ${clients.length} 个客户端`);
    
    if (clients.length === 0) {
      console.log('⚠️ 没有客户端，创建一个测试客户端...');
      const newClientResponse = await axios.post('http://localhost:3002/api/clients', {
        name: 'Test Client',
        email: 'client@test.com',
        company: 'Test Company',
        address: '123 Test Street'
      }, { headers });
      
      clients.push(newClientResponse.data.client || newClientResponse.data.data);
      console.log('✓ 创建了测试客户端');
    }
    
    const clientId = clients[0].id;
    console.log(`使用客户端ID: ${clientId}`);
    
    // 3. 创建一张100,000€的发票
    console.log('\n3. 创建100,000€的发票...');
    const invoiceData = {
      clientId: clientId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'paid', // 标记为已支付
      notes: '测试发票 - 100,000€',
      subtotal: 100000.00,
      taxAmount: 20000.00, // 20% 税率
      total: 120000.00,
      totalAmount: 120000.00,
      items: [
        {
          description: '高价值服务',
          quantity: 1,
          unitPrice: 100000.00,
          taxRate: 20,
          taxAmount: 20000.00,
          total: 120000.00
        }
      ]
    };
    
    console.log('发送的发票数据:', JSON.stringify(invoiceData, null, 2));
    
    const createResponse = await axios.post('http://localhost:3002/api/invoices', invoiceData, { headers });
    
    console.log('✓ 发票创建响应:', JSON.stringify(createResponse.data, null, 2));
    
    const createdInvoice = createResponse.data.invoice;
    console.log(`✓ 创建了发票ID: ${createdInvoice.id}`);
    console.log(`发票金额: ${createdInvoice.total}€`);
    console.log(`发票状态: ${createdInvoice.status}`);
    
    // 4. 验证发票是否正确保存
    console.log('\n4. 验证发票数据...');
    const getResponse = await axios.get(`http://localhost:3002/api/invoices/${createdInvoice.id}`, { headers });
    const savedInvoice = getResponse.data.data.invoice;
    
    console.log('保存的发票数据:');
    console.log(`- ID: ${savedInvoice.id}`);
    console.log(`- 发票号: ${savedInvoice.invoiceNumber}`);
    console.log(`- 状态: ${savedInvoice.status}`);
    console.log(`- 小计: ${savedInvoice.subtotal}€`);
    console.log(`- 税额: ${savedInvoice.taxAmount}€`);
    console.log(`- 总计: ${savedInvoice.total}€`);
    console.log(`- 总金额: ${savedInvoice.totalAmount}€`);
    console.log(`- 创建时间: ${savedInvoice.createdAt}`);
    
    // 5. 检查发票项目
    if (savedInvoice.InvoiceItems && savedInvoice.InvoiceItems.length > 0) {
      console.log('\n发票项目:');
      savedInvoice.InvoiceItems.forEach((item, index) => {
        console.log(`项目 ${index + 1}:`);
        console.log(`  - 描述: ${item.description}`);
        console.log(`  - 数量: ${item.quantity}`);
        console.log(`  - 单价: ${item.unitPrice}€`);
        console.log(`  - 税率: ${item.taxRate}%`);
        console.log(`  - 税额: ${item.taxAmount}€`);
        console.log(`  - 总计: ${item.total}€`);
      });
    }
    
    // 6. 测试仪表板API
    console.log('\n5. 测试仪表板API...');
    
    // 测试发票状态分布
    const statusResponse = await axios.get('http://localhost:3002/api/reports/invoice-status', { headers });
    console.log('\n发票状态分布API响应:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // 测试仪表板统计
    const statsResponse = await axios.get('http://localhost:3002/api/dashboard/stats', { headers });
    console.log('\n仪表板统计API响应:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // 7. 检查数据一致性
    console.log('\n6. 数据一致性检查...');
    
    const allInvoicesResponse = await axios.get('http://localhost:3002/api/invoices', { headers });
    const allInvoices = allInvoicesResponse.data.data?.invoices || allInvoicesResponse.data.invoices || [];
    
    console.log(`总发票数量: ${allInvoices.length}`);
    
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
    console.log(`已支付发票数量: ${paidInvoices.length}`);
    
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => {
      const amount = parseFloat(inv.total || inv.totalAmount || 0);
      return sum + amount;
    }, 0);
    
    console.log(`已支付发票总金额: ${totalPaidAmount}€`);
    
    // 查找我们刚创建的发票
    const ourInvoice = allInvoices.find(inv => inv.id === createdInvoice.id);
    if (ourInvoice) {
      console.log('\n✓ 找到我们创建的发票:');
      console.log(`- ID: ${ourInvoice.id}`);
      console.log(`- 状态: ${ourInvoice.status}`);
      console.log(`- 金额: ${ourInvoice.total || ourInvoice.totalAmount}€`);
    } else {
      console.log('❌ 未找到我们创建的发票！');
    }
    
    return createdInvoice.id;
    
  } catch (error) {
    console.error('调试过程中出错:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('HTTP状态码:', error.response.status);
    }
  }
}

// 运行调试
debugInvoiceCreation().then(invoiceId => {
  if (invoiceId) {
    console.log(`\n=== 调试完成，创建的发票ID: ${invoiceId} ===`);
  }
}).catch(console.error);