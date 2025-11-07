const { Integration, DataMapping, SyncLog } = require('../models');
const IntegrationFactory = require('../services/integrations/base/IntegrationFactory');
const DataMapper = require('../services/integrations/base/DataMapper');
const jwt = require('jsonwebtoken');

class IntegrationController {
  // 获取用户的所有集成
  static async getIntegrations(req, res) {
    try {
      const userId = req.user.id;
      
      const integrations = await Integration.findAll({
        where: { user_id: userId },
        include: [
          {
            model: DataMapping,
            as: 'dataMappings',
            limit: 5,
            order: [['updated_at', 'DESC']]
          },
          {
            model: SyncLog,
            as: 'syncLogs',
            limit: 10,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // 隐藏敏感信息
      const sanitizedIntegrations = integrations.map(integration => {
        const data = integration.toJSON();
        delete data.access_token;
        delete data.refresh_token;
        return data;
      });

      res.json({
        success: true,
        data: sanitizedIntegrations
      });
    } catch (error) {
      console.error('获取集成列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取集成列表失败',
        error: error.message
      });
    }
  }

  // 获取单个集成详情
  static async getIntegration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const integration = await Integration.findOne({
        where: { 
          id: id,
          user_id: userId 
        },
        include: [
          {
            model: DataMapping,
            as: 'dataMappings'
          },
          {
            model: SyncLog,
            as: 'syncLogs',
            limit: 20,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: '集成不存在'
        });
      }

      // 隐藏敏感信息
      const data = integration.toJSON();
      delete data.access_token;
      delete data.refresh_token;

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('获取集成详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取集成详情失败',
        error: error.message
      });
    }
  }

  // 创建新集成
  static async createIntegration(req, res) {
    try {
      const userId = req.user.id;
      const { platform, platform_type, config, settings } = req.body;

      // 验证必填字段
      if (!platform || !platform_type) {
        return res.status(400).json({
          success: false,
          message: '平台名称和类型为必填项'
        });
      }

      // 检查是否已存在相同平台的集成
      const existingIntegration = await Integration.findOne({
        where: {
          user_id: userId,
          platform: platform
        }
      });

      if (existingIntegration) {
        return res.status(409).json({
          success: false,
          message: '该平台的集成已存在'
        });
      }

      // 验证平台配置
      const factory = new IntegrationFactory();
      const isValidConfig = factory.validateConfig(platform, config || {});
      
      if (!isValidConfig.valid) {
        return res.status(400).json({
          success: false,
          message: '配置验证失败',
          errors: isValidConfig.errors
        });
      }

      // 创建集成
      const integration = await Integration.create({
        user_id: userId,
        platform,
        platform_type,
        config: config || {},
        settings: settings || {},
        is_active: false, // 默认未激活，需要完成认证后激活
        sync_status: 'idle'
      });

      res.status(201).json({
        success: true,
        message: '集成创建成功',
        data: {
          id: integration.id,
          platform: integration.platform,
          platform_type: integration.platform_type,
          is_active: integration.is_active,
          sync_status: integration.sync_status,
          created_at: integration.created_at
        }
      });
    } catch (error) {
      console.error('创建集成失败:', error);
      res.status(500).json({
        success: false,
        message: '创建集成失败',
        error: error.message
      });
    }
  }

  // 更新集成配置
  static async updateIntegration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { config, settings, is_active } = req.body;

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

      // 验证配置（如果提供了新配置）
      if (config) {
        const factory = new IntegrationFactory();
        const isValidConfig = factory.validateConfig(integration.platform, config);
        
        if (!isValidConfig.valid) {
          return res.status(400).json({
            success: false,
            message: '配置验证失败',
            errors: isValidConfig.errors
          });
        }
      }

      // 更新集成
      const updateData = {};
      if (config !== undefined) updateData.config = config;
      if (settings !== undefined) updateData.settings = settings;
      if (is_active !== undefined) updateData.is_active = is_active;
      updateData.updated_at = new Date();

      await integration.update(updateData);

      res.json({
        success: true,
        message: '集成更新成功',
        data: {
          id: integration.id,
          platform: integration.platform,
          is_active: integration.is_active,
          sync_status: integration.sync_status,
          updated_at: integration.updated_at
        }
      });
    } catch (error) {
      console.error('更新集成失败:', error);
      res.status(500).json({
        success: false,
        message: '更新集成失败',
        error: error.message
      });
    }
  }

  // 删除集成
  static async deleteIntegration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

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

      // 删除集成（级联删除相关的DataMapping和SyncLog）
      await integration.destroy();

      res.json({
        success: true,
        message: '集成删除成功'
      });
    } catch (error) {
      console.error('删除集成失败:', error);
      res.status(500).json({
        success: false,
        message: '删除集成失败',
        error: error.message
      });
    }
  }

  // 获取支持的平台列表
  static async getSupportedPlatforms(req, res) {
    try {
      const platforms = IntegrationFactory.getSupportedPlatforms();

      res.json({
        success: true,
        data: platforms
      });
    } catch (error) {
      console.error('获取支持平台失败:', error);
      res.status(500).json({
        success: false,
        message: '获取支持平台失败',
        error: error.message
      });
    }
  }

  // 测试集成连接
  static async testConnection(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

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

      // 创建集成服务实例并测试连接
      const factory = new IntegrationFactory();
      const service = factory.createService(integration.platform, integration.getDecryptedConfig());
      
      const testResult = await service.testConnection();

      if (testResult.success) {
        // 更新集成状态
        await integration.update({
          is_active: true,
          sync_status: 'idle',
          error_message: null
        });
      } else {
        await integration.update({
          is_active: false,
          sync_status: 'error',
          error_message: testResult.error
        });
      }

      res.json({
        success: testResult.success,
        message: testResult.success ? '连接测试成功' : '连接测试失败',
        data: testResult
      });
    } catch (error) {
      console.error('测试连接失败:', error);
      res.status(500).json({
        success: false,
        message: '测试连接失败',
        error: error.message
      });
    }
  }

  // 手动触发同步
  static async triggerSync(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { entity_types, direction = 'bidirectional' } = req.body;

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

      if (!integration.isActive()) {
        return res.status(400).json({
          success: false,
          message: '集成未激活或令牌已过期'
        });
      }

      // 更新同步状态
      await integration.updateSyncStatus('syncing');

      // 创建同步日志
      const batchId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const syncLogs = (entity_types || ['client', 'invoice']).map(entityType => ({
        integration_id: integration.id,
        sync_type: 'manual',
        entity_type: entityType,
        operation: 'read',
        direction: direction === 'bidirectional' ? 'inbound' : direction,
        status: 'pending',
        batch_id: batchId
      }));

      await SyncLog.bulkCreate(syncLogs);

      // 这里应该触发后台同步任务
      // TODO: 实现队列系统来处理同步任务
      
      res.json({
        success: true,
        message: '同步任务已启动',
        data: {
          batch_id: batchId,
          entity_types: entity_types || ['client', 'invoice'],
          direction: direction
        }
      });
    } catch (error) {
      console.error('触发同步失败:', error);
      res.status(500).json({
        success: false,
        message: '触发同步失败',
        error: error.message
      });
    }
  }

  // 获取同步状态
  static async getSyncStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { batch_id } = req.query;

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

      const whereClause = { integration_id: integration.id };
      if (batch_id) {
        whereClause.batch_id = batch_id;
      }

      const syncLogs = await SyncLog.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: batch_id ? undefined : 50
      });

      // 统计同步状态
      const stats = syncLogs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          integration_status: integration.sync_status,
          last_sync_at: integration.last_sync_at,
          sync_logs: syncLogs,
          stats: stats
        }
      });
    } catch (error) {
      console.error('获取同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步状态失败',
        error: error.message
      });
    }
  }

  // 获取数据映射
  static async getDataMappings(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { entity_type } = req.query;

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

      const whereClause = { integration_id: integration.id };
      if (entity_type) {
        whereClause.local_entity = entity_type;
      }

      const mappings = await DataMapping.findAll({
        where: whereClause,
        order: [['updated_at', 'DESC']]
      });

      res.json({
        success: true,
        data: mappings
      });
    } catch (error) {
      console.error('获取数据映射失败:', error);
      res.status(500).json({
        success: false,
        message: '获取数据映射失败',
        error: error.message
      });
    }
  }
}

module.exports = IntegrationController;