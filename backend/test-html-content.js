const EmailService = require('./src/services/emailService');

async function testHtmlContent() {
    console.log('🔍 测试HTML内容详细检查');
    
    try {
        const emailService = new EmailService();
        
        const testInvoice = {
            id: 'html-content-test-' + Date.now(),
            invoiceNumber: 'INV-HTML-TEST-001',
            total: 149.99,
            clientName: 'HTML测试客户',
            dueDate: '2024-12-31',
            currency: 'EUR'
        };
        
        console.log('📊 测试发票数据:', testInvoice);
        
        const emailContent = await emailService.generateEmailContent(
            testInvoice,
            'HTML内容测试',
            null,
            null
        );
        
        console.log('\n📧 邮件内容生成完成');
        console.log('- HTML长度:', emailContent.html.length);
        
        // 详细检查HTML内容
        const htmlLines = emailContent.html.split('\n');
        console.log('\n🔍 HTML内容逐行检查:');
        
        let foundPaymentError = false;
        let foundPaymentButton = false;
        let foundPaymentLink = false;
        
        htmlLines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('支付链接生成失败') || 
                trimmedLine.includes('Payment link generation failed') ||
                trimmedLine.includes('注意：支付链接生成失败')) {
                console.log(`❌ 第${index+1}行发现支付错误: ${trimmedLine}`);
                foundPaymentError = true;
            }
            
            if (trimmedLine.includes('立即支付发票') || 
                trimmedLine.includes('Pay Invoice')) {
                console.log(`✅ 第${index+1}行发现支付按钮: ${trimmedLine}`);
                foundPaymentButton = true;
            }
            
            if (trimmedLine.includes('https://') && 
                trimmedLine.includes('checkout')) {
                console.log(`🔗 第${index+1}行发现支付链接: ${trimmedLine}`);
                foundPaymentLink = true;
            }
        });
        
        console.log('\n📊 检查总结:');
        console.log('- 支付错误:', foundPaymentError ? '❌ 存在' : '✅ 无');
        console.log('- 支付按钮:', foundPaymentButton ? '✅ 存在' : '❌ 缺失');
        console.log('- 支付链接:', foundPaymentLink ? '✅ 存在' : '❌ 缺失');
        
        // 如果发现错误，输出完整HTML内容的相关部分
        if (foundPaymentError) {
            console.log('\n🔍 完整HTML内容中包含错误的部分:');
            const errorLines = htmlLines.filter(line => 
                line.includes('支付链接生成失败') || 
                line.includes('Payment link generation failed') ||
                line.includes('注意：支付链接生成失败')
            );
            errorLines.forEach(line => console.log('❌', line.trim()));
        }
        
    } catch (error) {
        console.error('❌ HTML内容测试失败:', error.message);
        console.error('错误详情:', error);
    }
}

testHtmlContent();