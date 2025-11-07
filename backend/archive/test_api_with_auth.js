const axios = require('axios');

async function testAPIWithAuth() {
    try {
        console.log('=== 测试API数据一致性 ===\n');
        
        // 1. 先登录获取token
        console.log('1. 登录获取token...');
        const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
            email: 'a133128860897@163.com',
            password: 'Ddtb959322'
        });
        
        const token = loginResponse.data.data.token;
        console.log('登录成功，获取到token');
        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
        
        if (!token) {
            console.error('未获取到token，登录响应:', loginResponse.data);
            return;
        }
        
        console.log('Token:', token.substring(0, 50) + '...');
        
        // 2. 测试发票状态分布API
        console.log('\n2. 测试发票状态分布API...');
        const statusResponse = await axios.get('http://localhost:3002/api/dashboard/invoice-status-distribution?month=2025-09', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('发票状态分布API返回:');
        console.log(JSON.stringify(statusResponse.data, null, 2));
        
        // 3. 测试获取所有发票API
        console.log('\n3. 测试获取所有发票API...');
        const invoicesResponse = await axios.get('http://localhost:3002/api/invoices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('获取所有发票API响应:', JSON.stringify(invoicesResponse.data, null, 2));
        
        const invoices = invoicesResponse.data.data?.invoices || invoicesResponse.data.data || invoicesResponse.data;
        console.log(`获取所有发票API返回: 总计 ${invoices ? invoices.length : 0} 张发票`);
        
        if (invoices && Array.isArray(invoices)) {
            // 统计发票状态
            const statusCount = {};
            invoices.forEach(invoice => {
                statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
            });
            
            console.log('发票状态统计:');
            Object.entries(statusCount).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}张`);
            });
            
            // 4. 检查9月份的发票
            console.log('\n4. 检查2025年9月的发票...');
            const septemberInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.invoiceDate);
                return invoiceDate.getFullYear() === 2025 && invoiceDate.getMonth() === 8; // 9月是索引8
            });
            
            console.log(`2025年9月发票数量: ${septemberInvoices.length}张`);
            
            const septemberStatusCount = {};
            septemberInvoices.forEach(invoice => {
                septemberStatusCount[invoice.status] = (septemberStatusCount[invoice.status] || 0) + 1;
            });
            
            console.log('2025年9月发票状态统计:');
            Object.entries(septemberStatusCount).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}张`);
            });
        } else {
            console.log('发票数据格式异常或为空');
        }
        
    } catch (error) {
        console.error('测试失败:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('认证失败，可能是token无效或JWT_SECRET不匹配');
        }
    }
}

testAPIWithAuth();