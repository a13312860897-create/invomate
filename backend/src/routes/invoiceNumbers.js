/**
 * 发票编号管理路由
 * 提供发票编号生成和验证相关的API端点
 */

const express = require('express');
const router = express.Router();
const InvoiceNumberService = require('../services/invoiceNumberService');
const { authenticateToken } = require('../middleware/auth');

// 获取下一个发票编号
router.get('/next-number', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'standard'; // 'standard' 或 'french'
    
    console.log(`生成发票编号 - 用户ID: ${userId}, 格式: ${format}`);
    
    // 初始化发票编号服务
    const isMemoryMode = !require('../models').sequelize;
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);
    
    // 生成下一个发票编号
    const invoiceNumber = await invoiceNumberService.getNextInvoiceNumber(userId, format);
    
    console.log(`生成的发票编号: ${invoiceNumber}`);
    
    res.json({
      success: true,
      invoiceNumber,
      format
    });
  } catch (error) {
    console.error('生成发票编号失败:', error);
    res.status(500).json({
      success: false,
      message: '生成发票编号失败',
      error: error.message
    });
  }
});

// 验证发票编号格式
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber, format = 'standard' } = req.body;
    
    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: '发票编号不能为空'
      });
    }
    
    // 初始化发票编号服务
    const isMemoryMode = !require('../models').sequelize;
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);
    
    // 验证格式
    const isValidFormat = invoiceNumberService.validateInvoiceNumberFormat(invoiceNumber, format);
    
    // 检查是否已存在
    const exists = await invoiceNumberService.isInvoiceNumberExists(invoiceNumber, req.user.id);
    
    res.json({
      success: true,
      isValidFormat,
      exists,
      invoiceNumber,
      format
    });
  } catch (error) {
    console.error('验证发票编号失败:', error);
    res.status(500).json({
      success: false,
      message: '验证发票编号失败',
      error: error.message
    });
  }
});

// 获取发票编号统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 初始化发票编号服务
    const isMemoryMode = !require('../models').sequelize;
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);
    
    // 获取统计信息
    const stats = await invoiceNumberService.getInvoiceNumberStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取发票编号统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发票编号统计失败',
      error: error.message
    });
  }
});

module.exports = router;