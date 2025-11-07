const { AuditLog } = require('../models');

// 审计日志中间件
const auditLogger = (action, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const startTime = Date.now();
    
    // 重写res.send以捕获响应
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 异步记录审计日志，不阻塞响应
      setImmediate(async () => {
        try {
          const success = res.statusCode >= 200 && res.statusCode < 400;
          const details = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: responseTime,
            requestBody: options.logRequestBody ? sanitizeData(req.body) : undefined,
            responseBody: options.logResponseBody ? sanitizeData(data) : undefined,
            query: req.query,
            params: req.params,
            ...options.additionalData
          };

          await AuditLog.create({
            userId: req.user ? req.user.id : null,
            action: action,
            details: JSON.stringify(details),
            ipAddress: getClientIP(req),
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: success,
            errorMessage: success ? null : getErrorMessage(data)
          });
        } catch (error) {
          console.error('Error logging audit trail:', error);
        }
      });
      
      // 调用原始的send方法
      originalSend.call(this, data);
    };
    
    next();
  };
};

// 敏感数据清理函数
const sanitizeData = (data) => {
  if (!data) return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'creditCard', 'ssn', 'bankAccount', 'apiKey'
  ];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
    
    return obj;
  };
  
  return sanitizeObject(sanitized);
};

// 获取客户端IP地址
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'];
};

// 从响应数据中提取错误信息
const getErrorMessage = (data) => {
  try {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      return parsed.error || parsed.message || null;
    } else if (typeof data === 'object' && data !== null) {
      return data.error || data.message || null;
    }
  } catch (e) {
    // 如果无法解析，返回null
  }
  return null;
};

// 预定义的审计动作
const AUDIT_ACTIONS = {
  // 认证相关
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_COMPLETE: 'password_reset_complete',
  
  // 发票相关
  INVOICE_CREATE: 'invoice_create',
  INVOICE_UPDATE: 'invoice_update',
  INVOICE_DELETE: 'invoice_delete',
  INVOICE_SEND: 'invoice_send',
  INVOICE_VIEW: 'invoice_view',
  INVOICE_DOWNLOAD: 'invoice_download',
  INVOICE_PAYMENT_RECEIVED: 'invoice_payment_received',
  
  // 客户相关
  CLIENT_CREATE: 'client_create',
  CLIENT_UPDATE: 'client_update',
  CLIENT_DELETE: 'client_delete',
  CLIENT_VIEW: 'client_view',
  
  // 隐私相关
  PRIVACY_SETTINGS_UPDATE: 'privacy_settings_update',
  DATA_EXPORT_REQUEST: 'data_export_request',
  DATA_EXPORT_DOWNLOAD: 'data_export_download',
  ACCOUNT_DELETION_REQUEST: 'account_deletion_request',
  DATA_ANONYMIZATION: 'data_anonymization',
  
  // 系统相关
  SETTINGS_UPDATE: 'settings_update',
  PROFILE_UPDATE: 'profile_update',
  SUBSCRIPTION_CHANGE: 'subscription_change',
  PAYMENT_PROCESS: 'payment_process',
  
  // 安全相关
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  TWO_FACTOR_ENABLE: 'two_factor_enable',
  TWO_FACTOR_DISABLE: 'two_factor_disable'
};

// 快捷审计日志函数
const logAuditEvent = async (userId, action, details = {}, req = null) => {
  try {
    await AuditLog.create({
      userId: userId,
      action: action,
      details: JSON.stringify(details),
      ipAddress: req ? getClientIP(req) : null,
      userAgent: req ? req.get('User-Agent') : null,
      sessionId: req ? req.sessionID : null,
      success: true
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// 记录失败事件
const logFailedEvent = async (userId, action, errorMessage, details = {}, req = null) => {
  try {
    await AuditLog.create({
      userId: userId,
      action: action,
      details: JSON.stringify(details),
      ipAddress: req ? getClientIP(req) : null,
      userAgent: req ? req.get('User-Agent') : null,
      sessionId: req ? req.sessionID : null,
      success: false,
      errorMessage: errorMessage
    });
  } catch (error) {
    console.error('Error logging failed event:', error);
  }
};

// 安全事件检测中间件
const securityMonitor = () => {
  const suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter)\b/i, // SQL注入
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /\.\.\//g, // 路径遍历
    /\b(eval|exec|system|shell_exec)\b/i // 代码执行
  ];
  
  return async (req, res, next) => {
    try {
      // 检查请求参数中的可疑模式
      const checkData = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      const suspiciousActivity = suspiciousPatterns.some(pattern => 
        pattern.test(checkData)
      );
      
      if (suspiciousActivity) {
        await logFailedEvent(
          req.user ? req.user.id : null,
          AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
          'Suspicious patterns detected in request',
          {
            url: req.originalUrl,
            method: req.method,
            suspiciousData: sanitizeData(checkData)
          },
          req
        );
        
        return res.status(400).json({ error: 'Invalid request detected' });
      }
      
      next();
    } catch (error) {
      console.error('Error in security monitor:', error);
      next();
    }
  };
};

// 速率限制审计
const rateLimitAudit = () => {
  const attempts = new Map();
  const WINDOW_SIZE = 15 * 60 * 1000; // 15分钟
  const MAX_ATTEMPTS = 100; // 每15分钟最多100次请求
  
  return async (req, res, next) => {
    try {
      const clientIP = getClientIP(req);
      const now = Date.now();
      const windowStart = now - WINDOW_SIZE;
      
      // 清理过期记录
      if (!attempts.has(clientIP)) {
        attempts.set(clientIP, []);
      }
      
      const clientAttempts = attempts.get(clientIP).filter(time => time > windowStart);
      
      if (clientAttempts.length >= MAX_ATTEMPTS) {
        await logFailedEvent(
          req.user ? req.user.id : null,
          AUDIT_ACTIONS.RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded: ${clientAttempts.length} requests in 15 minutes`,
          {
            ip: clientIP,
            url: req.originalUrl,
            method: req.method
          },
          req
        );
        
        return res.status(429).json({ 
          error: 'Too many requests. Please try again later.' 
        });
      }
      
      // 记录当前请求
      clientAttempts.push(now);
      attempts.set(clientIP, clientAttempts);
      
      next();
    } catch (error) {
      console.error('Error in rate limit audit:', error);
      next();
    }
  };
};

module.exports = {
  auditLogger,
  logAuditEvent,
  logFailedEvent,
  securityMonitor,
  rateLimitAudit,
  AUDIT_ACTIONS,
  sanitizeData,
  getClientIP
};