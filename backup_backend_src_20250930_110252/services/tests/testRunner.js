/**
 * 测试运行器
 * 统一运行所有服务层测试
 */

const DataServiceTest = require('./DataService.test');
const DateUtilsTest = require('./DateUtils.test');
const InvoiceFilterServiceTest = require('./InvoiceFilterService.test');

/**
 * 简易测试框架
 */
class SimpleTestFramework {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  /**
   * 运行单个测试套件
   */
  async runTestSuite(suiteName, testFunction) {
    console.log(`\n=== 运行 ${suiteName} 测试套件 ===`);
    
    try {
      const startTime = Date.now();
      const success = await testFunction();
      const endTime = Date.now();
      
      if (success) {
        console.log(`✅ ${suiteName} 测试套件通过 (${endTime - startTime}ms)`);
        this.results.passed++;
        this.results.details.push({
          suite: suiteName,
          status: 'passed',
          duration: endTime - startTime
        });
      } else {
        throw new Error('测试函数返回false');
      }
    } catch (error) {
      console.error(`❌ ${suiteName} 测试套件失败:`, error.message);
      this.results.failed++;
      this.results.details.push({
        suite: suiteName,
        status: 'failed',
        error: error.message
      });
    }
    
    this.results.total++;
  }

  /**
   * 打印测试结果摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('测试结果摘要');
    console.log('='.repeat(50));
    console.log(`总测试套件: ${this.results.total}`);
    console.log(`通过: ${this.results.passed}`);
    console.log(`失败: ${this.results.failed}`);
    console.log(`成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n失败的测试套件:');
      this.results.details
        .filter(detail => detail.status === 'failed')
        .forEach(detail => {
          console.log(`- ${detail.suite}: ${detail.error}`);
        });
    }
    
    console.log('='.repeat(50));
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  const framework = new SimpleTestFramework();
  
  console.log('开始运行所有服务层测试...');
  
  // 运行各个测试套件
  await framework.runTestSuite('DataService', DataServiceTest.runAllTests);
  await framework.runTestSuite('DateUtils', DateUtilsTest.runAllTests);
  await framework.runTestSuite('InvoiceFilterService', InvoiceFilterServiceTest.runAllTests);
  
  // 打印结果摘要
  framework.printSummary();
  
  return framework.results.failed === 0;
}

/**
 * 运行特定测试套件
 */
async function runSpecificTest(testName) {
  const framework = new SimpleTestFramework();
  
  switch (testName.toLowerCase()) {
    case 'dataservice':
      await framework.runTestSuite('DataService', DataServiceTest.runAllTests);
      break;
    case 'dateutils':
      await framework.runTestSuite('DateUtils', DateUtilsTest.runAllTests);
      break;
    case 'invoicefilterservice':
      await framework.runTestSuite('InvoiceFilterService', InvoiceFilterServiceTest.runAllTests);
      break;
    default:
      console.error(`未知的测试套件: ${testName}`);
      return false;
  }
  
  framework.printSummary();
  return framework.results.failed === 0;
}

/**
 * 运行集成测试
 */
async function runIntegrationTests() {
  console.log('\n=== 运行集成测试 ===');
  
  try {
    // 数据一致性验证
    console.log('验证数据一致性...');
    const DataService = require('../DataService');
    const consistencyResult = await DataService.validateDataConsistency('user1', '2024-01');
    
    if (!consistencyResult.isConsistent) {
      throw new Error('数据一致性验证失败');
    }
    
    console.log('✅ 数据一致性验证通过');
    
    // API响应时间测试
    console.log('测试API响应时间...');
    const startTime = Date.now();
    await DataService.getUnifiedChartData('user1', '2024-01');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    if (responseTime > 100) {
      console.warn(`⚠️ API响应时间较慢: ${responseTime}ms`);
    } else {
      console.log(`✅ API响应时间正常: ${responseTime}ms`);
    }
    
    console.log('✅ 集成测试通过');
    return true;
    
  } catch (error) {
    console.error('❌ 集成测试失败:', error.message);
    return false;
  }
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 所有测试通过！');
        process.exit(0);
      } else {
        console.log('\n💥 有测试失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('测试运行出错:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  runSpecificTest,
  runIntegrationTests,
  SimpleTestFramework
};