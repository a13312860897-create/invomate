const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const Invoice = require('../models/invoice');

// 发送发票邮件
router.post('/send-invoice/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { method } = req.body; // 'smtp' or 'resend'
    
    // 验证发票是否存在
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: '发票不存在' });
    }
    
    // 发送邮件
    const result = await emailService.sendInvoiceEmail(invoiceId, invoice.userId, { method });
    
    res.status(200).json({
      success: true,
      message: '邮件发送成功',
      data: result
    });
  } catch (error) {
    console.error('发送邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '发送邮件失败',
      error: error.message
    });
  }
});

// 测试邮件发送
router.post('/test', async (req, res) => {
  try {
    const { to, method } = req.body;
    
    if (!to) {
      return res.status(400).json({ message: '请提供收件人邮箱地址' });
    }
    
    const result = await emailService.sendTestEmail(to, method);
    
    res.status(200).json({
      success: true,
      message: '测试邮件发送成功',
      data: result
    });
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({
      success: false,
      message: '发送测试邮件失败',
      error: error.message
    });
  }
});

module.exports = router;