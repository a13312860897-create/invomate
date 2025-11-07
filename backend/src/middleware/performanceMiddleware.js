const PerformanceMonitor = require('../services/monitoring/PerformanceMonitor');
const { v4: uuidv4 } = require('uuid');

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

/**
 * 性能监控中间件
 * 自动记录所有API请求的性能指标
 */
function performanceMiddleware(req, res, next) {
  // 生成请求ID
  const requestId = uuidv4();
  req.requestId = requestId;
  
  // 获取端点信息
  const endpoint = req.route ? req.route.path : req.path;
  const method = req.method;
  
  // 开始监控
  const requestInfo = performanceMonitor.startRequest(endpoint, method, requestId);
  
  // 保存请求信息到req对象
  req.performanceInfo = requestInfo;
  
  // 监听响应结束事件
  const originalSend = res.send;
  const originalJson = res.json;
  
  // 重写res.send方法
  res.send = function(data) {
    recordRequestEnd(req, res);
    return originalSend.call(this, data);
  };
  
  // 重写res.json方法
  res.json = function(data) {
    recordRequestEnd(req, res);
    return originalJson.call(this, data);
  };
  
  // 监听响应完成事件（备用）
  res.on('finish', () => {
    recordRequestEnd(req, res);
  });
  
  // 监听错误事件
  res.on('error', (error) => {
    recordRequestEnd(req, res, error);
  });
  
  next();
}

/**
 * 记录请求结束
 */
function recordRequestEnd(req, res, error = null) {
  if (req.performanceInfo && !req.performanceRecorded) {
    req.performanceRecorded = true;
    performanceMonitor.endRequest(
      req.performanceInfo,
      res.statusCode,
      error
    );
  }
}

/**
 * 获取性能监控实例
 */
function getPerformanceMonitor() {
  return performanceMonitor;
}

/**
 * 性能统计路由处理器
 */
function getPerformanceStats(req, res) {
  try {
    const { endpoint, hours, minutes } = req.query;
    
    let stats;
    if (endpoint) {
      stats = performanceMonitor.getEndpointStats(endpoint);
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint not found'
        });
      }
      
      // 如果指定了时间范围，获取历史数据
      if (minutes) {
        stats.responseTimeHistory = performanceMonitor.getResponseTimeHistory(
          endpoint, 
          parseInt(minutes)
        );
      }
      
      if (hours) {
        stats.recentErrors = performanceMonitor.getRecentErrors(
          endpoint, 
          parseInt(hours)
        );
      }
    } else {
      stats = performanceMonitor.getPerformanceStats();
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get performance stats',
      error: error.message
    });
  }
}

/**
 * 重置性能统计路由处理器
 */
function resetPerformanceStats(req, res) {
  try {
    const { endpoint } = req.body;
    
    performanceMonitor.resetStats(endpoint);
    
    res.json({
      success: true,
      message: endpoint ? 
        `Stats reset for endpoint: ${endpoint}` : 
        'All stats reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance stats',
      error: error.message
    });
  }
}

/**
 * 健康检查路由处理器
 */
function healthCheck(req, res) {
  try {
    const systemMetrics = performanceMonitor.getSystemMetrics();
    const summary = performanceMonitor.getSummaryStats();
    
    // 判断系统健康状态
    const isHealthy = 
      systemMetrics.memory.heapUsagePercent < 90 &&
      summary.errorRate < 0.1 &&
      summary.avgResponseTime < 5000;
    
    const status = isHealthy ? 'healthy' : 'warning';
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
      systemMetrics,
      summary,
      checks: {
        memoryUsage: {
          status: systemMetrics.memory.heapUsagePercent < 90 ? 'pass' : 'fail',
          value: systemMetrics.memory.heapUsagePercent,
          threshold: 90
        },
        errorRate: {
          status: summary.errorRate < 0.1 ? 'pass' : 'fail',
          value: summary.errorRate,
          threshold: 0.1
        },
        responseTime: {
          status: summary.avgResponseTime < 5000 ? 'pass' : 'fail',
          value: summary.avgResponseTime,
          threshold: 5000
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
}

module.exports = {
  performanceMiddleware,
  getPerformanceMonitor,
  getPerformanceStats,
  resetPerformanceStats,
  healthCheck
};