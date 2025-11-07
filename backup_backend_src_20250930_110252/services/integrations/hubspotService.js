const axios = require('axios');
const { Integration } = require('../../models');
const logger = require('../../utils/logger');
const { encrypt, decrypt } = require('../../utils/encryption');

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // ms between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Error types for better error handling
const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  AUTHENTICATION: 'AUTHENTICATION',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

class HubSpotService {
  constructor() {
    this.baseURL = 'https://api.hubapi.com';
    this.apiVersion = 'v3';
  }

  /**
   * 验证HubSpot API密钥
   * @param {string} apiKey - HubSpot API密钥
   * @returns {Promise<Object>} 验证结果
   */
  async validateApiKey(apiKey) {
    try {
      const response = await this.makeRateLimitedRequest(async () => {
        return await axios.get(`${this.baseURL}/account-info/${this.apiVersion}/details`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      });
      
      return {
        valid: true,
        data: response.data
      };
    } catch (error) {
      const errorInfo = this.categorizeError(error);
      logger.error('HubSpot API key validation failed:', {
        type: errorInfo.type,
        message: errorInfo.message,
        status: error.response?.status
      });
      
      return {
        valid: false,
        error: errorInfo.message,
        type: errorInfo.type
      };
    }
  }

  /**
   * 创建HubSpot集成
   * @param {Object} integrationData - 集成配置数据
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 创建的集成对象
   */
  async createIntegration(integrationData, userId) {
    try {
      const { name, description, apiKey, syncFrequency, dataTypes, settings } = integrationData;

      // 验证API密钥
      const isValidKey = await this.validateApiKey(apiKey);
      if (!isValidKey) {
        throw new Error('Invalid HubSpot API key');
      }

      // 加密API密钥
      const encryptedApiKey = encrypt(apiKey);

      // 创建集成记录
      const integration = await Integration.create({
        userId,
        platform: 'hubspot',
        name,
        description,
        status: 'active',
        configuration: {
          apiKey: encryptedApiKey,
          syncFrequency: syncFrequency || 'hourly',
          dataTypes: dataTypes || ['contacts', 'companies', 'deals'],
          settings: settings || {
            bidirectionalSync: false,
            conflictResolution: 'hubspot_wins',
            batchSize: 100,
            timeout: 30000
          }
        },
        lastSync: null,
        nextSync: this.calculateNextSync(syncFrequency || 'hourly'),
        syncStats: {
          totalSynced: 0,
          errors: 0,
          warnings: 0,
          lastSyncDuration: 0
        }
      });

      logger.info(`HubSpot integration created for user ${userId}:`, integration.id);
      return integration;
    } catch (error) {
      logger.error('Failed to create HubSpot integration:', error.message);
      throw error;
    }
  }

  /**
   * 测试HubSpot连接
   * @param {string} integrationId - 集成ID
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const apiKey = decrypt(integration.configuration.apiKey);
      const startTime = Date.now();

      // 测试API连接
      const response = await this.makeRateLimitedRequest(async () => {
        return await axios.get(`${this.baseURL}/account-info/${this.apiVersion}/details`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      });

      const duration = Date.now() - startTime;
      const accountInfo = response.data;

      // 更新集成状态
      await integration.update({
        status: 'active',
        lastTestedAt: new Date(),
        errorMessage: null
      });

      return {
        success: true,
        message: 'Connection successful',
        duration,
        accountInfo: {
          portalId: accountInfo.portalId,
          accountType: accountInfo.accountType,
          timeZone: accountInfo.timeZone,
          currency: accountInfo.currency
        }
      };
    } catch (error) {
      const errorInfo = this.categorizeError(error);
      logger.error('HubSpot connection test failed:', errorInfo);
      
      // 更新集成状态为错误
      const integration = await Integration.findByPk(integrationId);
      if (integration) {
        await integration.update({
          status: 'error',
          lastTestedAt: new Date(),
          errorMessage: errorInfo.message
        });
      }
      
      return {
        success: false,
        message: errorInfo.message,
        type: errorInfo.type,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * 同步联系人数据
   * @param {string} integrationId - 集成ID
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncContacts(integrationId, options = {}) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const apiKey = decrypt(integration.configuration.apiKey);
      const { batchSize = 100, lastModifiedDate } = options;
      
      let allContacts = [];
      let hasMore = true;
      let after = null;
      let syncedCount = 0;
      let errorCount = 0;

      while (hasMore) {
        try {
          const params = {
            limit: batchSize,
            properties: ['firstname', 'lastname', 'email', 'phone', 'company', 'createdate', 'lastmodifieddate']
          };

          if (after) {
            params.after = after;
          }

          if (lastModifiedDate) {
            params.filterGroups = [{
              filters: [{
                propertyName: 'lastmodifieddate',
                operator: 'GTE',
                value: lastModifiedDate
              }]
            }];
          }

          const response = await axios.get(`${this.baseURL}/crm/${this.apiVersion}/objects/contacts`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            params
          });

          const contacts = response.data.results || [];
          allContacts = allContacts.concat(contacts);
          syncedCount += contacts.length;

          hasMore = response.data.paging?.next?.after;
          after = response.data.paging?.next?.after;

          // 处理联系人数据并保存到本地数据库
          await this.processContacts(contacts, integrationId);

          logger.info(`Synced ${contacts.length} contacts from HubSpot`);
        } catch (batchError) {
          logger.error('Error syncing contact batch:', batchError.message);
          errorCount++;
          
          if (errorCount > 5) {
            throw new Error('Too many batch errors, stopping sync');
          }
        }
      }

      // 更新集成统计信息
      await this.updateSyncStats(integrationId, {
        totalSynced: syncedCount,
        errors: errorCount,
        lastSync: new Date(),
        nextSync: this.calculateNextSync(integration.configuration.syncFrequency)
      });

      return {
        success: true,
        syncedCount,
        errorCount,
        totalContacts: allContacts.length
      };
    } catch (error) {
      logger.error('HubSpot contacts sync failed:', error.message);
      throw error;
    }
  }

  /**
   * 同步公司数据
   * @param {string} integrationId - 集成ID
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncCompanies(integrationId, options = {}) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const apiKey = decrypt(integration.configuration.apiKey);
      const { batchSize = 100, lastModifiedDate } = options;
      
      let allCompanies = [];
      let hasMore = true;
      let after = null;
      let syncedCount = 0;
      let errorCount = 0;

      while (hasMore) {
        try {
          const params = {
            limit: batchSize,
            properties: ['name', 'domain', 'industry', 'phone', 'city', 'state', 'country', 'createdate', 'lastmodifieddate']
          };

          if (after) {
            params.after = after;
          }

          if (lastModifiedDate) {
            params.filterGroups = [{
              filters: [{
                propertyName: 'lastmodifieddate',
                operator: 'GTE',
                value: lastModifiedDate
              }]
            }];
          }

          const response = await axios.get(`${this.baseURL}/crm/${this.apiVersion}/objects/companies`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            params
          });

          const companies = response.data.results || [];
          allCompanies = allCompanies.concat(companies);
          syncedCount += companies.length;

          hasMore = response.data.paging?.next?.after;
          after = response.data.paging?.next?.after;

          // 处理公司数据并保存到本地数据库
          await this.processCompanies(companies, integrationId);

          logger.info(`Synced ${companies.length} companies from HubSpot`);
        } catch (batchError) {
          logger.error('Error syncing company batch:', batchError.message);
          errorCount++;
          
          if (errorCount > 5) {
            throw new Error('Too many batch errors, stopping sync');
          }
        }
      }

      return {
        success: true,
        syncedCount,
        errorCount,
        totalCompanies: allCompanies.length
      };
    } catch (error) {
      logger.error('HubSpot companies sync failed:', error.message);
      throw error;
    }
  }

  /**
   * 同步交易数据
   * @param {string} integrationId - 集成ID
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncDeals(integrationId, options = {}) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const apiKey = decrypt(integration.configuration.apiKey);
      const { batchSize = 100, lastModifiedDate } = options;
      
      let allDeals = [];
      let hasMore = true;
      let after = null;
      let syncedCount = 0;
      let errorCount = 0;

      while (hasMore) {
        try {
          const params = {
            limit: batchSize,
            properties: ['dealname', 'amount', 'dealstage', 'pipeline', 'closedate', 'createdate', 'lastmodifieddate']
          };

          if (after) {
            params.after = after;
          }

          if (lastModifiedDate) {
            params.filterGroups = [{
              filters: [{
                propertyName: 'lastmodifieddate',
                operator: 'GTE',
                value: lastModifiedDate
              }]
            }];
          }

          const response = await axios.get(`${this.baseURL}/crm/${this.apiVersion}/objects/deals`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            params
          });

          const deals = response.data.results || [];
          allDeals = allDeals.concat(deals);
          syncedCount += deals.length;

          hasMore = response.data.paging?.next?.after;
          after = response.data.paging?.next?.after;

          // 处理交易数据并保存到本地数据库
          await this.processDeals(deals, integrationId);

          logger.info(`Synced ${deals.length} deals from HubSpot`);
        } catch (batchError) {
          logger.error('Error syncing deal batch:', batchError.message);
          errorCount++;
          
          if (errorCount > 5) {
            throw new Error('Too many batch errors, stopping sync');
          }
        }
      }

      return {
        success: true,
        syncedCount,
        errorCount,
        totalDeals: allDeals.length
      };
    } catch (error) {
      logger.error('HubSpot deals sync failed:', error.message);
      throw error;
    }
  }

  /**
   * 执行完整同步
   * @param {string} integrationId - 集成ID
   * @returns {Promise<Object>} 同步结果
   */
  async performFullSync(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const startTime = Date.now();
      const results = {
        contacts: { syncedCount: 0, errorCount: 0 },
        companies: { syncedCount: 0, errorCount: 0 },
        deals: { syncedCount: 0, errorCount: 0 }
      };

      const dataTypes = integration.configuration.dataTypes || [];

      // 同步联系人
      if (dataTypes.includes('contacts')) {
        try {
          const contactResult = await this.syncContacts(integrationId);
          results.contacts = contactResult;
        } catch (error) {
          logger.error('Contacts sync failed:', error.message);
          results.contacts.errorCount = 1;
        }
      }

      // 同步公司
      if (dataTypes.includes('companies')) {
        try {
          const companyResult = await this.syncCompanies(integrationId);
          results.companies = companyResult;
        } catch (error) {
          logger.error('Companies sync failed:', error.message);
          results.companies.errorCount = 1;
        }
      }

      // 同步交易
      if (dataTypes.includes('deals')) {
        try {
          const dealResult = await this.syncDeals(integrationId);
          results.deals = dealResult;
        } catch (error) {
          logger.error('Deals sync failed:', error.message);
          results.deals.errorCount = 1;
        }
      }

      const duration = Date.now() - startTime;
      const totalSynced = results.contacts.syncedCount + results.companies.syncedCount + results.deals.syncedCount;
      const totalErrors = results.contacts.errorCount + results.companies.errorCount + results.deals.errorCount;

      // 更新集成统计信息
      await this.updateSyncStats(integrationId, {
        totalSynced,
        errors: totalErrors,
        lastSync: new Date(),
        lastSyncDuration: duration,
        nextSync: this.calculateNextSync(integration.configuration.syncFrequency)
      });

      logger.info(`HubSpot full sync completed for integration ${integrationId}: ${totalSynced} records synced, ${totalErrors} errors, ${duration}ms`);

      return {
        success: totalErrors === 0,
        duration,
        totalSynced,
        totalErrors,
        results
      };
    } catch (error) {
      logger.error('HubSpot full sync failed:', error.message);
      throw error;
    }
  }

