/**
 * 数据映射器类
 * 负责在本地数据格式和第三方平台数据格式之间进行转换
 */
class DataMapper {
  constructor(platform) {
    this.platform = platform;
    this.mappingRules = this.initializeMappingRules();
  }

  /**
   * 初始化映射规则
   * @returns {Object} 映射规则对象
   */
  initializeMappingRules() {
    return {
      // 客户数据映射规则
      client: {
        inbound: {}, // 从外部平台到本地
        outbound: {} // 从本地到外部平台
      },
      // 发票数据映射规则
      invoice: {
        inbound: {},
        outbound: {}
      },
      // 项目数据映射规则
      project: {
        inbound: {},
        outbound: {}
      },
      // 任务数据映射规则
      task: {
        inbound: {},
        outbound: {}
      }
    };
  }

  /**
   * 映射客户数据
   * @param {Object} data - 原始数据
   * @param {string} direction - 映射方向 ('inbound' | 'outbound')
   * @returns {Object} 映射后的数据
   */
  mapClient(data, direction = 'inbound') {
    if (direction === 'inbound') {
      return this.mapClientInbound(data);
    } else {
      return this.mapClientOutbound(data);
    }
  }

  /**
   * 映射发票数据
   * @param {Object} data - 原始数据
   * @param {string} direction - 映射方向
   * @returns {Object} 映射后的数据
   */
  mapInvoice(data, direction = 'inbound') {
    if (direction === 'inbound') {
      return this.mapInvoiceInbound(data);
    } else {
      return this.mapInvoiceOutbound(data);
    }
  }

  /**
   * 映射项目数据
   * @param {Object} data - 原始数据
   * @param {string} direction - 映射方向
   * @returns {Object} 映射后的数据
   */
  mapProject(data, direction = 'inbound') {
    if (direction === 'inbound') {
      return this.mapProjectInbound(data);
    } else {
      return this.mapProjectOutbound(data);
    }
  }

  /**
   * 映射任务数据
   * @param {Object} data - 原始数据
   * @param {string} direction - 映射方向
   * @returns {Object} 映射后的数据
   */
  mapTask(data, direction = 'inbound') {
    if (direction === 'inbound') {
      return this.mapTaskInbound(data);
    } else {
      return this.mapTaskOutbound(data);
    }
  }

