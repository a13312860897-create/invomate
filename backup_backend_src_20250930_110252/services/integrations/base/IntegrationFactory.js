// const SalesforceService = require('../crm/SalesforceService');
const HubSpotService = require('../hubspotService');
// const PipedriveService = require('../crm/PipedriveService');
// const TrelloService = require('../project-management/TrelloService');
// const AsanaService = require('../project-management/AsanaService');
// const MondayService = require('../project-management/MondayService');

/**
 * 集成服务工厂类
 * 负责创建和管理各种第三方集成服务实例
 */
class IntegrationFactory {
  constructor() {
    // 注册所有可用的集成服务
    this.services = new Map();
    this.registerServices();
  }

  /**
   * 注册所有集成服务
   */
  registerServices() {
    // CRM服务
    // this.services.set('salesforce', {
    //   class: SalesforceService,
    //   type: 'crm',
    //   name: 'Salesforce',
    //   description: 'Salesforce CRM integration',
    //   requiredConfig: ['clientId', 'clientSecret', 'instanceUrl'],
    //   optionalConfig: ['apiVersion', 'sandbox']
    // });

    this.services.set('hubspot', {
      class: HubSpotService,
      type: 'crm',
      name: 'HubSpot',
      description: 'HubSpot CRM integration',
      requiredConfig: ['apiKey'],
      optionalConfig: ['portalId']
    });

    // this.services.set('pipedrive', {
    //   class: PipedriveService,
    //   type: 'crm',
    //   name: 'Pipedrive',
    //   description: 'Pipedrive CRM integration',
    //   requiredConfig: ['apiToken', 'companyDomain'],
    //   optionalConfig: []
    // });

    // 项目管理服务
    // this.services.set('trello', {
    //   class: TrelloService,
    //   type: 'project_management',
    //   name: 'Trello',
    //   description: 'Trello project management integration',
    //   requiredConfig: ['apiKey', 'token'],
    //   optionalConfig: ['defaultBoardId']
    // });

    // this.services.set('asana', {
    //   class: AsanaService,
    //   type: 'project_management',
    //   name: 'Asana',
    //   description: 'Asana project management integration',
    //   requiredConfig: ['accessToken'],
    //   optionalConfig: ['workspaceId']
    // });

    // this.services.set('monday', {
    //   class: MondayService,
    //   type: 'project_management',
    //   name: 'Monday.com',
    //   description: 'Monday.com project management integration',
    //   requiredConfig: ['apiToken'],
    //   optionalConfig: ['accountId']
    // });
  }

  /**
   * 创建集成服务实例
   * @param {string} platform - 平台名称
   * @param {Object} config - 配置对象
   * @param {number} integrationId - 集成ID
   * @returns {BaseIntegrationService} 集成服务实例
   */
  createService(platform, config, integrationId = null) {
    const serviceInfo = this.services.get(platform.toLowerCase());
    
    if (!serviceInfo) {
      throw new Error(`Unsupported integration platform: ${platform}`);
    }

    // 验证必需的配置参数
    this.validateConfig(platform, config, serviceInfo.requiredConfig);

    // 创建服务实例
    const ServiceClass = serviceInfo.class;
    const serviceConfig = {
      platform: platform.toLowerCase(),
      platformType: serviceInfo.type,
      integrationId,
      ...config
    };

    try {
      const service = new ServiceClass(serviceConfig);
      console.log(`[IntegrationFactory] Created ${serviceInfo.name} service instance`);
      return service;
    } catch (error) {
      console.error(`[IntegrationFactory] Failed to create ${serviceInfo.name} service:`, error);
      throw new Error(`Failed to create ${serviceInfo.name} service: ${error.message}`);
    }
  }

