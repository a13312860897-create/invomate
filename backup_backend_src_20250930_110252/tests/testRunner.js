/**
 * 测试运行器
 * 统一执行所有测试套件并生成综合测试报告
 */

const path = require('path');
const fs = require('fs');

// 导入所有测试套件
const { runComprehensiveTests } = require('./comprehensiveDataConsistency.test');
const { runEdgeCaseTests } = require('./edgeCases.test');
const { runPerformanceTests } = require('./performanceTests.test');

/**
 * 生成测试报告
 */
function generateTestReport(allResults) {
    const timestamp = new Date().toISOString();
    const totalPassed = allResults.reduce((sum, result) => sum + result.passed, 0);
    const totalTests = allResults.reduce((sum, result) => sum + result.total, 0);
    const overallPassRate = Math.round((totalPassed / totalTests) * 100);
    
    const report = {
        timestamp,
        summary: {
            totalTests,
            totalPassed,
            totalFailed: totalTests - totalPassed,
            overallPassRate: `${overallPassRate}%`
        },
        testSuites: allResults.map(result => ({
            name: result.suiteName,
            passed: result.passed,
            total: result.total,
            passRate: `${Math.round((result.passed / result.total) * 100)}%`,
            results: result.results
        })),
        recommendations: generateRecommendations(allResults),
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memoryUsage: process.memoryUsage()
        }
    };
    
    return report;
}

/**
 * 生成改进建议
 */
function generateRecommendations(allResults) {
    const recommendations = [];
    
    // 分析失败的测试
    const failedTests = [];
    allResults.forEach(suite => {
        suite.results.forEach(test => {
            if (!test.pass) {
                failedTests.push({
                    suite: suite.suiteName,
                    test: test.name,
                    details: test.details
                });
            }
        });
    });
    
    if (failedTests.length === 0) {
        recommendations.push({
            type: 'success',
            message: '🎉 所有测试通过！系统运行状态良好。',
            priority: 'info'
        });
    } else {
        recommendations.push({
            type: 'failure',
            message: `发现 ${failedTests.length} 个失败的测试，需要关注以下问题：`,
            priority: 'high',
            details: failedTests
        });
    }
    
    // 性能建议
    const performanceSuite = allResults.find(r => r.suiteName === '性能测试');
    if (performanceSuite) {
        const performanceFailures = performanceSuite.results.filter(r => !r.pass);
        if (performanceFailures.length > 0) {
            recommendations.push({
                type: 'performance',
                message: '检测到性能问题，建议进行以下优化：',
                priority: 'medium',
                suggestions: [
                    '考虑实施数据分页以处理大数据集',
                    '优化数据库查询和索引',
                    '实施更高效的缓存策略',
                    '考虑异步处理长时间运行的操作'
                ]
            });
        }
    }
    
    // 边界情况建议
    const edgeCaseSuite = allResults.find(r => r.suiteName === '边界情况测试');
    if (edgeCaseSuite) {
        const edgeCaseFailures = edgeCaseSuite.results.filter(r => !r.pass);
        if (edgeCaseFailures.length > 0) {
            recommendations.push({
                type: 'robustness',
                message: '发现边界情况处理问题，建议加强：',
                priority: 'medium',
                suggestions: [
                    '添加更严格的输入验证',
                    '改进错误处理和异常捕获',
                    '增加数据清洗和标准化流程',
                    '实施更全面的日志记录'
                ]
            });
        }
    }
    
    // 数据一致性建议
    const consistencySuite = allResults.find(r => r.suiteName === '全面数据一致性测试');
    if (consistencySuite) {
        const consistencyFailures = consistencySuite.results.filter(r => !r.pass);
        if (consistencyFailures.length > 0) {
            recommendations.push({
                type: 'consistency',
                message: '数据一致性需要改进：',
                priority: 'high',
                suggestions: [
                    '审查和统一数据筛选逻辑',
                    '实施更频繁的数据一致性检查',
                    '考虑使用事务确保数据完整性',
                    '建立数据质量监控机制'
                ]
            });
        }
    }
    
    return recommendations;
}

/**
 * 保存测试报告到文件
 */
