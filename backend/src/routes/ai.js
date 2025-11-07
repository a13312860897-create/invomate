/**
 * 简化版AI功能路由 - MVP阶段
 * 定义基本的邮件发送API端点
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/ai/send-invoice-email
 * @desc 发送发票邮件
 * @access Private
 */
router.post('/send-invoice-email', authenticateToken, aiController.sendInvoiceEmail);

/**
 * @route POST /api/ai/send-batch-emails
 * @desc 批量发送发票邮件
 * @access Private
 */
router.post('/send-batch-emails', authenticateToken, aiController.sendBatchInvoiceEmails);

/**
 * @route GET /api/ai/verify-email-config
 * @desc 验证邮件配置
 * @access Private
 */
router.get('/verify-email-config', authenticateToken, aiController.verifyEmailConfig);

/**
 * @route GET /api/ai/health
 * @desc AI服务健康检查
 * @access Private
 */
router.get('/health', authenticateToken, aiController.healthCheck);

module.exports = router;