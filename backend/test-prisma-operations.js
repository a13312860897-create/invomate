/**
 * Prisma 操作测试脚本
 */

const { PrismaClient } = require('@prisma/client');

async function testPrismaOperations() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 测试 Prisma 操作...\n');
        
        // 测试1: 查询现有记录
        console.log('1. 查询现有记录...');
        const existingCount = await prisma.invoicePaymentToken.count();
        console.log('✅ 现有记录数:', existingCount);
        
        // 测试2: 删除操作
        console.log('\n2. 测试删除操作...');
        const testInvoiceId = 'test-delete-' + Date.now();
        
        // 先创建一个测试记录
        const testRecord = await prisma.invoicePaymentToken.create({
            data: {
                invoiceId: testInvoiceId,
                paymentToken: 'test-token-' + Date.now(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                isUsed: false
            }
        });
        console.log('✅ 测试记录创建成功:', testRecord.id);
        
        // 测试删除操作
        const deleteResult = await prisma.invoicePaymentToken.deleteMany({
            where: { invoiceId: testInvoiceId }
        });
        console.log('✅ 删除操作成功，删除记录数:', deleteResult.count);
        
        // 测试3: 创建操作
        console.log('\n3. 测试创建操作...');
        const newRecord = await prisma.invoicePaymentToken.create({
            data: {
                invoiceId: 'test-invoice-' + Date.now(),
                paymentToken: 'test-token-' + Date.now(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                isUsed: false
            }
        });
        console.log('✅ 创建操作成功:', newRecord.id);
        
        // 清理测试记录
        await prisma.invoicePaymentToken.delete({
            where: { id: newRecord.id }
        });
        console.log('✅ 测试记录清理完成');
        
        console.log('\n🎉 所有 Prisma 操作测试通过！');
        
    } catch (error) {
        console.error('❌ Prisma 操作测试失败:', error);
        console.error('错误详情:', error.message);
        console.error('错误堆栈:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testPrismaOperations().catch(console.error);