function saveTestReport(report) {
    const reportsDir = path.join(__dirname, 'reports');
    
    // 确保报告目录存在
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `test-report-${timestamp}.json`);
    const htmlReportPath = path.join(reportsDir, `test-report-${timestamp}.html`);
    
    // 保存JSON报告
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 生成HTML报告
    const htmlReport = generateHtmlReport(report);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`\n📊 测试报告已保存:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return { jsonPath: reportPath, htmlPath: htmlReportPath };
}

/**
 * 生成HTML测试报告
 */
function generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告 - ${report.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .test-suite { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .test-suite-header { background: #007bff; color: white; padding: 15px; font-weight: bold; }
        .test-result { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .test-result:last-child { border-bottom: none; }
        .test-result.pass { background-color: #d4edda; }
        .test-result.fail { background-color: #f8d7da; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .recommendation { margin-bottom: 15px; }
        .recommendation.high { border-left: 4px solid #dc3545; padding-left: 15px; }
        .recommendation.medium { border-left: 4px solid #ffc107; padding-left: 15px; }
        .recommendation.info { border-left: 4px solid #17a2b8; padding-left: 15px; }
        .system-info { background: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px; font-family: monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 测试报告</h1>
            <p>生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>总测试数</h3>
                <div class="number">${report.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>通过测试</h3>
                <div class="number pass">${report.summary.totalPassed}</div>
            </div>
            <div class="summary-card">
                <h3>失败测试</h3>
                <div class="number fail">${report.summary.totalFailed}</div>
            </div>
            <div class="summary-card">
                <h3>通过率</h3>
                <div class="number">${report.summary.overallPassRate}</div>
            </div>
        </div>
        
        ${report.testSuites.map(suite => `
            <div class="test-suite">
                <div class="test-suite-header">
                    ${suite.name} (${suite.passed}/${suite.total} 通过, ${suite.passRate})
                </div>
                ${suite.results.map(test => `
                    <div class="test-result ${test.pass ? 'pass' : 'fail'}">
                        <span>${test.name}</span>
                        <span>${test.pass ? '✅' : '❌'}</span>
                    </div>
                    <div style="padding: 5px 15px; font-size: 0.9em; color: #666;">
                        ${test.details}
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div class="recommendations">
            <h2>📋 改进建议</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <strong>${rec.message}</strong>
                    ${rec.suggestions ? `
                        <ul>
                            ${rec.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${rec.details ? `
                        <details>
                            <summary>详细信息</summary>
                            <pre>${JSON.stringify(rec.details, null, 2)}</pre>
                        </details>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="system-info">
            <h3>系统信息</h3>
            <div>Node.js版本: ${report.systemInfo.nodeVersion}</div>
            <div>平台: ${report.systemInfo.platform} (${report.systemInfo.arch})</div>
            <div>内存使用: ${Math.round(report.systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB</div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * 主测试运行器
 */
async function runAllTests() {
    console.log('🚀 开始执行全面测试套件...\n');
    
    const startTime = Date.now();
    const allResults = [];
    
    try {
        // 运行全面数据一致性测试
        console.log('📊 执行全面数据一致性测试...');
        const comprehensiveResult = await runComprehensiveTests();
        allResults.push({
            suiteName: '全面数据一致性测试',
            ...comprehensiveResult
        });
        
        // 运行边界情况测试
        console.log('\n🔍 执行边界情况测试...');
        const edgeCaseResult = await runEdgeCaseTests();
        allResults.push({
            suiteName: '边界情况测试',
            ...edgeCaseResult
        });
        
        // 运行性能测试
        console.log('\n⚡ 执行性能测试...');
        const performanceResult = await runPerformanceTests();
        allResults.push({
            suiteName: '性能测试',
            ...performanceResult
        });
        
    } catch (error) {
        console.error('测试执行过程中发生错误:', error);
        allResults.push({
            suiteName: '测试执行错误',
            passed: 0,
            total: 1,
            results: [{
                name: '测试套件执行',
                pass: false,
                details: `错误: ${error.message}`
            }]
        });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // 生成综合报告
    const report = generateTestReport(allResults);
    report.executionTime = `${Math.round(totalTime / 1000)}秒`;
    
    // 保存报告
    const reportPaths = saveTestReport(report);
    
    // 输出最终结果
    console.log('\n' + '='.repeat(60));
    console.log('🏁 测试执行完成');
    console.log('='.repeat(60));
    console.log(`⏱️  总执行时间: ${report.executionTime}`);
    console.log(`📈 总体通过率: ${report.summary.overallPassRate}`);
    console.log(`✅ 通过测试: ${report.summary.totalPassed}`);
    console.log(`❌ 失败测试: ${report.summary.totalFailed}`);
    console.log(`📊 总测试数: ${report.summary.totalTests}`);
    
    // 显示关键建议
    const highPriorityRecs = report.recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
        console.log('\n🚨 高优先级建议:');
        highPriorityRecs.forEach(rec => {
            console.log(`   • ${rec.message}`);
        });
    }
    
    console.log(`\n📄 详细报告: ${reportPaths.htmlPath}`);
    console.log('='.repeat(60));
    
    return report;
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    generateTestReport,
    saveTestReport
};