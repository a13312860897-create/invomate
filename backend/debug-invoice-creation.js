const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugInvoiceCreation() {
    try {
        console.log('=== 调试发票创建 ===');
        
        // 1. 登录
        console.log('\n1. 登录...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取客户列表
        console.log('\n2. 获取客户列表...');
        const clientsResponse = await axios.get(`${BASE_URL}/clients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const clients = clientsResponse.data.data.clients;
        console.log(`✅ 获取到 ${clients.length} 个客户`);
        console.log('客户信息:', clients.map(c => ({ id: c.id, name: c.name })));
        
        // 3. 创建测试发票
        console.log('\n3. 创建测试发票...');
        const invoiceData = {
            clientId: clients[0].id,
            issueDate: '2025-01-15',
            dueDate: '2025-02-14',
            status: 'draft',
            subtotal: 100,
            taxAmount: 20,
            total: 120,
            notes: '调试测试发票',
            items: [
                {
                    description: '调试测试服务',
                    quantity: 1,
                    unitPrice: 100,
                    taxRate: 20
                }
            ]
        };
        
        console.log('发送的发票数据:', JSON.stringify(invoiceData, null, 2));
        
        const createResponse = await axios.post(`${BASE_URL}/invoices`, invoiceData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 发票创建成功!');
        console.log('创建的发票:', createResponse.data);
        
    } catch (error) {
        console.error('\n❌ 错误详情:');
        console.error('状态码:', error.response?.status);
        console.error('状态文本:', error.response?.statusText);
        console.error('错误数据:', JSON.stringify(error.response?.data, null, 2));
        console.error('错误消息:', error.message);
        
        if (error.response?.data?.details) {
            console.error('详细信息:', error.response.data.details);
        }
    }
}

debugInvoiceCreation();