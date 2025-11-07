const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function testEmailSending() {
  try {
    console.log('🚀 开始测试邮件发送功能...');

    // 1. 登录获取token
    console.log('\n📝 步骤1: 登录获取token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: 'password123'
    });

    let token;
    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
    } else if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.token) {
      token = loginResponse.data.data.token;
    }

    if (!token) {
      console.error('❌ 无法获取token');
      console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
      throw new Error('登录失败，无法获取token');
    }

    console.log('✅ 登录成功，token已获取');

    // 2. 获取客户列表
    console.log('\n📋 步骤2: 获取客户列表...');
    const clientsResponse = await axios.get(`${API_BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let clients = [];
    if (clientsResponse.data && Array.isArray(clientsResponse.data)) {
      clients = clientsResponse.data;
    } else if (clientsResponse.data && clientsResponse.data.data && Array.isArray(clientsResponse.data.data)) {
      clients = clientsResponse.data.data;
    } else if (clientsResponse.data && clientsResponse.data.clients && Array.isArray(clientsResponse.data.clients)) {
      clients = clientsResponse.data.clients;
    }

    let testClient;
    if (clients.length > 0) {
      testClient = clients[0];
      console.log(`✅ 使用现有客户: ${testClient.name}`);
    } else {
      // 创建测试客户
      console.log('📝 创建测试客户...');
      const createClientResponse = await axios.post(`${API_BASE_URL}/clients`, {
        name: 'Test Client',
        email: 'testclient@example.com',
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'France'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      testClient = createClientResponse.data.data || createClientResponse.data;
      console.log(`✅ 测试客户创建成功: ${testClient.name}`);
    }

    // 3. 创建测试发票
    console.log('\n📄 步骤3: 创建测试发票...');
    const invoiceData = {
      invoiceNumber: 'FR-2025-000009',
      clientId: testClient.id,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          description: 'Test Service',
          quantity: 1,
          unitPrice: 100,
          total: 100
        }
      ],
      subtotal: 100,
      taxRate: 20,
      taxAmount: 20,
      total: 120
    };

    const createInvoiceResponse = await axios.post(`${API_BASE_URL}/invoices`, invoiceData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const invoice = createInvoiceResponse.data.data || createInvoiceResponse.data;
    console.log(`✅ 测试发票创建成功，ID: ${invoice.id}`);

    // 4. 测试邮件发送
    console.log('\n📧 步骤4: 测试邮件发送...');
    const emailData = {
      invoiceId: invoice.id,
      recipientEmail: 'test@example.com',
      subject: '测试发票邮件',
      customText: '这是一封测试邮件'
    };

    const emailResponse = await axios.post(`${API_BASE_URL}/ai/send-invoice-email`, emailData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ 邮件发送成功！');
    console.log('📧 邮件发送结果:', JSON.stringify(emailResponse.data, null, 2));

    console.log('\n🎉 所有测试通过！邮件发送功能已修复。');

  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testEmailSending();