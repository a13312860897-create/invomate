const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  testInterval: '0 2 * * *', // 每天凌晨2点运行
  reportDir: 'tests/consistency/reports',
  logFile: 'tests/consistency/automation.log',
  emailOnFailure: true,
  maxRetries: 3
};

class AutomatedTestRunner {
  constructor() {
    this.setupDirectories();
    this.setupCronJob();
  }

  setupDirectories() {
    fs.ensureDirSync(CONFIG.reportDir);
    fs.ensureDirSync(path.dirname(CONFIG.logFile));
  }

  setupCronJob() {
    console.log('设置定时任务...');
    
    cron.schedule(CONFIG.testInterval, () => {
      this.runTests();
    }, {
      scheduled: true,
      timezone: "Asia/Shanghai"
    });

    console.log(`自动化测试已设置，将在每天 ${CONFIG.testInterval} 运行`);
  }

  async runTests() {
    const startTime = new Date();
    this.log(`开始运行自动化测试 - ${startTime.toISOString()}`);

    try {
      // 1. 运行一致性测试
      await this.runConsistencyTests();
      
      // 2. 验证API端点
      await this.validateAPIEndpoints();
      
      // 3. 检查数据完整性
      await this.checkDataIntegrity();
      
      // 4. 生成报告
      await this.generateReport(startTime, true);
      
      this.log('自动化测试完成 - 成功');
      
    } catch (error) {
      this.log(`自动化测试失败: ${error.message}`);
      await this.generateReport(startTime, false, error);
      
      if (CONFIG.emailOnFailure) {
        await this.sendFailureNotification(error);
      }
    }
  }

  async runConsistencyTests() {
    this.log('运行一致性测试...');
    
    try {
      // 运行所有一致性测试
      execSync('node tests/run-all-consistency-tests.js', { 
        cwd: 'g:\\发票软件',
        stdio: 'pipe' 
      });
      
      this.log('一致性测试完成');
    } catch (error) {
      throw new Error(`一致性测试失败: ${error.message}`);
    }
  }

  async validateAPIEndpoints() {
    this.log('验证API端点...');
    
    const endpoints = [
      '/api/health',
      '/api/dashboard/unified-chart-data?month=2025-10',
      '/api/dashboard/invoice-status-distribution',
      '/api/dashboard/monthly-revenue-trend'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3002${endpoint}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        this.log(`✓ ${endpoint} - 正常`);
      } catch (error) {
        throw new Error(`API端点验证失败 ${endpoint}: ${error.message}`);
      }
    }
  }

  async checkDataIntegrity() {
    this.log('检查数据完整性...');
    
    // 检查报告文件是否存在且有效
    const reportPath = 'tests/consistency/reports/latest-results.json';
    if (!fs.existsSync(reportPath)) {
      throw new Error('测试报告文件不存在');
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // 验证报告结构
    if (!report.summary || !report.results) {
      throw new Error('测试报告格式无效');
    }

    // 检查是否有失败的测试
    if (report.summary.failed > 0) {
      throw new Error(`有 ${report.summary.failed} 个测试失败`);
    }

    this.log('数据完整性检查完成');
  }

  async generateReport(startTime, success, error = null) {
    const report = {
      timestamp: new Date().toISOString(),
      startTime: startTime.toISOString(),
      duration: Date.now() - startTime.getTime(),
      status: success ? 'SUCCESS' : 'FAILED',
      error: error ? error.message : null,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    };

    const reportPath = path.join(CONFIG.reportDir, `automation-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`生成报告: ${reportPath}`);
  }

  async sendFailureNotification(error) {
    // 这里可以集成邮件发送功能
    this.log(`发送失败通知: ${error.message}`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(CONFIG.logFile, logEntry);
  }
}

// 启动自动化测试
if (require.main === module) {
  const runner = new AutomatedTestRunner();
  
  // 如果提供了 --run-now 参数，立即运行测试
  if (process.argv.includes('--run-now')) {
    runner.runTests();
  }
}

module.exports = AutomatedTestRunner;