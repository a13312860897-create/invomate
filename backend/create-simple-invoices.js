const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function createSimpleInvoices() {
    try {
        console.log('=== 创建测试发票 ===');
        
        // 1. 登录
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取客户列表
        const clientsResponse = await axios.get(`${BASE_URL}/clients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const clients = clientsResponse.data.data.clients;
        console.log(`✅ 获取到 ${clients.length} 个客户`);
        
        // 3. 创建多张测试发票（使用成功的格式）
        const statuses = ['draft', 'sent', 'paid', 'overdue'];
        let successCount = 0;
        
        for (let i = 0; i < 8; i++) {
            try {
                const client = clients[i % clients.length];
                const status = statuses[i % statuses.length];
                
                // 使用之前成功的数据格式
                const invoiceData = {
                    clientId: client.id,
                    issueDate: '2025-01-15',
                    dueDate: '2025-02-14',
                    status: status,
                    subtotal: 100,
                    taxAmount: 20,
                    total: 120,
                    notes: `测试发票 ${i + 1} - 用于验证翻页功能`,
                    items: [
                        {
                            description: `测试服务项目 ${i + 1}`,
                            quantity: 1,
                            unitPrice: 100,
                            taxRate: 20
                        }
                    ]
                };
                
                const createResponse = await axios.post(`${BASE_URL}/invoices`, invoiceData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`✅ 发票 ${i + 1} 创建成功 (${createResponse.data.data.invoice.invoiceNumber}) - 状态: ${status}`);
                successCount++;
                
                // 添加延迟避免并发问题
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.log(`❌ 发票 ${i + 1} 创建失败:`, error.response?.data?.message || error.message);
            }
        }
        
        console.log(`\n=== 创建完成 ===`);
        console.log(`✅ 成功创建 ${successCount}/8 张测试发票`);
        console.log('现在可以在前端界面验证翻页功能了！');
        
    } catch (error) {
        console.error('❌ 脚本执行失败:', error.message);
    }
}

createSimpleInvoices();