const { getDatabase } = require('../config/dbFactory');
const dbType = process.env.DB_TYPE || 'postgres';

// 如果不是内存数据库，则使用Sequelize定义模型
if (dbType !== 'memory') {
  const { DataTypes } = require('sequelize');
  const { sequelize } = require('../config/database');
  
  const ReminderLog = sequelize.define('ReminderLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Invoices',
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
    timestamps: true,
    tableName: 'reminder_logs'
  });
  
  module.exports = ReminderLog;
} else {
  // 对于内存数据库，返回一个空对象
  // 实际的模型定义在models/index.js中处理
  module.exports = {};
}