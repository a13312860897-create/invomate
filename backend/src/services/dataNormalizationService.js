/**
 * 数据标准化服务
 * 标准化发票数据以确保一致性和合规性
 */
class DataNormalizationService {
  constructor() {
    this.standardFields = {
      // 公司信息字段
      company: {
        name: { required: true, type: 'string' },
        address: { required: true, type: 'string' },
        city: { required: true, type: 'string' },
        postalCode: { required: true, type: 'string' },
        country: { required: true, type: 'string' },
        tvaNumber: { required: false, type: 'string' },
        siret: { required: false, type: 'string' },
        email: { required: false, type: 'string' },
        phone: { required: false, type: 'string' }
      },
      // 客户信息字段
      client: {
        name: { required: true, type: 'string' },
        address: { required: true, type: 'string' },
        city: { required: true, type: 'string' },
        postalCode: { required: true, type: 'string' },
        country: { required: true, type: 'string' },
        tvaNumber: { required: false, type: 'string' },
        email: { required: false, type: 'string' },
        phone: { required: false, type: 'string' }
      },
      // 发票基本信息
      invoice: {
        id: { required: true, type: 'string' },
        date: { required: true, type: 'date' },
        dueDate: { required: true, type: 'date' },
        currency: { required: true, type: 'string', default: 'EUR' },
        status: { required: false, type: 'string', default: 'draft' },
        notes: { required: false, type: 'string' },
        paymentTerms: { required: false, type: 'string' }
      },
      // 项目明细
      items: {
        description: { required: true, type: 'string' },
        quantity: { required: true, type: 'number', default: 1 },
        unitPrice: { required: true, type: 'number' },
        tvaRate: { required: true, type: 'number', default: 20 },
        totalPrice: { required: false, type: 'number' }
      },
      // 总计信息
      totals: {
        subtotal: { required: true, type: 'number' },
        totalTVA: { required: true, type: 'number' },
        total: { required: true, type: 'number' }
      }
    };

    this.countrySpecificRules = {
      FR: {
        requiredFields: ['tvaNumber'],
        legalNotes: [
          'TVA non applicable, art. 293 B du CGI',
          'TVA intracommunautaire due par le preneur'
        ],
        invoiceIdFormat: /^FAC-\d{4}-\d{3}$/,
        dateFormat: 'DD/MM/YYYY'
      },
      DE: {
        requiredFields: ['vatNumber'],
        legalNotes: ['Umsatzsteuer-Identifikationsnummer'],
        invoiceIdFormat: /^RE-\d{4}-\d{3}$/,
        dateFormat: 'DD.MM.YYYY'
      },
      default: {
        requiredFields: [],
        legalNotes: [],
        invoiceIdFormat: /^INV-\d{4}-\d{3}$/,
        dateFormat: 'YYYY-MM-DD'
      }
    };
  }

  /**
   * 标准化发票数据
   * @param {Object} rawData - 原始发票数据
   * @param {Object} userData - 用户/公司数据
   * @param {Object} clientData - 客户数据
   * @returns {Object} 标准化后的数据
   */
  async normalizeInvoiceData(rawData, userData = {}, clientData = {}) {
    try {
      // 合并数据
      const mergedData = this.mergeData(rawData, userData, clientData);
      
      // 标准化公司信息
      const company = this.normalizeCompanyData(mergedData.company || userData);
      
      // 标准化客户信息
      const client = this.normalizeClientData(mergedData.client || clientData);
      
      // 标准化发票基本信息
      const invoice = this.normalizeInvoiceData(mergedData);
      
      // 标准化项目明细
      const items = this.normalizeItems(mergedData.items || []);
      
      // 计算总计
      const totals = this.calculateTotals(items);
      
      // 添加法律声明
      const legalNotes = this.generateLegalNotes(client.country, totals.totalTVA);
      
      // 验证数据完整性
      const validation = this.validateNormalizedData({
        company, client, invoice, items, totals
      });

      return {
        success: validation.isValid,
        company,
        client,
        invoice,
        items,
        totals,
        legalNotes,
        validation,
        metadata: {
          normalizedAt: new Date().toISOString(),
          country: client.country,
          currency: invoice.currency,
          language: this.getLanguage(client.country)
        }
      };
    } catch (error) {
      console.error('数据标准化失败:', error);
      return {
        success: false,
        error: error.message,
        details: '数据标准化过程中发生错误'
      };
    }
  }

  /**
   * 合并多个数据源
   */
  mergeData(rawData, userData, clientData) {
    return {
      ...rawData,
      company: { ...userData, ...rawData.company },
      client: { ...clientData, ...rawData.client },
      items: rawData.items || [],
      invoice: rawData.invoice || rawData
    };
  }

  /**
   * 标准化公司数据
   */
  normalizeCompanyData(companyData) {
    const normalized = {};
    const fields = this.standardFields.company;

    for (const [field, config] of Object.entries(fields)) {
      let value = companyData[field] || companyData[this.camelToSnake(field)] || config.default;
      
      if (config.required && !value) {
        throw new Error(`公司信息缺少必需字段: ${field}`);
      }

      if (value && config.type === 'string') {
        value = value.toString().trim();
      }

      normalized[field] = value;
    }

    // 特殊处理：根据国家格式化地址
    if (normalized.country) {
      normalized.formattedAddress = this.formatAddress(normalized);
    }

    return normalized;
  }

