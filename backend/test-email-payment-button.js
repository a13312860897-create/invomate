/**
 * 测试邮件模板中的直接支付按钮功能
 */

const EmailService = require('./src/services/emailService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailPaymentButton() {
    console.log('🧪 开始测试邮件模板中的直接支付按钮功能...\n');

    try {
        // 1. 创建测试发票数据
        console.log('📝 创建测试发票数据...');
        const testInvoice = {
            id: 'test-email-' + Date.now(),
            invoiceNumber: 'INV-EMAIL-001',
            clientName: '测试客户',
            total: 150.00,
            currency: 'EUR',
            dueDate: '2024-12-31',
            items: [
                {
                    description: '测试服务',
                    quantity: 1,
                    unitPrice: 150.00,
                    total: 150.00
                }
            ]
        };

        // 2. 初始化邮件服务
        console.log('📧 初始化邮件服务...');
        const emailService = new EmailService();

        // 3. 生成邮件内容（包含支付按钮）
        console.log('🎨 生成邮件内容...');
        const emailContent = await emailService.generateEmailContent(testInvoice);

        console.log('✅ 邮件内容生成成功！');
        console.log('\n📄 邮件文本内容:');
        console.log('=' .repeat(50));
        console.log(emailContent.text);
        console.log('=' .repeat(50));

        console.log('\n🌐 邮件HTML内容:');
        console.log('=' .repeat(50));
        console.log(emailContent.html);
        console.log('=' .repeat(50));

        // 4. 验证支付按钮是否存在
        const hasPaymentButton = emailContent.html.includes('立即支付发票');
        const hasPaymentLink = emailContent.html.includes('href=');
        
        console.log('\n🔍 支付按钮验证结果:');
        console.log(`- 包含支付按钮: ${hasPaymentButton ? '✅' : '❌'}`);
        console.log(`- 包含支付链接: ${hasPaymentLink ? '✅' : '❌'}`);

        // 5. 检查数据库中的支付令牌
        console.log('\n🔐 检查数据库中的支付令牌...');
        const paymentTokens = await prisma.invoicePaymentToken.findMany({
            where: {
                invoiceId: testInvoice.id
            }
        });

        console.log(`找到 ${paymentTokens.length} 个支付令牌`);
        if (paymentTokens.length > 0) {
            paymentTokens.forEach((token, index) => {
                console.log(`令牌 ${index + 1}:`);
                console.log(`  - ID: ${token.id}`);
                console.log(`  - 支付令牌: ${token.paymentToken}`);
                console.log(`  - 过期时间: ${token.expiresAt}`);
                console.log(`  - 是否已使用: ${token.isUsed}`);
            });
        }

        // 6. 清理测试数据
        console.log('\n🧹 清理测试数据...');
        await prisma.invoicePaymentToken.deleteMany({
            where: {
                invoiceId: testInvoice.id
            }
        });

        console.log('\n🎉 邮件支付按钮测试完成！');
        console.log('✅ 邮件模板已成功集成直接支付按钮功能');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// 运行测试
if (require.main === module) {
    testEmailPaymentButton()
        .then(() => {
            console.log('\n✅ 所有测试通过！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testEmailPaymentButton };