const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 根据数据库类型决定如何定义模型
const dbType = process.env.DB_TYPE || 'memory';

let sequelize;
if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  sequelize = db.sequelize;
}

// 定义模型变量
let User, Client, Invoice, InvoiceItem, ReminderLog, Payment, PaymentRecord, TaxSetting, InvoiceTemplate, TemplateField, Integration, DataMapping, SyncLog, EmailConfig, EmailTemplate;

// 如果不是内存数据库，则使用Sequelize定义模型
if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  
  // 导入集成相关模型
  const Integration = require('./Integration');
  const DataMapping = require('./DataMapping');
  const SyncLog = require('./SyncLog');

  // 定义User模型
  User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fax: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en'
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    paymentReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    overdueNotices: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    newFeaturesAnnouncements: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'US'
    },
    
    // 法国特化字段
    vatNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    siren: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [9, 9]
      }
    },
    siretNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [14, 14]
      }
    },
    legalForm: {
      type: DataTypes.STRING,
      allowNull: true
    },
    registeredCapital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    rcsNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nafCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // 银行信息字段
    bankIBAN: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankBIC: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountHolder: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // 保险信息字段
    insuranceCompany: {
      type: DataTypes.STRING,
      allowNull: true
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    insuranceCoverage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    peppolId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    invoiceMode: {
      type: DataTypes.ENUM('france', 'international'),
      defaultValue: 'international'
    },
    
    // GDPR和隐私设置
    dataProcessingConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    marketingConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    analyticsConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dataRetentionPeriod: {
      type: DataTypes.ENUM('1year', '3years', '7years', 'indefinite'),
      defaultValue: '7years'
    },
    dataExportFormat: {
      type: DataTypes.ENUM('json', 'csv', 'pdf'),
      defaultValue: 'json'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletionRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isAnonymized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC',
      allowNull: false
    },
    
    // 订阅相关字段
    subscription: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'free'
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'inactive'
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paddleCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paddleSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paddleTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  // 定义Client模型
  Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'US'
    },
    
    // 法国特化字段
    vatNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    siren: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [9, 9]
      }
    },
    siret: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [14, 14]
      }
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'FR'
    },
    
    // 交付地址字段 - 用于区分账单地址和交付地址
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryPostalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryCountry: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'FR'
    },
    
    // 是否与账单地址相同的标志
    sameAsAddress: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // 外键显式引用小写表名 'users'，避免大小写问题
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'clients',
    timestamps: true
  });

  // 定义Invoice模型
  Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    invoiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'draft'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    invoiceMode: {
      type: DataTypes.ENUM('fr', 'intl'),
      defaultValue: 'intl'
    },
    
    // 法国发票特定字段
    sellerCompanyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerCompanyAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sellerTaxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerSiren: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [9, 9]
      }
    },
    sellerSiret: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [14, 14]
      }
    },
    sellerLegalForm: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerRegisteredCapital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    sellerRcsNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sellerNafCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tvaExempt: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tvaExemptClause: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    autoLiquidation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    vicesCachés: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    // 邮件发送相关字段
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailMessageId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // DGFiP e-reporting相关字段
    dgfipSubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    dgfipSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dgfipSubmissionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dgfipStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dgfipValidationCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dgfipValidationResult: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dgfipProcessingTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // Peppol网络相关字段
    peppolSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    peppolSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    peppolMessageId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    peppolStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // PDF相关字段
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // 发票项目JSON存储
    items: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 总税额字段
    totalTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    
    // 支付相关字段
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // 交付地址字段 - 发票级别的交付地址覆盖
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryCity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryPostalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryCountry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    
    // 移除了orderReference和contractReference字段以简化界面
    
    // 付款条款字段
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '付款条款'
    },
    paymentDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
      comment: '付款期限天数'
    },
    
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // 外键显式引用小写表名 'users'，避免大小写问题
      references: {
        model: 'users',
        key: 'id'
      }
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Client,
        key: 'id'
      }
    }
  }, {
    tableName: 'invoices',
    timestamps: true
  });

  // 定义 Subscription 模型（示例），显式设置 tableName 与 users 外键引用
  Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    paddleCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paddleSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    planType: {
      type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
      allowNull: false,
      defaultValue: 'free'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'past_due', 'trial', 'paused'),
      allowNull: false,
      defaultValue: 'inactive'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true
  });

  // 定义InvoiceItem模型
  InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Invoice,
        key: 'id'
      }
    }
  }, {
    tableName: 'invoice_items',
    timestamps: true
  });

  // 定义ReminderLog模型
  ReminderLog = sequelize.define('ReminderLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Invoice,
        key: 'id'
      }
    },
    sentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reminderType: {
      type: DataTypes.ENUM('payment_reminder', 'overdue_notice'),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'reminder_logs',
    timestamps: true
  });

  // 定义TaxSetting模型
  TaxSetting = sequelize.define('TaxSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceMode: {
      type: DataTypes.ENUM('fr', 'intl'),
      defaultValue: 'fr',
      allowNull: false
    },
    taxSystem: {
      type: DataTypes.ENUM('standard', 'micro', 'real', 'simples', 'lucroPresumido', 'lucroReal'),
      defaultValue: 'standard',
      allowNull: false
    },
    taxRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    autoGenerateReports: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    taxCompliance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    invoicePrefix: {
      type: DataTypes.STRING,
      defaultValue: 'INV-',
      allowNull: false
    },
    defaultTaxRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    issRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    siren: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 国际特定字段已被删除
    companyAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'invoice_mode',
    timestamps: true
  });



  // 定义InvoiceTemplate模型
  InvoiceTemplate = sequelize.define('InvoiceTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '模板名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '模板描述'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为默认模板'
    },
    templateConfig: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '模板配置JSON字符串'
    },
    fieldMappings: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '字段映射配置JSON字符串'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否激活'
    }
  }, {
    tableName: 'invoice_templates',
    timestamps: true
  });

  // 定义TemplateField模型
  TemplateField = sequelize.define('TemplateField', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字段名称'
    },
    fieldLabel: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '字段标签'
    },
    fieldType: {
      type: DataTypes.ENUM('text', 'number', 'date', 'select', 'checkbox', 'textarea', 'email', 'tel'),
      allowNull: false,
      defaultValue: 'text',
      comment: '字段类型'
    },
    defaultValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '默认值'
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '选项配置JSON'
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否必填'
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '字段排序位置'
    },
    targetEntity: {
      type: DataTypes.ENUM('invoice', 'client', 'item'),
      allowNull: false,
      defaultValue: 'invoice',
      comment: '目标实体类型'
    },
    validation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '验证规则JSON'
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoice_templates',
        key: 'id'
      }
    }
  }, {
    tableName: 'template_fields',
    timestamps: true
  });

  // 定义Payment模型
  Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'canceled', 'refunded'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeChargeId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  // 定义PaymentRecord模型
  PaymentRecord = sequelize.define('PaymentRecord', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'payments',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'canceled', 'refunded'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD'
    },
    eventType: {
      type: DataTypes.ENUM('payment_intent.created', 'payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled', 'charge.refunded'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    stripeEventId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'payment_records',
    timestamps: true
  });

  // 定义AuditLog模型
  AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '执行的操作类型'
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作详情JSON'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '客户端IP地址'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理字符串'
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '会话ID'
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '操作是否成功'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // 定义EmailConfig模型
  EmailConfig = sequelize.define('EmailConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // 每个用户只能有一个邮件配置
      references: {
        model: 'users',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      comment: '发送邮件的邮箱地址'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '邮箱密码或应用专用密码'
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '邮箱服务商类型'
    },
    providerName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '邮箱服务商名称'
    },
    smtpHost: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'SMTP服务器地址'
    },
    smtpPort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 587,
      comment: 'SMTP端口'
    },
    smtpSecure: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否使用SSL/TLS'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '配置是否激活'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '配置是否已验证'
    },
    lastTestAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后测试时间'
    },
    testResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '最后测试结果'
    }
  }, {
    tableName: 'email_configs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['email']
      },
      {
        fields: ['provider']
      }
    ]
  });

  // 定义EmailTemplate模型
  EmailTemplate = sequelize.define('EmailTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '模板名称'
    },
    type: {
      type: DataTypes.ENUM('invoice', 'reminder', 'payment_confirmation', 'custom'),
      allowNull: false,
      defaultValue: 'invoice',
      comment: '邮件模板类型'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '邮件主题模板'
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'HTML邮件内容模板'
    },
    textContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '纯文本邮件内容模板'
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '模板变量定义'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为默认模板'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '模板描述'
    }
  }, {
    tableName: 'email_templates',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['userId', 'type', 'isDefault']
      }
    ]
  });

  // 定义关联关系
  User.hasMany(Client, { foreignKey: 'userId' });
  Client.belongsTo(User, { foreignKey: 'userId' });

  // 集成相关关联关系
  User.hasMany(Integration, { foreignKey: 'user_id', as: 'integrations' });
  Integration.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Integration.hasMany(DataMapping, { foreignKey: 'integration_id', as: 'dataMappings', onDelete: 'CASCADE' });
  DataMapping.belongsTo(Integration, { foreignKey: 'integration_id', as: 'integration' });

  Integration.hasMany(SyncLog, { foreignKey: 'integration_id', as: 'syncLogs', onDelete: 'CASCADE' });
  SyncLog.belongsTo(Integration, { foreignKey: 'integration_id', as: 'integration' });

  User.hasMany(Invoice, { foreignKey: 'userId' });
  Invoice.belongsTo(User, { foreignKey: 'userId' });

  // User 与 Subscription 关联（示例）
  User.hasMany(Subscription, { foreignKey: 'userId' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });

  Client.hasMany(Invoice, { foreignKey: 'clientId' });
  Invoice.belongsTo(Client, { foreignKey: 'clientId' });

  Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId' });
  InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });

  Invoice.hasMany(ReminderLog, { foreignKey: 'invoiceId' });
  ReminderLog.belongsTo(Invoice, { foreignKey: 'invoiceId' });

  // 添加TaxSetting关联
  User.hasOne(TaxSetting, { foreignKey: 'userId' });
  TaxSetting.belongsTo(User, { foreignKey: 'userId' });


  
  // 添加发票模板关联
  User.hasMany(InvoiceTemplate, { foreignKey: 'userId' });
  InvoiceTemplate.belongsTo(User, { foreignKey: 'userId' });
  
  InvoiceTemplate.hasMany(TemplateField, { foreignKey: 'templateId' });
  TemplateField.belongsTo(InvoiceTemplate, { foreignKey: 'templateId' });

  // 支付相关模型关联
  User.hasMany(Payment, { foreignKey: 'userId' });
  Payment.belongsTo(User, { foreignKey: 'userId' });

  Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });
  Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

  Payment.hasMany(PaymentRecord, { foreignKey: 'paymentId' });
  PaymentRecord.belongsTo(Payment, { foreignKey: 'paymentId' });

  // 审计日志关联
  User.hasMany(AuditLog, { foreignKey: 'userId' });
  AuditLog.belongsTo(User, { foreignKey: 'userId' });

  // 邮件配置关联
  User.hasOne(EmailConfig, { foreignKey: 'userId' });
  EmailConfig.belongsTo(User, { foreignKey: 'userId' });

  // 邮件模板关联
  User.hasMany(EmailTemplate, { foreignKey: 'userId' });
  EmailTemplate.belongsTo(User, { foreignKey: 'userId' });
}

