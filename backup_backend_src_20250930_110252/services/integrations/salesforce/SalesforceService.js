const BaseIntegrationService = require('../base/BaseIntegrationService');
const DataMapper = require('../base/DataMapper');
const axios = require('axios');

class SalesforceService extends BaseIntegrationService {
  constructor(config) {
    super('salesforce', config);
    
    // Salesforce配置
    this.clientId = config.client_id;
    this.clientSecret = config.client_secret;
    this.redirectUri = config.redirect_uri;
    this.instanceUrl = config.instance_url || 'https://login.salesforce.com';
    this.apiVersion = config.api_version || 'v58.0';
    
    // 设置API基础URL
    if (config.access_token) {
      this.setupApiClient(config.access_token, config.instance_url);
    }
    
    // 初始化数据映射器
    this.dataMapper = new DataMapper({
      // 客户映射规则
      client: {
        local_to_external: {
          'name': 'Name',
          'company': 'AccountName',
          'email': 'Email',
          'phone': 'Phone',
          'address': 'MailingStreet',
          'city': 'MailingCity',
          'postalCode': 'MailingPostalCode',
          'country': 'MailingCountry',
          'vatNumber': 'Tax_ID__c'
        },
        external_to_local: {
          'Name': 'name',
          'AccountName': 'company',
          'Email': 'email',
          'Phone': 'phone',
          'MailingStreet': 'address',
          'MailingCity': 'city',
          'MailingPostalCode': 'postalCode',
          'MailingCountry': 'country',
          'Tax_ID__c': 'vatNumber'
        }
      },
      // 发票映射规则
      invoice: {
        local_to_external: {
          'invoiceNumber': 'Invoice_Number__c',
          'issueDate': 'Invoice_Date__c',
          'dueDate': 'Due_Date__c',
          'status': 'Status__c',
          'total': 'Amount',
          'currency': 'CurrencyIsoCode',
          'notes': 'Description'
        },
        external_to_local: {
          'Invoice_Number__c': 'invoiceNumber',
          'Invoice_Date__c': 'issueDate',
          'Due_Date__c': 'dueDate',
          'Status__c': 'status',
          'Amount': 'total',
          'CurrencyIsoCode': 'currency',
          'Description': 'notes'
        }
      }
    });
  }

  /**
   * 设置API客户端
   */
  setupApiClient(accessToken, instanceUrl) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
    
