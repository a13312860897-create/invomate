/**
 * 性能测试套件
 * 测试系统在不同数据量和负载下的性能表现
 */

const path = require('path');
const DataService = require('../services/DataService');
const InvoiceFilterService = require('../services/InvoiceFilterService');

// 内存数据库模拟
const memoryDb = {
    invoices: []
};

/**
 * 生成大量测试数据
 */
function generateLargeDataset(count = 10000) {
    memoryDb.invoices = [];
    
    const statuses = ['paid', 'pending', 'overdue', 'cancelled'];
    const invoices = [];
    
    console.log(`正在生成 ${count} 张测试发票...`);
    
    for (let i = 1; i <= count; i++) {
        const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const paidDate = status === 'paid' ? 
            new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
        
        invoices.push({
            id: i,
            amount: Math.round((Math.random() * 10000 + 100) * 100) / 100,
            status: status,
            createdAt: createdDate.toISOString(),
            updatedAt: createdDate.toISOString(),
            paidAt: paidDate ? paidDate.toISOString() : null,
            issuedAt: createdDate.toISOString(),
            dueAt: new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // 每1000条显示进度
        if (i % 1000 === 0) {
            console.log(`已生成 ${i}/${count} 张发票...`);
        }
    }
    
    memoryDb.invoices = invoices;
    console.log(`✓ 成功生成 ${count} 张测试发票`);
    return invoices;
}

/**
 * 性能测试工具函数
 */
function measurePerformance(name, fn) {
    return async (...args) => {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        const result = await fn(...args);
        
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const executionTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        return {
            result,
            performance: {
                name,
                executionTime: Math.round(executionTime * 100) / 100,
                memoryDelta: Math.round(memoryDelta / 1024), // KB
                memoryUsed: Math.round(endMemory.heapUsed / 1024 / 1024) // MB
            }
        };
    };
}

/**
 * 运行性能测试
 */
async function runPerformanceTests() {
    console.log('\n=== 性能测试套件 ===\n');
    
    const results = [];
    const performanceMetrics = [];
    
    try {
        // 测试不同数据量级
        const dataSizes = [100, 1000, 5000, 10000];
        
        for (const size of dataSizes) {
            console.log(`\n--- 测试数据量: ${size} 张发票 ---`);
            
            // 生成测试数据
            const dataGenStart = Date.now();
            generateLargeDataset(size);
            const dataGenTime = Date.now() - dataGenStart;
            
            console.log(`数据生成耗时: ${dataGenTime}ms`);
            
            const dataService = new DataService(memoryDb);
            const month = '2024-09';
            
            // 测试各个API的性能
            const userId = 1; // 测试用户ID
            const apis = [
                { name: 'getInvoiceStatusDistribution', fn: () => dataService.getInvoiceStatusDistribution(userId, month) },
                { name: 'getRevenueTrend', fn: () => dataService.getRevenueTrend(userId, month) },
                { name: 'getMonthlyInvoiceSummary', fn: () => dataService.getMonthlyInvoiceSummary(userId, month) },
                { name: 'getUnifiedChartData', fn: () => dataService.getUnifiedChartData(userId, month) },
                { name: 'validateDataConsistency', fn: () => dataService.validateDataConsistency(userId, month) }
            ];
            
            for (const api of apis) {
                const measuredFn = measurePerformance(`${api.name}_${size}`, api.fn);
                const { result, performance } = await measuredFn();
                
                performanceMetrics.push({
                    ...performance,
                    dataSize: size,
                    apiName: api.name
                });
                
                console.log(`${api.name}: ${performance.executionTime}ms, 内存: ${performance.memoryDelta}KB`);
                
                // 性能基准测试
                const isPerformant = performance.executionTime < (size / 10 + 100); // 动态基准
                results.push({
                    name: `${api.name} 性能 (${size}条数据)`,
                    pass: isPerformant,
                    details: `执行时间: ${performance.executionTime}ms, 内存变化: ${performance.memoryDelta}KB`
                });
            }
        }
        
        console.log('\n--- 并发测试 ---');
        
        // 并发测试
        generateLargeDataset(1000);
        const dataService = new DataService(memoryDb);
        const month = '2024-09';
        const userId = 1;
        
        const concurrentStart = Date.now();
        const concurrentPromises = Array.from({ length: 10 }, () => 
            Promise.all([
                dataService.getInvoiceStatusDistribution(userId, month),
                dataService.getRevenueTrend(userId, month),
                dataService.getMonthlyInvoiceSummary(userId, month)
            ])
        );
        
        await Promise.all(concurrentPromises);
        const concurrentTime = Date.now() - concurrentStart;
        
        results.push({
            name: '并发API调用性能',
            pass: concurrentTime < 5000, // 5秒内完成
            details: `10个并发请求组耗时: ${concurrentTime}ms`
        });
        
        console.log(`并发测试完成: ${concurrentTime}ms`);
        
        console.log('\n--- 内存泄漏测试 ---');
        
        // 内存泄漏测试
        const initialMemory = process.memoryUsage().heapUsed;
        
        for (let i = 0; i < 100; i++) {
            await dataService.getInvoiceStatusDistribution(userId, month);
            await dataService.getRevenueTrend(userId, month);
            
            // 每10次检查一次内存
            if (i % 10 === 0) {
                if (global.gc) {
                    global.gc(); // 强制垃圾回收（需要 --expose-gc 参数）
                }
                const currentMemory = process.memoryUsage().heapUsed;
                const memoryGrowth = currentMemory - initialMemory;
                console.log(`第${i}次迭代，内存增长: ${Math.round(memoryGrowth / 1024)}KB`);
            }
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const totalMemoryGrowth = finalMemory - initialMemory;
        
        results.push({
            name: '内存泄漏测试',
            pass: totalMemoryGrowth < 50 * 1024 * 1024, // 小于50MB增长
            details: `100次迭代后内存增长: ${Math.round(totalMemoryGrowth / 1024 / 1024)}MB`
        });
        
        console.log('\n--- 缓存性能测试 ---');
        
        // 缓存性能测试
        generateLargeDataset(5000);
        const cachedDataService = new DataService(memoryDb);
        
        // 第一次调用（无缓存）
        const firstCallStart = Date.now();
        await cachedDataService.getInvoiceStatusDistribution(userId, month);
        const firstCallTime = Date.now() - firstCallStart;
        
        // 第二次调用（有缓存）
        const secondCallStart = Date.now();
        await cachedDataService.getInvoiceStatusDistribution(userId, month);
        const secondCallTime = Date.now() - secondCallStart;
        
        const cacheSpeedup = firstCallTime / secondCallTime;
        
        results.push({
            name: '缓存性能提升',
            pass: cacheSpeedup > 2, // 至少2倍提升
            details: `首次: ${firstCallTime}ms, 缓存: ${secondCallTime}ms, 提升: ${cacheSpeedup.toFixed(2)}x`
        });
        
        console.log(`缓存测试 - 首次: ${firstCallTime}ms, 缓存: ${secondCallTime}ms`);
        
    } catch (error) {
        console.error('性能测试执行错误:', error);
        results.push({
            name: '性能测试执行',
            pass: false,
            details: `错误: ${error.message}`
        });
    }
    
    // 输出测试结果
    console.log('\n=== 性能测试结果汇总 ===\n');
    
    let passedCount = 0;
    let totalCount = results.length;
    
    results.forEach((result, index) => {
        const status = result.pass ? '✅ 通过' : '❌ 失败';
        console.log(`${index + 1}. ${result.name}: ${status}`);
        console.log(`   详情: ${result.details}\n`);
        
        if (result.pass) passedCount++;
    });
    
    // 性能指标分析
    console.log('\n=== 性能指标分析 ===\n');
    
    const apiNames = [...new Set(performanceMetrics.map(m => m.apiName))];
    
    apiNames.forEach(apiName => {
        const apiMetrics = performanceMetrics.filter(m => m.apiName === apiName);
        console.log(`${apiName}:`);
        
        apiMetrics.forEach(metric => {
            console.log(`  ${metric.dataSize}条数据: ${metric.executionTime}ms`);
        });
        
        // 计算性能增长趋势
        if (apiMetrics.length > 1) {
            const sorted = apiMetrics.sort((a, b) => a.dataSize - b.dataSize);
            const growthRate = sorted[sorted.length - 1].executionTime / sorted[0].executionTime;
            const dataGrowthRate = sorted[sorted.length - 1].dataSize / sorted[0].dataSize;
            const efficiency = growthRate / dataGrowthRate;
            
            console.log(`  性能增长率: ${growthRate.toFixed(2)}x (数据增长 ${dataGrowthRate}x)`);
            console.log(`  效率指标: ${efficiency.toFixed(3)} (越小越好)\n`);
        }
    });
    
    console.log(`性能测试总计: ${passedCount}/${totalCount} 个测试通过`);
    console.log(`通过率: ${Math.round(passedCount / totalCount * 100)}%`);
    
    if (passedCount === totalCount) {
        console.log('\n🎉 所有性能测试通过！系统性能表现优秀。');
    } else {
        console.log('\n⚠️  部分性能测试失败，需要优化性能。');
    }
    
    return {
        passed: passedCount,
        total: totalCount,
        results: results,
        performanceMetrics: performanceMetrics
    };
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runPerformanceTests().catch(console.error);
}

module.exports = {
    generateLargeDataset,
    measurePerformance,
    runPerformanceTests
};