/**
 * 完整邮件发送流程测试脚本
 * 模拟从前端发票页面发送邮件的完整流程
 */

const PDFEmailService = require('./src/services/pdfEmailService');

async function testCompleteEmailFlow() {
    try {
        console.log('🚀 开始测试完整邮件发送流程...\n');
        
        // 创建 PDFEmailService 实例
        const pdfEmailService = new PDFEmailService();
        console.log('✅ PDFEmailService 实例创建成功');
        
        // 准备测试发票数据 - 模拟真实的发票数据结构
        const testInvoiceData = {
            id: 'test-complete-' + Date.now(),
            invoiceNumber: 'FR-2025-TEST-001',
            clientName: 'Test Client Company',
            clientEmail: 'test@example.com',
            totalAmount: 299.99,
            currency: 'EUR',
            dueDate: '2025-12-15',
            // PDF生成服务期望的字段名
            InvoiceItems: [
                {
                    description: 'Web Development Services',
                    quantity: 1,
                    unitPrice: 299.99,
                    total: 299.99
                }
            ],
            // 同时保留items字段以兼容其他服务
            items: [
                {
                    description: 'Web Development Services',
                    quantity: 1,
                    unitPrice: 299.99,
                    total: 299.99
                }
            ],
            // 添加更多发票字段以确保完整性
            issueDate: '2025-11-15',
            invoiceDate: '2025-11-15',
            taxAmount: 59.99,
            subtotal: 240.00,
            clientId: 'test-client-id',
            Client: {
                name: 'Test Client Company',
                email: 'test@example.com',
                address: '123 Test Street',
                city: 'Test City',
                postalCode: '12345',
                country: 'France'
            }
        };
        
        const testUserData = {
            name: 'Test User',
            email: 'sender@example.com',
            company: 'Test Company'
        };
        
        const testClientData = {
            name: 'Test Client Company',
            email: 'test@example.com'
        };
        
        console.log('📋 测试数据准备完成');
        console.log('发票ID:', testInvoiceData.id);
        console.log('发票号码:', testInvoiceData.invoiceNumber);
        console.log('客户邮箱:', testInvoiceData.clientEmail);
        console.log('总金额:', testInvoiceData.totalAmount, testInvoiceData.currency);
        console.log('InvoiceItems:', testInvoiceData.InvoiceItems?.length || 0, '项');
        console.log('items:', testInvoiceData.items?.length || 0, '项');
        
        // 测试完整的邮件发送流程
        console.log('\n📧 开始测试邮件发送流程...');
        
        try {
            const result = await pdfEmailService.generateAndSendInvoice({
                invoiceId: testInvoiceData.id,           // invoiceId
                invoiceData: testInvoiceData,            // invoiceData
                userData: testUserData,                  // userData
                clientData: testClientData,              // clientData
                recipientEmail: testInvoiceData.clientEmail,  // recipientEmail
                subject: `发票 ${testInvoiceData.invoiceNumber}`, // subject
                customText: null,                        // customText - 使用默认模板
                customHtml: null,                        // customHtml - 使用默认模板
                userId: 'test-user-id'                   // userId
            });
            
            console.log('\n🎉 邮件发送流程测试结果:');
            console.log('成功状态:', result.success);
            console.log('发票ID:', result.invoiceId);
            console.log('PDF生成:', result.pdfGenerated ? '✅' : '❌');
            console.log('邮件发送:', result.emailSent ? '✅' : '❌');
            
            if (result.success) {
                console.log('✅ 完整邮件发送流程测试成功！');
                console.log('邮件ID:', result.messageId);
                console.log('收件人:', result.recipientEmail);
            } else {
                console.log('❌ 邮件发送流程测试失败');
                console.log('错误信息:', result.error);
            }
            
        } catch (error) {
            console.error('❌ 邮件发送流程测试失败:', error.message);
            console.error('错误堆栈:', error.stack);
        }
        
        // 清理测试数据
        console.log('\n🧹 清理测试数据...');
        try {
            // 清理支付令牌
            await pdfEmailService.emailService.invoicePaymentService.prisma.invoicePaymentToken.deleteMany({
                where: { invoiceId: testInvoiceData.id }
            });
            console.log('✅ 测试数据清理完成');
        } catch (error) {
            console.log('⚠️  测试数据清理失败:', error.message);
        }
        
        console.log('\n🏁 完整邮件发送流程测试完成！');
        
    } catch (error) {
        console.error('❌ 完整邮件发送流程测试失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

testCompleteEmailFlow().catch(console.error);