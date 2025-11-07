/**
 * 测试实际邮件发送，包括支付按钮
 * 这个脚本会发送真实的邮件到指定邮箱
 */

const { PrismaClient } = require('@prisma/client');
const { PDFEmailService } = require('./src/services/pdfEmailService');

const prisma = new PrismaClient();

async function testRealEmailWithPayment() {
    console.log('📧 开始测试实际邮件发送（包含支付按钮）...\n');

    try {
        // 1. 创建测试发票数据
        console.log('1️⃣ 创建测试发票...');
        
        const testInvoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `TEST-${Date.now()}`,
                totalAmount: 1333333.20,
                currency: 'EUR',
                dueDate: new Date('2025-12-02'),
                status: 'draft',
                userId: 1, // 假设用户ID为1
                clientId: 1, // 假设客户ID为1
                InvoiceItems: {
                    create: [{
                        description: '测试服务',
                        quantity: 1,
                        unitPrice: 1333333.20,
                        totalPrice: 1333333.20
                    }]
                }
            },
            include: {
                InvoiceItems: true,
                Client: true,
                User: {
                    include: {
                        Company: true
                    }
                }
            }
        });

        console.log('✅ 测试发票创建成功:', testInvoice.invoiceNumber);

        // 2. 发送邮件
        console.log('\n2️⃣ 发送邮件...');
        const pdfEmailService = new PDFEmailService();
        
        const result = await pdfEmailService.generateAndSendInvoice({
            invoiceId: testInvoice.id,
            recipientEmail: 'test@example.com', // 替换为您的测试邮箱
            subject: `测试发票 ${testInvoice.invoiceNumber}`,
            message: '这是一封测试邮件，请检查支付按钮是否正常显示。'
        });

        if (result.success) {
            console.log('✅ 邮件发送成功！');
            console.log('📧 收件人:', 'test@example.com');
            console.log('📄 发票号:', testInvoice.invoiceNumber);
            console.log('💰 金额:', '€1333333.20');
            console.log('\n请检查您的邮箱，确认：');
            console.log('1. 邮件是否收到');
            console.log('2. PDF附件是否正常');
            console.log('3. 支付按钮是否显示');
            console.log('4. 支付按钮是否可点击');
        } else {
            console.log('❌ 邮件发送失败:', result.error);
        }

        // 3. 清理测试数据
        console.log('\n3️⃣ 清理测试数据...');
        await prisma.invoiceItem.deleteMany({
            where: { invoiceId: testInvoice.id }
        });
        await prisma.invoice.delete({
            where: { id: testInvoice.id }
        });
        console.log('✅ 测试数据清理完成');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行测试
testRealEmailWithPayment()
    .then(() => {
        console.log('\n🏁 实际邮件发送测试完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('测试失败:', error);
        process.exit(1);
    });