  /**
   * 验证配置参数
   * @param {string} platform - 平台名称
   * @param {Object} config - 配置对象
   * @param {Array} requiredFields - 必需字段数组
   */
  validateConfig(platform, config, requiredFields) {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!config[field] || config[field].trim() === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required configuration for ${platform}: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * 获取所有支持的平台列表
   * @returns {Array} 平台信息数组
   */
  getSupportedPlatforms() {
    const platforms = [];
    
    for (const [key, serviceInfo] of this.services) {
      platforms.push({
        key,
        name: serviceInfo.name,
        type: serviceInfo.type,
        description: serviceInfo.description,
        requiredConfig: serviceInfo.requiredConfig,
        optionalConfig: serviceInfo.optionalConfig
      });
    }
    
    return platforms;
  }

  /**
   * 根据类型获取平台列表
   * @param {string} type - 平台类型 ('crm' | 'project_management')
   * @returns {Array} 指定类型的平台数组
   */
  getPlatformsByType(type) {
    const platforms = this.getSupportedPlatforms();
    return platforms.filter(platform => platform.type === type);
  }

  /**
   * 获取CRM平台列表
   * @returns {Array} CRM平台数组
   */
  getCRMPlatforms() {
    return this.getPlatformsByType('crm');
  }

  /**
   * 获取项目管理平台列表
   * @returns {Array} 项目管理平台数组
   */
  getProjectManagementPlatforms() {
    return this.getPlatformsByType('project_management');
  }

  /**
   * 检查平台是否支持
   * @param {string} platform - 平台名称
   * @returns {boolean} 是否支持
   */
  isSupported(platform) {
    return this.services.has(platform.toLowerCase());
  }

  /**
   * 获取平台信息
   * @param {string} platform - 平台名称
   * @returns {Object|null} 平台信息
   */
  getPlatformInfo(platform) {
    const serviceInfo = this.services.get(platform.toLowerCase());
    if (!serviceInfo) {
      return null;
    }

    return {
      platform: platform.toLowerCase(),
      name: serviceInfo.name,
      type: serviceInfo.type,
      description: serviceInfo.description,
      requiredConfig: serviceInfo.requiredConfig,
      optionalConfig: serviceInfo.optionalConfig
    };
  }

  /**
   * 批量创建服务实例
   * @param {Array} integrations - 集成配置数组
   * @returns {Map} 服务实例映射
   */
  createMultipleServices(integrations) {
    const services = new Map();
    const errors = [];

    for (const integration of integrations) {
      try {
        const service = this.createService(
          integration.platform,
          integration.config,
          integration.id
        );
        services.set(integration.id, service);
      } catch (error) {
        errors.push({
          integrationId: integration.id,
          platform: integration.platform,
          error: error.message
        });
      }
    }

    if (errors.length > 0) {
      console.warn('[IntegrationFactory] Some services failed to create:', errors);
    }

    return { services, errors };
  }

  /**
   * 获取平台的默认配置模板
   * @param {string} platform - 平台名称
   * @returns {Object} 配置模板
   */
  getConfigTemplate(platform) {
    const serviceInfo = this.services.get(platform.toLowerCase());
    if (!serviceInfo) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const template = {};
    
    // 添加必需字段
    serviceInfo.requiredConfig.forEach(field => {
      template[field] = {
        required: true,
        type: this.getFieldType(field),
        description: this.getFieldDescription(field)
      };
    });

    // 添加可选字段
    serviceInfo.optionalConfig.forEach(field => {
      template[field] = {
        required: false,
        type: this.getFieldType(field),
        description: this.getFieldDescription(field)
      };
    });

    return template;
  }

  /**
   * 获取字段类型
   * @param {string} fieldName - 字段名称
   * @returns {string} 字段类型
   */
  getFieldType(fieldName) {
    const typeMap = {
      'apiKey': 'password',
      'apiToken': 'password',
      'accessToken': 'password',
      'clientSecret': 'password',
      'token': 'password',
      'clientId': 'text',
      'instanceUrl': 'url',
      'companyDomain': 'text',
      'portalId': 'number',
      'workspaceId': 'text',
      'accountId': 'text',
      'defaultBoardId': 'text',
      'apiVersion': 'text',
      'sandbox': 'boolean'
    };
    
    return typeMap[fieldName] || 'text';
  }

  /**
   * 获取字段描述
   * @param {string} fieldName - 字段名称
   * @returns {string} 字段描述
   */
  getFieldDescription(fieldName) {
    const descriptionMap = {
      'apiKey': 'API密钥',
      'apiToken': 'API令牌',
      'accessToken': '访问令牌',
      'clientSecret': '客户端密钥',
      'token': '认证令牌',
      'clientId': '客户端ID',
      'instanceUrl': '实例URL',
      'companyDomain': '公司域名',
      'portalId': '门户ID',
      'workspaceId': '工作空间ID',
      'accountId': '账户ID',
      'defaultBoardId': '默认看板ID',
      'apiVersion': 'API版本',
      'sandbox': '是否为沙箱环境'
    };
    
    return descriptionMap[fieldName] || fieldName;
  }
}

// 创建单例实例
const integrationFactory = new IntegrationFactory();

module.exports = integrationFactory;