/**
 * 模板数据服务
 * 提供数据标准化和验证功能
 */
class TemplateDataService {
  constructor() {
    this.standardFields = {
      company: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: true },
        postalCode: { type: 'string', required: true },
        city: { type: 'string', required: true },
        country: { type: 'string', required: true },
        tvaNumber: { type: 'string', required: false },
        siret: { type: 'string', required: false },
        email: { type: 'string', required: false },
        phone: { type: 'string', required: false }
      },
      client: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: true },
        postalCode: { type: 'string', required: true },
        city: { type: 'string', required: true },
        country: { type: 'string', required: true },
        tvaNumber: { type: 'string', required: false },
        type: { type: 'string', required: false }, // 'individual', 'company', 'government'
        hasTVA: { type: 'boolean', required: false }
      },
      invoice: {
        id: { type: 'string', required: true },
        date: { type: 'date', required: true },
        dueDate: { type: 'date', required: true },
        currency: { type: 'string', required: true, default: 'EUR' },
        status: { type: 'string', required: false, default: 'pending' },
        notes: { type: 'string', required: false }
      },
      items: {
        description: { type: 'string', required: true },
        quantity: { type: 'number', required: true },
        unitPrice: { type: 'number', required: true },
        tvaRate: { type: 'number', required: true },
        totalPrice: { type: 'number', required: false }
      },
      totals: {
        subtotal: { type: 'number', required: true },
        totalTVA: { type: 'number', required: true },
        total: { type: 'number', required: true },
        discount: { type: 'number', required: false, default: 0 }
      }
    };

    this.countrySpecificRules = {
      FR: {
        requiredFields: ['tvaNumber', 'siret'],
        legalNotes: [
          'TVA intracommunautaire due par le preneur',
          'TVA non applicable, art. 293 B du CGI',
          'Conformément à la réglementation française en vigueur'
        ],
        invoiceIdFormat: /^FAC-\d{4}-\d{3}$/,
        dateFormat: 'DD/MM/YYYY'
      },
      DE: {
        requiredFields: ['vatNumber'],
        legalNotes: [
          'Steuerfreie innergemeinschaftliche Lieferung',
          'Umkehrung der Steuerschuldnerschaft'
        ],
        invoiceIdFormat: /^RE-\d{4}-\d{3}$/,
        dateFormat: 'DD.MM.YYYY'
      }
    };
  }

  /**
   * 标准化发票数据
   */
  standardizeInvoiceData(invoiceData, userData, clientData) {
    try {
      // 标准化公司数据
      const company = this.standardizeCompanyData(userData);
      
      // 标准化客户数据
      const client = this.standardizeClientData(clientData);
      
      // 标准化发票数据
      const invoice = this.standardizeInvoiceDataOnly(invoiceData);
      
      // 标准化项目数据
      const items = this.standardizeItems(invoiceData.items || []);
      
      // 计算总计
      const totals = this.calculateTotals(items, invoiceData.discount || 0);
      
      // 生成法律声明
      const legalNotes = this.generateLegalNotes(client.country, invoice, totals);
      
      return {
        company,
        client,
        invoice,
        items,
        totals,
        legalNotes,
        metadata: {
          standardized: true,
          timestamp: new Date().toISOString(),
          country: client.country
        }
      };
    } catch (error) {
      console.error('数据标准化失败:', error);
      throw new Error(`数据标准化失败: ${error.message}`);
    }
  }

  /**
   * 标准化公司数据
   */
  standardizeCompanyData(companyData) {
    const company = {};
    const fields = this.standardFields.company;
    
    for (const [field, config] of Object.entries(fields)) {
      let value = companyData[field];
      
      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`公司数据缺少必需字段: ${field}`);
      }
      
      if (value !== undefined && value !== null) {
        value = this.validateAndTransform(value, config.type);
        company[field] = value;
      } else if (config.default !== undefined) {
        company[field] = config.default;
      }
    }
    
    return company;
  }

  /**
   * 标准化客户数据
   */
  standardizeClientData(clientData) {
    const client = {};
    const fields = this.standardFields.client;
    
    for (const [field, config] of Object.entries(fields)) {
      let value = clientData[field];
      
      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`客户数据缺少必需字段: ${field}`);
      }
      
      if (value !== undefined && value !== null) {
        value = this.validateAndTransform(value, config.type);
        client[field] = value;
      } else if (config.default !== undefined) {
        client[field] = config.default;
      }
    }
    
    // 确定客户类型
    if (!client.type) {
      client.type = this.determineClientType(client);
    }
    
    return client;
  }

  /**
   * 标准化发票数据（仅发票部分）
   */
  standardizeInvoiceDataOnly(invoiceData) {
    const invoice = {};
    const fields = this.standardFields.invoice;
    
    for (const [field, config] of Object.entries(fields)) {
      let value = invoiceData[field];
      
      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`发票数据缺少必需字段: ${field}`);
      }
      
      if (value !== undefined && value !== null) {
        value = this.validateAndTransform(value, config.type);
        invoice[field] = value;
      } else if (config.default !== undefined) {
        invoice[field] = config.default;
      }
    }
    
    return invoice;
  }

  /**
   * 标准化项目数据
   */
  standardizeItems(itemsData) {
    if (!Array.isArray(itemsData)) {
      throw new Error('项目数据必须是数组');
    }
    
    if (itemsData.length === 0) {
      throw new Error('项目数据不能为空');
    }
    
    return itemsData.map((item, index) => {
      const standardizedItem = {};
      const fields = this.standardFields.items;
      
      for (const [field, config] of Object.entries(fields)) {
        let value = item[field];
        
        if (config.required && (value === undefined || value === null || value === '')) {
          throw new Error(`项目 ${index + 1} 缺少必需字段: ${field}`);
        }
        
        if (value !== undefined && value !== null) {
          value = this.validateAndTransform(value, config.type);
          standardizedItem[field] = value;
        } else if (config.default !== undefined) {
          standardizedItem[field] = config.default;
        }
      }
      
      // 计算项目总价
      if (standardizedItem.quantity && standardizedItem.unitPrice) {
        standardizedItem.totalPrice = standardizedItem.quantity * standardizedItem.unitPrice;
      }
      
      return standardizedItem;
    });
  }

  /**
   * 计算总计
   */
  calculateTotals(items, discount = 0) {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalTVA = items.reduce((sum, item) => {
      const itemTVA = (item.totalPrice || 0) * (item.tvaRate || 0) / 100;
      return sum + itemTVA;
    }, 0);
    
    let total = subtotal + totalTVA - discount;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  /**
   * 生成法律声明
   */
  generateLegalNotes(country, invoice, totals) {
    const notes = [];
    const rules = this.countrySpecificRules[country];
    
    if (rules && rules.legalNotes) {
      notes.push(...rules.legalNotes);
    }
    
    // 根据发票特征添加特定声明
    if (totals.totalTVA === 0) {
      if (country === 'FR') {
        notes.push('TVA non applicable, art. 293 B du CGI (régime de la franchise en base)');
      } else if (country === 'DE') {
        notes.push('Steuerfreie innergemeinschaftliche Lieferung');
      }
    }
    
    return notes;
  }

  /**
   * 验证标准化数据
   */
  validateStandardizedData(standardizedData) {
    const errors = [];
    
    try {
      // 验证公司数据
      this.validateCompanyData(standardizedData.company);
      
      // 验证客户数据
      this.validateClientData(standardizedData.client);
      
      // 验证发票数据
      this.validateInvoiceData(standardizedData.invoice);
      
      // 验证项目数据
      this.validateItems(standardizedData.items);
      
      // 验证总计
      this.validateTotals(standardizedData.totals);
      
      // 验证法律声明
      this.validateLegalNotes(standardizedData.legalNotes, standardizedData.client.country);
      
    } catch (error) {
      errors.push(error.message);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取示例数据
   */
  getSampleData() {
    return {
      company: {
        name: '示例公司',
        address: '123 Rue de la Paix',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
        tvaNumber: 'FR12345678901',
        siret: '12345678901234',
        email: 'contact@example.com',
        phone: '+33 1 23 45 67 89'
      },
      client: {
        name: '客户公司',
        address: '456 Avenue des Champs-Élysées',
        postalCode: '75008',
        city: 'Paris',
        country: 'FR',
        tvaNumber: 'FR98765432109',
        type: 'company'
      },
      invoice: {
        id: 'FAC-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        currency: 'EUR',
        status: 'pending',
        notes: '示例发票'
      },
      items: [
        {
          description: '咨询服务',
          quantity: 10,
          unitPrice: 150.00,
          tvaRate: 20
        },
        {
          description: '技术支持',
          quantity: 5,
          unitPrice: 100.00,
          tvaRate: 20
        }
      ],
      totals: {
        subtotal: 2000.00,
        totalTVA: 400.00,
        discount: 0,
        total: 2400.00
      },
      legalNotes: [
        'Conformément à la réglementation française en vigueur'
      ]
    };
  }

  /**
   * 验证和转换数据
   */
  validateAndTransform(value, type) {
    switch (type) {
      case 'string':
        return value.toString().trim();
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`值 "${value}" 不是有效的数字`);
        }
        return num;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error(`值 "${value}" 不是有效的日期`);
        }
        return date.toISOString().split('T')[0];
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * 确定客户类型
   */
  determineClientType(client) {
    if (client.tvaNumber) {
      return 'company';
    }
    if (client.country && client.country !== 'FR') {
      return 'foreign';
    }
    return 'individual';
  }

  /**
   * 验证公司数据
   */
  validateCompanyData(company) {
    if (!company || typeof company !== 'object') {
      throw new Error('公司数据必须是对象');
    }
    
    const requiredFields = ['name', 'address', 'postalCode', 'city', 'country'];
    for (const field of requiredFields) {
      if (!company[field]) {
        throw new Error(`公司数据缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 验证客户数据
   */
  validateClientData(client) {
    if (!client || typeof client !== 'object') {
      throw new Error('客户数据必须是对象');
    }
    
    const requiredFields = ['name', 'address', 'postalCode', 'city', 'country'];
    for (const field of requiredFields) {
      if (!client[field]) {
        throw new Error(`客户数据缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 验证发票数据
   */
  validateInvoiceData(invoice) {
    if (!invoice || typeof invoice !== 'object') {
      throw new Error('发票数据必须是对象');
    }
    
    const requiredFields = ['id', 'date', 'dueDate'];
    for (const field of requiredFields) {
      if (!invoice[field]) {
        throw new Error(`发票数据缺少必需字段: ${field}`);
      }
    }
  }

  /**
   * 验证项目数据
   */
  validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('项目数据必须是非空数组');
    }
    
    items.forEach((item, index) => {
      const requiredFields = ['description', 'quantity', 'unitPrice', 'tvaRate'];
      for (const field of requiredFields) {
        if (item[field] === undefined || item[field] === null) {
          throw new Error(`项目 ${index + 1} 缺少必需字段: ${field}`);
        }
      }
    });
  }

  /**
   * 验证总计
   */
  validateTotals(totals) {
    if (!totals || typeof totals !== 'object') {
      throw new Error('总计数据必须是对象');
    }
    
    const requiredFields = ['subtotal', 'totalTVA', 'total'];
    for (const field of requiredFields) {
      if (typeof totals[field] !== 'number') {
        throw new Error(`总计数据缺少必需字段或类型错误: ${field}`);
      }
    }
  }

  /**
   * 验证法律声明
   */
  validateLegalNotes(legalNotes, country) {
    if (!Array.isArray(legalNotes)) {
      throw new Error('法律声明必须是数组');
    }
    
    const rules = this.countrySpecificRules[country];
    if (rules && rules.requiredNotes) {
      const missingNotes = rules.requiredNotes.filter(note => 
        !legalNotes.some(legalNote => legalNote.includes(note))
      );
      
      if (missingNotes.length > 0) {
        throw new Error(`缺少必需的法律声明: ${missingNotes.join(', ')}`);
      }
    }
  }
}

module.exports = TemplateDataService;