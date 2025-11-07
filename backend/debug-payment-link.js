const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugPaymentLink() {
    console.log('=== 调试支付链接生成 ===\n');
    
    try {
        // 1. 登录
        console.log('1. 登录...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取发票
        console.log('\n2. 获取发票...');
        const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const invoices = invoicesResponse.data.data.invoices;
        const unpaidInvoice = invoices.find(invoice => invoice.status !== 'paid');
        console.log(`✅ 找到未支付发票: ${unpaidInvoice.invoiceNumber} (ID: ${unpaidInvoice.id})`);
        
        // 3. 生成支付链接
        console.log('\n3. 生成支付链接...');
        const paymentLinkResponse = await axios.post(
            `${BASE_URL}/invoices/${unpaidInvoice.id}/payment-link`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('支付链接响应状态码:', paymentLinkResponse.status);
        console.log('支付链接响应数据:', JSON.stringify(paymentLinkResponse.data, null, 2));
        
        // 4. 测试后端支付API
        const paymentToken = paymentLinkResponse.data.data.token;
        console.log('\n4. 测试后端支付API...');
        const backendPaymentResponse = await axios.get(
            `${BASE_URL}/invoices/payment/${paymentToken}`
        );
        
        console.log('后端支付API响应状态码:', backendPaymentResponse.status);
        console.log('后端支付API响应数据:', JSON.stringify(backendPaymentResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ 错误:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('状态码:', error.response.status);
        }
    }
}

debugPaymentLink();