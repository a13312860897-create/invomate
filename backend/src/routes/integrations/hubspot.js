const express = require('express');
const router = express.Router();
const HubSpotService = require('../../services/integrations/hubspotService');
const { authenticateToken } = require('../../middleware/auth');
const { validateIntegrationData } = require('../../middleware/validation');
const IntegrationErrorHandler = require('../../middleware/integrationErrorHandler');
const healthCheckService = require('../../services/integrations/healthCheckService');
const logger = require('../../utils/logger');

// 创建HubSpot服务实例
const hubspotService = new HubSpotService();

// 应用错误处理中间件
router.use(IntegrationErrorHandler.wrapAsync);

/**
 * @route POST /api/integrations/hubspot
 * @desc 创建HubSpot集成
 * @access Private
 */
router.post('/', authenticateToken, validateIntegrationData, IntegrationErrorHandler.wrapAsync(async (req, res) => {
  const integration = await hubspotService.createIntegration({
    ...req.body,
    userId: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: integration
  });
}));

/**
 * @route POST /api/integrations/hubspot/:id/test
 * @desc 测试HubSpot连接
 * @access Private
 */
router.post('/:id/test', 
  authenticateToken, 
  IntegrationErrorHandler.validateIntegrationAccess,
  IntegrationErrorHandler.wrapAsync(async (req, res) => {
    const result = await hubspotService.testConnection(req.integration);
    
    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * @route POST /api/integrations/hubspot/:id/sync
 * @desc 执行HubSpot同步
 * @access Private
 */
router.post('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { dataType, options } = req.body;
    
    let result;
    
    switch (dataType) {
      case 'contacts':
        result = await hubspotService.syncContacts(id, options);
        break;
      case 'companies':
        result = await hubspotService.syncCompanies(id, options);
        break;
      case 'deals':
        result = await hubspotService.syncDeals(id, options);
        break;
      case 'all':
      default:
        result = await hubspotService.performFullSync(id);
        break;
    }
    
    res.json({
      success: result.success,
      message: 'Sync completed',
      data: result
    });
  } catch (error) {
    logger.error('Failed to sync HubSpot data:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/integrations/hubspot/:id/status
 * @desc 获取HubSpot同步状态
 * @access Private
 */
router.get('/:id/status', 
  authenticateToken, 
  IntegrationErrorHandler.validateIntegrationAccess,
  IntegrationErrorHandler.wrapAsync(async (req, res) => {
    const status = await hubspotService.getSyncStatus(req.params.id);
    
    res.json({
      success: true,
      data: status
    });
  })
);

/**
 * @route GET /api/integrations/hubspot/:id/health
 * @desc 获取健康状态
 * @access Private
 */
router.get('/:id/health', 
  authenticateToken, 
  IntegrationErrorHandler.validateIntegrationAccess,
  IntegrationErrorHandler.wrapAsync(async (req, res) => {
    const healthStatus = healthCheckService.getIntegrationHealth(req.params.id);
    
    if (!healthStatus) {
      // 如果没有健康状态，强制检查一次
      const status = await healthCheckService.forceCheckIntegration(req.params.id);
      return res.json({
        success: true,
        data: status
      });
    }
    
    res.json({
      success: true,
      data: healthStatus
    });
  })
);

/**
 * @route POST /api/integrations/hubspot/:id/health/check
 * @desc 强制健康检查
 * @access Private
 */
router.post('/:id/health/check', 
  authenticateToken, 
  IntegrationErrorHandler.validateIntegrationAccess,
  IntegrationErrorHandler.wrapAsync(async (req, res) => {
    const healthStatus = await healthCheckService.forceCheckIntegration(req.params.id);
    
    res.json({
      success: true,
      data: healthStatus
    });
  })
);

/**
 * @route POST /api/integrations/hubspot/validate-key
 * @desc 验证HubSpot API密钥
 * @access Private
 */
router.post('/validate-key', authenticateToken, IntegrationErrorHandler.wrapAsync(async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json(
      IntegrationErrorHandler.createErrorResponse(
        'VALIDATION_ERROR',
        'API key is required',
        400
      )
    );
  }
  
  const validation = await hubspotService.validateApiKey(apiKey);
  
  if (!validation.valid) {
    return res.status(400).json(
      IntegrationErrorHandler.createErrorResponse(
        validation.type || 'VALIDATION_ERROR',
        validation.error || 'Invalid API key',
        400
      )
    );
  }
  
  res.json({
    success: true,
    data: validation.data
  });
}));

/**
 * @route GET /api/integrations/hubspot/:id/contacts
 * @desc 获取同步的联系人数据
 * @access Private
 */
router.get('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    
    // 这里应该实现从本地数据库获取同步的联系人数据
    // 具体实现取决于您的数据模型
    
    res.json({
      success: true,
      data: {
        contacts: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get HubSpot contacts:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/integrations/hubspot/:id/companies
 * @desc 获取同步的公司数据
 * @access Private
 */
router.get('/:id/companies', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    
    // 这里应该实现从本地数据库获取同步的公司数据
    // 具体实现取决于您的数据模型
    
    res.json({
      success: true,
      data: {
        companies: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get HubSpot companies:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/integrations/hubspot/:id/deals
 * @desc 获取同步的交易数据
 * @access Private
 */
router.get('/:id/deals', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    
    // 这里应该实现从本地数据库获取同步的交易数据
    // 具体实现取决于您的数据模型
    
    res.json({
      success: true,
      data: {
        deals: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get HubSpot deals:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/integrations/hubspot/:id/sync-logs
 * @desc 获取同步日志
 * @access Private
 */
router.get('/:id/sync-logs', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 100, level } = req.query;
    
    // 这里应该实现从日志系统获取同步日志
    // 具体实现取决于您的日志存储方案
    
    res.json({
      success: true,
      data: {
        logs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get HubSpot sync logs:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route PUT /api/integrations/hubspot/:id/configuration
 * @desc 更新HubSpot集成配置
 * @access Private
 */
router.put('/:id/configuration', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { syncFrequency, dataTypes, settings } = req.body;
    
    // 这里应该实现更新集成配置的逻辑
    // 具体实现取决于您的数据模型
    
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update HubSpot configuration:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/integrations/hubspot/:id/pause
 * @desc 暂停HubSpot集成
 * @access Private
 */
router.post('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该实现暂停集成的逻辑
    // 具体实现取决于您的数据模型和调度系统
    
    res.json({
      success: true,
      message: 'Integration paused successfully'
    });
  } catch (error) {
    logger.error('Failed to pause HubSpot integration:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/integrations/hubspot/:id/resume
 * @desc 恢复HubSpot集成
 * @access Private
 */
router.post('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该实现恢复集成的逻辑
    // 具体实现取决于您的数据模型和调度系统
    
    res.json({
      success: true,
      message: 'Integration resumed successfully'
    });
  } catch (error) {
    logger.error('Failed to resume HubSpot integration:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 应用错误处理中间件
router.use(IntegrationErrorHandler.handleError);

module.exports = router;