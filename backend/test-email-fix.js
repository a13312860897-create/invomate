const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080';

async function testEmailFunctionality() {
  console.log('=== 测试修复后的邮件发送功能 ===');
  
  try {
    // 1. 登录获取token
    console.log('\n1. 登录获取token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('✅ 登录成功，获取到token:', token ? '存在' : '不存在');
    console.log('登录响应数据:', loginResponse.data);
    
    if (!token) {
      throw new Error('未能获取到有效的token');
    }
    
    // 2. 获取客户列表
    console.log('\n2. 获取客户列表...');
    const clientsResponse = await axios.get(`${API_BASE_URL}/api/clients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('客户响应数据:', clientsResponse.data);
    
    let clients;
    if (clientsResponse.data.data && clientsResponse.data.data.clients && Array.isArray(clientsResponse.data.data.clients)) {
      clients = clientsResponse.data.data.clients;
    } else if (clientsResponse.data.data && Array.isArray(clientsResponse.data.data)) {
      clients = clientsResponse.data.data;
    } else if (Array.isArray(clientsResponse.data)) {
      clients = clientsResponse.data;
    } else {
      clients = [];
    }
    
    console.log(`✅ 获取到 ${clients.length} 个客户`);
    
    if (clients.length === 0) {
      // 创建一个测试客户
      console.log('没有客户，创建测试客户...');
      const testClientData = {
        name: '测试客户',
        email: 'test@example.com',
        address: '测试地址',
        phone: '1234567890'
      };
      
      const createClientResponse = await axios.post(`${API_BASE_URL}/api/clients`, testClientData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let newClient;
      if (createClientResponse.data.success && createClientResponse.data.data) {
        newClient = createClientResponse.data.data;
      } else if (createClientResponse.data.id) {
        newClient = createClientResponse.data;
      } else {
        throw new Error('创建测试客户失败');
      }
      
      clients = [newClient];
      console.log('✅ 创建测试客户成功');
    }
    
    const testClient = clients[0];
    console.log('使用测试客户:', testClient.name, testClient.email);
    
    // 3. 创建测试发票
    console.log('\n3. 创建测试发票...');
    
    // 使用建议的发票编号
    const nextInvoiceNumber = 'FR-2025-000002'; // 使用建议的编号
    console.log('使用发票编号:', nextInvoiceNumber);
    
    const invoiceData = {
      clientId: testClient.id,
      invoiceNumber: nextInvoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'sent',
      items: [
        {
          description: '邮件测试服务',
          quantity: 1,
          unitPrice: 100,
          taxRate: 20
        }
      ],
      subtotal: 100,
      taxAmount: 20,
      total: 120,
      totalAmount: 120
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/api/invoices`, invoiceData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    let invoice;
    if (createResponse.data.success && createResponse.data.data && createResponse.data.data.invoice) {
      invoice = createResponse.data.data.invoice;
    } else if (createResponse.data.id) {
      invoice = createResponse.data;
    } else {
      throw new Error('创建发票失败：响应格式错误');
    }
    
    console.log(`✅ 创建发票成功，ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}`);
    
    // 4. 测试邮件发送
    console.log('\n4. 测试邮件发送...');
    const emailPayload = {
      invoiceId: invoice.id,
      recipientEmail: testClient.email,
      type: 'invoice',
      attachPDF: true,
      useUserConfig: true
    };
    
    console.log('邮件发送payload:', emailPayload);
    
    const emailResponse = await axios.post(`${API_BASE_URL}/api/ai/send-invoice-email`, emailPayload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('邮件发送响应:', emailResponse.data);
    
    if (emailResponse.data.success) {
      console.log('✅ 邮件发送成功！');
      console.log('收件人:', emailResponse.data.data.recipient);
      console.log('消息ID:', emailResponse.data.data.messageId);
    } else {
      console.log('❌ 邮件发送失败:', emailResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testEmailFunctionality();