    this.apiClient = axios.create({
      baseURL: `${instanceUrl}/services/data/${this.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // 添加响应拦截器处理令牌过期
    this.apiClient.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // 令牌过期，尝试刷新
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            // 重试原请求
            error.config.headers['Authorization'] = `Bearer ${this.accessToken}`;
            return this.apiClient.request(error.config);
          }
        }
        throw error;
      }
    );
  }

  /**
   * 获取OAuth认证URL
   */
  getAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'api refresh_token offline_access',
      state: state
    });

    return `${this.instanceUrl}/services/oauth2/authorize?${params.toString()}`;
  }

  /**
   * 交换授权码获取访问令牌
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.instanceUrl}/services/oauth2/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, instance_url, issued_at } = response.data;
      
      // 设置API客户端
      this.setupApiClient(access_token, instance_url);
      
      return {
        success: true,
        access_token,
        refresh_token,
        instance_url,
        expires_at: new Date(parseInt(issued_at) + (2 * 60 * 60 * 1000)) // 2小时后过期
      };
    } catch (error) {
      console.error('Salesforce token exchange failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.instanceUrl}/services/oauth2/token`, {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, instance_url, issued_at } = response.data;
      
      // 更新API客户端
      this.setupApiClient(access_token, instance_url);
      
      return {
        success: true,
        access_token,
        instance_url,
        expires_at: new Date(parseInt(issued_at) + (2 * 60 * 60 * 1000))
      };
    } catch (error) {
      console.error('Salesforce token refresh failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const response = await this.apiClient.get('/sobjects/');
      return {
        success: true,
        message: 'Salesforce连接成功',
        data: {
          sobjects_count: response.data.sobjects?.length || 0,
          instance_url: this.instanceUrl
        }
      };
    } catch (error) {
      console.error('Salesforce connection test failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * 同步客户数据到Salesforce
   */
  async syncClientsToSalesforce(clients) {
    const results = [];
    
    for (const client of clients) {
      try {
        // 映射本地客户数据到Salesforce格式
        const contactData = this.dataMapper.mapData('client', client, 'local_to_external');
        
        // 检查是否已存在
        const existingContact = await this.findContactByEmail(client.email);
        
        let result;
        if (existingContact) {
          // 更新现有联系人
          result = await this.updateContact(existingContact.Id, contactData);
          result.operation = 'update';
        } else {
          // 创建新联系人
          result = await this.createContact(contactData);
          result.operation = 'create';
        }
        
        result.local_id = client.id;
        results.push(result);
        
      } catch (error) {
        console.error(`同步客户 ${client.id} 失败:`, error);
        results.push({
          success: false,
          local_id: client.id,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 从Salesforce同步客户数据
   */
  async syncClientsFromSalesforce(lastSyncDate = null) {
    try {
      let query = "SELECT Id, Name, AccountName, Email, Phone, MailingStreet, MailingCity, MailingPostalCode, MailingCountry, Tax_ID__c, LastModifiedDate FROM Contact";
      
      if (lastSyncDate) {
        query += ` WHERE LastModifiedDate > ${lastSyncDate.toISOString()}`;
      }
      
      query += " ORDER BY LastModifiedDate DESC LIMIT 1000";
      
      const response = await this.apiClient.get(`/query/?q=${encodeURIComponent(query)}`);
      
      const contacts = response.data.records.map(contact => {
        const localData = this.dataMapper.mapData('client', contact, 'external_to_local');
        return {
          ...localData,
          external_id: contact.Id,
          external_updated_at: new Date(contact.LastModifiedDate)
        };
      });
      
      return {
        success: true,
        data: contacts,
        total: response.data.totalSize
      };
    } catch (error) {
      console.error('从Salesforce同步客户失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 同步发票数据到Salesforce
   */
  async syncInvoicesToSalesforce(invoices) {
    const results = [];
    
    for (const invoice of invoices) {
      try {
        // 映射本地发票数据到Salesforce格式
        const opportunityData = this.dataMapper.mapData('invoice', invoice, 'local_to_external');
        
        // 查找对应的联系人
        const contact = await this.findContactByEmail(invoice.client?.email);
        if (contact) {
          opportunityData.ContactId = contact.Id;
          opportunityData.AccountId = contact.AccountId;
        }
        
        // 设置必填字段
        opportunityData.Name = `Invoice ${invoice.invoiceNumber}`;
        opportunityData.StageName = this.mapInvoiceStatusToStage(invoice.status);
        opportunityData.CloseDate = invoice.dueDate;
        
        // 检查是否已存在
        const existingOpportunity = await this.findOpportunityByInvoiceNumber(invoice.invoiceNumber);
        
        let result;
        if (existingOpportunity) {
          // 更新现有机会
          result = await this.updateOpportunity(existingOpportunity.Id, opportunityData);
          result.operation = 'update';
        } else {
          // 创建新机会
          result = await this.createOpportunity(opportunityData);
          result.operation = 'create';
        }
        
        result.local_id = invoice.id;
        results.push(result);
        
      } catch (error) {
        console.error(`同步发票 ${invoice.id} 失败:`, error);
        results.push({
          success: false,
          local_id: invoice.id,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 创建联系人
   */
  async createContact(contactData) {
    try {
      const response = await this.apiClient.post('/sobjects/Contact/', contactData);
      return {
        success: true,
        external_id: response.data.id,
        data: response.data
      };
    } catch (error) {
      throw new Error(`创建联系人失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 更新联系人
   */
  async updateContact(contactId, contactData) {
    try {
      await this.apiClient.patch(`/sobjects/Contact/${contactId}`, contactData);
      return {
        success: true,
        external_id: contactId
      };
    } catch (error) {
      throw new Error(`更新联系人失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 根据邮箱查找联系人
   */
  async findContactByEmail(email) {
    if (!email) return null;
    
    try {
      const query = `SELECT Id, AccountId FROM Contact WHERE Email = '${email}' LIMIT 1`;
      const response = await this.apiClient.get(`/query/?q=${encodeURIComponent(query)}`);
      return response.data.records[0] || null;
    } catch (error) {
      console.error('查找联系人失败:', error);
      return null;
    }
  }

  /**
   * 创建机会
   */
  async createOpportunity(opportunityData) {
    try {
      const response = await this.apiClient.post('/sobjects/Opportunity/', opportunityData);
      return {
        success: true,
        external_id: response.data.id,
        data: response.data
      };
    } catch (error) {
      throw new Error(`创建机会失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 更新机会
   */
  async updateOpportunity(opportunityId, opportunityData) {
    try {
      await this.apiClient.patch(`/sobjects/Opportunity/${opportunityId}`, opportunityData);
      return {
        success: true,
        external_id: opportunityId
      };
    } catch (error) {
      throw new Error(`更新机会失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 根据发票号查找机会
   */
  async findOpportunityByInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber) return null;
    
    try {
      const query = `SELECT Id FROM Opportunity WHERE Invoice_Number__c = '${invoiceNumber}' LIMIT 1`;
      const response = await this.apiClient.get(`/query/?q=${encodeURIComponent(query)}`);
      return response.data.records[0] || null;
    } catch (error) {
      console.error('查找机会失败:', error);
      return null;
    }
  }

  /**
   * 映射发票状态到Salesforce阶段
   */
  mapInvoiceStatusToStage(status) {
    const statusMap = {
      'draft': 'Prospecting',
      'sent': 'Proposal/Price Quote',
      'paid': 'Closed Won',
      'overdue': 'Negotiation/Review',
      'cancelled': 'Closed Lost'
    };
    return statusMap[status] || 'Prospecting';
  }

  /**
   * 获取Salesforce对象信息
   */
  async getSObjectInfo(objectType) {
    try {
      const response = await this.apiClient.get(`/sobjects/${objectType}/describe/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(operations) {
    try {
      const batchRequest = {
        batchRequests: operations.map((op, index) => ({
          method: op.method,
          url: op.url,
          richInput: op.data,
          binaryPartName: `request${index}`
        }))
      };

      const response = await this.apiClient.post('/composite/batch/', batchRequest);
      return {
        success: true,
        results: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SalesforceService;