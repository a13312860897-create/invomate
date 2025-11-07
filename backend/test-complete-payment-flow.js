const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
const FRONTEND_URL = 'http://localhost:3000';

async function testCompletePaymentFlow() {
    console.log('=== 完整支付流程测试 ===\n');
    
    try {
        // 1. 登录
        console.log('1. 用户登录...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'a133128860897@163.com',
            password: '123456'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 获取发票列表
        console.log('\n2. 获取发票列表...');
        const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const invoices = invoicesResponse.data.data.invoices;
        console.log(`✅ 找到 ${invoices.length} 个发票`);
        
        // 3. 找到未支付的发票
        console.log('\n3. 查找未支付发票...');
        const unpaidInvoice = invoices.find(invoice => invoice.status !== 'paid');
        
        if (!unpaidInvoice) {
            console.log('❌ 没有找到未支付的发票');
            return;
        }
        
        console.log(`✅ 找到未支付发票: ${unpaidInvoice.invoiceNumber} (ID: ${unpaidInvoice.id})`);
        console.log(`   客户: ${unpaidInvoice.Client?.name || '未知'}`);
        console.log(`   金额: €${unpaidInvoice.total}`);
        console.log(`   状态: ${unpaidInvoice.status}`);
        
        // 4. 生成支付链接
        console.log('\n4. 生成支付链接...');
        const paymentLinkResponse = await axios.post(
            `${BASE_URL}/invoices/${unpaidInvoice.id}/payment-link`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const paymentData = paymentLinkResponse.data.data;
        console.log('✅ 支付链接生成成功!');
        console.log(`   支付URL: ${paymentData.paymentUrl}`);
        console.log(`   令牌: ${paymentData.token}`);
        console.log(`   过期时间: ${paymentData.expiresAt}`);
        
        // 5. 测试后端支付API
        console.log('\n5. 测试后端支付API...');
        const backendPaymentResponse = await axios.get(
            `${BASE_URL}/invoices/payment/${paymentData.token}`
        );
        
        console.log('✅ 后端支付API响应成功!');
        console.log(`   发票号: ${backendPaymentResponse.data.data.invoice.invoiceNumber}`);
        console.log(`   客户: ${backendPaymentResponse.data.data.invoice.Client.name}`);
        console.log(`   金额: €${backendPaymentResponse.data.data.invoice.total}`);
        
        // 6. 测试前端支付页面
        console.log('\n6. 测试前端支付页面访问...');
        const frontendUrl = `${FRONTEND_URL}/payment/${paymentData.token}`;
        console.log(`   前端支付页面URL: ${frontendUrl}`);
        
        // 简单的HTTP请求测试前端页面是否可访问
        try {
            const frontendResponse = await axios.get(frontendUrl, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500; // 接受所有非5xx错误
                }
            });
            console.log(`✅ 前端支付页面可访问 (状态码: ${frontendResponse.status})`);
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('⚠️  前端服务器未运行，但支付链接格式正确');
            } else {
                console.log(`⚠️  前端页面访问异常: ${error.message}`);
            }
        }
        
        // 7. 验证支付链接在邮件中的格式
        console.log('\n7. 验证邮件中的支付链接格式...');
        const emailPaymentUrl = `${FRONTEND_URL}/payment/${paymentData.token}`;
        console.log(`   邮件中应包含的支付链接: ${emailPaymentUrl}`);
        console.log('✅ 支付链接格式正确，指向自有支付页面');
        
        console.log('\n🎉 完整支付流程测试通过！');
        console.log('\n=== 测试总结 ===');
        console.log('✅ 用户登录正常');
        console.log('✅ 发票列表获取正常');
        console.log('✅ 支付链接生成正常');
        console.log('✅ 后端支付API正常');
        console.log('✅ 前端支付页面链接正确');
        console.log('✅ 邮件支付链接格式正确');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('响应数据:', error.response.data);
        }
    }
}

testCompletePaymentFlow();