const { Sequelize } = require('sequelize');
require('dotenv').config();

// 从环境变量中获取数据库配置
const dbName = process.env.DB_NAME || 'invoice_saas';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'password';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';

// 创建Sequelize实例
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.error('Database configuration:', {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser
    });
    return false;
  }
};

// 导出Sequelize实例和连接测试函数
module.exports = {
  sequelize,
  testConnection,
  isMemoryMode: () => process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE
};