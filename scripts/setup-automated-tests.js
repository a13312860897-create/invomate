const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../backend/src/utils/logger');

/**
 * 自动化测试调度器
 * 负责定期运行各种测试并生成报告
 */
class AutomatedTestScheduler {
  constructor() {
    this.jobs = new Map();
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * 启动自动化测试调度
   */
  start() {
    if (this.isRunning) {
      logger.warn('自动化测试调度器已在运行');
      return;
    }

    logger.info('启动自动化测试调度器...');
    this.isRunning = true;

    // 每小时运行一次数据一致性测试
    this.scheduleConsistencyTests();
    
    // 每天凌晨2点运行性能测试
    this.schedulePerformanceTests();
    
    // 每周一凌晨3点运行完整测试套件
    this.scheduleFullTestSuite();
    
    // 每天清理旧的测试报告
    this.scheduleReportCleanup();

    logger.info('自动化测试调度器启动完成');
  }

  /**
   * 停止自动化测试调度
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('自动化测试调度器未在运行');
      return;
    }

    logger.info('停止自动化测试调度器...');
    
    // 停止所有定时任务
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`已停止定时任务: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    
    logger.info('自动化测试调度器已停止');
  }

  /**
   * 调度数据一致性测试
   */
  scheduleConsistencyTests() {
    // 每小时的第5分钟运行
    const job = cron.schedule('5 * * * *', async () => {
      logger.info('开始执行定时数据一致性测试');
      await this.runConsistencyTests();
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('consistency-tests', job);
    job.start();
    logger.info('已调度数据一致性测试: 每小时第5分钟执行');
  }

  /**
   * 调度性能测试
   */
  schedulePerformanceTests() {
    // 每天凌晨2点运行
    const job = cron.schedule('0 2 * * *', async () => {
      logger.info('开始执行定时性能测试');
      await this.runPerformanceTests();
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('performance-tests', job);
    job.start();
    logger.info('已调度性能测试: 每天凌晨2点执行');
  }

  /**
   * 调度完整测试套件
   */
  scheduleFullTestSuite() {
    // 每周一凌晨3点运行
    const job = cron.schedule('0 3 * * 1', async () => {
      logger.info('开始执行定时完整测试套件');
      await this.runFullTestSuite();
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('full-test-suite', job);
    job.start();
    logger.info('已调度完整测试套件: 每周一凌晨3点执行');
  }

  /**
   * 调度报告清理
   */
  scheduleReportCleanup() {
    // 每天凌晨4点清理旧报告
    const job = cron.schedule('0 4 * * *', async () => {
      logger.info('开始清理旧测试报告');
      await this.cleanupOldReports();
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('report-cleanup', job);
    job.start();
    logger.info('已调度报告清理: 每天凌晨4点执行');
  }

  /**
   * 运行数据一致性测试
   */
  async runConsistencyTests() {
    try {
      const result = await this.executeTest('consistency', [
        'dashboard-consistency-test.js',
        'client-consistency-test.js',
        'invoice-consistency-test.js',
        'report-consistency-test.js'
      ]);

      await this.saveTestResult('consistency', result);
      
      if (!result.success) {
        logger.error('数据一致性测试失败', { result });
        await this.sendAlert('数据一致性测试失败', result);
      } else {
        logger.info('数据一致性测试完成', { 
          passed: result.passed, 
          total: result.total 
        });
      }
    } catch (error) {
      logger.error('执行数据一致性测试时发生错误', { error: error.message });
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTests() {
    try {
      const result = await this.executeTest('performance', [
        'api-performance-test.js',
        'database-performance-test.js'
      ]);

      await this.saveTestResult('performance', result);
      
      if (!result.success) {
        logger.error('性能测试失败', { result });
        await this.sendAlert('性能测试失败', result);
      } else {
        logger.info('性能测试完成', { 
          passed: result.passed, 
          total: result.total 
        });
      }
    } catch (error) {
      logger.error('执行性能测试时发生错误', { error: error.message });
    }
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite() {
    try {
      logger.info('开始运行完整测试套件');
      
      // 运行所有测试
      const consistencyResult = await this.runConsistencyTests();
      const performanceResult = await this.runPerformanceTests();
      
      // 生成综合报告
      const fullReport = {
        timestamp: new Date().toISOString(),
        consistency: consistencyResult,
        performance: performanceResult,
        overall: {
          success: consistencyResult?.success && performanceResult?.success,
          totalTests: (consistencyResult?.total || 0) + (performanceResult?.total || 0),
          totalPassed: (consistencyResult?.passed || 0) + (performanceResult?.passed || 0)
        }
      };

      await this.saveTestResult('full-suite', fullReport);
      logger.info('完整测试套件执行完成', { report: fullReport.overall });
      
    } catch (error) {
      logger.error('执行完整测试套件时发生错误', { error: error.message });
    }
  }

  /**
   * 执行测试
   */
  async executeTest(testType, testFiles) {
    return new Promise((resolve) => {
      const testDir = path.join(__dirname, '..', 'tests', testType);
      let totalTests = 0;
      let passedTests = 0;
      let results = [];

      const runNextTest = async (index) => {
        if (index >= testFiles.length) {
          resolve({
            success: passedTests === totalTests,
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            results: results
          });
          return;
        }

        const testFile = testFiles[index];
        const testPath = path.join(testDir, testFile);
        
        if (!fs.existsSync(testPath)) {
          logger.warn(`测试文件不存在: ${testPath}`);
          runNextTest(index + 1);
          return;
        }

        const child = spawn('node', [testPath], {
          stdio: 'pipe',
          cwd: testDir
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          totalTests++;
          const success = code === 0;
          if (success) passedTests++;

          results.push({
            testFile,
            success,
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });

          logger.info(`测试 ${testFile} ${success ? '通过' : '失败'}`);
          runNextTest(index + 1);
        });

        child.on('error', (error) => {
          totalTests++;
          results.push({
            testFile,
            success: false,
            exitCode: -1,
            stdout: '',
            stderr: error.message
          });

          logger.error(`测试 ${testFile} 执行错误: ${error.message}`);
          runNextTest(index + 1);
        });
      };

      runNextTest(0);
    });
  }

  /**
   * 保存测试结果
   */
  async saveTestResult(testType, result) {
    try {
      const reportsDir = path.join(__dirname, '..', 'tests', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testType}-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      logger.info(`测试结果已保存: ${filepath}`);
    } catch (error) {
      logger.error('保存测试结果失败', { error: error.message });
    }
  }

  /**
   * 发送告警
   */
  async sendAlert(title, details) {
    // 这里可以集成邮件、短信或其他告警系统
    logger.error(`告警: ${title}`, { details });
    
    // 示例：写入告警文件
    try {
      const alertsDir = path.join(__dirname, '..', 'logs', 'alerts');
      if (!fs.existsSync(alertsDir)) {
        fs.mkdirSync(alertsDir, { recursive: true });
      }

      const alertFile = path.join(alertsDir, `alert-${Date.now()}.json`);
      const alertData = {
        timestamp: new Date().toISOString(),
        title,
        details,
        severity: 'high'
      };

      fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
    } catch (error) {
      logger.error('写入告警文件失败', { error: error.message });
    }
  }

  /**
   * 清理旧报告
   */
  async cleanupOldReports() {
    try {
      const reportsDir = path.join(__dirname, '..', 'tests', 'reports');
      if (!fs.existsSync(reportsDir)) {
        return;
      }

      const files = fs.readdirSync(reportsDir);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天

      let deletedCount = 0;
      
      files.forEach(file => {
        const filepath = path.join(reportsDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      logger.info(`清理了 ${deletedCount} 个旧测试报告`);
    } catch (error) {
      logger.error('清理旧报告失败', { error: error.message });
    }
  }

  /**
   * 获取调度状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      lastResults: this.testResults.slice(-10) // 最近10次结果
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const scheduler = new AutomatedTestScheduler();
  
  // 处理命令行参数
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      scheduler.start();
      break;
    case 'stop':
      scheduler.stop();
      break;
    case 'status':
      console.log(JSON.stringify(scheduler.getStatus(), null, 2));
      break;
    case 'test-consistency':
      scheduler.runConsistencyTests();
      break;
    case 'test-performance':
      scheduler.runPerformanceTests();
      break;
    case 'test-full':
      scheduler.runFullTestSuite();
      break;
    default:
      console.log(`
使用方法: node setup-automated-tests.js <command>

命令:
  start              启动自动化测试调度
  stop               停止自动化测试调度
  status             查看调度状态
  test-consistency   立即运行一致性测试
  test-performance   立即运行性能测试
  test-full          立即运行完整测试套件

示例:
  node setup-automated-tests.js start
  node setup-automated-tests.js status
      `);
      process.exit(1);
  }

  // 处理进程信号
  process.on('SIGINT', () => {
    logger.info('收到中断信号，正在停止调度器...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('收到终止信号，正在停止调度器...');
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = AutomatedTestScheduler;