/**
 * 模拟客户端服务
 * 用于测试和开发环境的客户端数据操作
 */

const { Client } = require('../models');

// 生成模拟ID的辅助函数
function generateId(prefix) {
  return `${prefix}${Math.floor(Math.random() * 10000)}`;
}

class MockClientService {
  /**
   * 根据ID获取客户端
   * @param {number} id - 客户端ID
   * @returns {Promise<Object>} - 客户端对象
   */
  async getClientById(id) {
    try {
      // 在实际应用中，这里会查询数据库
      // const client = await Client.findByPk(id);
      
      // 返回模拟数据
      return {
        id: id,
        name: 'Test Client',
        company: 'Test Company',
        phone: '123-456-7890',
        address: '123 Test St, Test City',
        country: 'France',
        vatNumber: 'FR12345678901',
        siren: '123456789',
        siret: '12345678901234',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting client by ID:', error);
      throw error;
    }
  }

  /**
   * 获取所有客户端
   * @returns {Promise<Array>} - 客户端对象数组
   */
  async getAllClients() {
    try {
      // 在实际应用中，这里会查询数据库
      // const clients = await Client.findAll();
      
      // 返回模拟数据
      return [
        {
          id: 1,
          name: 'Client A',
          company: 'Company A',
          phone: '111-222-3333',
          address: '111 A St, A City',
          country: 'France',
          vatNumber: 'FR11111111111',
          siren: '111111111',
          siret: '11111111111111',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Client B',
          company: 'Company B',
          phone: '222-333-4444',
          address: '222 B St, B City',
          country: 'France',
          vatNumber: 'FR22222222222',
          siren: '222222222',
          siret: '22222222222222',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw error;
    }
  }

  /**
   * 创建新客户端
   * @param {Object} clientData - 客户端数据
   * @returns {Promise<Object>} - 创建的客户端对象
   */
  async createClient(clientData) {
    try {
      // 在实际应用中，这里会在数据库中创建新记录
      // const newClient = await Client.create(clientData);
      
      // 返回模拟数据
      return {
        id: generateId('CLIENT-'),
        ...clientData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * 更新客户端
   * @param {number} id - 客户端ID
   * @param {Object} clientData - 要更新的客户端数据
   * @returns {Promise<Object>} - 更新后的客户端对象
   */
  async updateClient(id, clientData) {
    try {
      // 在实际应用中，这里会更新数据库中的记录
      // const updatedClient = await Client.update(clientData, { where: { id } });
      
      // 返回模拟数据
      return {
        id,
        ...clientData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * 删除客户端
   * @param {number} id - 客户端ID
   * @returns {Promise<boolean>} - 是否删除成功
   */
  async deleteClient(id) {
    try {
      // 在实际应用中，这里会删除数据库中的记录
      // await Client.destroy({ where: { id } });
      
      // 返回模拟数据
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
}

module.exports = new MockClientService();