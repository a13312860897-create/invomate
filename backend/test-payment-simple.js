const axios = require('axios');

async function testPaymentLink() {
    try {
        console.log('=== 测试支付链接生成 ===');
        
        // 1. 登录
        console.log('1. 登录...');
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        const token = loginRes.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取发票
        console.log('2. 获取发票列表...');
        const invoicesRes = await axios.get('http://localhost:8080/api/invoices', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const invoices = invoicesRes.data.data.invoices;
        console.log(`✅ 找到 ${invoices.length} 个发票`);
        
        if (invoices.length === 0) {
            console.log('❌ 没有发票可测试');
            return;
        }
        
        // 找到第一个未支付的发票
        const unpaidInvoice = invoices.find(inv => inv.status !== 'paid');
        if (!unpaidInvoice) {
            throw new Error('没有找到未支付的发票');
        }
        
        console.log(`使用发票: ${unpaidInvoice.invoiceNumber} (ID: ${unpaidInvoice.id}, 状态: ${unpaidInvoice.status})`);
        
        // 3. 生成支付链接
        console.log('3. 生成支付链接...');
        const paymentRes = await axios.post(`http://localhost:8080/api/invoices/${unpaidInvoice.id}/payment-link`, {
            paymentMethod: 'stripe'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ 支付链接生成成功!');
        console.log('支付URL:', paymentRes.data.data.paymentUrl);
        console.log('令牌:', paymentRes.data.data.token);
        
        // 4. 测试支付页面访问
        console.log('4. 测试支付页面访问...');
        const paymentToken = paymentRes.data.data.token;
        const pageRes = await axios.get(`http://localhost:8080/api/invoices/payment/${paymentToken}`);
        
        console.log('✅ 支付页面访问成功!');
        console.log('发票信息:', {
            number: pageRes.data.data.invoice.invoiceNumber,
            total: pageRes.data.data.invoice.total,
            client: pageRes.data.data.invoice.Client?.name
        });
        
        console.log('\n🎉 所有测试通过！支付链接系统工作正常。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.log('详细错误:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentLink();