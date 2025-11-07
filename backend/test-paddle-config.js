require('dotenv').config();

async function testPaddleConfig() {
    console.log('🧪 检查Paddle配置和环境变量...\n');

    // 1. 检查环境变量
    console.log('🔍 检查环境变量:');
    console.log('==================================================');
    console.log('PADDLE_VENDOR_ID:', process.env.PADDLE_VENDOR_ID ? '✅ 已设置' : '❌ 未设置');
    console.log('PADDLE_API_KEY:', process.env.PADDLE_API_KEY ? '✅ 已设置' : '❌ 未设置');
    console.log('PADDLE_ENVIRONMENT:', process.env.PADDLE_ENVIRONMENT || '未设置');
    console.log('PADDLE_WEBHOOK_SECRET:', process.env.PADDLE_WEBHOOK_SECRET ? '✅ 已设置' : '❌ 未设置');
    console.log('==================================================\n');

    // 2. 检查Paddle服务配置
    console.log('🔍 检查Paddle服务配置:');
    try {
        const PaddleService = require('./src/services/paddleService');
        const paddleService = new PaddleService();
        
        console.log('✅ PaddleService 实例化成功');
        
        // 检查是否使用模拟模式
        const isUsingMock = !process.env.PADDLE_API_KEY || process.env.PADDLE_ENVIRONMENT === 'test';
        console.log('🎭 使用模拟模式:', isUsingMock ? '是' : '否');
        
    } catch (error) {
        console.log('❌ PaddleService 实例化失败:', error.message);
    }

    // 3. 测试支付链接生成
    console.log('\n🔍 测试支付链接生成:');
    try {
        const InvoicePaymentService = require('./src/services/invoicePaymentService');
        const paymentService = new InvoicePaymentService();
        
        const testInvoice = {
            id: 'paddle-config-test-' + Date.now(),
            invoiceNumber: 'INV-PADDLE-TEST-001',
            total: 99.99,
            customerName: 'Paddle配置测试客户'
        };
        
        console.log('📊 测试发票数据:', testInvoice);
        
        const paymentResult = await paymentService.createPaymentLink(testInvoice);
        
        console.log('📧 支付链接生成结果:');
        console.log('- 成功:', paymentResult.success ? '✅' : '❌');
        console.log('- 支付URL:', paymentResult.paymentUrl || '无');
        console.log('- 错误:', paymentResult.error || '无');
        
        if (paymentResult.success) {
            console.log('✅ 支付链接生成正常');
        } else {
            console.log('❌ 支付链接生成失败:', paymentResult.error);
        }
        
    } catch (error) {
        console.log('❌ 支付链接测试失败:', error.message);
    }

    // 4. 测试邮件模板生成
    console.log('\n🔍 测试邮件模板生成:');
    try {
        const EmailService = require('./src/services/emailService');
        const emailService = new EmailService();
        await emailService.initializeTransporter();
        
        const testInvoiceForEmail = {
            id: 'email-template-test-' + Date.now(),
            invoiceNumber: 'INV-EMAIL-TEST-001',
            total: 149.99,
            customerName: '邮件模板测试客户',
            dueDate: '2024-12-31'
        };
        
        const emailContent = await emailService.generateEmailContent(testInvoiceForEmail);
        
        console.log('📧 邮件模板生成结果:');
        console.log('- HTML长度:', emailContent.html.length);
        console.log('- 文本长度:', emailContent.text.length);
        
        // 检查支付相关内容
        const hasPaymentButton = emailContent.html.includes('立即支付发票') || 
                                emailContent.html.includes('Pay Invoice');
        const hasPaymentLink = emailContent.html.includes('https://') && 
                              emailContent.html.includes('checkout');
        const hasPaymentError = emailContent.html.includes('支付链接生成失败') ||
                               emailContent.html.includes('Payment link generation failed');
        
        console.log('- 包含支付按钮:', hasPaymentButton ? '✅' : '❌');
        console.log('- 包含支付链接:', hasPaymentLink ? '✅' : '❌');
        console.log('- 支付错误状态:', hasPaymentError ? '❌ 有错误' : '✅ 无错误');
        
        if (!hasPaymentButton) {
            console.log('\n❌ 邮件模板中缺少支付按钮！');
            console.log('🔍 HTML内容片段:');
            const lines = emailContent.html.split('\n');
            lines.forEach((line, index) => {
                if (line.includes('支付') || line.includes('Payment') || 
                    line.includes('checkout') || line.includes('button') ||
                    line.includes('立即') || line.includes('失败')) {
                    console.log(`第${index+1}行: ${line.trim()}`);
                }
            });
        }
        
    } catch (error) {
        console.log('❌ 邮件模板测试失败:', error.message);
    }

    // 5. 总结
    console.log('\n📊 Paddle配置检查总结:');
    console.log('==================================================');
    
    const hasRequiredEnvVars = process.env.PADDLE_VENDOR_ID && process.env.PADDLE_API_KEY;
    console.log(`${hasRequiredEnvVars ? '✅' : '❌'} 环境变量: ${hasRequiredEnvVars ? '完整' : '缺失'}`);
    
    const isInTestMode = !process.env.PADDLE_API_KEY || process.env.PADDLE_ENVIRONMENT === 'test';
    console.log(`${isInTestMode ? '🎭' : '🔗'} 运行模式: ${isInTestMode ? '测试/模拟' : '生产'}`);
    
    console.log('==================================================');
    
    if (!hasRequiredEnvVars) {
        console.log('\n⚠️ 建议检查:');
        console.log('1. 确保 .env 文件中设置了 PADDLE_VENDOR_ID 和 PADDLE_API_KEY');
        console.log('2. 检查 Paddle 账户配置');
        console.log('3. 验证 API 密钥是否有效');
    }
    
    if (isInTestMode) {
        console.log('\n🎭 当前使用模拟模式，支付按钮应该正常显示');
    }
}

// 运行测试
testPaddleConfig().catch(console.error);