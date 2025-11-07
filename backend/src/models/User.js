const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/dbFactory');
const db = getDatabase();

// 获取适当的User模型
const getUserModel = () => {
  const dbType = process.env.DB_TYPE || 'postgres';
  
  if (dbType === 'memory') {
    // 使用内存数据库
    const memoryDb = require('../config/memoryDatabase');
    return memoryDb;
  } else {
    // 使用Sequelize模型
    const { User } = require('./index');
    return User;
  }
};

const User = getUserModel();

// User模型适配Sequelize和内存数据库
class UserModel {
  // 创建新用户
  static async create(userData) {
    // 如果提供了密码，则进行哈希处理
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      return User.createUser(userData);
    } else {
      // 使用Sequelize模型
      return await User.create(userData);
    }
  }

  // 查找用户
  static async findOne(options) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        return User.findUserById(options.where.id);
      } else if (options.where && options.where.email) {
        return User.findUserByEmail(options.where.email);
      }
      return null;
    } else {
      // 使用Sequelize模型
      return await User.findOne(options);
    }
  }

  // 根据主键查找用户
  static async findByPk(id, options = {}) {
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      return User.findUserById(id);
    } else {
      // 使用Sequelize模型
      return await User.findByPk(id, options);
    }
  }

  // 更新用户
  static async update(updates, options) {
    // 如果更新包含密码，则进行哈希处理
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      if (options.where && options.where.id) {
        const updatedUser = User.updateUser(options.where.id, updates);
        return updatedUser ? [1] : [0];
      }
      return [0];
    } else {
      // 使用Sequelize模型
      const [affectedRows] = await User.update(updates, options);
      if (affectedRows > 0 && options.where && options.where.id) {
        return await User.findByPk(options.where.id);
      }
      return null;
    }
  }

  // 实例方法：更新用户数据
  async update(updates) {
    // 如果更新包含密码，则进行哈希处理
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const dbType = process.env.DB_TYPE || 'postgres';
    
    if (dbType === 'memory') {
      // 使用内存数据库
      const updatedUser = User.updateUser(this.id, updates);
      if (updatedUser) {
        Object.assign(this, updatedUser);
      }
      return this;
    } else {
      // 使用Sequelize模型
      const [affectedRows] = await User.update(updates, {
        where: { id: this.id }
      });
      
      if (affectedRows > 0) {
        const updatedUser = await User.findByPk(this.id);
        Object.assign(this, updatedUser.toJSON());
      }
      
      return this;
    }
  }
}

module.exports = UserModel;