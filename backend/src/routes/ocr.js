/**
 * OCR功能路由
 * 处理OCR相关的API请求
 */

const express = require('express');
const router = express.Router();
const ocrController = require('../controllers/ocrController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 处理文档并提取发票信息
 * POST /api/ocr/process
 * 需要认证
 */
router.post('/process', authenticateToken, ocrController.upload.single('document'), ocrController.processDocument);

/**
 * 获取OCR服务状态
 * GET /api/ocr/status
 * 需要认证
 */
router.get('/status', authenticateToken, ocrController.getOCRStatus);

/**
 * 验证提取的发票数据
 * POST /api/ocr/validate
 * 需要认证
 */
router.post('/validate', authenticateToken, ocrController.validateInvoiceData);

module.exports = router;