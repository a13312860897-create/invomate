const { sequelize } = require('./database');
const memoryDb = require('./memoryDatabase');

let dbTypeLogged = false;

/**
 * 数据库工厂函数
 * 根据环境变量DB_TYPE返回适当的数据库实例
 * DB_TYPE可以是'postgres'或'memory'，默认为'memory'
 */
const getDatabase = () => {
  const dbType = process.env.DB_TYPE || 'memory';
  
  if (dbType === 'memory') {
    if (!dbTypeLogged) {
      console.log('Using in-memory database');
      dbTypeLogged = true;
    }
    return {
      sequelize: memoryDb,
      authenticate: () => memoryDb.authenticate(),
      sync: () => memoryDb.sync()
    };
  } else {
    if (!dbTypeLogged) {
      console.log('Using PostgreSQL database');
      dbTypeLogged = true;
    }
    return {
      sequelize,
      authenticate: async () => {
        const connected = await require('./database').testConnection();
        if (!connected) {
          console.warn('PostgreSQL connection failed, falling back to in-memory database');
          return {
            sequelize: memoryDb,
            authenticate: () => memoryDb.authenticate(),
            sync: () => memoryDb.sync()
          };
        }
        return { sequelize };
      },
      sync: async () => {
        const connected = await require('./database').testConnection();
        if (!connected) {
          console.warn('PostgreSQL unavailable during sync, using in-memory database');
          return memoryDb.sync();
        }
        const { syncDatabase } = require('../models');
        return syncDatabase();
      }
    };
  }
};

module.exports = { getDatabase };