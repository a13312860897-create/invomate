const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { sandboxMiddleware } = require('../middleware/sandbox');
const router = express.Router();

/**
 * 提交法国电子发票
 */
router.post('/france/submit', authenticateToken, sandboxMiddleware, async (req, res) => {
  try {
    const { invoiceId, invoiceData } = req.body;
    
    if (!invoiceId || !invoiceData) {
      return res.status(400).json({ message: 'Invoice ID and data are required' });
    }
    
    // 使用电子发票服务（真实或模拟）
    const result = await req.eInvoiceService.submitFrenchInvoice(invoiceData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'French invoice submitted successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to submit French invoice',
        error: result.error,
        errorCode: result.errorCode
      });
    }
  } catch (error) {
    console.error('Submit French invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



/**
 * 获取法国电子发票状态
 */
router.get('/france/status/:invoiceId', authenticateToken, sandboxMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }
    
    // 使用电子发票服务（真实或模拟）
    const result = await req.eInvoiceService.getFrenchInvoiceStatus(invoiceId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get French invoice status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



/**
 * 取消法国电子发票
 */
router.post('/france/cancel', authenticateToken, sandboxMiddleware, async (req, res) => {
  try {
    const { invoiceId, reason } = req.body;
    
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }
    
    // 使用电子发票服务（真实或模拟）
    const result = await req.eInvoiceService.cancelFrenchInvoice(invoiceId, reason);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'French invoice cancelled successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel French invoice',
        error: result.reason
      });
    }
  } catch (error) {
    console.error('Cancel French invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



/**
 * 获取沙盒模式状态
 */
router.get('/sandbox/status', authenticateToken, async (req, res) => {
  try {
    const isSandbox = req.headers['x-sandbox-mode'] === 'true';
    
    res.json({
      success: true,
      isSandbox,
      message: isSandbox ? 'Sandbox mode is active' : 'Production mode is active'
    });
  } catch (error) {
    console.error('Get sandbox status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;