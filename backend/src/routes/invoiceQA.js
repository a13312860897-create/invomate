/**
 * 发票自然语言问答路由
 * 定义发票自然语言问答相关的API端点
 */

const express = require('express');
const router = express.Router();
const invoiceQAController = require('../controllers/invoiceQAController');
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/invoice-qa/query
 * @desc 处理自然语言查询
 * @access Private
 */
router.post('/query', [
  authenticateToken,
  body('query')
    .notEmpty()
    .withMessage('查询内容不能为空')
    .isLength({ min: 1, max: 500 })
    .withMessage('查询内容长度必须在1-500个字符之间'),
  body('options')
    .optional()
    .isObject()
    .withMessage('选项必须是对象')
], invoiceQAController.processQuery);

/**
 * @route GET /api/invoice-qa/query-types
 * @desc 获取支持的查询类型
 * @access Private
 */
router.get('/query-types', authenticateToken, invoiceQAController.getSupportedQueryTypes);

/**
 * @route GET /api/invoice-qa/history
 * @desc 获取查询历史
 * @access Private
 */
router.get('/history', [
  authenticateToken,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制值必须是1-100之间的整数'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('偏移值必须是非负整数')
], invoiceQAController.getQueryHistory);

/**
 * @route GET /api/invoice-qa/suggestions
 * @desc 获取查询建议
 * @access Private
 */
router.get('/suggestions', authenticateToken, invoiceQAController.getQuerySuggestions);

module.exports = router;