/**
 * 实际邮件发送调试脚本
 * 模拟完整的邮件发送流程，调试支付按钮缺失问题
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 导入服务
const EmailService = require('./src/services/emailService');
const InvoicePaymentService = require('./src/services/invoicePaymentService');

async function debugActualEmailFlow() {
    console.log('🔍 开始调试实际邮件发送流程...\n');

    // 测试发票数据（模拟您收到邮件的发票）
    const testInvoice = {
        id: 1,
        invoiceNumber: 'FR-2025-000001',
        total: 1333333.20,
        totalAmount: 1333333.20,
        amount: 1333333.20,
        issueDate: '2025-01-25',
        dueDate: '2025-12-02',
        status: 'pending',
        customerName: 'xiangjie invomate lao',
        clientName: 'xiangjie invomate lao',
        clientEmail: 'test@example.com',
        currency: 'EUR',
        items: [
            {
                description: '测试服务',
                quantity: 1,
                unitPrice: 1333333.20,
                total: 1333333.20
            }
        ]
    };

    console.log('📋 测试发票数据:');
    console.log(JSON.stringify(testInvoice, null, 2));
    console.log('');

    // 1. 测试支付服务
    console.log('🔧 步骤1: 测试支付服务...');
    try {
        const paymentService = new InvoicePaymentService();
        console.log('✓ InvoicePaymentService 初始化成功');

        const paymentResult = await paymentService.generateDirectPaymentLink(testInvoice, {
            expiryDays: 7
        });

        console.log('💳 支付链接生成结果:');
        console.log(JSON.stringify(paymentResult, null, 2));
        console.log('');
    } catch (error) {
        console.error('❌ 支付服务测试失败:', error.message);
        console.error('错误详情:', error);
        console.log('');
    }

    // 2. 测试邮件服务初始化
    console.log('📧 步骤2: 测试邮件服务初始化...');
    try {
        const emailService = new EmailService();
        console.log('✓ EmailService 初始化成功');
        console.log('✓ invoicePaymentService 已注入:', !!emailService.invoicePaymentService);
        console.log('');
    } catch (error) {
        console.error('❌ 邮件服务初始化失败:', error.message);
        console.log('');
    }

    // 3. 测试邮件内容生成
    console.log('📝 步骤3: 测试邮件内容生成...');
    try {
        const emailService = new EmailService();
        
        // 直接调用 generateEmailContent 方法
        console.log('调用 generateEmailContent...');
        const emailContent = await emailService.generateEmailContent(testInvoice);
        
        console.log('📧 邮件内容生成结果:');
        console.log('文本内容长度:', emailContent.text.length);
        console.log('HTML内容长度:', emailContent.html.length);
        console.log('');
        
        console.log('📄 文本内容预览:');
        console.log(emailContent.text.substring(0, 500) + '...');
        console.log('');
        
        console.log('🌐 HTML内容预览:');
        console.log(emailContent.html.substring(0, 800) + '...');
        console.log('');
        
        // 检查支付按钮
        const hasPaymentButton = emailContent.html.includes('立即支付发票');
        const hasPaymentLink = emailContent.html.includes('href=');
        const hasPaymentError = emailContent.html.includes('支付链接生成失败') || 
                               emailContent.html.includes('Payment link generation failed');
        
        console.log('🔍 支付功能检查:');
        console.log('包含支付按钮:', hasPaymentButton ? '✅' : '❌');
        console.log('包含支付链接:', hasPaymentLink ? '✅' : '❌');
        console.log('包含支付错误:', hasPaymentError ? '❌' : '✅');
        console.log('');
        
        if (!hasPaymentButton) {
            console.log('⚠️  支付按钮缺失！检查HTML内容中的支付相关部分...');
            
            // 搜索支付相关的关键词
            const paymentKeywords = ['支付', 'payment', 'pay', 'paddle', 'href'];
            paymentKeywords.forEach(keyword => {
                const found = emailContent.html.toLowerCase().includes(keyword.toLowerCase());
                console.log(`  - "${keyword}": ${found ? '找到' : '未找到'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 邮件内容生成失败:', error.message);
        console.error('错误堆栈:', error.stack);
        console.log('');
    }

    // 4. 检查环境变量
    console.log('🔧 步骤4: 检查环境变量...');
    console.log('PADDLE_VENDOR_ID:', process.env.PADDLE_VENDOR_ID ? '已设置' : '未设置');
    console.log('PADDLE_API_KEY:', process.env.PADDLE_API_KEY ? '已设置' : '未设置');
    console.log('PADDLE_ENVIRONMENT:', process.env.PADDLE_ENVIRONMENT || '未设置');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '未设置');
    console.log('');

    console.log('🏁 调试完成！');
}

// 运行调试
debugActualEmailFlow().catch(error => {
    console.error('调试过程中发生错误:', error);
    process.exit(1);
});