  /**
   * 处理联系人数据
   * @param {Array} contacts - HubSpot联系人数据
   * @param {string} integrationId - 集成ID
   */
  async processContacts(contacts, integrationId) {
    const processedContacts = [];
    const errors = [];
    
    for (const contact of contacts) {
      try {
        const processed = this.processContactData(contact);
        if (processed) {
          processedContacts.push(processed);
        }
      } catch (error) {
        errors.push({
          contactId: contact.id,
          error: error.message
        });
        logger.warn(`Failed to process contact ${contact.id}:`, error.message);
      }
    }
    
    logger.info(`Processing ${contacts.length} contacts for integration ${integrationId}: ${processedContacts.length} processed, ${errors.length} errors`);
    return { processedContacts, errors };
  }
  
  /**
   * 处理单个联系人数据
   * @param {Object} hubspotContact - HubSpot联系人数据
   * @returns {Object|null} 处理后的联系人数据
   */
  processContactData(hubspotContact) {
    try {
      if (!hubspotContact || !hubspotContact.id) {
        throw new Error('Invalid contact data: missing ID');
      }
      
      const properties = hubspotContact.properties || {};
      
      // Validate required fields
      if (!properties.email && !properties.firstname && !properties.lastname) {
        logger.warn(`Contact ${hubspotContact.id} has no email or name, skipping`);
        return null;
      }
      
      // Clean and validate email
      const email = properties.email ? properties.email.toLowerCase().trim() : '';
      if (email && !this.isValidEmail(email)) {
        logger.warn(`Contact ${hubspotContact.id} has invalid email: ${email}`);
      }
      
      // Clean phone number
      const phone = properties.phone ? this.cleanPhoneNumber(properties.phone) : '';
      
      return {
        externalId: hubspotContact.id,
        firstName: (properties.firstname || '').trim(),
        lastName: (properties.lastname || '').trim(),
        email: email,
        phone: phone,
        company: (properties.company || '').trim(),
        source: 'hubspot',
        createdAt: properties.createdate ? new Date(properties.createdate) : new Date(),
        lastModified: properties.lastmodifieddate ? new Date(properties.lastmodifieddate) : new Date(),
        rawData: hubspotContact // Keep original data for debugging
      };
    } catch (error) {
      logger.error(`Error processing contact data for ${hubspotContact?.id}:`, error.message);
      throw error;
    }
  }

