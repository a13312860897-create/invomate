/**
 * 调试邮件支付按钮问题
 * 检查支付链接生成和邮件模板渲染
 */

const paddleService = require('./src/services/paddleService');
const EmailService = require('./src/services/emailService');

async function debugEmailPayment() {
    console.log('🔍 开始调试邮件支付按钮问题...\n');

    try {
        // 1. 测试支付链接生成
        console.log('1️⃣ 测试支付链接生成...');
        
        const testInvoiceData = {
            id: 1, // 添加发票ID
            invoiceNumber: 'FR-2025-000001',
            totalAmount: 1333333.20,
            currency: 'EUR',
            dueDate: '2025-12-02'
        };

        const testClientData = {
            name: 'xiangjie invomate lao',
            email: 'test@example.com'
        };

        let paymentLink = null;
        let paymentError = null;

        try {
            paymentLink = await paddleService.createPaymentLink({
                amount: testInvoiceData.totalAmount,
                currency: testInvoiceData.currency,
                description: `发票 ${testInvoiceData.invoiceNumber}`,
                customerEmail: testClientData.email,
                invoiceNumber: testInvoiceData.invoiceNumber
            });
            console.log('✅ 支付链接生成成功:', paymentLink);
        } catch (error) {
            paymentError = error.message;
            console.log('❌ 支付链接生成失败:', paymentError);
        }

        // 2. 测试邮件内容生成
        console.log('\n2️⃣ 测试邮件内容生成...');
        const emailService = new EmailService();
        
        const emailContent = await emailService.generateEmailContent(
            testInvoiceData,
            testClientData,
            null, // customText
            null  // customHtml
        );

        console.log('📧 邮件内容生成完成');
        console.log('- 主题:', emailContent.subject);
        console.log('- HTML长度:', emailContent.html.length);

        // 3. 检查支付按钮
        console.log('\n3️⃣ 检查支付按钮...');
        const hasPaymentButton = emailContent.html.includes('立即支付发票');
        const hasPaymentLink = paymentLink && emailContent.html.includes(paymentLink);
        const hasPaymentError = paymentError && emailContent.html.includes(paymentError);

        console.log('- 包含支付按钮文本:', hasPaymentButton ? '✅' : '❌');
        console.log('- 包含支付链接:', hasPaymentLink ? '✅' : '❌');
        console.log('- 包含支付错误信息:', hasPaymentError ? '✅' : '❌');

        // 4. 输出相关HTML片段
        if (hasPaymentButton) {
            console.log('\n📄 支付按钮HTML片段:');
            const paymentButtonMatch = emailContent.html.match(/(立即支付发票[\s\S]*?<\/a>)/);
            if (paymentButtonMatch) {
                console.log(paymentButtonMatch[0]);
            }
        }

        if (hasPaymentError) {
            console.log('\n⚠️ 支付错误信息HTML片段:');
            const errorMatch = emailContent.html.match(/(支付链接生成失败[\s\S]*?<\/div>)/);
            if (errorMatch) {
                console.log(errorMatch[0]);
            }
        }

        // 5. 总结
        console.log('\n📊 调试结果总结:');
        console.log('- 支付链接生成:', paymentLink ? '✅ 成功' : '❌ 失败');
        console.log('- 邮件模板渲染:', '✅ 成功');
        console.log('- 支付按钮显示:', hasPaymentButton ? '✅ 正常' : '❌ 缺失');
        
        if (!hasPaymentButton && !paymentLink) {
            console.log('\n🔍 问题分析:');
            console.log('- 支付链接生成失败，导致邮件模板中不显示支付按钮');
            console.log('- 建议检查Paddle配置和网络连接');
        } else if (!hasPaymentButton && paymentLink) {
            console.log('\n🔍 问题分析:');
            console.log('- 支付链接生成成功，但邮件模板渲染有问题');
            console.log('- 建议检查邮件模板逻辑');
        }

    } catch (error) {
        console.error('❌ 调试过程中发生错误:', error);
    }
}

// 运行调试
debugEmailPayment()
    .then(() => {
        console.log('\n🏁 邮件支付按钮调试完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('调试失败:', error);
        process.exit(1);
    });