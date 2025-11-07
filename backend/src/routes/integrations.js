const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integrationController');
const { authenticateToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// 导入特定平台路由
const hubspotRoutes = require('./integrations/hubspot');

// 验证中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 获取支持的平台列表（无需认证）
router.get('/platforms', IntegrationController.getSupportedPlatforms);

// 所有其他路由都需要认证
router.use(authenticateToken);

// 获取用户的所有集成
router.get('/', IntegrationController.getIntegrations);

// 创建新集成
router.post('/', [
  body('platform')
    .notEmpty()
    .withMessage('平台名称不能为空')
    .isIn(['salesforce', 'hubspot', 'trello', 'asana', 'monday'])
    .withMessage('不支持的平台类型'),
  body('platform_type')
    .notEmpty()
    .withMessage('平台类型不能为空')
    .isIn(['crm', 'project_management'])
    .withMessage('平台类型必须是 crm 或 project_management'),
  body('config')
    .optional()
    .isObject()
    .withMessage('配置必须是对象格式'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象格式'),
  handleValidationErrors
], IntegrationController.createIntegration);

// 获取单个集成详情
router.get('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
], IntegrationController.getIntegration);

// 更新集成配置
router.put('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  body('config')
    .optional()
    .isObject()
    .withMessage('配置必须是对象格式'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('设置必须是对象格式'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active必须是布尔值'),
  handleValidationErrors
], IntegrationController.updateIntegration);

// 删除集成
router.delete('/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
], IntegrationController.deleteIntegration);

// 测试集成连接
router.post('/:id/test', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
], IntegrationController.testConnection);

// 手动触发同步
router.post('/:id/sync', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  body('entity_types')
    .optional()
    .isArray()
    .withMessage('entity_types必须是数组')
    .custom((value) => {
      const validTypes = ['client', 'invoice', 'project', 'task'];
      return value.every(type => validTypes.includes(type));
    })
    .withMessage('entity_types包含无效的实体类型'),
  body('direction')
    .optional()
    .isIn(['inbound', 'outbound', 'bidirectional'])
    .withMessage('direction必须是 inbound、outbound 或 bidirectional'),
  handleValidationErrors
], IntegrationController.triggerSync);

// 获取同步状态
router.get('/:id/sync/status', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  query('batch_id')
    .optional()
    .isString()
    .withMessage('batch_id必须是字符串'),
  handleValidationErrors
], IntegrationController.getSyncStatus);

// 获取数据映射
router.get('/:id/mappings', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  query('entity_type')
    .optional()
    .isIn(['client', 'invoice', 'project', 'task'])
    .withMessage('entity_type必须是有效的实体类型'),
  handleValidationErrors
], IntegrationController.getDataMappings);

// OAuth认证相关路由

// 启动OAuth认证流程
router.get('/:id/auth/start', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { Integration } = require('../models');
    const IntegrationFactory = require('../services/integrations/base/IntegrationFactory');

    const integration = await Integration.findOne({
      where: { 
        id: id,
        user_id: userId 
      }
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: '集成不存在'
      });
    }

    // 创建集成服务实例
    const factory = new IntegrationFactory();
    const service = factory.createService(integration.platform, integration.getDecryptedConfig());
    
    if (!service.getAuthUrl) {
      return res.status(400).json({
        success: false,
        message: '该平台不支持OAuth认证'
      });
    }

    // 生成状态参数用于安全验证
    const state = `${integration.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取OAuth认证URL
    const authUrl = service.getAuthUrl(state);

    res.json({
      success: true,
      data: {
        auth_url: authUrl,
        state: state
      }
    });
  } catch (error) {
    console.error('启动OAuth认证失败:', error);
    res.status(500).json({
      success: false,
      message: '启动OAuth认证失败',
      error: error.message
    });
  }
});

// OAuth回调处理
router.get('/:id/auth/callback', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  query('code')
    .notEmpty()
    .withMessage('授权码不能为空'),
  query('state')
    .notEmpty()
    .withMessage('状态参数不能为空'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { code, state } = req.query;
    const userId = req.user.id;
    const { Integration } = require('../models');
    const IntegrationFactory = require('../services/integrations/base/IntegrationFactory');

    // 验证状态参数
    const [integrationId] = state.split('_');
    if (parseInt(integrationId) !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态参数'
      });
    }

    const integration = await Integration.findOne({
      where: { 
        id: id,
        user_id: userId 
      }
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: '集成不存在'
      });
    }

    // 创建集成服务实例
    const factory = new IntegrationFactory();
    const service = factory.createService(integration.platform, integration.getDecryptedConfig());
    
    // 交换授权码获取访问令牌
    const tokenResult = await service.exchangeCodeForToken(code);

    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        message: '获取访问令牌失败',
        error: tokenResult.error
      });
    }

    // 保存令牌并激活集成
    integration.setEncryptedToken(
      tokenResult.access_token,
      tokenResult.refresh_token
    );
    
    await integration.update({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expires_at: tokenResult.expires_at,
      is_active: true,
      sync_status: 'idle',
      error_message: null
    });

    res.json({
      success: true,
      message: 'OAuth认证成功',
      data: {
        platform: integration.platform,
        is_active: true,
        expires_at: tokenResult.expires_at
      }
    });
  } catch (error) {
    console.error('OAuth回调处理失败:', error);
    res.status(500).json({
      success: false,
      message: 'OAuth回调处理失败',
      error: error.message
    });
  }
});

// 刷新访问令牌
router.post('/:id/auth/refresh', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { Integration } = require('../models');
    const IntegrationFactory = require('../services/integrations/base/IntegrationFactory');

    const integration = await Integration.findOne({
      where: { 
        id: id,
        user_id: userId 
      }
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: '集成不存在'
      });
    }

    if (!integration.refresh_token) {
      return res.status(400).json({
        success: false,
        message: '没有可用的刷新令牌'
      });
    }

    // 创建集成服务实例
    const factory = new IntegrationFactory();
    const service = factory.createService(integration.platform, integration.getDecryptedConfig());
    
    // 刷新访问令牌
    const refreshResult = await service.refreshToken(integration.refresh_token);

    if (!refreshResult.success) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌失败',
        error: refreshResult.error
      });
    }

    // 更新令牌
    integration.setEncryptedToken(
      refreshResult.access_token,
      refreshResult.refresh_token || integration.refresh_token
    );
    
    await integration.update({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expires_at: refreshResult.expires_at,
      is_active: true,
      sync_status: 'idle',
      error_message: null
    });

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        expires_at: refreshResult.expires_at
      }
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败',
      error: error.message
    });
  }
});

// 挂载特定平台路由
router.use('/hubspot', hubspotRoutes);

module.exports = router;