  /**
   * 标准化客户数据
   */
  normalizeClientData(clientData) {
    const normalized = {};
    const fields = this.standardFields.client;

    for (const [field, config] of Object.entries(fields)) {
      let value = clientData[field] || clientData[this.camelToSnake(field)] || config.default;
      
      if (config.required && !value) {
        throw new Error(`客户信息缺少必需字段: ${field}`);
      }

      if (value && config.type === 'string') {
        value = value.toString().trim();
      }

      normalized[field] = value;
    }

    // 特殊处理：TVA号码验证
    if (normalized.tvaNumber) {
      normalized.tvaValid = this.validateTVANumber(normalized.tvaNumber, normalized.country);
    }

    // 确定客户类型（法国、欧盟、其他）
    normalized.clientType = this.determineClientType(normalized.country);

    return normalized;
  }

  /**
   * 标准化发票基本信息
   */
  normalizeInvoiceData(invoiceData) {
    const normalized = {};
    const fields = this.standardFields.invoice;

    for (const [field, config] of Object.entries(fields)) {
      let value = invoiceData[field] || invoiceData[this.camelToSnake(field)] || config.default;
      
      if (config.required && !value) {
        if (field === 'id') {
          value = this.generateInvoiceId();
        } else if (field === 'date') {
          value = new Date().toISOString().split('T')[0];
        } else if (field === 'dueDate') {
          value = this.calculateDueDate(normalized.date || new Date());
        } else {
          throw new Error(`发票信息缺少必需字段: ${field}`);
        }
      }

      if (field === 'date' || field === 'dueDate') {
        value = this.normalizeDate(value);
      }

      normalized[field] = value;
    }

    return normalized;
  }

  /**
   * 标准化项目明细
   */
  normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('发票必须包含至少一个项目');
    }

    return items.map((item, index) => {
      const normalized = {};
      const fields = this.standardFields.items;

      for (const [field, config] of Object.entries(fields)) {
        let value = item[field] || item[this.camelToSnake(field)] || config.default;
        
        if (config.required && (value === undefined || value === null)) {
          throw new Error(`项目 ${index + 1} 缺少必需字段: ${field}`);
        }

        if (config.type === 'number' && value !== undefined) {
          value = parseFloat(value) || 0;
        }

        normalized[field] = value;
      }

      // 计算项目总价
      if (normalized.quantity && normalized.unitPrice) {
        normalized.totalPrice = normalized.quantity * normalized.unitPrice;
      }

      return normalized;
    });
  }

  /**
   * 计算总计
   */
  calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalTVA = items.reduce((sum, item) => {
      const itemTVA = (item.totalPrice || 0) * (item.tvaRate || 0) / 100;
      return sum + itemTVA;
    }, 0);
    const total = subtotal + totalTVA;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * 生成法律声明
   */
  generateLegalNotes(country, totalTVA) {
    const rules = this.countrySpecificRules[country] || this.countrySpecificRules.default;
    const notes = [];

    if (totalTVA === 0) {
      notes.push(...rules.legalNotes);
    }

    // 添加通用声明
    notes.push('TVA non applicable, art. 293 B du CGI');

    return notes;
  }

  /**
   * 验证标准化数据
   */
  validateNormalizedData(data) {
    const errors = [];

    // 验证公司信息
    if (!data.company.name) errors.push('公司名称不能为空');
    if (!data.company.address) errors.push('公司地址不能为空');

    // 验证客户信息
    if (!data.client.name) errors.push('客户名称不能为空');
    if (!data.client.country) errors.push('客户国家不能为空');

    // 验证发票信息
    if (!data.invoice.id) errors.push('发票编号不能为空');
    if (!data.invoice.date) errors.push('发票日期不能为空');

    // 验证项目
    if (!data.items || data.items.length === 0) {
      errors.push('发票必须包含至少一个项目');
    }

    // 验证总计
    if (data.totals.subtotal < 0) errors.push('小计不能为负数');
    if (data.totals.total < 0) errors.push('总计不能为负数');

    return {
      isValid: errors.length === 0,
      errors,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * 验证标准化数据
   */
  validateStandardizedData(data) {
    return this.validateNormalizedData(data);
  }

  // 辅助方法
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  formatAddress(data) {
    const { address, city, postalCode, country } = data;
    return `${address}, ${postalCode} ${city}, ${country}`;
  }

  validateTVANumber(tvaNumber, country) {
    const patterns = {
      FR: /^FR\d{11}$/,
      DE: /^DE\d{9}$/,
      IT: /^IT\d{11}$/
    };

    const pattern = patterns[country] || /^[A-Z]{2}\d{9,12}$/;
    return pattern.test(tvaNumber);
  }

  determineClientType(country) {
    if (country === 'FR') return 'france';
    if (['DE', 'IT', 'ES', 'NL', 'BE'].includes(country)) return 'eu';
    return 'international';
  }

  normalizeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  calculateDueDate(invoiceDate) {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + 30); // 默认30天付款期限
    return date.toISOString().split('T')[0];
  }

  generateInvoiceId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FAC-${year}-${random}`;
  }

  getLanguage(country) {
    const languages = {
      FR: 'fr',
      DE: 'de',
      IT: 'it',
      ES: 'es',
      NL: 'nl'
    };
    return languages[country] || 'en';
  }
}

module.exports = { DataNormalizationService };