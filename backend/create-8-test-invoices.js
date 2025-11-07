const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function create8TestInvoices() {
    try {
        console.log('=== 创建8张测试发票 ===');
        
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
        
        // 3. 创建8张测试发票
        const statuses = ['draft', 'sent', 'paid', 'overdue'];
        let successCount = 0;
        
        for (let i = 0; i < 8; i++) {
            try {
                const client = clients[i % clients.length];
                const status = statuses[i % statuses.length];
                
                // 生成不同的日期
                const issueDate = new Date();
                issueDate.setDate(issueDate.getDate() - (i * 2));
                
                const dueDate = new Date(issueDate);
                dueDate.setDate(dueDate.getDate() + 30);
                
                const invoiceData = {
                    clientId: client.id,
                    issueDate: issueDate.toISOString().split('T')[0],
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: status,
                    subtotal: 100 + (i * 50),
                    taxAmount: 20 + (i * 10),
                    total: 120 + (i * 60),
                    notes: `测试发票 ${i + 1} - 用于验证翻页功能`,
                    items: [
                        {
                            description: `测试服务项目 ${i + 1}`,
                            quantity: 1 + i,
                            unitPrice: 100 + (i * 10),
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
                
                console.log(`✅ 发票 ${i + 1} 创建成功 (${createResponse.data.data.invoice.invoiceNumber})`);
                successCount++;
                
                // 添加小延迟避免并发问题
                await new Promise(resolve => setTimeout(resolve, 100));
                
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

create8TestInvoices();