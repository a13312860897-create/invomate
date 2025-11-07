/**
 * 数据库表结构检查脚本
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabaseStructure() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 检查数据库表结构...\n');
        
        // 尝试查询 InvoicePaymentToken 表
        console.log('1. 尝试查询 InvoicePaymentToken 表...');
        try {
            const count = await prisma.invoicePaymentToken.count();
            console.log('✅ invoicePaymentToken 表存在，记录数:', count);
        } catch (error) {
            console.log('❌ invoicePaymentToken 表访问失败:', error.message);
        }
        
        // 尝试使用大写的 InvoicePaymentToken
        console.log('\n2. 尝试查询 InvoicePaymentToken 表（大写）...');
        try {
            const count = await prisma.InvoicePaymentToken.count();
            console.log('✅ InvoicePaymentToken 表存在，记录数:', count);
        } catch (error) {
            console.log('❌ InvoicePaymentToken 表访问失败:', error.message);
        }
        
        // 检查 Prisma 客户端中可用的模型
        console.log('\n3. 检查 Prisma 客户端中的可用模型...');
        console.log('可用的模型:', Object.keys(prisma).filter(key => 
            typeof prisma[key] === 'object' && 
            prisma[key] !== null && 
            'findMany' in prisma[key]
        ));
        
        // 尝试创建一个测试记录
        console.log('\n4. 尝试创建测试记录...');
        try {
            const testRecord = await prisma.InvoicePaymentToken.create({
                data: {
                    invoiceId: 'test-123',
                    paymentToken: 'test-token-' + Date.now(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
                    isUsed: false
                }
            });
            console.log('✅ 测试记录创建成功:', testRecord.id);
            
            // 删除测试记录
            await prisma.InvoicePaymentToken.delete({
                where: { id: testRecord.id }
            });
            console.log('✅ 测试记录删除成功');
        } catch (error) {
            console.log('❌ 测试记录创建失败:', error.message);
        }
        
    } catch (error) {
        console.error('数据库检查失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabaseStructure().catch(console.error);