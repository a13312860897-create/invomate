import api from './api';

class ClientService {
  // Set the API instance to use (will be injected from AuthContext)
  setApi(apiInstance) {
    this.api = apiInstance;
  }

  // 获取所有客户
  async getClients() {
    try {
      const response = await api.get('/clients');

      const data = response.data;
      
      // 统一返回格式：始终返回客户数组
      if (data.success && data.data && Array.isArray(data.data.clients)) {
        return data.data.clients;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn('Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // 根据ID获取单个客户
  async getClient(id) {
    try {
      const response = await api.get(`/clients/${id}`);
      const data = response.data;
      return data.success ? data.data : data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }

  // 创建新客户
  async createClient(clientData) {
    try {
      // 验证必要字段
      if (!clientData || !clientData.name || clientData.name.trim() === '') {
        throw new Error('客户姓名是必填项');
      }

      const response = await api.post('/clients', clientData);
      const result = response.data;
      return result.success ? result.data : result;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // 更新客户
  async updateClient(id, clientData) {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      const result = response.data;
      return result.success ? result.data : result;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // 删除客户
  async deleteClient(id) {
    try {
      const response = await api.delete(`/clients/${id}`);
      const result = response.data;
      return result;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
}

const clientService = new ClientService();
export default clientService;
export { clientService };