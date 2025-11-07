/**
 * 测试当前邮件生成情况
 * 检查支付按钮是否正确显示
 */

const EmailService = require('./src/services/emailService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCurrentEmailGeneration() {
    console.log('🧪 测试当前邮件生成情况...\n');

    try {
        // 创建测试发票数据
        const testInvoice = {
            id: 'email-test-' + Date.now(),
            invoiceNumber: 'INV-EMAIL-TEST-001',
            clientName: '测试客户',
            total: 199.99,
            currency: 'EUR',
            dueDate: '2024-12-31',
            items: [
                {
                    description: '测试服务',
                    quantity: 1,
                    unitPrice: 199.99,
                    total: 199.99
                }
            ]
        };

        console.log('📄 测试发票数据:');
        console.log(JSON.stringify(testInvoice, null, 2));
        console.log('');

        // 初始化邮件服务
        const emailService = new EmailService();
        
        console.log('📧 生成邮件内容...');
        const emailContent = await emailService.generateEmailContent(testInvoice);
        
        console.log('✅ 邮件内容生成完成');
        console.log('');

        // 检查邮件内容
        console.log('📝 邮件主题和文本内容:');
        console.log('Subject:', emailContent.subject || 'N/A');
        console.log('Text length:', emailContent.text ? emailContent.text.length : 0);
        console.log('');

        // 检查HTML内容中的支付按钮
        console.log('🔍 检查HTML内容中的支付按钮...');
        if (emailContent.html) {
            const hasPaymentButton = emailContent.html.includes('立即支付发票');
            const hasPaymentLink = emailContent.html.includes('href=');
            const hasPaymentError = emailContent.html.includes('支付链接生成失败');
            
            console.log(`📧 HTML内容长度: ${emailContent.html.length}`);
            console.log(`🔗 包含支付按钮: ${hasPaymentButton ? '✅' : '❌'}`);
            console.log(`🔗 包含支付链接: ${hasPaymentLink ? '✅' : '❌'}`);
            console.log(`⚠️  包含支付错误: ${hasPaymentError ? '❌' : '✅'}`);
            
            // 提取支付链接
            const linkMatch = emailContent.html.match(/href="([^"]*payment[^"]*)"/);
            if (linkMatch) {
                console.log(`🔗 支付链接: ${linkMatch[1]}`);
            }
            
            // 显示HTML内容的关键部分
            console.log('\n📄 HTML内容预览 (支付按钮部分):');
            const paymentSectionMatch = emailContent.html.match(/(立即支付发票[\s\S]*?<\/a>)/);
            if (paymentSectionMatch) {
                console.log(paymentSectionMatch[1]);
            } else {
                console.log('❌ 未找到支付按钮部分');
                
                // 查找可能的错误信息
                const errorMatch = emailContent.html.match(/(支付链接生成失败[\s\S]*?<\/div>)/);
                if (errorMatch) {
                    console.log('⚠️  发现错误信息:');
                    console.log(errorMatch[1]);
                }
            }
        } else {
            console.log('❌ 没有HTML内容');
        }

        // 检查数据库中的支付令牌
        console.log('\n🗄️  检查数据库中的支付令牌...');
        const paymentTokens = await prisma.invoicePaymentToken.findMany({
            where: {
                invoiceId: testInvoice.id
            }
        });

        console.log(`📊 支付令牌数量: ${paymentTokens.length}`);
        if (paymentTokens.length > 0) {
            const token = paymentTokens[0];
            console.log(`🔐 令牌: ${token.paymentToken}`);
            console.log(`📄 发票ID: ${token.invoiceId}`);
            console.log(`⏰ 过期时间: ${token.expiresAt}`);
            console.log(`🔒 是否已使用: ${token.isUsed}`);
        }

        // 清理测试数据
        console.log('\n🧹 清理测试数据...');
        await prisma.invoicePaymentToken.deleteMany({
            where: {
                invoiceId: testInvoice.id
            }
        });
        console.log('✅ 测试数据清理完成');

        console.log('\n📊 测试总结:');
        console.log('=' .repeat(50));
        console.log(`✅ 邮件内容生成: ${emailContent ? '成功' : '失败'}`);
        console.log(`✅ HTML内容: ${emailContent.html ? '存在' : '缺失'}`);
        console.log(`✅ 支付按钮: ${emailContent.html && emailContent.html.includes('立即支付发票') ? '存在' : '缺失'}`);
        console.log(`✅ 支付令牌: ${paymentTokens.length > 0 ? '已生成' : '未生成'}`);
        console.log('=' .repeat(50));

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// 运行测试
if (require.main === module) {
    testCurrentEmailGeneration()
        .then(() => {
            console.log('\n🏆 邮件生成测试完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testCurrentEmailGeneration };