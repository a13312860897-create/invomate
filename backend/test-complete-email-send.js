const EmailService = require('./src/services/emailService');
const PdfEmailService = require('./src/services/pdfEmailService');
const reminderEmailService = require('./src/services/ai/reminderEmailService_new');

async function testCompleteEmailSend() {
    console.log('🧪 测试完整的邮件发送流程...\n');

    try {
        // 1. 模拟发票数据（与AI控制器中的格式一致）
        const mockInvoiceData = {
            id: 'complete-test-' + Date.now(),
            invoiceNumber: 'INV-COMPLETE-001',
            total: 199.99,
            issueDate: '2024-11-09',
            dueDate: '2024-12-31',
            status: 'pending',
            customerName: '完整测试客户',
            customerEmail: 'complete-test@example.com',
            subtotal: 166.66,
            taxAmount: 33.33,
            items: JSON.stringify([
                {
                    description: '完整测试服务',
                    quantity: 1,
                    unitPrice: 166.66,
                    total: 166.66
                }
            ]),
            userData: {
                companyName: '测试公司',
                email: 'company@test.com'
            }
        };

        const recipientEmail = 'complete-test@example.com';
        const userData = {
            companyName: '测试公司',
            email: 'company@test.com'
        };

        console.log('📊 模拟发票数据:', {
            id: mockInvoiceData.id,
            invoiceNumber: mockInvoiceData.invoiceNumber,
            total: mockInvoiceData.total,
            customerName: mockInvoiceData.customerName
        });

        // 2. 测试 ReminderEmailService.sendInvoiceEmail（这是AI控制器调用的）
        console.log('\n🔍 测试 ReminderEmailService.sendInvoiceEmail...');
        
        // 模拟AI控制器的调用方式
        const result = await reminderEmailService.sendInvoiceEmail(
            mockInvoiceData, 
            recipientEmail, 
            { 
                type: 'invoice', 
                attachPDF: true, 
                emailConfig: null, 
                userData: userData 
            }
        );

        console.log('📧 ReminderEmailService 发送结果:', result);

        if (result.success) {
            console.log('✅ 邮件发送成功！');
            console.log('📧 消息ID:', result.messageId);
            console.log('📮 收件人:', result.recipient);
        } else {
            console.log('❌ 邮件发送失败:', result.error);
        }

        // 3. 测试直接使用 PdfEmailService
        console.log('\n🔍 测试直接使用 PdfEmailService...');
        const pdfEmailService = new PdfEmailService();
        
        const directResult = await pdfEmailService.generateAndSendInvoice({
            invoiceId: null,
            invoiceData: mockInvoiceData,
            clientData: { name: mockInvoiceData.customerName, email: recipientEmail },
            userData: userData,
            recipientEmail: recipientEmail,
            attachPDF: true,
            emailConfig: null
        });

        console.log('📧 PdfEmailService 直接发送结果:', directResult);

        // 4. 测试邮件内容生成（不发送）
        console.log('\n🔍 测试邮件内容生成（不发送）...');
        const emailService = new EmailService();
        await emailService.initializeTransporter();
        
        const emailContent = await emailService.generateEmailContent(mockInvoiceData);
        
        console.log('📧 邮件内容生成结果:');
        console.log('- 文本内容长度:', emailContent.text.length);
        console.log('- HTML内容长度:', emailContent.html.length);
        
        // 检查支付按钮
        const hasPaymentButton = emailContent.html.includes('立即支付发票') || 
                                emailContent.html.includes('Pay Invoice');
        const hasPaymentLink = emailContent.html.includes('https://') && 
                              emailContent.html.includes('checkout');
        
        console.log('🔗 支付按钮检查:');
        console.log('- 包含支付按钮:', hasPaymentButton ? '✅' : '❌');
        console.log('- 包含支付链接:', hasPaymentLink ? '✅' : '❌');

        if (hasPaymentButton) {
            console.log('\n📄 支付按钮HTML片段:');
            const lines = emailContent.html.split('\n');
            lines.forEach((line, index) => {
                if (line.includes('支付') || line.includes('checkout') || line.includes('立即')) {
                    console.log(`第${index+1}行: ${line.trim()}`);
                }
            });
        }

        // 5. 测试总结
        console.log('\n📊 完整邮件发送测试总结:');
        console.log('==================================================');
        console.log(`${result.success ? '✅' : '❌'} ReminderEmailService: ${result.success ? '成功' : '失败'}`);
        console.log(`${directResult.success ? '✅' : '❌'} PdfEmailService: ${directResult.success ? '成功' : '失败'}`);
        console.log(`${hasPaymentButton ? '✅' : '❌'} 支付按钮: ${hasPaymentButton ? '存在' : '缺失'}`);
        console.log(`${hasPaymentLink ? '✅' : '❌'} 支付链接: ${hasPaymentLink ? '存在' : '缺失'}`);
        console.log('==================================================');

        if (!hasPaymentButton) {
            console.log('\n❌ 问题诊断: 邮件中确实缺少支付按钮！');
            console.log('可能的原因:');
            console.log('1. Paddle API配置问题');
            console.log('2. 支付链接生成失败');
            console.log('3. 环境变量配置问题');
            console.log('4. 发票数据格式问题');
            
            console.log('\n🔍 详细HTML内容:');
            console.log(emailContent.html);
        } else {
            console.log('\n🏆 完整邮件发送测试完成！支付按钮正常。');
        }

    } catch (error) {
        console.error('❌ 完整邮件发送测试失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testCompleteEmailSend().catch(console.error);