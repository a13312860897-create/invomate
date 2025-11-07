const express = require('express');
const TemplateController = require('../controllers/templateController');
// 使用可选鉴权，便于演示页面在无Token时也能调用
const { optionalAuth } = require('../middleware/auth');

/**
 * 模板路由配置
 * 处理模板相关的HTTP请求路由
 */
function createTemplateRoutes() {
  const router = express.Router();
  const templateController = new TemplateController();

  /**
   * @swagger
   * tags:
   *   name: Templates
   *   description: 发票模板管理
   */

  /**
   * @swagger
   * /api/templates/render:
   *   post:
   *     summary: 渲染发票模板
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - format
   *               - invoiceData
   *               - userData
   *               - clientData
   *             properties:
   *               format:
   *                 type: string
   *                 enum: [email, pdf, print]
   *                 description: 输出格式
   *               templateType:
   *                 type: string
   *                 enum: [french-standard, tva-exempt, self-liquidation]
   *                 default: french-standard
   *                 description: 模板类型
   *               invoiceData:
   *                 type: object
   *                 description: 发票数据
   *               userData:
   *                 type: object
   *                 description: 用户/公司数据
   *               clientData:
   *                 type: object
   *                 description: 客户数据
   *     responses:
   *       200:
   *         description: 模板渲染成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   description: 渲染结果
   */
  router.post('/render', optionalAuth, (req, res) => templateController.renderInvoice(req, res));

  /**
   * @swagger
   * /api/templates/render-multiple:
   *   post:
   *     summary: 批量渲染多种格式
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invoiceData
   *               - userData
   *               - clientData
   *             properties:
   *               templateType:
   *                 type: string
   *                 enum: [french-standard, tva-exempt, self-liquidation]
   *                 default: french-standard
   *                 description: 模板类型
   *               formats:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [email, pdf, print]
   *                 default: [email, pdf, print]
   *                 description: 输出格式列表
   *               invoiceData:
   *                 type: object
   *                 description: 发票数据
   *               userData:
   *                 type: object
   *                 description: 用户/公司数据
   *               clientData:
   *                 type: object
   *                 description: 客户数据
   *     responses:
   *       200:
   *         description: 批量渲染成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   description: 渲染结果
   */
  router.post('/render-multiple', optionalAuth, (req, res) => templateController.renderMultipleFormats(req, res));

  /**
   * @swagger
   * /api/templates/preview/{templateType}:
   *   get:
   *     summary: 获取模板预览
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: templateType
   *         required: true
   *         schema:
   *           type: string
   *           enum: [french-standard, tva-exempt, self-liquidation]
   *         description: 模板类型
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [html, pdf]
   *           default: html
   *         description: 预览格式
   *     responses:
   *       200:
   *         description: 模板预览成功
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   */
  router.get('/preview/:templateType', optionalAuth, (req, res) => templateController.getTemplatePreview(req, res));

  /**
   * @swagger
   * /api/templates/list:
   *   get:
   *     summary: 获取可用模板列表
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 模板列表获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     templates:
   *                       type: array
   *                       description: 可用模板列表
   *                     formats:
   *                       type: array
   *                       description: 可用格式列表
   *                     stats:
   *                       type: object
   *                       description: 渲染统计信息
   */
  router.get('/list', optionalAuth, (req, res) => templateController.getAvailableTemplates(req, res));

  /**
   * @swagger
   * /api/templates/config:
   *   get:
   *     summary: 获取模板配置信息
   *     tags: [Templates]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 配置信息获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   description: 模板配置信息
   */
  router.get('/config', optionalAuth, (req, res) => templateController.getTemplateConfig(req, res));

  return router;
}

module.exports = createTemplateRoutes;