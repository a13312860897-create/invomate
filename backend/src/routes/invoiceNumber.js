const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const InvoiceNumberService = require('../services/invoiceNumberService');

// 检查是否为内存模式
const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DATABASE_URL;

/**
 * @route GET /api/invoices/next-number
 * @desc Get next invoice number for the authenticated user
 * @access Private
 */
router.get('/next-number', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'standard'; // 'standard' or 'french'
    
    // 初始化发票编号服务
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);
    
    // 获取下一个发票编号
    const invoiceNumber = await invoiceNumberService.getNextInvoiceNumber(userId, format);
    
    res.json({
      success: true,
      invoiceNumber: invoiceNumber
    });
  } catch (error) {
    console.error('获取下一个发票编号失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发票编号失败',
      error: error.message
    });
  }
});

module.exports = router;