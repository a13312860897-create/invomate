/**
 * Salesforce集成配置
 */

module.exports = {
  // OAuth配置
  oauth: {
    // 授权URL
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    // 令牌URL
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    // 撤销URL
    revokeUrl: 'https://login.salesforce.com/services/oauth2/revoke',
    // 默认作用域
    defaultScopes: ['api', 'refresh_token', 'offline_access'],
    // 沙盒环境URL
    sandboxAuthUrl: 'https://test.salesforce.com/services/oauth2/authorize',
    sandboxTokenUrl: 'https://test.salesforce.com/services/oauth2/token'
  },

  // API配置
  api: {
    // 默认API版本
    defaultVersion: 'v58.0',
    // 支持的API版本
    supportedVersions: ['v54.0', 'v55.0', 'v56.0', 'v57.0', 'v58.0'],
    // 请求超时时间（毫秒）
    timeout: 30000,
    // 重试次数
    retryAttempts: 3,
    // 重试延迟（毫秒）
    retryDelay: 1000
  },

  // 数据同步配置
  sync: {
    // 批量操作大小
    batchSize: 200,
    // 同步间隔（分钟）
    syncInterval: 15,
    // 最大同步记录数
    maxRecords: 10000,
    // 同步超时时间（分钟）
    syncTimeout: 30
  },

  // 对象映射配置
  objectMappings: {
    // 客户映射到联系人
    client: {
      salesforceObject: 'Contact',
      requiredFields: ['LastName', 'Email'],
      fieldMappings: {
        'name': 'LastName',
        'firstName': 'FirstName',
        'company': 'AccountName',
        'email': 'Email',
        'phone': 'Phone',
        'mobile': 'MobilePhone',
        'address': 'MailingStreet',
        'city': 'MailingCity',
        'state': 'MailingState',
        'postalCode': 'MailingPostalCode',
        'country': 'MailingCountry',
        'vatNumber': 'Tax_ID__c',
        'website': 'Website__c',
        'industry': 'Industry__c',
        'notes': 'Description'
      },
      customFields: {
        'Tax_ID__c': 'text',
        'Website__c': 'url',
        'Industry__c': 'picklist',
        'Invoice_System_ID__c': 'text'
      }
    },

    // 发票映射到机会
    invoice: {
      salesforceObject: 'Opportunity',
      requiredFields: ['Name', 'StageName', 'CloseDate'],
      fieldMappings: {
        'invoiceNumber': 'Invoice_Number__c',
        'issueDate': 'Invoice_Date__c',
        'dueDate': 'CloseDate',
        'status': 'StageName',
        'total': 'Amount',
        'subtotal': 'Subtotal__c',
        'taxAmount': 'Tax_Amount__c',
        'currency': 'CurrencyIsoCode',
        'notes': 'Description',
        'paymentTerms': 'Payment_Terms__c',
        'discount': 'Discount__c'
      },
      customFields: {
        'Invoice_Number__c': 'text',
        'Invoice_Date__c': 'date',
        'Subtotal__c': 'currency',
        'Tax_Amount__c': 'currency',
        'Payment_Terms__c': 'text',
        'Discount__c': 'percent',
        'Invoice_System_ID__c': 'text'
      },
      stageMapping: {
        'draft': 'Prospecting',
        'sent': 'Proposal/Price Quote',
        'viewed': 'Negotiation/Review',
        'paid': 'Closed Won',
        'overdue': 'Negotiation/Review',
        'cancelled': 'Closed Lost',
        'refunded': 'Closed Lost'
      }
    },

    // 发票项目映射到机会产品
    invoiceItem: {
      salesforceObject: 'OpportunityLineItem',
      requiredFields: ['OpportunityId', 'Quantity', 'UnitPrice'],
      fieldMappings: {
        'description': 'Description',
        'quantity': 'Quantity',
        'unitPrice': 'UnitPrice',
        'total': 'TotalPrice',
        'discount': 'Discount',
        'taxRate': 'Tax_Rate__c'
      },
      customFields: {
        'Tax_Rate__c': 'percent',
        'Invoice_Item_ID__c': 'text'
      }
    }
  },

  // Webhook配置
  webhooks: {
    // 支持的事件类型
    supportedEvents: [
      'Contact.created',
      'Contact.updated',
      'Contact.deleted',
      'Opportunity.created',
      'Opportunity.updated',
      'Opportunity.deleted',
      'Account.created',
      'Account.updated'
    ],
    // Webhook验证
    verification: {
      enabled: true,
      algorithm: 'sha256'
    }
  },

  // 错误处理配置
  errorHandling: {
    // 可重试的错误代码
    retryableErrors: [
      'UNABLE_TO_LOCK_ROW',
      'REQUEST_LIMIT_EXCEEDED',
      'SERVER_UNAVAILABLE',
      'TIMEOUT'
    ],
    // 忽略的错误（不记录日志）
    ignoredErrors: [
      'DUPLICATE_VALUE'
    ],
    // 错误通知配置
    notifications: {
      enabled: true,
      threshold: 10, // 连续错误次数阈值
      cooldown: 3600 // 通知冷却时间（秒）
    }
  },

  // 限流配置
  rateLimiting: {
    // API调用限制（每小时）
    apiCallsPerHour: 15000,
    // 批量API限制（每24小时）
    bulkApiCallsPerDay: 10000,
    // 并发请求限制
    concurrentRequests: 25,
    // 限流策略
    strategy: 'sliding_window'
  },

  // 缓存配置
  cache: {
    // 启用缓存
    enabled: true,
    // 缓存TTL（秒）
    ttl: 300,
    // 缓存键前缀
    keyPrefix: 'sf_',
    // 可缓存的查询类型
    cacheableQueries: [
      'sobject_describe',
      'picklist_values',
      'user_info'
    ]
  },

  // 日志配置
  logging: {
    // 日志级别
    level: 'info',
    // 记录API调用
    logApiCalls: true,
    // 记录数据同步
    logDataSync: true,
    // 敏感字段（不记录到日志）
    sensitiveFields: [
      'access_token',
      'refresh_token',
      'client_secret',
      'password'
    ]
  },

  // 环境配置
  environments: {
    development: {
      instanceUrl: 'https://test.salesforce.com',
      apiVersion: 'v58.0',
      debug: true
    },
    staging: {
      instanceUrl: 'https://test.salesforce.com',
      apiVersion: 'v58.0',
      debug: false
    },
    production: {
      instanceUrl: 'https://login.salesforce.com',
      apiVersion: 'v58.0',
      debug: false
    }
  }
};