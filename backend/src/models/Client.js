const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 获取适当的Client模型
const getClientModel = () => {
  const dbType = process.env.DB_TYPE || 'postgres';
  
  if (dbType === 'memory') {
    // 使用内存数据库
    const memoryDb = require('../config/memoryDatabase');
    return memoryDb;
  } else {
    // 使用Sequelize模型
    const { Client } = require('./index');
    return Client;
  }
};

const Client = getClientModel();

// Client模型适配Sequelize和内存数据库
class ClientModel {
  // 创建新客户
  static async create(clientData) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      return Client.createClient(clientData);
    } else {
      // 使用Sequelize模型
      return await Client.create(clientData);
    }
  }

  // 查找客户
  static async findOne(options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        return Client.findClientById(options.where.id);
      }
      return null;
    } else {
      // 使用Sequelize模型
      return await Client.findOne(options);
    }
  }

  // 根据主键查找客户
  static async findByPk(id) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      return Client.findClientById(id);
    } else {
      // 使用Sequelize模型
      return await Client.findByPk(id);
    }
  }

  // 查找所有客户
  static async findAll(options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.userId) {
        return Client.findClientsByUserId(options.where.userId);
      }
      return Client.findAllClients();
    } else {
      // 使用Sequelize模型
      return await Client.findAll(options);
    }
  }

  // 更新客户
  static async update(updates, options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        const updatedClient = Client.updateClient(options.where.id, updates);
        return updatedClient ? [1] : [0];
      }
      return [0];
    } else {
      // 使用Sequelize模型
      const [affectedRows] = await Client.update(updates, options);
      if (affectedRows > 0 && options.where && options.where.id) {
        return await Client.findByPk(options.where.id);
      }
      return null;
    }
  }

  // 删除客户
  static async destroy(options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        return Client.deleteClient(options.where.id) ? 1 : 0;
      }
      return 0;
    } else {
      // 使用Sequelize模型
      return await Client.destroy(options);
    }
  }
}

module.exports = ClientModel;