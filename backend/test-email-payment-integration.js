/**
 * EmailService 支付集成测试脚本
 */

const EmailService = require('./src/services/emailService');

async function testEmailPaymentIntegration() {
    try {
        console.log('🔍 测试 EmailService 支付集成...\n');
        
        // 创建 EmailService 实例
        const emailService = new EmailService();
        console.log('✅ EmailService 实例创建成功');
        
        // 检查 invoicePaymentService 是否正确初始化
        console.log('InvoicePaymentService 实例:', !!emailService.invoicePaymentService);
        console.log('Prisma 实例:', !!emailService.invoicePaymentService.prisma);
        
        // 准备测试数据
        const testInvoiceData = {
            id: 'test-email-' + Date.now(),
            invoiceNumber: 'TEST-EMAIL-001',
            totalAmount: 150.00,
            currency: 'EUR',
            clientName: 'Test Client',
            dueDate: '2025-12-02'
        };
        
        console.log('\n1. 测试 generateEmailContent 方法...');
        try {
            const emailContent = await emailService.generateEmailContent(
                testInvoiceData,  // invoiceData 作为第一个参数
                null,             // clientData
                null,             // customText - 使用默认模板
                null              // customHtml - 使用默认模板
            );
            
            console.log('✅ generateEmailContent 方法执行成功');
            console.log('文本内容长度:', emailContent.text.length);
            console.log('HTML内容长度:', emailContent.html.length);
            
            // 输出实际的邮件内容
            console.log('\n📄 实际的文本内容:');
            console.log(emailContent.text);
            console.log('\n🌐 实际的HTML内容:');
            console.log(emailContent.html);
            
            // 检查是否包含支付链接
            const hasPaymentLink = emailContent.html.includes('立即支付发票');
            const hasPaymentError = emailContent.html.includes('支付链接生成失败');
            
            console.log('包含支付按钮:', hasPaymentLink ? '✅' : '❌');
            console.log('包含支付错误:', hasPaymentError ? '❌' : '✅');
            
            if (hasPaymentError) {
                console.log('\n支付链接生成失败的详细信息:');
                const errorMatch = emailContent.html.match(/支付链接生成失败[^<]*/);
                if (errorMatch) {
                    console.log(errorMatch[0]);
                }
            }
            
        } catch (error) {
            console.error('❌ generateEmailContent 方法失败:', error.message);
            console.error('错误堆栈:', error.stack);
        }
        
        // 直接测试 invoicePaymentService
        console.log('\n2. 直接测试 invoicePaymentService...');
        try {
            const paymentLink = await emailService.invoicePaymentService.generateDirectPaymentLink(testInvoiceData);
            console.log('✅ 直接调用 generateDirectPaymentLink 成功');
            console.log('支付链接:', paymentLink.paymentUrl);
        } catch (error) {
            console.error('❌ 直接调用 generateDirectPaymentLink 失败:', error.message);
            console.error('错误堆栈:', error.stack);
        }
        
        console.log('\n🎉 EmailService 支付集成测试完成！');
        
    } catch (error) {
        console.error('❌ EmailService 支付集成测试失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

testEmailPaymentIntegration().catch(console.error);