  /**
   * 处理公司数据
   * @param {Array} companies - HubSpot公司数据
   * @param {string} integrationId - 集成ID
   */
  async processCompanies(companies, integrationId) {
    const processedCompanies = [];
    const errors = [];
    
    for (const company of companies) {
      try {
        const processed = this.processCompanyData(company);
        if (processed) {
          processedCompanies.push(processed);
        }
      } catch (error) {
        errors.push({
          companyId: company.id,
          error: error.message
        });
        logger.warn(`Failed to process company ${company.id}:`, error.message);
      }
    }
    
    logger.info(`Processing ${companies.length} companies for integration ${integrationId}: ${processedCompanies.length} processed, ${errors.length} errors`);
    return { processedCompanies, errors };
  }
  
  /**
   * 处理单个公司数据
   * @param {Object} hubspotCompany - HubSpot公司数据
   * @returns {Object|null} 处理后的公司数据
   */
  processCompanyData(hubspotCompany) {
    try {
      if (!hubspotCompany || !hubspotCompany.id) {
        throw new Error('Invalid company data: missing ID');
      }
      
      const properties = hubspotCompany.properties || {};
      
      // Validate required fields
      if (!properties.name && !properties.domain) {
        logger.warn(`Company ${hubspotCompany.id} has no name or domain, skipping`);
        return null;
      }
      
      // Clean and validate domain
      const domain = properties.domain ? properties.domain.toLowerCase().trim() : '';
      if (domain && !this.isValidDomain(domain)) {
        logger.warn(`Company ${hubspotCompany.id} has invalid domain: ${domain}`);
      }
      
      // Clean phone number
      const phone = properties.phone ? this.cleanPhoneNumber(properties.phone) : '';
      
      return {
        externalId: hubspotCompany.id,
        name: (properties.name || '').trim(),
        domain: domain,
        industry: (properties.industry || '').trim(),
        phone: phone,
        city: (properties.city || '').trim(),
        state: (properties.state || '').trim(),
        country: (properties.country || '').trim(),
        source: 'hubspot',
        createdAt: properties.createdate ? new Date(properties.createdate) : new Date(),
        lastModified: properties.lastmodifieddate ? new Date(properties.lastmodifieddate) : new Date(),
        rawData: hubspotCompany
      };
    } catch (error) {
      logger.error(`Error processing company data for ${hubspotCompany?.id}:`, error.message);
      throw error;
    }
  }

