/**
 * 运行所有数据一致性测试
 * 包括仪表板、发票管理、客户管理、报表等页面的数据一致性验证
 */

const DashboardConsistencyTest = require('./consistency/dashboard-consistency-test');
const InvoiceConsistencyTest = require('./consistency/invoice-consistency-test');
const ClientConsistencyTest = require('./consistency/client-consistency-test');
const ReportConsistencyTest = require('./consistency/report-consistency-test');

class AllConsistencyTests {
  constructor() {
    this.tests = [
      { name: '仪表板数据一致性测试', class: DashboardConsistencyTest },
      { name: '发票管理数据一致性测试', class: InvoiceConsistencyTest },
      { name: '客户管理数据一致性测试', class: ClientConsistencyTest },
      { name: '报表数据一致性测试', class: ReportConsistencyTest }
    ];
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 开始执行所有数据一致性测试...\n');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const testConfig of this.tests) {
      console.log(`\n📋 执行 ${testConfig.name}...`);
      console.log('-'.repeat(60));
      
      try {
        const testInstance = new testConfig.class();
        
        // 初始化认证（如果测试类需要）
        if (typeof testInstance.initialize === 'function') {
          console.log('🔐 初始化认证...');
          await testInstance.initialize();
        }
        
        const result = await testInstance.run();
        
        this.results.push({
          name: testConfig.name,
          success: true,
          result: result,
          error: null
        });

        // 统计测试结果
        if (result && result.summary) {
          totalTests += result.summary.totalTests;
          passedTests += result.summary.passedTests;
          failedTests += result.summary.failedTests;
        }

        console.log(`✅ ${testConfig.name} 完成`);
        
      } catch (error) {
        console.error(`❌ ${testConfig.name} 失败:`, error.message);
        
        this.results.push({
          name: testConfig.name,
          success: false,
          result: null,
          error: error.message
        });
        
        failedTests++;
      }
    }

    const totalTime = Date.now() - startTime;
    
    // 输出总结报告
    this.printSummaryReport(totalTests, passedTests, failedTests, totalTime);
    
    return {
      results: this.results,
      summary: {
        totalTestSuites: this.tests.length,
        successfulTestSuites: this.results.filter(r => r.success).length,
        failedTestSuites: this.results.filter(r => !r.success).length,
        totalTests,
        passedTests,
        failedTests,
        totalTime
      }
    };
  }

  printSummaryReport(totalTests, passedTests, failedTests, totalTime) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 数据一致性测试总结报告');
    console.log('='.repeat(80));
    
    // 测试套件统计
    const successfulSuites = this.results.filter(r => r.success).length;
    const failedSuites = this.results.filter(r => !r.success).length;
    
    console.log(`\n🧪 测试套件统计:`);
    console.log(`   总测试套件: ${this.tests.length}`);
    console.log(`   成功套件: ${successfulSuites}`);
    console.log(`   失败套件: ${failedSuites}`);
    console.log(`   成功率: ${((successfulSuites / this.tests.length) * 100).toFixed(1)}%`);
    
    // 测试用例统计
    console.log(`\n📋 测试用例统计:`);
    console.log(`   总测试用例: ${totalTests}`);
    console.log(`   通过用例: ${passedTests}`);
    console.log(`   失败用例: ${failedTests}`);
    console.log(`   通过率: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    
    // 执行时间
    console.log(`\n⏱️  执行时间: ${(totalTime / 1000).toFixed(2)}秒`);
    
    // 详细结果
    console.log(`\n📝 详细结果:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.name}`);
      
      if (!result.success && result.error) {
        console.log(`      错误: ${result.error}`);
      } else if (result.success && result.result && result.result.summary) {
        const summary = result.result.summary;
        console.log(`      测试用例: ${summary.passedTests}/${summary.totalTests} 通过`);
      }
    });
    
    // 问题汇总
    const failedResults = this.results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log(`\n⚠️  发现的问题:`);
      failedResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.name}: ${result.error}`);
      });
    }
    
    // 建议
    console.log(`\n💡 建议:`);
    if (failedSuites === 0) {
      console.log('   🎉 所有数据一致性测试都通过了！系统数据一致性良好。');
    } else {
      console.log('   🔧 请检查失败的测试套件，修复数据一致性问题。');
      console.log('   📊 建议优先修复影响核心功能的数据不一致问题。');
      console.log('   🔄 修复后重新运行测试以验证问题是否解决。');
    }
    
    console.log('\n' + '='.repeat(80));
  }

  // 生成详细的HTML报告
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据一致性测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-result.success { border-left-color: #28a745; }
        .test-result.error { border-left-color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>数据一致性测试报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <h3>测试套件</h3>
            <p>总数: ${this.tests.length}</p>
            <p class="success">成功: ${this.results.filter(r => r.success).length}</p>
            <p class="error">失败: ${this.results.filter(r => !r.success).length}</p>
        </div>
    </div>
    
    <h2>详细结果</h2>
    ${this.results.map(result => `
        <div class="test-result ${result.success ? 'success' : 'error'}">
            <h3>${result.success ? '✅' : '❌'} ${result.name}</h3>
            ${result.success ? 
                '<p>测试通过</p>' : 
                `<p class="error">错误: ${result.error}</p>`
            }
        </div>
    `).join('')}
</body>
</html>`;
    
    return html;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const allTests = new AllConsistencyTests();
  
  allTests.runAllTests()
    .then(results => {
      const summary = results.summary;
      
      if (summary.failedTestSuites === 0) {
        console.log('\n🎉 所有数据一致性测试完成，系统数据一致性良好！');
        process.exit(0);
      } else {
        console.log(`\n⚠️  发现 ${summary.failedTestSuites} 个测试套件失败，请检查并修复问题。`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ 测试执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = AllConsistencyTests;