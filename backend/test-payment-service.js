/**
 * InvoicePaymentService 测试脚本
 */

const InvoicePaymentService = require('./src/services/invoicePaymentService');

async function testPaymentService() {
    try {
        console.log('🔍 测试 InvoicePaymentService...\n');
        
        // 创建服务实例
        const paymentService = new InvoicePaymentService();
        console.log('✅ InvoicePaymentService 实例创建成功');
        
        // 测试 savePaymentToken 方法
        console.log('\n1. 测试 savePaymentToken 方法...');
        const testInvoiceId = 'test-invoice-' + Date.now();
        const testToken = 'test-token-' + Date.now();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        try {
            await paymentService.savePaymentToken(testInvoiceId, testToken, expiresAt, 'paddle-123');
            console.log('✅ savePaymentToken 方法执行成功');
        } catch (error) {
            console.error('❌ savePaymentToken 方法失败:', error.message);
            console.error('错误堆栈:', error.stack);
            return;
        }
        
        // 测试 validatePaymentToken 方法
        console.log('\n2. 测试 validatePaymentToken 方法...');
        try {
            const validation = await paymentService.validatePaymentToken(testInvoiceId, testToken);
            console.log('✅ validatePaymentToken 方法执行成功:', validation.valid);
        } catch (error) {
            console.error('❌ validatePaymentToken 方法失败:', error.message);
        }
        
        // 测试 generateDirectPaymentLink 方法
        console.log('\n3. 测试 generateDirectPaymentLink 方法...');
        const mockInvoice = {
            id: testInvoiceId,
            totalAmount: 100.00,
            currency: 'EUR',
            invoiceNumber: 'TEST-001'
        };
        
        try {
            const paymentLink = await paymentService.generateDirectPaymentLink(mockInvoice);
            console.log('✅ generateDirectPaymentLink 方法执行成功');
            console.log('支付链接:', paymentLink.paymentUrl);
        } catch (error) {
            console.error('❌ generateDirectPaymentLink 方法失败:', error.message);
            console.error('错误堆栈:', error.stack);
        }
        
        // 清理测试数据
        console.log('\n4. 清理测试数据...');
        try {
            await paymentService.prisma.invoicePaymentToken.deleteMany({
                where: { invoiceId: testInvoiceId }
            });
            console.log('✅ 测试数据清理完成');
        } catch (error) {
            console.error('❌ 测试数据清理失败:', error.message);
        }
        
        console.log('\n🎉 InvoicePaymentService 测试完成！');
        
    } catch (error) {
        console.error('❌ InvoicePaymentService 测试失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

testPaymentService().catch(console.error);