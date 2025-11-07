const { User } = require('../models');

/**
 * 沙盒模式中间件
 * 检测请求是否处于沙盒模式，并设置相应的服务
 */
const sandboxMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取沙盒模式标志
    const isSandbox = req.headers['x-sandbox-mode'] === 'true';
    
    // 如果有用户认证，检查用户设置
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      if (user && user.sandboxMode) {
        req.isSandbox = true;
      } else {
        req.isSandbox = isSandbox;
      }
    } else {
      req.isSandbox = isSandbox;
    }
    
    // 根据沙盒模式设置服务
    if (req.isSandbox) {
      // 使用模拟服务
      req.invoiceService = require('../services/mockInvoiceService');
      req.eInvoiceService = require('../services/mockEInvoiceService');
      
      // 添加沙盒模式标记到响应头
      res.setHeader('X-Sandbox-Mode', 'true');
    } else {
      // 使用模拟服务（因为真实服务尚未实现）
      req.invoiceService = require('../services/mockInvoiceService');
      req.eInvoiceService = require('../services/mockEInvoiceService');
    }
    
    next();
  } catch (error) {
    console.error('Sandbox middleware error:', error);
    res.status(500).json({ message: 'Sandbox middleware error' });
  }
};

module.exports = { sandboxMiddleware };