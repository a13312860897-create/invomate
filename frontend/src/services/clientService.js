import api from './api';

class ClientService {
  // Set the API instance to use (will be injected from AuthContext)
  setApi(apiInstance) {
    this.api = apiInstance;
  }

  // Get all clients
  async getClients() {
    try {
      const response = await api.get('/clients');

      const data = response.data;
      
      // Unified return format: always return client array
      if (data.success && data.data && Array.isArray(data.data.clients)) {
        console.log('返回客户数组，长度:', data.data.clients.length);
        return data.data.clients;
      } else if (Array.isArray(data)) {
        console.log('直接返回数组，长度:', data.length);
        return data;
      } else {
        console.warn('Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      console.error('错误详情:', error.message);
      console.error('响应状态:', error.response?.status);
      console.error('响应数据:', error.response?.data);
      throw error;
    }
  }

  // Get single client by ID
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

  // Create new client
  async createClient(clientData) {
    try {
      // Validate required fields
      if (!clientData || !clientData.name || clientData.name.trim() === '') {
        throw new Error('Client name is required');
      }

      const response = await api.post('/clients', clientData);
      const result = response.data;
      return result.success ? result.data : result;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update client
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

  // Delete client
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