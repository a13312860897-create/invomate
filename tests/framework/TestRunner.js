/**
 * 数据一致性测试框架 - 测试执行器
 * 负责管理和执行所有测试套件
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

class TestRunner {
  constructor(config = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      parallel: false,
      outputDir: './reports',
      ...config
    };
    
    this.testSuites = [];
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * 注册测试套件
   * @param {Object} testSuite - 测试套件对象
   */
  registerTestSuite(testSuite) {
    if (!testSuite.name || !testSuite.tests) {
      throw new Error('测试套件必须包含 name 和 tests 属性');
    }
    
    this.testSuites.push({
      ...testSuite,
      id: this.generateId(),
      registeredAt: new Date().toISOString()
    });
    
    console.log(`✓ 已注册测试套件: ${testSuite.name} (${testSuite.tests.length} 个测试)`);
  }

  /**
   * 执行所有测试套件
   * @returns {Object} 测试结果摘要
   */
  async runAllTests() {
    console.log('\n🚀 开始执行数据一致性测试...\n');
    
    this.startTime = performance.now();
    this.results = [];

    try {
      if (this.config.parallel) {
        await this.runTestsInParallel();
      } else {
        await this.runTestsSequentially();
      }
    } catch (error) {
      console.error('❌ 测试执行过程中发生错误:', error.message);
    }

    this.endTime = performance.now();
    
    const summary = this.generateSummary();
    await this.saveResults();
    
    this.printSummary(summary);
    return summary;
  }

  /**
   * 顺序执行测试套件
   */
  async runTestsSequentially() {
    for (const testSuite of this.testSuites) {
      console.log(`\n📋 执行测试套件: ${testSuite.name}`);
      const result = await this.runTestSuite(testSuite);
      this.results.push(result);
    }
  }

  /**
   * 并行执行测试套件
   */
  async runTestsInParallel() {
    const promises = this.testSuites.map(testSuite => 
      this.runTestSuite(testSuite)
    );
    
    this.results = await Promise.all(promises);
  }

  /**
   * 执行单个测试套件
   * @param {Object} testSuite - 测试套件
   * @returns {Object} 测试套件结果
   */
  async runTestSuite(testSuite) {
    const suiteStartTime = performance.now();
    const suiteResult = {
      id: testSuite.id,
      name: testSuite.name,
      description: testSuite.description || '',
      startTime: new Date().toISOString(),
      tests: [],
      summary: {
        total: testSuite.tests.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    };

    // 执行套件前置操作
    if (testSuite.beforeAll) {
      try {
        await this.executeWithTimeout(testSuite.beforeAll, 'beforeAll');
      } catch (error) {
        console.error(`❌ 套件前置操作失败: ${error.message}`);
        suiteResult.beforeAllError = error.message;
      }
    }

    // 执行所有测试
    for (const test of testSuite.tests) {
      const testResult = await this.runSingleTest(test, testSuite);
      suiteResult.tests.push(testResult);
      
      // 更新统计
      if (testResult.status === 'passed') {
        suiteResult.summary.passed++;
      } else if (testResult.status === 'failed') {
        suiteResult.summary.failed++;
      } else {
        suiteResult.summary.skipped++;
      }
    }

    // 执行套件后置操作
    if (testSuite.afterAll) {
      try {
        await this.executeWithTimeout(testSuite.afterAll, 'afterAll');
      } catch (error) {
        console.error(`❌ 套件后置操作失败: ${error.message}`);
        suiteResult.afterAllError = error.message;
      }
    }

    const suiteEndTime = performance.now();
    suiteResult.summary.duration = Math.round(suiteEndTime - suiteStartTime);
    suiteResult.endTime = new Date().toISOString();

    return suiteResult;
  }

  /**
   * 执行单个测试
   * @param {Object} test - 测试对象
   * @param {Object} testSuite - 所属测试套件
   * @returns {Object} 测试结果
   */
  async runSingleTest(test, testSuite) {
    const testStartTime = performance.now();
    const testResult = {
      name: test.name,
      description: test.description || '',
      startTime: new Date().toISOString(),
      status: 'pending',
      duration: 0,
      retries: 0,
      error: null,
      logs: []
    };

    // 跳过被标记为跳过的测试
    if (test.skip) {
      testResult.status = 'skipped';
      testResult.skipReason = test.skipReason || '测试被跳过';
      console.log(`⏭️  跳过测试: ${test.name}`);
      return testResult;
    }

    let attempts = 0;
    const maxAttempts = (test.retries !== undefined) ? test.retries + 1 : this.config.retries + 1;

    while (attempts < maxAttempts) {
      attempts++;
      testResult.retries = attempts - 1;

      try {
        // 执行测试前置操作
        if (testSuite.beforeEach) {
          await this.executeWithTimeout(testSuite.beforeEach, 'beforeEach');
        }

        // 执行测试
        console.log(`  🧪 执行测试: ${test.name}${attempts > 1 ? ` (重试 ${attempts - 1})` : ''}`);
        await this.executeWithTimeout(test.test, test.name, test.timeout);
        
        // 执行测试后置操作
        if (testSuite.afterEach) {
          await this.executeWithTimeout(testSuite.afterEach, 'afterEach');
        }

        testResult.status = 'passed';
        console.log(`  ✅ 测试通过: ${test.name}`);
        break;

      } catch (error) {
        testResult.error = {
          message: error.message,
          stack: error.stack,
          attempt: attempts
        };

        if (attempts < maxAttempts) {
          console.log(`  ⚠️  测试失败，准备重试: ${test.name} (${error.message})`);
          await this.delay(1000); // 重试前等待1秒
        } else {
          testResult.status = 'failed';
          console.log(`  ❌ 测试失败: ${test.name} - ${error.message}`);
        }
      }
    }

    const testEndTime = performance.now();
    testResult.duration = Math.round(testEndTime - testStartTime);
    testResult.endTime = new Date().toISOString();

    return testResult;
  }

  /**
   * 带超时执行函数
   * @param {Function} fn - 要执行的函数
   * @param {string} name - 函数名称
   * @param {number} timeout - 超时时间
   */
  async executeWithTimeout(fn, name, timeout = this.config.timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${name} 执行超时 (${timeout}ms)`));
      }, timeout);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 生成测试结果摘要
   * @returns {Object} 测试摘要
   */
  generateSummary() {
    const summary = {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString(),
      duration: Math.round(this.endTime - this.startTime),
      testSuites: {
        total: this.testSuites.length,
        passed: 0,
        failed: 0
      },
      tests: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      successRate: 0,
      failedTests: []
    };

    // 统计结果
    this.results.forEach(suiteResult => {
      summary.tests.total += suiteResult.summary.total;
      summary.tests.passed += suiteResult.summary.passed;
      summary.tests.failed += suiteResult.summary.failed;
      summary.tests.skipped += suiteResult.summary.skipped;

      if (suiteResult.summary.failed === 0) {
        summary.testSuites.passed++;
      } else {
        summary.testSuites.failed++;
      }

      // 收集失败的测试
      suiteResult.tests.forEach(test => {
        if (test.status === 'failed') {
          summary.failedTests.push({
            suite: suiteResult.name,
            test: test.name,
            error: test.error?.message || '未知错误'
          });
        }
      });
    });

    // 计算成功率
    if (summary.tests.total > 0) {
      summary.successRate = Math.round((summary.tests.passed / summary.tests.total) * 100);
    }

    return summary;
  }

  /**
   * 保存测试结果
   */
  async saveResults() {
    try {
      // 确保输出目录存在
      await fs.mkdir(this.config.outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // 保存详细结果
      const detailedResults = {
        summary: this.generateSummary(),
        results: this.results,
        config: this.config,
        timestamp
      };

      const jsonPath = path.join(this.config.outputDir, `test-results-${timestamp}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(detailedResults, null, 2));

      // 保存最新结果
      const latestPath = path.join(this.config.outputDir, 'latest-results.json');
      await fs.writeFile(latestPath, JSON.stringify(detailedResults, null, 2));

      console.log(`\n📄 测试结果已保存到: ${jsonPath}`);
    } catch (error) {
      console.error('❌ 保存测试结果失败:', error.message);
    }
  }

  /**
   * 打印测试摘要
   * @param {Object} summary - 测试摘要
   */
  printSummary(summary) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试执行摘要');
    console.log('='.repeat(60));
    console.log(`⏱️  执行时间: ${summary.duration}ms`);
    console.log(`📋 测试套件: ${summary.testSuites.total} 个 (通过: ${summary.testSuites.passed}, 失败: ${summary.testSuites.failed})`);
    console.log(`🧪 测试用例: ${summary.tests.total} 个 (通过: ${summary.tests.passed}, 失败: ${summary.tests.failed}, 跳过: ${summary.tests.skipped})`);
    console.log(`📈 成功率: ${summary.successRate}%`);

    if (summary.failedTests.length > 0) {
      console.log('\n❌ 失败的测试:');
      summary.failedTests.forEach(failed => {
        console.log(`   • ${failed.suite} > ${failed.test}: ${failed.error}`);
      });
    }

    console.log('='.repeat(60));
    
    if (summary.successRate === 100) {
      console.log('🎉 所有测试都通过了！');
    } else {
      console.log('⚠️  存在失败的测试，请检查并修复问题。');
    }
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取测试统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      registeredSuites: this.testSuites.length,
      totalTests: this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0),
      lastRunResults: this.results.length > 0 ? this.generateSummary() : null
    };
  }
}

module.exports = TestRunner;