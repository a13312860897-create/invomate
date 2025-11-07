/**
 * 发票发送历史模型
 * 用于跟踪发票发送的详细历史记录
 */

const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

const dbType = process.env.DB_TYPE || 'memory';

let InvoiceSendingHistory;

if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  const sequelize = db.sequelize;

  InvoiceSendingHistory = sequelize.define('InvoiceSendingHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    
    // 发送基本信息
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sentTo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    sentBy: {
      type: DataTypes.ENUM('manual', 'scheduled', 'reminder', 'batch'),
      defaultValue: 'manual'
    },
    
    // 邮件相关信息
    emailSubject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailProvider: {
      type: DataTypes.ENUM('smtp', 'resend', 'sendgrid', 'mailgun'),
      allowNull: true
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // 发送状态
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'),
      defaultValue: 'pending'
    },
    
    // 发送结果
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 发送选项
    customSubject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ccEmails: {
      type: DataTypes.TEXT, // JSON array of CC emails
      allowNull: true
    },
    bccEmails: {
      type: DataTypes.TEXT, // JSON array of BCC emails
      allowNull: true
    },
    
    // PDF相关
    pdfGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pdfPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pdfSize: {
      type: DataTypes.INTEGER, // PDF文件大小（字节）
      allowNull: true
    },
    
    // 支付链接
    paymentUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentUrlClicked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentUrlClickedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // 邮件跟踪
    emailOpened: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailOpenedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailOpenCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    // 发送配置
    emailMethod: {
      type: DataTypes.ENUM('smtp', 'resend', 'auto'),
      defaultValue: 'auto'
    },
    forceRegeneratePDF: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // 批量发送相关
    batchId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    batchSequence: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    // 提醒相关
    reminderType: {
      type: DataTypes.ENUM('gentle', 'urgent', 'final'),
      allowNull: true
    },
    reminderSequence: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    
    // 元数据
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
    // 响应时间统计
    processingTime: {
      type: DataTypes.INTEGER, // 处理时间（毫秒）
      allowNull: true
    },
    
    // 额外数据
    metadata: {
      type: DataTypes.TEXT, // JSON格式的额外数据
      allowNull: true
    }
  }, {
    tableName: 'invoice_sending_history',
    timestamps: true,
    indexes: [
      {
        fields: ['invoiceId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['clientId']
      },
      {
        fields: ['sentAt']
      },
      {
        fields: ['status']
      },
      {
        fields: ['batchId']
      },
      {
        fields: ['messageId']
      }
    ]
  });

} else {
  // 内存数据库的简化实现
  InvoiceSendingHistory = {
    create: async (data) => {
      const history = {
        id: Date.now(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (!db.invoiceSendingHistory) {
        db.invoiceSendingHistory = [];
      }
      
      db.invoiceSendingHistory.push(history);
      return history;
    },
    
    findAll: async (options = {}) => {
      if (!db.invoiceSendingHistory) return [];
      
      let results = [...db.invoiceSendingHistory];
      
      if (options.where) {
        results = results.filter(item => {
          return Object.keys(options.where).every(key => 
            item[key] === options.where[key]
          );
        });
      }
      
      if (options.order) {
        const [field, direction] = options.order[0];
        results.sort((a, b) => {
          if (direction === 'DESC') {
            return new Date(b[field]) - new Date(a[field]);
          }
          return new Date(a[field]) - new Date(b[field]);
        });
      }
      
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
      
      return results;
    },
    
    findOne: async (options = {}) => {
      if (!db.invoiceSendingHistory) return null;
      
      return db.invoiceSendingHistory.find(item => {
        return Object.keys(options.where).every(key => 
          item[key] === options.where[key]
        );
      }) || null;
    },
    
    update: async (updates, options) => {
      if (!db.invoiceSendingHistory) return [0];
      
      let updatedCount = 0;
      db.invoiceSendingHistory = db.invoiceSendingHistory.map(item => {
        const matches = Object.keys(options.where).every(key => 
          item[key] === options.where[key]
        );
        
        if (matches) {
          updatedCount++;
          return { ...item, ...updates, updatedAt: new Date() };
        }
        return item;
      });
      
      return [updatedCount];
    }
  };
}

module.exports = InvoiceSendingHistory;