/**
 * AI功能路由
 * 定义AI相关的API端点
 */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/ai/reminder-email/generate
 * @desc 生成催款邮件内容
 * @access Private
 */
router.post('/reminder-email/generate', authenticateToken, aiController.generateReminderEmail);

/**
 * @route POST /api/ai/reminder-email/send
 * @desc 发送催款邮件
 * @access Private
 */
router.post('/reminder-email/send', authenticateToken, aiController.sendReminderEmail);

/**
 * @route POST /api/ai/reminder-email/bulk-send
 * @desc 批量发送催款邮件
 * @access Private
 */
router.post('/reminder-email/bulk-send', authenticateToken, aiController.sendBulkReminderEmails);

/**
 * @route GET /api/ai/status
 * @desc 获取AI服务状态
 * @access Private
 */
router.get('/status', authenticateToken, aiController.getAIStatus);

module.exports = router;