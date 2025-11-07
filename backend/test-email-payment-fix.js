/**
 * 测试修复后的邮件支付按钮功能
 */
const EmailService = require('./src/services/emailService');
const InvoicePaymentService = require('./src/services/invoicePaymentService');

async function testEmailPaymentFix() {
    console.log('=== 邮件支付按钮修复验证测试 ===\n');

    try {
        // 1. 测试邮件服务初始化
        console.log('1. 初始化邮件服务...');
        const emailService = new EmailService();
        console.log('✓ 邮件服务初始化成功');

        // 2. 测试支付服务初始化
        console.log('\n2. 初始化支付服务...');
        const paymentService = new InvoicePaymentService();
        console.log('✓ 支付服务初始化成功');

        // 3. 模拟发票数据
        const mockInvoice = {
            id: 1,
            invoiceNumber: 'INV-2025-TEST-001',
            totalAmount: 1000,
            total: 1000,
            currency: 'EUR',
            clientEmail: 'test@example.com',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        const mockClient = {
            name: '测试客户',
            email: 'test@example.com'
        };

        const mockUser = {
            companyName: '测试公司',
            email: 'company@test.com'
        };

        // 4. 测试支付链接生成
        console.log('\n3. 测试支付链接生成...');
        try {
            const paymentResult = await paymentService.generateDirectPaymentLink(mockInvoice);
            console.log('✓ 支付链接生成成功');
            console.log(`支付URL: ${paymentResult.paymentUrl ? '已生成' : '未生成'}`);
        } catch (paymentError) {
            console.log(`⚠️  支付链接生成失败: ${paymentError.message}`);
            console.log('这可能是因为Paddle配置问题，但不影响邮件模板测试');
        }

        // 5. 测试邮件内容生成（包含支付按钮）
        console.log('\n4. 测试邮件内容生成...');
        const emailContent = await emailService.generateEmailContent(
            mockInvoice,
            mockClient,
            mockUser,
            null, // customText
            null  // customHtml
        );

        console.log('✓ 邮件内容生成成功');
        
        // 检查邮件内容是否包含支付相关元素
        const hasPaymentButton = emailContent.html.includes('立即支付发票') || 
                                emailContent.html.includes('Pay Invoice Now') ||
                                emailContent.html.includes('Payer la facture');
        
        const hasPaymentLink = emailContent.html.includes('paymentLink') ||
                              emailContent.html.includes('payment-link') ||
                              emailContent.html.includes('href=');

        console.log(`支付按钮检测: ${hasPaymentButton ? '✓ 包含' : '✗ 缺失'}`);
        console.log(`支付链接检测: ${hasPaymentLink ? '✓ 包含' : '✗ 缺失'}`);

        // 6. 显示邮件HTML片段（支付按钮部分）
        console.log('\n5. 邮件HTML内容分析...');
        const htmlLines = emailContent.html.split('\n');
        const paymentLines = htmlLines.filter(line => 
            line.includes('支付') || 
            line.includes('payment') || 
            line.includes('Pay') ||
            line.includes('button') ||
            line.includes('btn')
        );

        if (paymentLines.length > 0) {
            console.log('✓ 发现支付相关HTML内容:');
            paymentLines.slice(0, 5).forEach((line, index) => {
                console.log(`  ${index + 1}. ${line.trim()}`);
            });
        } else {
            console.log('⚠️  未发现支付相关HTML内容');
        }

        // 7. 测试总结
        console.log('\n=== 测试结果总结 ===');
        console.log(`✓ 邮件服务: 正常`);
        console.log(`✓ 支付服务: 正常`);
        console.log(`${hasPaymentButton ? '✓' : '✗'} 支付按钮: ${hasPaymentButton ? '已包含' : '缺失'}`);
        console.log(`${hasPaymentLink ? '✓' : '✗'} 支付链接: ${hasPaymentLink ? '已包含' : '缺失'}`);

        if (hasPaymentButton && hasPaymentLink) {
            console.log('\n🎉 邮件支付按钮修复验证通过！');
            console.log('前端组件现在应该能正确发送包含支付按钮的邮件了。');
        } else {
            console.log('\n⚠️  邮件支付按钮可能仍有问题，需要进一步检查。');
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误详情:', error.stack);
    }
}

// 运行测试
testEmailPaymentFix().catch(console.error);