const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 根据数据库类型决定如何定义模型
const dbType = process.env.DB_TYPE || 'postgres';

let sequelize;
if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  sequelize = db.sequelize;
}

// 定义Payment模型
let Payment;

if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  
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
}

// 创建Payment适配器
const PaymentAdapter = {
  create: (paymentData) => {
    if (dbType === 'memory') {
      return require('../config/memoryDatabase').createPayment(paymentData);
    } else {
      return Payment.create(paymentData);
    }
  },
  findOne: (options) => {
    if (dbType === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      if (options.where) {
        const { id, userId, paymentIntentId, invoiceId } = options.where;
        
        // 如果有id和userId，查找匹配的支付记录
        if (id && userId) {
          const payment = memoryDb.findPaymentById(id);
          if (payment && payment.userId === userId) {
            return Promise.resolve(payment);
          }
          return Promise.resolve(null);
        }
        
        // 其他查询条件
        if (id) {
          return Promise.resolve(memoryDb.findPaymentById(id));
        } else if (paymentIntentId) {
          return Promise.resolve(memoryDb.findPaymentByIntentId(paymentIntentId));
        } else if (invoiceId) {
          return Promise.resolve(memoryDb.findPaymentByInvoiceId(invoiceId));
        }
      }
      return Promise.resolve(null);
    } else {
      return Payment.findOne(options);
    }
  },
  findByPk: (id) => {
    if (dbType === 'memory') {
      return Promise.resolve(require('../config/memoryDatabase').findPaymentById(id));
    } else {
      return Payment.findByPk(id);
    }
  },
  findAll: (options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.userId) {
        return Promise.resolve(require('../config/memoryDatabase').findPaymentsByUserId(options.where.userId));
      } else if (options.where && options.where.invoiceId) {
        return Promise.resolve(require('../config/memoryDatabase').findPaymentsByInvoiceId(options.where.invoiceId));
      }
      return Promise.resolve(require('../config/memoryDatabase').findAllPayments());
    } else {
      return Payment.findAll(options);
    }
  },
  update: (updates, options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.id) {
        return Promise.resolve([require('../config/memoryDatabase').updatePayment(options.where.id, updates) ? 1 : 0]);
      } else if (options.where && options.where.paymentIntentId) {
        return Promise.resolve([require('../config/memoryDatabase').updatePaymentByIntentId(options.where.paymentIntentId, updates) ? 1 : 0]);
      }
      return Promise.resolve([0]);
    } else {
      return Payment.update(updates, options);
    }
  },
  destroy: (options) => {
    if (dbType === 'memory') {
      if (options.where && options.where.id) {
        return Promise.resolve(require('../config/memoryDatabase').deletePayment(options.where.id) ? 1 : 0);
      }
      return Promise.resolve(0);
    } else {
      return Payment.destroy(options);
    }
  }
};

module.exports = dbType === 'memory' ? PaymentAdapter : Payment;