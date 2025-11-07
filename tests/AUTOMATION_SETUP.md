# 自动化测试设置指南

## 目标
建立定期运行的数据一致性检验流程，确保系统稳定性。

## 设置步骤

### 1. 安装依赖
```bash
cd g:\发票软件
npm install node-cron fs-extra
```

### 2. 创建自动化测试脚本

创建文件 `g:\发票软件\scripts\automated-tests.js`：

```javascript
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
```

### 3. 设置系统服务

#### Windows任务计划程序
创建文件 `g:\发票软件\scripts\setup-windows-task.js`：

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 创建XML任务定义
const taskXml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${new Date().toISOString()}</Date>
    <Author>Invoice System</Author>
    <Description>自动化数据一致性测试</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>${new Date().toISOString().split('T')[0]}T02:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1H</ExecutionTimeLimit>
    <Priority>6</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>node</Command>
      <Arguments>g:\\发票软件\\scripts\\automated-tests.js --run-now</Arguments>
    </Exec>
  </Actions>
</Task>`;

// 保存XML文件
const xmlPath = path.join(__dirname, 'automation-task.xml');
fs.writeFileSync(xmlPath, taskXml);

try {
  // 创建任务
  execSync(`schtasks /Create /TN "InvoiceSystemAutomation" /XML "${xmlPath}" /F`, { stdio: 'inherit' });
  console.log('Windows任务计划程序已设置成功');
  
  // 清理临时文件
  fs.unlinkSync(xmlPath);
} catch (error) {
  console.error('设置任务计划程序失败:', error.message);
}
```

### 4. 配置监控面板

创建监控面板 `g:\发票软件\scripts\monitoring-dashboard.js`：

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;

app.use(express.static('public'));
app.use(express.json());

// API端点：获取测试状态
app.get('/api/status', (req, res) => {
  try {
    const logFile = 'tests/consistency/automation.log';
    const reportDir = 'tests/consistency/reports';
    
    if (!fs.existsSync(logFile)) {
      return res.json({ status: 'unknown', message: '无日志文件' });
    }
    
    const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim());
    const lastLog = logs[logs.length - 1] || '';
    
    // 获取最新的报告
    const reports = fs.readdirSync(reportDir)
      .filter(file => file.startsWith('automation-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    let latestReport = null;
    if (reports.length > 0) {
      const latestReportPath = path.join(reportDir, reports[0]);
      latestReport = JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));
    }
    
    res.json({
      status: lastLog.includes('成功') ? 'healthy' : 'warning',
      lastLog: lastLog,
      latestReport: latestReport,
      totalTests: reports.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// API端点：获取测试历史
app.get('/api/history', (req, res) => {
  try {
    const reportDir = 'tests/consistency/reports';
    const reports = fs.readdirSync(reportDir)
      .filter(file => file.startsWith('automation-') && file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 30); // 最近30个报告
    
    const history = reports.map(file => {
      const reportPath = path.join(reportDir, file);
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      return {
        timestamp: report.timestamp,
        status: report.status,
        duration: report.duration,
        error: report.error
      };
    });
    
    res.json(history);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动监控面板
app.listen(PORT, () => {
  console.log(`监控面板运行在 http://localhost:${PORT}`);
});
```

## 使用说明

### 启动自动化测试
```bash
# 1. 启动自动化测试服务
cd g:\发票软件
node scripts/automated-tests.js

# 2. 立即运行测试（带参数）
node scripts/automated-tests.js --run-now

# 3. 设置Windows定时任务
node scripts/setup-windows-task.js
```

### 查看监控面板
```bash
# 启动监控面板
cd g:\发票软件
node scripts/monitoring-dashboard.js

# 访问 http://localhost:3003 查看监控面板
```

### 查看日志和报告
```bash
# 查看自动化测试日志
cat tests/consistency/automation.log

# 查看最新的测试报告
cat tests/consistency/reports/latest-results.json

# 查看所有自动化测试报告
ls tests/consistency/reports/automation-*.json
```

## 故障排除

### 常见问题

1. **权限问题**: 确保脚本有权限访问测试目录
2. **端口冲突**: 如果3003端口被占用，修改监控面板端口
3. **定时任务不执行**: 检查Windows任务计划程序设置

### 手动干预

如果自动化测试失败，可以：
1. 查看详细日志：`tests/consistency/automation.log`
2. 手动运行测试：`node tests/run-all-consistency-tests.js`
3. 检查系统状态：`curl http://localhost:3002/api/health`