  /**
   * 通用数据映射方法
   * @param {Object} data - 原始数据
   * @param {string} entityType - 实体类型
   * @param {string} direction - 映射方向
   * @returns {Object} 映射后的数据
   */
  mapData(data, entityType, direction = 'inbound') {
    switch (entityType) {
      case 'client':
        return this.mapClient(data, direction);
      case 'invoice':
        return this.mapInvoice(data, direction);
      case 'project':
        return this.mapProject(data, direction);
      case 'task':
        return this.mapTask(data, direction);
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * 客户数据入站映射（从外部平台到本地）
   * @param {Object} externalData - 外部平台数据
   * @returns {Object} 本地格式数据
   */
  mapClientInbound(externalData) {
    // 基础映射，子类可以重写
    return {
      name: this.extractValue(externalData, ['name', 'companyName', 'displayName', 'title']),
      email: this.extractValue(externalData, ['email', 'emailAddress', 'primaryEmail']),
      phone: this.extractValue(externalData, ['phone', 'phoneNumber', 'primaryPhone', 'mobile']),
      address: this.extractAddress(externalData),
      company: this.extractValue(externalData, ['company', 'companyName', 'organization']),
      website: this.extractValue(externalData, ['website', 'url', 'websiteUrl']),
      notes: this.extractValue(externalData, ['notes', 'description', 'comments']),
      external_id: this.extractValue(externalData, ['id', 'externalId', 'recordId']),
      platform: this.platform,
      created_at: this.parseDate(this.extractValue(externalData, ['createdAt', 'dateCreated', 'created'])),
      updated_at: this.parseDate(this.extractValue(externalData, ['updatedAt', 'dateModified', 'modified']))
    };
  }

  /**
   * 客户数据出站映射（从本地到外部平台）
   * @param {Object} localData - 本地数据
   * @returns {Object} 外部平台格式数据
   */
  mapClientOutbound(localData) {
    // 基础映射，子类可以重写
    return {
      name: localData.name,
      email: localData.email,
      phone: localData.phone,
      company: localData.company,
      website: localData.website,
      notes: localData.notes
    };
  }

  /**
   * 发票数据入站映射
   * @param {Object} externalData - 外部平台数据
   * @returns {Object} 本地格式数据
   */
  mapInvoiceInbound(externalData) {
    return {
      invoice_number: this.extractValue(externalData, ['invoiceNumber', 'number', 'id']),
      client_name: this.extractValue(externalData, ['clientName', 'customerName', 'accountName']),
      amount: this.parseAmount(this.extractValue(externalData, ['amount', 'total', 'totalAmount'])),
      currency: this.extractValue(externalData, ['currency', 'currencyCode']) || 'EUR',
      status: this.mapStatus(this.extractValue(externalData, ['status', 'state'])),
      due_date: this.parseDate(this.extractValue(externalData, ['dueDate', 'paymentDue', 'dueDatetime'])),
      issue_date: this.parseDate(this.extractValue(externalData, ['issueDate', 'invoiceDate', 'dateIssued'])),
      description: this.extractValue(externalData, ['description', 'memo', 'notes']),
      external_id: this.extractValue(externalData, ['id', 'externalId', 'recordId']),
      platform: this.platform
    };
  }

  /**
   * 发票数据出站映射
   * @param {Object} localData - 本地数据
   * @returns {Object} 外部平台格式数据
   */
  mapInvoiceOutbound(localData) {
    return {
      invoiceNumber: localData.invoice_number,
      clientName: localData.client_name,
      amount: localData.amount,
      currency: localData.currency,
      status: localData.status,
      dueDate: this.formatDate(localData.due_date),
      issueDate: this.formatDate(localData.issue_date),
      description: localData.description
    };
  }

  /**
   * 项目数据入站映射
   * @param {Object} externalData - 外部平台数据
   * @returns {Object} 本地格式数据
   */
  mapProjectInbound(externalData) {
    return {
      name: this.extractValue(externalData, ['name', 'title', 'projectName']),
      description: this.extractValue(externalData, ['description', 'notes', 'summary']),
      status: this.mapProjectStatus(this.extractValue(externalData, ['status', 'state'])),
      start_date: this.parseDate(this.extractValue(externalData, ['startDate', 'createdAt', 'dateStarted'])),
      end_date: this.parseDate(this.extractValue(externalData, ['endDate', 'dueDate', 'completedAt'])),
      client_id: this.extractValue(externalData, ['clientId', 'customerId', 'accountId']),
      external_id: this.extractValue(externalData, ['id', 'externalId', 'recordId']),
      platform: this.platform
    };
  }

  /**
   * 项目数据出站映射
   * @param {Object} localData - 本地数据
   * @returns {Object} 外部平台格式数据
   */
  mapProjectOutbound(localData) {
    return {
      name: localData.name,
      description: localData.description,
      status: localData.status,
      startDate: this.formatDate(localData.start_date),
      endDate: this.formatDate(localData.end_date)
    };
  }

  /**
   * 任务数据入站映射
   * @param {Object} externalData - 外部平台数据
   * @returns {Object} 本地格式数据
   */
  mapTaskInbound(externalData) {
    return {
      title: this.extractValue(externalData, ['title', 'name', 'summary']),
      description: this.extractValue(externalData, ['description', 'notes', 'content']),
      status: this.mapTaskStatus(this.extractValue(externalData, ['status', 'state'])),
      priority: this.mapPriority(this.extractValue(externalData, ['priority', 'importance'])),
      due_date: this.parseDate(this.extractValue(externalData, ['dueDate', 'deadline', 'dueOn'])),
      assignee: this.extractValue(externalData, ['assignee', 'assignedTo', 'owner']),
      project_id: this.extractValue(externalData, ['projectId', 'boardId', 'listId']),
      external_id: this.extractValue(externalData, ['id', 'externalId', 'recordId']),
      platform: this.platform
    };
  }

  /**
   * 任务数据出站映射
   * @param {Object} localData - 本地数据
   * @returns {Object} 外部平台格式数据
   */
  mapTaskOutbound(localData) {
    return {
      title: localData.title,
      description: localData.description,
      status: localData.status,
      priority: localData.priority,
      dueDate: this.formatDate(localData.due_date),
      assignee: localData.assignee
    };
  }

  /**
   * 从对象中提取值（支持多个可能的字段名）
   * @param {Object} obj - 源对象
   * @param {Array} fields - 可能的字段名数组
   * @returns {any} 提取的值
   */
  extractValue(obj, fields) {
    if (!obj || !fields) return null;
    
    for (const field of fields) {
      if (obj.hasOwnProperty(field) && obj[field] !== null && obj[field] !== undefined) {
        return obj[field];
      }
      
      // 支持嵌套字段（如 properties.email）
      if (field.includes('.')) {
        const value = this.getNestedValue(obj, field);
        if (value !== null && value !== undefined) {
          return value;
        }
      }
    }
    
    return null;
  }

  /**
   * 获取嵌套对象的值
   * @param {Object} obj - 源对象
   * @param {string} path - 路径（如 'properties.email'）
   * @returns {any} 值
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * 提取地址信息
   * @param {Object} data - 数据对象
   * @returns {string} 格式化的地址
   */
  extractAddress(data) {
    const addressFields = [
      this.extractValue(data, ['address', 'street', 'address1']),
      this.extractValue(data, ['address2', 'addressLine2']),
      this.extractValue(data, ['city', 'locality']),
      this.extractValue(data, ['state', 'region', 'province']),
      this.extractValue(data, ['postalCode', 'zipCode', 'zip']),
      this.extractValue(data, ['country', 'countryCode'])
    ];
    
    return addressFields.filter(field => field).join(', ');
  }

  /**
   * 解析日期
   * @param {string|Date} dateValue - 日期值
   * @returns {Date|null} 解析后的日期
   */
  parseDate(dateValue) {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @returns {string} 格式化的日期字符串
   */
  formatDate(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  }

  /**
   * 解析金额
   * @param {string|number} amount - 金额值
   * @returns {number} 解析后的金额
   */
  parseAmount(amount) {
    if (!amount) return 0;
    
    if (typeof amount === 'number') {
      return amount;
    }
    
    // 移除货币符号和逗号
    const cleaned = amount.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 映射状态
   * @param {string} status - 外部状态
   * @returns {string} 本地状态
   */
  mapStatus(status) {
    if (!status) return 'draft';
    
    const statusMap = {
      'draft': 'draft',
      'pending': 'pending',
      'sent': 'sent',
      'paid': 'paid',
      'overdue': 'overdue',
      'cancelled': 'cancelled',
      'void': 'cancelled'
    };
    
    return statusMap[status.toLowerCase()] || 'draft';
  }

  /**
   * 映射项目状态
   * @param {string} status - 外部项目状态
   * @returns {string} 本地项目状态
   */
  mapProjectStatus(status) {
    if (!status) return 'active';
    
    const statusMap = {
      'active': 'active',
      'completed': 'completed',
      'on_hold': 'on_hold',
      'cancelled': 'cancelled',
      'archived': 'archived'
    };
    
    return statusMap[status.toLowerCase()] || 'active';
  }

  /**
   * 映射任务状态
   * @param {string} status - 外部任务状态
   * @returns {string} 本地任务状态
   */
  mapTaskStatus(status) {
    if (!status) return 'todo';
    
    const statusMap = {
      'todo': 'todo',
      'in_progress': 'in_progress',
      'done': 'done',
      'cancelled': 'cancelled'
    };
    
    return statusMap[status.toLowerCase()] || 'todo';
  }

  /**
   * 映射优先级
   * @param {string} priority - 外部优先级
   * @returns {string} 本地优先级
   */
  mapPriority(priority) {
    if (!priority) return 'medium';
    
    const priorityMap = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'high'
    };
    
    return priorityMap[priority.toLowerCase()] || 'medium';
  }

  /**
   * 批量映射数据
   * @param {Array} dataArray - 数据数组
   * @param {string} entityType - 实体类型
   * @param {string} direction - 映射方向
   * @returns {Array} 映射后的数据数组
   */
  mapBatch(dataArray, entityType, direction = 'inbound') {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array for batch mapping');
    }
    
    return dataArray.map(item => {
      try {
        return this.mapData(item, entityType, direction);
      } catch (error) {
        console.error(`[DataMapper] Failed to map ${entityType}:`, error);
        return null;
      }
    }).filter(item => item !== null);
  }

  /**
   * 验证映射后的数据
   * @param {Object} data - 映射后的数据
   * @param {string} entityType - 实体类型
   * @returns {Object} 验证结果
   */
  validateMappedData(data, entityType) {
    const errors = [];
    
    switch (entityType) {
      case 'client':
        if (!data.name && !data.email) {
          errors.push('Client must have either name or email');
        }
        break;
      case 'invoice':
        if (!data.invoice_number) {
          errors.push('Invoice must have invoice_number');
        }
        if (!data.amount || data.amount <= 0) {
          errors.push('Invoice must have valid amount');
        }
        break;
      case 'project':
        if (!data.name) {
          errors.push('Project must have name');
        }
        break;
      case 'task':
        if (!data.title) {
          errors.push('Task must have title');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DataMapper;