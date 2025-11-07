const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getPerformanceStats,
  resetPerformanceStats,
  healthCheck,
  getPerformanceMonitor
} = require('../middleware/performanceMiddleware');
const DataConsistencyMonitor = require('../services/monitoring/DataConsistencyMonitor');

// 创建数据一致性监控实例
const dataConsistencyMonitor = new DataConsistencyMonitor();

/**
 * @route GET /api/monitoring/health
 * @desc 系统健康检查
 * @access Public
 */
router.get('/health', healthCheck);

/**
 * @route GET /api/monitoring/performance
 * @desc 获取性能统计
 * @access Private
 */
router.get('/performance', authenticateToken, getPerformanceStats);

/**
 * @route POST /api/monitoring/performance/reset
 * @desc 重置性能统计
 * @access Private
 */
router.post('/performance/reset', authenticateToken, resetPerformanceStats);

/**
 * @route GET /api/monitoring/consistency/status
 * @desc 获取数据一致性监控状态
 * @access Private
 */
router.get('/consistency/status', authenticateToken, (req, res) => {
  try {
    const status = dataConsistencyMonitor.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get consistency monitor status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/monitoring/consistency/history
 * @desc 获取数据一致性历史结果
 * @access Private
 */
router.get('/consistency/history', authenticateToken, (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const history = dataConsistencyMonitor.getHistoryResults(parseInt(hours));
    
    res.json({
      success: true,
      data: {
        history,
        timeRange: `${hours} hours`,
        count: history.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get consistency history',
      error: error.message
    });
  }
});

/**
 * @route POST /api/monitoring/consistency/start
 * @desc 启动数据一致性监控
 * @access Private
 */
router.post('/consistency/start', authenticateToken, (req, res) => {
  try {
    dataConsistencyMonitor.start();
    res.json({
      success: true,
      message: 'Data consistency monitor started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start consistency monitor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/monitoring/consistency/stop
 * @desc 停止数据一致性监控
 * @access Private
 */
router.post('/consistency/stop', authenticateToken, (req, res) => {
  try {
    dataConsistencyMonitor.stop();
    res.json({
      success: true,
      message: 'Data consistency monitor stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop consistency monitor',
      error: error.message
    });
  }
});

/**
 * @route POST /api/monitoring/consistency/check
 * @desc 手动执行数据一致性检查
 * @access Private
 */
router.post('/consistency/check', authenticateToken, async (req, res) => {
  try {
    // 异步执行检查，不等待结果
    dataConsistencyMonitor.performConsistencyCheck().catch(error => {
      console.error('Manual consistency check failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Data consistency check initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initiate consistency check',
      error: error.message
    });
  }
});

/**
 * @route GET /api/monitoring/dashboard
 * @desc 获取监控仪表板数据
 * @access Private
 */
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const performanceMonitor = getPerformanceMonitor();
    const performanceStats = performanceMonitor.getPerformanceStats();
    const consistencyStatus = dataConsistencyMonitor.getStatus();
    const consistencyHistory = dataConsistencyMonitor.getHistoryResults(1); // 最近1小时
    
    // 计算关键指标
    const latestConsistency = consistencyHistory.length > 0 ? 
      consistencyHistory[0].overallScore : null;
    
    const topSlowEndpoints = Object.entries(performanceStats.endpoints)
      .sort((a, b) => b[1].avgResponseTime - a[1].avgResponseTime)
      .slice(0, 5)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.avgResponseTime,
        errorRate: stats.errorRate
      }));
    
    const topErrorEndpoints = Object.entries(performanceStats.endpoints)
      .sort((a, b) => b[1].errorRate - a[1].errorRate)
      .slice(0, 5)
      .map(([endpoint, stats]) => ({
        endpoint,
        errorRate: stats.errorRate,
        totalErrors: stats.totalErrors
      }));
    
    res.json({
      success: true,
      data: {
        overview: {
          systemHealth: performanceStats.systemMetrics,
          performanceSummary: performanceStats.summary,
          consistencyScore: latestConsistency,
          consistencyMonitorRunning: consistencyStatus.isRunning
        },
        performance: {
          topSlowEndpoints,
          topErrorEndpoints,
          systemMetrics: performanceStats.systemMetrics
        },
        consistency: {
          status: consistencyStatus,
          latestScore: latestConsistency,
          recentHistory: consistencyHistory.slice(0, 10)
        },
        alerts: generateAlerts(performanceStats, consistencyHistory)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring dashboard data',
      error: error.message
    });
  }
});

/**
 * 生成告警信息
 */
function generateAlerts(performanceStats, consistencyHistory) {
  const alerts = [];
  
  // 性能告警
  if (performanceStats.summary.errorRate > 0.05) {
    alerts.push({
      type: 'error',
      category: 'performance',
      message: `High error rate detected: ${(performanceStats.summary.errorRate * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  if (performanceStats.summary.avgResponseTime > 3000) {
    alerts.push({
      type: 'warning',
      category: 'performance',
      message: `High average response time: ${performanceStats.summary.avgResponseTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 系统资源告警
  if (performanceStats.systemMetrics.memory.heapUsagePercent > 80) {
    alerts.push({
      type: 'warning',
      category: 'system',
      message: `High memory usage: ${performanceStats.systemMetrics.memory.heapUsagePercent}%`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 数据一致性告警
  if (consistencyHistory.length > 0) {
    const latestScore = consistencyHistory[0].overallScore;
    if (latestScore < 0.95) {
      alerts.push({
        type: latestScore < 0.8 ? 'error' : 'warning',
        category: 'consistency',
        message: `Data consistency score below threshold: ${(latestScore * 100).toFixed(1)}%`,
        timestamp: consistencyHistory[0].timestamp
      });
    }
  }
  
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = router;