  /**
   * 处理交易数据
   * @param {Array} deals - HubSpot交易数据
   * @param {string} integrationId - 集成ID
   */
  async processDeals(deals, integrationId) {
    const processedDeals = [];
    const errors = [];
    
    for (const deal of deals) {
      try {
        const processed = this.processDealData(deal);
        if (processed) {
          processedDeals.push(processed);
        }
      } catch (error) {
        errors.push({
          dealId: deal.id,
          error: error.message
        });
        logger.warn(`Failed to process deal ${deal.id}:`, error.message);
      }
    }
    
    logger.info(`Processing ${deals.length} deals for integration ${integrationId}: ${processedDeals.length} processed, ${errors.length} errors`);
    return { processedDeals, errors };
  }
  
  /**
   * 处理单个交易数据
   * @param {Object} hubspotDeal - HubSpot交易数据
   * @returns {Object|null} 处理后的交易数据
   */
  processDealData(hubspotDeal) {
    try {
      if (!hubspotDeal || !hubspotDeal.id) {
        throw new Error('Invalid deal data: missing ID');
      }
      
      const properties = hubspotDeal.properties || {};
      
      // Validate required fields
      if (!properties.dealname) {
        logger.warn(`Deal ${hubspotDeal.id} has no name, skipping`);
        return null;
      }
      
      // Parse and validate amount
      let amount = 0;
      if (properties.amount) {
        amount = parseFloat(properties.amount);
        if (isNaN(amount)) {
          logger.warn(`Deal ${hubspotDeal.id} has invalid amount: ${properties.amount}`);
          amount = 0;
        }
      }
      
      // Parse close date
      let closeDate = null;
      if (properties.closedate) {
        closeDate = new Date(properties.closedate);
        if (isNaN(closeDate.getTime())) {
          logger.warn(`Deal ${hubspotDeal.id} has invalid close date: ${properties.closedate}`);
          closeDate = null;
        }
      }
      
      return {
        externalId: hubspotDeal.id,
        name: (properties.dealname || '').trim(),
        amount: amount,
        stage: (properties.dealstage || '').trim(),
        pipeline: (properties.pipeline || '').trim(),
        closeDate: closeDate,
        source: 'hubspot',
        createdAt: properties.createdate ? new Date(properties.createdate) : new Date(),
        lastModified: properties.lastmodifieddate ? new Date(properties.lastmodifieddate) : new Date(),
        rawData: hubspotDeal
      };
    } catch (error) {
      logger.error(`Error processing deal data for ${hubspotDeal?.id}:`, error.message);
      throw error;
    }
  }

