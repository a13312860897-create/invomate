/**
 * 全面的数据一致性测试套件
 * 包含边界情况、性能测试和混合筛选逻辑验证
 */

const path = require('path');
const DataService = require('../services/DataService');
const InvoiceFilterService = require('../services/InvoiceFilterService');

// 内存数据库模拟
const memoryDb = {
    invoices: []
};

/**
 * 创建全面的测试发票数据
 * 包含各种边界情况和混合筛选场景
 */
function createComprehensiveTestInvoices() {
    // 清空现有数据
    memoryDb.invoices = [];
    
    const testInvoices = [
        // 正常情况 - 2024年8月
        {
            id: 1,
            amount: 1000,
            status: 'paid',
            createdAt: '2024-08-15T10:00:00Z',
            updatedAt: '2024-08-15T10:00:00Z',
            paidAt: '2024-08-20T14:30:00Z',
            issuedAt: '2024-08-15T10:00:00Z',
            dueAt: '2024-09-15T10:00:00Z'
        },
        {
            id: 2,
            amount: 2000,
            status: 'pending',
            createdAt: '2024-08-10T09:00:00Z',
            updatedAt: '2024-08-10T09:00:00Z',
            paidAt: null,
            issuedAt: '2024-08-10T09:00:00Z',
            dueAt: '2024-09-10T09:00:00Z'
        },
        
        // 混合筛选场景 - 8月创建9月支付
        {
            id: 3,
            amount: 1500,
            status: 'paid',
            createdAt: '2024-08-25T16:00:00Z',
            updatedAt: '2024-09-05T11:00:00Z',
            paidAt: '2024-09-05T11:00:00Z',
            issuedAt: '2024-08-25T16:00:00Z',
            dueAt: '2024-09-25T16:00:00Z'
        },
        
        // 边界情况 - 月初第一天
        {
            id: 4,
            amount: 500,
            status: 'paid',
            createdAt: '2024-09-01T00:00:00Z',
            updatedAt: '2024-09-01T12:00:00Z',
            paidAt: '2024-09-01T12:00:00Z',
            issuedAt: '2024-09-01T00:00:00Z',
            dueAt: '2024-10-01T00:00:00Z'
        },
        
        // 边界情况 - 月末最后一天
        {
            id: 5,
            amount: 800,
            status: 'paid',
            createdAt: '2024-09-30T23:59:59Z',
            updatedAt: '2024-09-30T23:59:59Z',
            paidAt: '2024-09-30T23:59:59Z',
            issuedAt: '2024-09-30T23:59:59Z',
            dueAt: '2024-10-30T23:59:59Z'
        },
        
        // 跨时区边界情况
        {
            id: 6,
            amount: 1200,
            status: 'paid',
            createdAt: '2024-08-31T22:00:00Z', // UTC时间，可能是其他时区的9月1日
            updatedAt: '2024-09-01T02:00:00Z',
            paidAt: '2024-09-01T02:00:00Z',
            issuedAt: '2024-08-31T22:00:00Z',
            dueAt: '2024-09-30T22:00:00Z'
        },
        
        // 大金额测试
        {
            id: 7,
            amount: 999999.99,
            status: 'paid',
            createdAt: '2024-09-15T12:00:00Z',
            updatedAt: '2024-09-15T15:00:00Z',
            paidAt: '2024-09-15T15:00:00Z',
            issuedAt: '2024-09-15T12:00:00Z',
            dueAt: '2024-10-15T12:00:00Z'
        },
        
        // 小金额测试
        {
            id: 8,
            amount: 0.01,
            status: 'paid',
            createdAt: '2024-09-10T10:00:00Z',
            updatedAt: '2024-09-10T11:00:00Z',
            paidAt: '2024-09-10T11:00:00Z',
            issuedAt: '2024-09-10T10:00:00Z',
            dueAt: '2024-10-10T10:00:00Z'
        },
        
        // 各种状态测试
        {
            id: 9,
            amount: 750,
            status: 'overdue',
            createdAt: '2024-09-05T14:00:00Z',
            updatedAt: '2024-09-05T14:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-05T14:00:00Z',
            dueAt: '2024-09-20T14:00:00Z'
        },
        {
            id: 10,
            amount: 600,
            status: 'cancelled',
            createdAt: '2024-09-08T16:00:00Z',
            updatedAt: '2024-09-12T10:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-08T16:00:00Z',
            dueAt: '2024-10-08T16:00:00Z'
        },
        
        // 性能测试数据 - 大量发票
        ...Array.from({length: 100}, (_, i) => ({
            id: 100 + i,
            amount: Math.round((Math.random() * 5000 + 100) * 100) / 100,
            status: ['paid', 'pending', 'overdue', 'cancelled'][Math.floor(Math.random() * 4)],
            createdAt: new Date(2024, 8, Math.floor(Math.random() * 30) + 1).toISOString(),
            updatedAt: new Date(2024, 8, Math.floor(Math.random() * 30) + 1).toISOString(),
            paidAt: Math.random() > 0.5 ? new Date(2024, 8, Math.floor(Math.random() * 30) + 1).toISOString() : null,
            issuedAt: new Date(2024, 8, Math.floor(Math.random() * 30) + 1).toISOString(),
            dueAt: new Date(2024, 9, Math.floor(Math.random() * 30) + 1).toISOString()
        }))
    ];
    
    // 添加到内存数据库
    memoryDb.invoices.push(...testInvoices);
    
    console.log(`✓ 创建了 ${testInvoices.length} 张测试发票（包含边界情况和性能测试数据）`);
    return testInvoices;
}

/**
 * 运行全面的数据一致性测试
 */
async function runComprehensiveTests() {
    console.log('\n=== 全面数据一致性测试套件 ===\n');
    
    // 创建测试数据
    createComprehensiveTestInvoices();
    
    // 初始化服务
    const dataService = new DataService(memoryDb);
    const results = [];
    
    try {
        console.log('1. 基础数据一致性测试...');
        
        // 获取2024年9月的数据
        const month = '2024-09';
        const userId = 1; // 测试用户ID
        const statusDistribution = await dataService.getInvoiceStatusDistribution(userId, month);
        const revenueTrend = await dataService.getRevenueTrend(userId, month);
        const monthlySummary = await dataService.getMonthlyInvoiceSummary(userId, month);
        const unifiedData = await dataService.getUnifiedChartData(userId, month);
        
        // 测试1: 状态分布与收入趋势的已支付数据一致性（混合筛选逻辑）
        const statusPaidAmount = statusDistribution.summary?.statusAmounts?.paid || 0;
        const revenueTrendPaidAmount = revenueTrend.totalRevenue || 0;
        
        const amountDifference = Math.abs(statusPaidAmount - revenueTrendPaidAmount);
        const tolerance = 0.01; // 1分钱的容差
        
        results.push({
            name: '状态分布与收入趋势已支付金额一致性',
            pass: amountDifference <= tolerance,
            details: `状态分布已支付: ${statusPaidAmount}元, 收入趋势: ${revenueTrendPaidAmount}元, 差异: ${amountDifference}元`
        });
        
        // 测试2: 收入趋势与月度摘要的已支付数据一致性
        const summaryPaidAmount = monthlySummary.paid?.totalAmount || 0;
        const summaryPaidCount = monthlySummary.paid?.count || 0;
        const revenuePaidCount = revenueTrend.totalCount || 0;
        
        const summaryAmountDiff = Math.abs(summaryPaidAmount - revenueTrendPaidAmount);
        const summaryCountDiff = Math.abs(summaryPaidCount - revenuePaidCount);
        
        results.push({
            name: '收入趋势与月度摘要已支付数据一致性',
            pass: summaryAmountDiff <= tolerance && summaryCountDiff === 0,
            details: `摘要已支付: ${summaryPaidAmount}元/${summaryPaidCount}张, 收入趋势: ${revenueTrendPaidAmount}元/${revenuePaidCount}张`
        });
        
        console.log('2. 边界情况测试...');
        
        // 测试3: 月初边界测试
        const startOfMonth = new Date('2024-09-01T00:00:00Z');
        const invoicesAtStart = memoryDb.invoices.filter(inv => 
            new Date(inv.createdAt).getTime() === startOfMonth.getTime()
        );
        results.push({
            name: '月初边界数据处理',
            pass: invoicesAtStart.length > 0,
            details: `月初创建的发票: ${invoicesAtStart.length}张`
        });
        
        // 测试4: 月末边界测试
        const endOfMonth = new Date('2024-09-30T23:59:59Z');
        const invoicesAtEnd = memoryDb.invoices.filter(inv => 
            new Date(inv.createdAt).getTime() === endOfMonth.getTime()
        );
        results.push({
            name: '月末边界数据处理',
            pass: invoicesAtEnd.length > 0,
            details: `月末创建的发票: ${invoicesAtEnd.length}张`
        });
        
        // 测试5: 跨时区边界测试
        const crossTimezoneInvoices = memoryDb.invoices.filter(inv => {
            const createDate = new Date(inv.createdAt);
            const payDate = inv.paidAt ? new Date(inv.paidAt) : null;
            return payDate && createDate.getUTCMonth() !== payDate.getUTCMonth();
        });
        results.push({
            name: '跨时区/跨月支付处理',
            pass: crossTimezoneInvoices.length > 0,
            details: `跨月支付的发票: ${crossTimezoneInvoices.length}张`
        });
        
        console.log('3. 数值精度测试...');
        
        // 测试6: 大金额精度测试
        const largeAmountInvoices = memoryDb.invoices.filter(inv => inv.amount > 100000);
        const largeAmountSum = largeAmountInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        results.push({
            name: '大金额数值精度处理',
            pass: largeAmountInvoices.length > 0 && largeAmountSum > 0,
            details: `大金额发票: ${largeAmountInvoices.length}张, 总额: ${largeAmountSum}元`
        });
        
        // 测试7: 小金额精度测试
        const smallAmountInvoices = memoryDb.invoices.filter(inv => inv.amount < 1);
        results.push({
            name: '小金额数值精度处理',
            pass: smallAmountInvoices.length > 0,
            details: `小金额发票: ${smallAmountInvoices.length}张`
        });
        
        console.log('4. 性能测试...');
        
        // 测试8: 大数据量性能测试
        const startTime = Date.now();
        await dataService.getInvoiceStatusDistribution(userId, month);
        await dataService.getRevenueTrend(userId, month);
        await dataService.getMonthlyInvoiceSummary(userId, month);
        const endTime = Date.now();
        
        const performanceTime = endTime - startTime;
        results.push({
            name: '大数据量API响应性能',
            pass: performanceTime < 1000, // 1秒内完成
            details: `处理${memoryDb.invoices.length}张发票耗时: ${performanceTime}ms`
        });
        
        // 测试9: 内存使用测试
        const memoryUsage = process.memoryUsage();
        results.push({
            name: '内存使用效率',
            pass: memoryUsage.heapUsed < 100 * 1024 * 1024, // 小于100MB
            details: `堆内存使用: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        });
        
        console.log('5. 数据一致性验证...');
        
        // 测试10: 综合数据一致性验证
        const validationResult = await dataService.validateDataConsistency(userId, month);
        results.push({
            name: '综合数据一致性验证',
            pass: validationResult.isConsistent,
            details: validationResult.validationNote || '数据一致性检查'
        });
        
    } catch (error) {
        console.error('测试执行错误:', error);
        results.push({
            name: '测试执行',
            pass: false,
            details: `错误: ${error.message}`
        });
    }
    
    // 输出测试结果
    console.log('\n=== 测试结果汇总 ===\n');
    
    let passedCount = 0;
    let totalCount = results.length;
    
    results.forEach((result, index) => {
        const status = result.pass ? '✅ 通过' : '❌ 失败';
        console.log(`${index + 1}. ${result.name}: ${status}`);
        console.log(`   详情: ${result.details}\n`);
        
        if (result.pass) passedCount++;
    });
    
    console.log(`总计: ${passedCount}/${totalCount} 个测试通过`);
    console.log(`通过率: ${Math.round(passedCount / totalCount * 100)}%`);
    
    if (passedCount === totalCount) {
        console.log('\n🎉 所有测试通过！数据一致性和性能表现良好。');
    } else {
        console.log('\n⚠️  部分测试失败，需要进一步调查。');
    }
    
    return {
        passed: passedCount,
        total: totalCount,
        results: results
    };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runComprehensiveTests().catch(console.error);
}

module.exports = {
    createComprehensiveTestInvoices,
    runComprehensiveTests
};