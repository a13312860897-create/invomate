const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 根据数据库类型决定如何定义模型
const dbType = process.env.DB_TYPE || 'postgres';

let sequelize;
if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  sequelize = db.sequelize;
}

// 定义PaymentRecord模型
let PaymentRecord;

if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  
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
}

// 创建PaymentRecord适配器
const PaymentRecordAdapter = {
  create: (recordData) => {
    if (dbType === 'memory') {
      return require('../config/memoryDatabase').createPaymentRecord(recordData);
    } else {
      return PaymentRecord.create(recordData);
    }
  },
  findOne: (options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.id) {
        return Promise.resolve(require('../config/memoryDatabase').findPaymentRecordById(options.where.id));
      } else if (options.where && options.where.paymentId) {
        return Promise.resolve(require('../config/memoryDatabase').findPaymentRecordsByPaymentId(options.where.paymentId)[0]);
      }
      return Promise.resolve(null);
    } else {
      return PaymentRecord.findOne(options);
    }
  },
  findByPk: (id) => {
    if (dbType === 'memory') {
      return Promise.resolve(require('../config/memoryDatabase').findPaymentRecordById(id));
    } else {
      return PaymentRecord.findByPk(id);
    }
  },
  findAll: (options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.paymentId) {
        return Promise.resolve(require('../config/memoryDatabase').findPaymentRecordsByPaymentId(options.where.paymentId));
      }
      return Promise.resolve(require('../config/memoryDatabase').findAllPaymentRecords());
    } else {
      return PaymentRecord.findAll(options);
    }
  },
  update: (updates, options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.id) {
        return Promise.resolve([require('../config/memoryDatabase').updatePaymentRecord(options.where.id, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    } else {
      return PaymentRecord.update(updates, options);
    }
  },
  destroy: (options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.id) {
        return Promise.resolve(require('../config/memoryDatabase').deletePaymentRecord(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    } else {
      return PaymentRecord.destroy(options);
    }
  }
};

module.exports = dbType === 'memory' ? PaymentRecordAdapter : PaymentRecord;