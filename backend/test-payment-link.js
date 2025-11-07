const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPaymentLinkGeneration() {
    console.log('=== 测试支付链接生成功能 ===\n');

    try {
        // 1. 登录获取token
        console.log('1. 登录获取token...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            throw new Error('登录失败');
        }

        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');

        // 2. 获取发票列表
        console.log('\n2. 获取发票列表...');
        const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const invoices = invoicesResponse.data.data.invoices;
        console.log(`✅ 获取到 ${invoices.length} 个发票`);

        if (invoices.length === 0) {
            console.log('❌ 没有发票可测试');
            return;
        }

        // 使用最新的发票
        const testInvoice = invoices[0];
        console.log(`使用测试发票: ${testInvoice.invoiceNumber} (ID: ${testInvoice.id})`);

        // 3. 生成支付链接
        console.log('\n3. 生成支付链接...');
        const paymentLinkResponse = await axios.post(`${BASE_URL}/invoices/${testInvoice.id}/payment-link`, {
            paymentMethod: 'stripe'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (paymentLinkResponse.data.success) {
            console.log('✅ 支付链接生成成功！');
            console.log('支付链接:', paymentLinkResponse.data.data.paymentUrl);
            console.log('令牌:', paymentLinkResponse.data.data.token);
            console.log('过期时间:', paymentLinkResponse.data.data.expiresAt);

            // 4. 测试支付链接访问
            console.log('\n4. 测试支付链接访问...');
            const token_for_payment = paymentLinkResponse.data.data.token;
            
            try {
                const paymentPageResponse = await axios.get(`${BASE_URL}/invoices/payment/${token_for_payment}`);
                
                if (paymentPageResponse.data.success) {
                    console.log('✅ 支付页面访问成功！');
                    console.log('发票信息:', {
                        invoiceNumber: paymentPageResponse.data.data.invoice.invoiceNumber,
                        total: paymentPageResponse.data.data.invoice.total,
                        clientName: paymentPageResponse.data.data.invoice.Client?.name
                    });
                } else {
                    console.log('❌ 支付页面访问失败:', paymentPageResponse.data.message);
                }
            } catch (error) {
                console.log('❌ 支付页面访问出错:', error.response?.data?.message || error.message);
            }

        } else {
            console.log('❌ 支付链接生成失败:', paymentLinkResponse.data.message);
        }

    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentLinkGeneration();