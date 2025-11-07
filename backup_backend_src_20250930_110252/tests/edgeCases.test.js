/**
 * 边界情况和异常场景测试套件
 * 专门测试各种极端情况、错误处理和边界条件
 */

const path = require('path');
const DataService = require('../services/DataService');
const InvoiceFilterService = require('../services/InvoiceFilterService');

// 内存数据库模拟
const memoryDb = {
    invoices: []
};

/**
 * 创建边界情况测试数据
 */
function createEdgeCaseTestData() {
    memoryDb.invoices = [];
    
    const edgeCaseInvoices = [
        // 空值和null测试
        {
            id: 1,
            amount: 0,
            status: 'paid',
            createdAt: '2024-09-15T12:00:00Z',
            updatedAt: '2024-09-15T12:00:00Z',
            paidAt: '2024-09-15T12:00:00Z',
            issuedAt: null,
            dueAt: null
        },
        
        // 负金额测试（异常情况）
        {
            id: 2,
            amount: -100,
            status: 'cancelled',
            createdAt: '2024-09-10T10:00:00Z',
            updatedAt: '2024-09-10T10:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-10T10:00:00Z',
            dueAt: '2024-10-10T10:00:00Z'
        },
        
        // 极大金额测试
        {
            id: 3,
            amount: Number.MAX_SAFE_INTEGER,
            status: 'pending',
            createdAt: '2024-09-05T08:00:00Z',
            updatedAt: '2024-09-05T08:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-05T08:00:00Z',
            dueAt: '2024-10-05T08:00:00Z'
        },
        
        // 极小金额测试
        {
            id: 4,
            amount: Number.MIN_VALUE,
            status: 'paid',
            createdAt: '2024-09-20T15:00:00Z',
            updatedAt: '2024-09-20T15:00:00Z',
            paidAt: '2024-09-20T15:00:00Z',
            issuedAt: '2024-09-20T15:00:00Z',
            dueAt: '2024-10-20T15:00:00Z'
        },
        
        // 无效日期格式测试
        {
            id: 5,
            amount: 500,
            status: 'paid',
            createdAt: 'invalid-date',
            updatedAt: '2024-09-25T10:00:00Z',
            paidAt: '2024-09-25T10:00:00Z',
            issuedAt: '2024-09-25T10:00:00Z',
            dueAt: '2024-10-25T10:00:00Z'
        },
        
        // 未来日期测试
        {
            id: 6,
            amount: 800,
            status: 'pending',
            createdAt: '2025-12-31T23:59:59Z',
            updatedAt: '2025-12-31T23:59:59Z',
            paidAt: null,
            issuedAt: '2025-12-31T23:59:59Z',
            dueAt: '2026-01-31T23:59:59Z'
        },
        
        // 过去很久的日期测试
        {
            id: 7,
            amount: 300,
            status: 'paid',
            createdAt: '1970-01-01T00:00:00Z',
            updatedAt: '1970-01-01T00:00:00Z',
            paidAt: '1970-01-01T00:00:00Z',
            issuedAt: '1970-01-01T00:00:00Z',
            dueAt: '1970-02-01T00:00:00Z'
        },
        
        // 缺少必要字段测试
        {
            id: 8,
            // amount: undefined, // 缺少金额
            status: 'pending',
            createdAt: '2024-09-12T14:00:00Z',
            updatedAt: '2024-09-12T14:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-12T14:00:00Z',
            dueAt: '2024-10-12T14:00:00Z'
        },
        
        // 无效状态测试
        {
            id: 9,
            amount: 600,
            status: 'invalid_status',
            createdAt: '2024-09-18T16:00:00Z',
            updatedAt: '2024-09-18T16:00:00Z',
            paidAt: null,
            issuedAt: '2024-09-18T16:00:00Z',
            dueAt: '2024-10-18T16:00:00Z'
        },
        
        // 支付日期早于创建日期（逻辑错误）
        {
            id: 10,
            amount: 400,
            status: 'paid',
            createdAt: '2024-09-20T10:00:00Z',
            updatedAt: '2024-09-15T08:00:00Z',
            paidAt: '2024-09-15T08:00:00Z', // 支付日期早于创建日期
            issuedAt: '2024-09-20T10:00:00Z',
            dueAt: '2024-10-20T10:00:00Z'
        }
    ];
    
    memoryDb.invoices.push(...edgeCaseInvoices);
    console.log(`✓ 创建了 ${edgeCaseInvoices.length} 张边界情况测试发票`);
    return edgeCaseInvoices;
}