// 同步模型到数据库
const syncDatabase = async () => {
  try {
    if (sequelize.sync) {
      await sequelize.sync({ force: false });
      if (typeof sequelize.getQueryInterface === 'function') {
        const { DataTypes } = require('sequelize');
        const qi = sequelize.getQueryInterface();
        const desc = await qi.describeTable('users');
        if (!desc.subscription) {
          await qi.addColumn('users', 'subscription', { type: DataTypes.STRING, allowNull: false, defaultValue: 'free' });
        }
        if (!desc.emailVerified) {
          await qi.addColumn('users', 'emailVerified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        }
        if (!desc.verificationToken) {
          await qi.addColumn('users', 'verificationToken', { type: DataTypes.STRING, allowNull: true });
        }
        if (!desc.verificationExpires) {
          await qi.addColumn('users', 'verificationExpires', { type: DataTypes.DATE, allowNull: true });
        }
        if (!desc.refreshToken) {
          await qi.addColumn('users', 'refreshToken', { type: DataTypes.STRING, allowNull: true });
        }
        if (!desc.resetPasswordToken) {
          await qi.addColumn('users', 'resetPasswordToken', { type: DataTypes.STRING, allowNull: true });
        }
        if (!desc.resetPasswordExpires) {
          await qi.addColumn('users', 'resetPasswordExpires', { type: DataTypes.DATE, allowNull: true });
        }
      }
      console.log('Database synced successfully');
    } else {
      console.log('Memory database does not need explicit sync');
    }
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

// 根据数据库类型返回适当的模型
if (dbType === 'memory') {
  // 使用内存数据库模型
  const memoryDb = require('../config/memoryDatabase');
  
  // 创建适配器以匹配Sequelize模型的接口
  const UserAdapter = {
    create: (userData) => memoryDb.createUser(userData),
    findOne: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.findUserById(options.where.id));
      } else if (options.where && options.where.email) {
        return Promise.resolve(memoryDb.findUserByEmail(options.where.email));
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findUserById(id)),
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateUser(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteUser(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  
  const ClientAdapter = {
    create: (clientData) => memoryDb.createClient(clientData),
    findOne: (options) => {
      if (options.where && options.where.id) {
        // 确保ID是数字类型
        const clientId = parseInt(options.where.id);
        const client = memoryDb.findClientById(clientId);
        // 如果同时指定了userId，需要验证客户属于该用户
        if (client && options.where.userId && client.userId !== options.where.userId) {
          return Promise.resolve(null);
        }
        // 为客户对象添加实例方法和关联数据
        if (client) {
          client.update = (updates) => {
            return Promise.resolve(memoryDb.updateClient(client.id, updates));
          };
          client.destroy = () => {
            return Promise.resolve(memoryDb.deleteClient(client.id));
          };
          
          // 处理include参数，添加关联的发票数据
          if (options.include) {
            try {
              const invoices = memoryDb.findInvoicesByClientId(client.id);
              client.Invoices = invoices || [];
            } catch (error) {
              console.error('Error loading invoices for client:', error);
              client.Invoices = [];
            }
          }
        }
        return Promise.resolve(client);
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => {
      // 确保ID是数字类型
      const clientId = parseInt(id);
      const client = memoryDb.findClientById(clientId);
      // 为客户对象添加实例方法
      if (client) {
        client.update = (updates) => {
          return Promise.resolve(memoryDb.updateClient(client.id, updates));
        };
        client.destroy = () => {
          return Promise.resolve(memoryDb.deleteClient(client.id));
        };
      }
      return Promise.resolve(client);
    },
    findAll: (options) => {
      if (options.where && options.where.userId) {
        return Promise.resolve(memoryDb.findClientsByUserId(options.where.userId));
      }
      return Promise.resolve(memoryDb.findAllClients());
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        const clientId = parseInt(options.where.id);
        const client = memoryDb.findClientById(clientId);
        // 如果同时指定了userId，需要验证客户属于该用户
        if (client && options.where.userId && client.userId !== options.where.userId) {
          return Promise.resolve([0]);
        }
        return Promise.resolve([memoryDb.updateClient(clientId, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        const clientId = parseInt(options.where.id);
        const client = memoryDb.findClientById(clientId);
        // 如果同时指定了userId，需要验证客户属于该用户
        if (client && options.where.userId && client.userId !== options.where.userId) {
          return Promise.resolve(0);
        }
        return Promise.resolve(memoryDb.deleteClient(clientId) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  
  const InvoiceAdapter = {
    create: (invoiceData) => Promise.resolve(memoryDb.createInvoice(invoiceData)),
    findOne: (options) => {
      if (options.where && options.where.id) {
        let invoice = memoryDb.findInvoiceById(options.where.id);
        
        // 检查userId匹配（如果指定了userId）
        if (invoice && options.where.userId && invoice.userId !== options.where.userId) {
          return Promise.resolve(null);
        }
        
        if (invoice && options.include) {
          invoice = { ...invoice };
          options.include.forEach(includeOption => {
            if (includeOption.model === Client) {
              const client = memoryDb.findClientById(invoice.clientId);
              if (client && includeOption.attributes) {
                const filteredClient = {};
                includeOption.attributes.forEach(attr => {
                  filteredClient[attr] = client[attr];
                });
                invoice.Client = filteredClient;
              } else {
                invoice.Client = client;
              }
            }
            if (includeOption.model === InvoiceItem) {
              invoice.InvoiceItems = memoryDb.findInvoiceItemsByInvoiceId(invoice.id);
            }
          });
        }
        return Promise.resolve(invoice);
      }
      return Promise.resolve(null);
    },
    findByPk: (id, options) => {
      let invoice = memoryDb.findInvoiceById(id);
      if (invoice && options && options.include) {
        invoice = { ...invoice };
        options.include.forEach(includeOption => {
          if (includeOption.model === ClientAdapter) {
            const client = memoryDb.findClientById(invoice.clientId);
            if (client) {
              if (includeOption.attributes && includeOption.attributes.exclude) {
                // 处理 exclude 属性
                const filteredClient = { ...client };
                includeOption.attributes.exclude.forEach(excludeAttr => {
                  delete filteredClient[excludeAttr];
                });
                invoice.Client = filteredClient;
              } else if (includeOption.attributes && Array.isArray(includeOption.attributes)) {
                // 处理 include 属性
                const filteredClient = {};
                includeOption.attributes.forEach(attr => {
                  filteredClient[attr] = client[attr];
                });
                invoice.Client = filteredClient;
              } else {
                // 没有属性过滤，返回完整客户端数据
                invoice.Client = client;
              }
            }
          }
          if (includeOption.model === InvoiceItemAdapter) {
            invoice.InvoiceItems = memoryDb.findInvoiceItemsByInvoiceId(invoice.id);
          }
        });
      }
      return Promise.resolve(invoice);
    },
    findAll: (options) => {
      let invoices = [];
      
      if (options.where && options.where.userId) {
        invoices = memoryDb.findInvoicesByUserId(options.where.userId);
      } else {
        invoices = memoryDb.findAllInvoices();
      }
      
      // Apply additional filters
      if (options.where) {
        if (options.where.status) {
          invoices = invoices.filter(inv => inv.status === options.where.status);
        }
      }
      
      return Promise.resolve(invoices);
    },
    findAndCountAll: (options) => {
      let invoices = [];
      
      // Get invoices based on where clause
      if (options.where && options.where.userId) {
        invoices = memoryDb.findInvoicesByUserId(options.where.userId);
      } else {
        invoices = memoryDb.findAllInvoices();
      }
      
      // Apply additional filters
      if (options.where) {
        if (options.where.status) {
          invoices = invoices.filter(inv => inv.status === options.where.status);
        }
        if (options.where.clientId) {
          invoices = invoices.filter(inv => inv.clientId === options.where.clientId);
        }
        if (options.where.issueDate) {
          invoices = invoices.filter(inv => {
            const issueDate = new Date(inv.issueDate);
            let match = true;
            if (options.where.issueDate.gte) {
              match = match && issueDate >= new Date(options.where.issueDate.gte);
            }
            if (options.where.issueDate.lte) {
              match = match && issueDate <= new Date(options.where.issueDate.lte);
            }
            return match;
          });
        }
      }
      
      // Add related data (Client and InvoiceItems)
      if (options.include) {
        invoices = invoices.map(invoice => {
          const enrichedInvoice = { ...invoice };
          
          options.include.forEach(includeOption => {
            if (includeOption.model === Client) {
              const client = memoryDb.findClientById(invoice.clientId);
              if (client && includeOption.attributes) {
                const filteredClient = {};
                includeOption.attributes.forEach(attr => {
                  filteredClient[attr] = client[attr];
                });
                enrichedInvoice.Client = filteredClient;
              } else {
                enrichedInvoice.Client = client;
              }
            }
            if (includeOption.model === InvoiceItem) {
              enrichedInvoice.InvoiceItems = memoryDb.findInvoiceItemsByInvoiceId(invoice.id);
            }
          });
          
          return enrichedInvoice;
        });
      }
      
      // Apply sorting
      if (options.order && options.order.length > 0) {
        const [field, direction] = options.order[0];
        invoices.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          
          if (field === 'createdAt' || field === 'issueDate') {
            const aDate = new Date(aVal);
            const bDate = new Date(bVal);
            return direction === 'DESC' ? bDate - aDate : aDate - bDate;
          }
          
          if (direction === 'DESC') {
            return bVal > aVal ? 1 : -1;
          } else {
            return aVal > bVal ? 1 : -1;
          }
        });
      }
      
      // Apply pagination
      const totalCount = invoices.length;
      const offset = options.offset || 0;
      const limit = options.limit || totalCount;
      const paginatedInvoices = invoices.slice(offset, offset + limit);
      
      return Promise.resolve({
        count: totalCount,
        rows: paginatedInvoices
      });
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateInvoice(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteInvoice(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  
  const InvoiceItemAdapter = {
    create: (itemData) => memoryDb.createInvoiceItem(itemData),
    findOne: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.findInvoiceItemById(options.where.id));
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findInvoiceItemById(id)),
    findAll: (options) => {
      if (options.where && options.where.invoiceId) {
        return Promise.resolve(memoryDb.findInvoiceItemsByInvoiceId(options.where.invoiceId));
      }
      return Promise.resolve(memoryDb.findAllInvoiceItems());
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateInvoiceItem(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteInvoiceItem(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  
  // 创建ReminderLog适配器
  const ReminderLogAdapter = {
    create: (logData) => memoryDb.createReminderLog(logData),
    findOne: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.findReminderLogById(options.where.id));
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findReminderLogById(id)),
    findAll: (options) => {
      if (options.where && options.where.invoiceId) {
        return Promise.resolve(memoryDb.findReminderLogsByInvoiceId(options.where.invoiceId));
      }
      return Promise.resolve(memoryDb.findAllReminderLogs());
    },
    findAndCountAll: (options) => {
      let logs = memoryDb.findAllReminderLogs();
      
      // Apply filters if provided
      if (options.where) {
        if (options.where.invoiceId) {
          logs = logs.filter(log => log.invoiceId === options.where.invoiceId);
        }
        if (options.where.reminderType) {
          logs = logs.filter(log => log.reminderType === options.where.reminderType);
        }
      }
      
      // Apply include filters
      if (options.include && options.include.length > 0) {
        const include = options.include[0];
        if (include.model === Invoice && include.where && include.where.userId) {
          // Get invoices for this user
          const userInvoices = memoryDb.findInvoicesByUserId(include.where.userId);
          const userInvoiceIds = userInvoices.map(inv => inv.id);
          
          // Filter logs to only include those for user's invoices
          logs = logs.filter(log => userInvoiceIds.includes(log.invoiceId));
          
          // Add invoice data to each log
          logs = logs.map(log => {
            const invoice = userInvoices.find(inv => inv.id === log.invoiceId);
            return {
              ...log,
              Invoice: invoice ? { ...invoice } : null
            };
          });
        }
      }
      
      // Apply sorting
      if (options.order && options.order.length > 0) {
        const [field, direction] = options.order[0];
        logs.sort((a, b) => {
          if (direction === 'DESC') {
            return new Date(b[field]) - new Date(a[field]);
          } else {
            return new Date(a[field]) - new Date(b[field]);
          }
        });
      }
      
      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || logs.length;
      const paginatedLogs = logs.slice(offset, offset + limit);
      
      return Promise.resolve({
        count: logs.length,
        rows: paginatedLogs
      });
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateReminderLog(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteReminderLog(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  

  
  // 创建InvoiceTemplate适配器
  const InvoiceTemplateAdapter = {
    create: (templateData) => {
      const template = memoryDb.createInvoiceTemplate(templateData);
      return Promise.resolve(template);
    },
    findOne: (options) => {
      if (!memoryDb.invoiceTemplates) memoryDb.invoiceTemplates = [];
      if (options && options.where) {
        const found = memoryDb.invoiceTemplates.find(t => {
          return Object.keys(options.where).every(key => {
            const condVal = options.where[key];
            if (key === 'id' || key === 'userId') {
              return Number(t[key]) === Number(condVal);
            }
            return t[key] === condVal;
          });
        });
        return Promise.resolve(found || null);
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findInvoiceTemplateById(Number(id))),
    findAll: (options) => {
      if (options && options.where && options.where.userId) {
        return Promise.resolve(memoryDb.findInvoiceTemplatesByUserId(options.where.userId));
      }
      return Promise.resolve(memoryDb.findAllInvoiceTemplates());
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateInvoiceTemplate(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteInvoiceTemplate(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };
  
  // 创建TemplateField适配器
  const TemplateFieldAdapter = {
    create: (fieldData) => {
      const field = memoryDb.createTemplateField(fieldData);
      return Promise.resolve(field);
    },
    bulkCreate: (fieldsData) => {
      const createdFields = fieldsData.map(fieldData => {
        return memoryDb.createTemplateField(fieldData);
      });
      return Promise.resolve(createdFields);
    },
    findOne: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.findTemplateFieldById(options.where.id));
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findTemplateFieldById(id)),
    findAll: (options) => {
      if (options && options.where && options.where.templateId) {
        return Promise.resolve(memoryDb.findTemplateFieldsByTemplateId(options.where.templateId));
      }
      return Promise.resolve(memoryDb.findAllTemplateFields());
    },
    update: (updates, options) => {
      if (options.where && options.where.id) {
        return Promise.resolve([memoryDb.updateTemplateField(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.id) {
        return Promise.resolve(memoryDb.deleteTemplateField(options.where.id) ? 1 : 0);
      } else if (options.where && options.where.templateId) {
        return Promise.resolve(memoryDb.deleteTemplateFieldsByTemplateId(options.where.templateId));
      }
      return Promise.resolve(0);
    },
    bulkCreate: (fieldsData) => {
      const createdFields = fieldsData.map(fieldData => memoryDb.createTemplateField(fieldData));
      return Promise.resolve(createdFields);
    }
  };
  
  // 创建TaxSetting适配器
  const TaxSettingAdapter = {
    create: (settingData) => {
      const setting = memoryDb.createSettings(settingData);
      return Promise.resolve(setting);
    },
    findOne: (options) => {
      if (options.where && options.where.userId) {
        return Promise.resolve(memoryDb.findSettingsByUserId(options.where.userId));
      }
      return Promise.resolve(null);
    },
    findByPk: (id) => Promise.resolve(memoryDb.findSettingsById(id)),
    findAll: (options) => {
      if (options && options.where && options.where.userId) {
        const setting = memoryDb.findSettingsByUserId(options.where.userId);
        return Promise.resolve(setting ? [setting] : []);
      }
      return Promise.resolve(memoryDb.findAllSettings());
    },
    update: (updates, options) => {
      if (options.where && options.where.userId) {
        return Promise.resolve([memoryDb.updateSettingsByUserId(options.where.userId, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    },
    destroy: (options) => {
      if (options.where && options.where.userId) {
        return Promise.resolve(memoryDb.deleteSettingsByUserId(options.where.userId) ? 1 : 0);
      }
      return Promise.resolve(0);
    }
  };

  // 创建AuditLog适配器（内存模式下简单实现）
  const AuditLogAdapter = {
    create: (logData) => {
      // 在内存模式下，简单地返回成功，不实际存储审计日志
      return Promise.resolve({ id: Date.now(), ...logData });
    },
    findOne: () => Promise.resolve(null),
    findByPk: () => Promise.resolve(null),
    findAll: () => Promise.resolve([]),
    update: () => Promise.resolve([0]),
    destroy: () => Promise.resolve(0)
  };
  
  // 创建EmailConfig适配器（内存模式下简单实现）
  const EmailConfigAdapter = {
    create: (configData) => {
      return Promise.resolve(memoryDb.setEmailConfig(configData.userId, configData));
    },
    findOne: (options = {}) => {
      const userId = options.where && options.where.userId;
      return Promise.resolve(userId ? memoryDb.getEmailConfig(userId) : null);
    },
    findByPk: (id) => {
      const rec = (memoryDb.emailConfigs || []).find(c => Number(c.id) === Number(id));
      return Promise.resolve(rec || null);
    },
    findAll: () => Promise.resolve(memoryDb.emailConfigs || []),
    update: (updates, options = {}) => {
      const userId = options.where && options.where.userId;
      if (!userId) return Promise.resolve([0]);
      const res = memoryDb.setEmailConfig(userId, updates);
      return Promise.resolve([res ? 1 : 0]);
    },
    destroy: (options = {}) => {
      const userId = options.where && options.where.userId;
      if (!userId) return Promise.resolve(0);
      const ok = memoryDb.deleteEmailConfigByUserId(userId);
      return Promise.resolve(ok ? 1 : 0);
    },
    upsert: (configData) => {
      return Promise.resolve(memoryDb.setEmailConfig(configData.userId, configData));
    }
  };
  
  // 为内存数据库增加 Integration/SyncLog 适配器
  if (!memoryDb.integrations) memoryDb.integrations = [];
  if (!memoryDb.syncLogs) memoryDb.syncLogs = [];
  if (!memoryDb.nextIds) memoryDb.nextIds = {};
  if (!memoryDb.nextIds.integrations) memoryDb.nextIds.integrations = 1;
  if (!memoryDb.nextIds.syncLogs) memoryDb.nextIds.syncLogs = 1;

  const IntegrationAdapter = {
    create: (data) => {
      const id = memoryDb.nextIds.integrations++;
      const record = {
        id,
        user_id: data.user_id,
        platform: data.platform,
        platform_type: data.platform_type,
        config: data.config,
        is_active: data.is_active ?? true,
        sync_status: data.sync_status ?? 'idle',
        settings: data.settings || {},
        last_sync_at: null,
        error_message: null
      };
      memoryDb.integrations.push(record);
      return Promise.resolve(record);
    },
    findOne: ({ where }) => {
      const rec = memoryDb.integrations.find(i => {
        return Object.keys(where || {}).every(k => i[k] === where[k]);
      });
      return Promise.resolve(rec || null);
    },
    findByPk: (id) => {
      const rec = memoryDb.integrations.find(i => Number(i.id) === Number(id));
      return Promise.resolve(rec || null);
    },
    update: (updates, { where }) => {
      let updated = 0;
      memoryDb.integrations = memoryDb.integrations.map(i => {
        const match = where && Object.keys(where).every(k => i[k] === where[k]);
        if (match) {
          updated++;
          return { ...i, ...updates };
        }
        return i;
      });
      return Promise.resolve([updated]);
    },
    destroy: ({ where }) => {
      const before = memoryDb.integrations.length;
      memoryDb.integrations = memoryDb.integrations.filter(i => {
        return !Object.keys(where || {}).every(k => i[k] === where[k]);
      });
      const removed = before - memoryDb.integrations.length;
      return Promise.resolve(removed);
    },
    findByUserAndPlatform: (userId, platform) => {
      const rec = memoryDb.integrations.find(i => i.user_id === userId && i.platform === platform);
      return Promise.resolve(rec || null);
    }
  };

  const SyncLogAdapter = {
    create: (data) => {
      const id = memoryDb.nextIds.syncLogs++;
      const record = {
        id,
        integrationId: data.integrationId || data.integration_id,
        syncType: data.syncType,
        status: data.status,
        error: data.error || null,
        startedAt: data.startedAt || new Date(),
        completedAt: data.completedAt || null
      };
      memoryDb.syncLogs.push(record);
      return Promise.resolve(record);
    },
    destroy: ({ where }) => {
      const before = memoryDb.syncLogs.length;
      memoryDb.syncLogs = memoryDb.syncLogs.filter(l => {
        if (where.integrationId) {
          return Number(l.integrationId) !== Number(where.integrationId);
        }
        return true;
      });
      const removed = before - memoryDb.syncLogs.length;
      return Promise.resolve(removed);
    }
  };

  // 导入Payment和PaymentRecord适配器
  const Payment = require('./Payment');
  const PaymentRecord = require('./PaymentRecord');
let Subscription = null;
try {
  Subscription = require('./Subscription');
} catch (e) {
  console.warn(`Subscription module disabled: ${e.message}`);
  Subscription = null;
}

  module.exports = {
    sequelize: null,
    memoryDb, // 添加memoryDb导出
    User: UserAdapter,
    Client: ClientAdapter,
    Invoice: InvoiceAdapter,
    InvoiceItem: InvoiceItemAdapter,
    ReminderLog: ReminderLogAdapter,
    Payment,
    PaymentRecord,
    Subscription,
    TaxSetting: TaxSettingAdapter,
    InvoiceTemplate: InvoiceTemplateAdapter,
    TemplateField: TemplateFieldAdapter,
    AuditLog: AuditLogAdapter,
    EmailConfig: EmailConfigAdapter,
    Integration: IntegrationAdapter,
    SyncLog: SyncLogAdapter,
    syncDatabase
  };
} else {
  // 使用Sequelize模型
  module.exports = {
    sequelize,
    User,
    Client,
    Invoice,
    InvoiceItem,
    ReminderLog,
    Payment,
    PaymentRecord,
    Subscription,
    TaxSetting,
    InvoiceTemplate,
    TemplateField,
    AuditLog,
    EmailConfig,
    EmailTemplate,
    Integration,
    DataMapping,
    SyncLog,
    syncDatabase
  };
}