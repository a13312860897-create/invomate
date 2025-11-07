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