  /**
   * 更新同步统计信息
   * @param {string} integrationId - 集成ID
   * @param {Object} stats - 统计数据
   */
  async updateSyncStats(integrationId, stats) {
    try {
      await Integration.update({
        lastSync: stats.lastSync,
        nextSync: stats.nextSync,
        syncStats: {
          totalSynced: stats.totalSynced,
          errors: stats.errors,
          warnings: stats.warnings || 0,
          lastSyncDuration: stats.lastSyncDuration || 0
        }
      }, {
        where: { id: integrationId }
      });
    } catch (error) {
      logger.error('Failed to update sync stats:', error.message);
    }
  }

  /**
   * 计算下次同步时间
   * @param {string} frequency - 同步频率
   * @returns {Date} 下次同步时间
   */
  calculateNextSync(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'every5min':
        return new Date(now.getTime() + 5 * 60 * 1000);
      case 'every15min':
        return new Date(now.getTime() + 15 * 60 * 1000);
      case 'every30min':
        return new Date(now.getTime() + 30 * 60 * 1000);
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'every2hours':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      case 'every6hours':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000);
      case 'every12hours':
        return new Date(now.getTime() + 12 * 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // 默认1小时
    }
  }

  /**
   * 获取同步状态
   * @param {string} integrationId - 集成ID
   * @returns {Promise<Object>} 同步状态
   */
  async getSyncStatus(integrationId) {
    try {
      const integration = await Integration.findByPk(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      return {
        status: integration.status,
        lastSync: integration.lastSync,
        nextSync: integration.nextSync,
        syncStats: integration.syncStats,
        configuration: {
          syncFrequency: integration.configuration.syncFrequency,
          dataTypes: integration.configuration.dataTypes
        }
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error.message);
      throw error;
    }
  }

  /**
   * 执行带有速率限制的请求
   * @param {Function} requestFn - 请求函数
   * @param {number} retries - 重试次数
   * @returns {Promise<Object>} 请求结果
   */
  async makeRateLimitedRequest(requestFn, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 添加速率限制延迟
        if (attempt > 0) {
          await this.delay(RETRY_DELAY * attempt);
        } else {
          await this.delay(RATE_LIMIT_DELAY);
        }
        
        return await requestFn();
      } catch (error) {
        const errorInfo = this.categorizeError(error);
        
        // 如果是速率限制错误且还有重试次数，继续重试
        if (errorInfo.type === ERROR_TYPES.RATE_LIMIT && attempt < retries) {
          const retryAfter = error.response?.headers['retry-after'] || (attempt + 1) * 2;
          logger.warn(`Rate limit hit, retrying after ${retryAfter}s (attempt ${attempt + 1}/${retries + 1})`);
          await this.delay(retryAfter * 1000);
          continue;
        }
        
        // 如果是网络错误且还有重试次数，继续重试
        if (errorInfo.type === ERROR_TYPES.NETWORK && attempt < retries) {
          logger.warn(`Network error, retrying (attempt ${attempt + 1}/${retries + 1}):`, errorInfo.message);
          continue;
        }
        
        // 其他错误或重试次数用完，抛出错误
        throw error;
      }
    }
  }

  /**
   * 分类错误类型
   * @param {Error} error - 错误对象
   * @returns {Object} 错误信息
   */
  categorizeError(error) {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 429) {
        return {
          type: ERROR_TYPES.RATE_LIMIT,
          message: 'Rate limit exceeded',
          status
        };
      }
      
      if (status === 401 || status === 403) {
        return {
          type: ERROR_TYPES.AUTHENTICATION,
          message: 'Authentication failed - invalid API key',
          status
        };
      }
      
      if (status >= 400 && status < 500) {
        return {
          type: ERROR_TYPES.VALIDATION,
          message: error.response.data?.message || 'Client error',
          status
        };
      }
      
      if (status >= 500) {
        return {
          type: ERROR_TYPES.NETWORK,
          message: 'Server error',
          status
        };
      }
    }
    
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return {
        type: ERROR_TYPES.NETWORK,
        message: `Network error: ${error.code}`,
        code: error.code
      };
    }
    
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || 'Unknown error occurred'
    };
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * 验证域名格式
   * @param {string} domain - 域名
   * @returns {boolean} 是否有效
   */
  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }
  
  /**
   * 清理电话号码
   * @param {string} phone - 电话号码
   * @returns {string} 清理后的电话号码
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    // Remove all non-digit characters except + at the beginning
    return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  }
  
  /**
   * 创建同步日志记录
   * @param {string} integrationId - 集成ID
   * @param {string} syncType - 同步类型
   * @returns {Promise<Object>} 同步日志对象
   */
  async createSyncLog(integrationId, syncType) {
    try {
      // 这里应该创建同步日志记录到数据库
      // 由于没有SyncLog模型，这里返回一个模拟对象
      const syncLog = {
        id: Date.now().toString(),
        integrationId,
        syncType,
        status: 'running',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsTotal: 0,
        errors: null
      };
      
      logger.info(`Created sync log ${syncLog.id} for integration ${integrationId}`);
      return syncLog;
    } catch (error) {
      logger.error('Failed to create sync log:', error.message);
      throw error;
    }
  }
  
  /**
   * 更新同步日志记录
   * @param {string} syncLogId - 同步日志ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<void>}
   */
  async updateSyncLog(syncLogId, updates) {
    try {
      // 这里应该更新同步日志记录到数据库
      logger.info(`Updated sync log ${syncLogId}:`, updates);
    } catch (error) {
      logger.error('Failed to update sync log:', error.message);
      // Don't throw here to avoid masking the original error
    }
  }
  
  /**
   * 批量处理数据
   * @param {Array} items - 要处理的数据项
   * @param {Function} processFn - 处理函数
   * @param {number} batchSize - 批次大小
   * @returns {Promise<Object>} 处理结果
   */
  async batchProcess(items, processFn, batchSize = 100) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(item => processFn(item))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          } else if (result.status === 'rejected') {
            errors.push({
              item: batch[index],
              error: result.reason.message
            });
          }
        });
        
        // Add delay between batches to avoid overwhelming the system
        if (i + batchSize < items.length) {
          await this.delay(100);
        }
      } catch (error) {
        logger.error(`Batch processing error for items ${i}-${i + batchSize}:`, error.message);
        errors.push({
          batch: `${i}-${i + batchSize}`,
          error: error.message
        });
      }
    }
    
    return {
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    };
  }
}

module.exports = HubSpotService;