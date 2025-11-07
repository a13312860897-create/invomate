/**
 * 简化的邮件发送测试
 */

const EmailService = require('./src/services/emailService');

async function testSimpleEmail() {
    try {
        console.log('🚀 开始简化邮件测试...\n');
        
        // 创建邮件服务实例
        const emailService = new EmailService();
        console.log('✅ EmailService 实例创建成功');
        
        // 准备测试数据
        const testInvoiceData = {
            id: 'test-simple-' + Date.now(),
            invoiceNumber: 'TEST-SIMPLE-001',
            totalAmount: 150.00,
            currency: 'EUR',
            dueDate: '2025-12-02',
            items: [
                {
                    description: 'Test Service',
                    quantity: 1,
                    unitPrice: 150.00,
                    total: 150.00
                }
            ]
        };
        
        const testClientData = {
            name: 'Test Client',
            email: 'test@example.com'
        };
        
        console.log('📋 测试数据准备完成');
        console.log('发票ID:', testInvoiceData.id);
        console.log('发票号码:', testInvoiceData.invoiceNumber);
        console.log('总金额:', testInvoiceData.totalAmount, testInvoiceData.currency);
        
        // 测试邮件内容生成
        console.log('\n📧 测试邮件内容生成...');
        
        const emailContent = await emailService.generateEmailContent(
            testInvoiceData,
            testClientData,
            null, // customText
            null  // customHtml
        );
        
        console.log('✅ 邮件内容生成成功');
        console.log('文本内容长度:', emailContent.text?.length || 0);
        console.log('HTML内容长度:', emailContent.html?.length || 0);
        
        // 检查支付链接
        const hasPaymentButton = emailContent.html?.includes('立即支付发票') || false;
        const hasPaymentError = emailContent.text?.includes('支付链接生成失败') || false;
        
        console.log('包含支付按钮:', hasPaymentButton ? '✅' : '❌');
        console.log('包含支付错误:', hasPaymentError ? '✅' : '❌');
        
        if (hasPaymentButton) {
            console.log('🎉 邮件内容包含支付按钮，功能正常！');
        } else if (hasPaymentError) {
            console.log('⚠️  支付链接生成失败，但邮件内容生成正常');
        } else {
            console.log('❓ 邮件内容状态不明确');
        }
        
        console.log('\n🏁 简化邮件测试完成！');
        
    } catch (error) {
        console.error('❌ 简化邮件测试失败:', error);
        console.error('错误详情:', error.message);
    }
}

testSimpleEmail().catch(console.error);