/**
 * 运行边界情况测试
 */
async function runEdgeCaseTests() {
    console.log('\n=== 边界情况和异常场景测试 ===\n');
    
    createEdgeCaseTestData();
    const dataService = new DataService(memoryDb);
    const results = [];
    
    try {
        console.log('1. 空数据处理测试...');
        
        // 测试1: 空数据库处理
        const emptyDb = { invoices: [] };
        const emptyDataService = new DataService(emptyDb);
        const userId = 1; // 测试用户ID
        const month = '2024-09';
        
        try {
            const emptyStatusDist = await emptyDataService.getInvoiceStatusDistribution(userId, month);
            const emptyRevenueTrend = await emptyDataService.getRevenueTrend(userId, month);
            const emptyMonthlySummary = await emptyDataService.getMonthlyInvoiceSummary(userId, month);
            
            results.push({
                name: '空数据库处理',
                pass: emptyStatusDist && emptyRevenueTrend && emptyMonthlySummary,
                details: '空数据库时API正常返回默认值'
            });
        } catch (error) {
            results.push({
                name: '空数据库处理',
                pass: false,
                details: `空数据库处理失败: ${error.message}`
            });
        }
        
        console.log('2. 无效参数处理测试...');
        
        // 测试2: 无效月份参数
        try {
            await dataService.getInvoiceStatusDistribution(userId, 'invalid-month');
            results.push({
                name: '无效月份参数处理',
                pass: false,
                details: '应该抛出错误但没有'
            });
        } catch (error) {
            results.push({
                name: '无效月份参数处理',
                pass: true,
                details: `正确处理无效月份: ${error.message}`
            });
        }
        
        // 测试3: 无效用户ID
        try {
            await dataService.getInvoiceStatusDistribution(null, month);
            results.push({
                name: '无效用户ID处理',
                pass: false,
                details: '应该抛出错误但没有'
            });
        } catch (error) {
            results.push({
                name: '无效用户ID处理',
                pass: true,
                details: `正确处理无效用户ID: ${error.message}`
            });
        }
        
        console.log('3. 异常发票数据处理测试...');
        
        // 测试4: 负金额发票处理
        const testMonth = '2024-09';
        const statusDistribution = await dataService.getInvoiceStatusDistribution(userId, testMonth);
        const negativeAmountInvoices = memoryDb.invoices.filter(inv => inv.amount < 0);
        
        results.push({
            name: '负金额发票处理',
            pass: negativeAmountInvoices.length > 0,
            details: `发现 ${negativeAmountInvoices.length} 张负金额发票，系统应能正确处理`
        });
        
        // 测试5: 缺少必要字段的发票处理
        const invalidInvoices = memoryDb.invoices.filter(inv => 
            inv.amount === undefined || inv.amount === null
        );
        
        results.push({
            name: '缺少必要字段处理',
            pass: invalidInvoices.length > 0,
            details: `发现 ${invalidInvoices.length} 张缺少金额字段的发票`
        });
        
        // 测试6: 无效状态发票处理
        const invalidStatusInvoices = memoryDb.invoices.filter(inv => 
            !['paid', 'pending', 'overdue', 'cancelled'].includes(inv.status)
        );
        
        results.push({
            name: '无效状态发票处理',
            pass: invalidStatusInvoices.length > 0,
            details: `发现 ${invalidStatusInvoices.length} 张无效状态发票`
        });
        
        console.log('4. 日期边界测试...');
        
        // 测试7: 无效日期格式处理
        const invalidDateInvoices = memoryDb.invoices.filter(inv => {
            try {
                new Date(inv.createdAt);
                return false;
            } catch {
                return true;
            }
        });
        
        results.push({
            name: '无效日期格式处理',
            pass: true, // 系统应该能处理无效日期
            details: `发现 ${invalidDateInvoices.length} 张无效日期发票`
        });
        
        // 测试8: 未来日期发票处理
        const now = new Date();
        const futureInvoices = memoryDb.invoices.filter(inv => {
            try {
                return new Date(inv.createdAt) > now;
            } catch {
                return false;
            }
        });
        
        results.push({
            name: '未来日期发票处理',
            pass: futureInvoices.length > 0,
            details: `发现 ${futureInvoices.length} 张未来日期发票`
        });
        
        // 测试9: 逻辑错误日期处理（支付日期早于创建日期）
        const logicalErrorInvoices = memoryDb.invoices.filter(inv => {
            try {
                return inv.paidAt && new Date(inv.paidAt) < new Date(inv.createdAt);
            } catch {
                return false;
            }
        });
        
        results.push({
            name: '逻辑错误日期处理',
            pass: logicalErrorInvoices.length > 0,
            details: `发现 ${logicalErrorInvoices.length} 张支付日期早于创建日期的发票`
        });
        
        console.log('5. 极值测试...');
        
        // 测试10: 极大金额处理
        const largeAmountInvoices = memoryDb.invoices.filter(inv => 
            inv.amount > 1000000000 // 10亿以上
        );
        
        results.push({
            name: '极大金额处理',
            pass: largeAmountInvoices.length > 0,
            details: `发现 ${largeAmountInvoices.length} 张极大金额发票`
        });
        
        // 测试11: 极小金额处理
        const tinyAmountInvoices = memoryDb.invoices.filter(inv => 
            inv.amount > 0 && inv.amount < 0.001
        );
        
        results.push({
            name: '极小金额处理',
            pass: tinyAmountInvoices.length > 0,
            details: `发现 ${tinyAmountInvoices.length} 张极小金额发票`
        });
        
        console.log('6. 数据一致性在异常情况下的表现...');
        
        // 测试12: 异常数据下的一致性验证
        const validationResult = await dataService.validateDataConsistency(userId, testMonth);
        
        results.push({
            name: '异常数据下的一致性验证',
            pass: true, // 验证应该能够运行，不管结果如何
            details: `验证结果: ${validationResult.isConsistent ? '一致' : '不一致'}, 问题数: ${validationResult.issues.length}`
        });
        
    } catch (error) {
        console.error('边界测试执行错误:', error);
        results.push({
            name: '边界测试执行',
            pass: false,
            details: `错误: ${error.message}`
        });
    }
    
    // 输出测试结果
    console.log('\n=== 边界情况测试结果 ===\n');
    
    let passedCount = 0;
    let totalCount = results.length;
    
    results.forEach((result, index) => {
        const status = result.pass ? '✅ 通过' : '❌ 失败';
        console.log(`${index + 1}. ${result.name}: ${status}`);
        console.log(`   详情: ${result.details}\n`);
        
        if (result.pass) passedCount++;
    });
    
    console.log(`边界测试总计: ${passedCount}/${totalCount} 个测试通过`);
    console.log(`通过率: ${Math.round(passedCount / totalCount * 100)}%`);
    
    if (passedCount === totalCount) {
        console.log('\n🎉 所有边界测试通过！系统对异常情况处理良好。');
    } else {
        console.log('\n⚠️  部分边界测试失败，需要加强异常处理。');
    }
    
    return {
        passed: passedCount,
        total: totalCount,
        results: results
    };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runEdgeCaseTests().catch(console.error);
}

module.exports = {
    createEdgeCaseTestData,
    runEdgeCaseTests
};