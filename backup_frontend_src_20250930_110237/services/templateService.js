import api from './api';

class TemplateService {
  async getAllTemplates() {
    try {
      const response = await api.get('/invoice-templates');
      return response.data;
    } catch (error) {
      console.error('获取模板列表失败:', error);
      throw error;
    }
  }

  async getDefaultTemplate() {
    try {
      const response = await api.get('/invoice-templates/default');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // 没有默认模板
      }
      console.error('获取默认模板失败:', error);
      throw error;
    }
  }

  async getTemplate(id) {
    try {
      const response = await api.get(`/invoice-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取模板失败:', error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await api.post('/invoice-templates', templateData);
      return response.data;
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  }

  async updateTemplate(id, templateData) {
    try {
      const response = await api.put(`/invoice-templates/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error('更新模板失败:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const response = await api.delete(`/invoice-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  }

  async setDefaultTemplate(id) {
    try {
      const response = await api.post(`/invoice-templates/${id}/set-default`);
      return response.data;
    } catch (error) {
      console.error('设置默认模板失败:', error);
      throw error;
    }
  }

  /**
   * 应用模板到发票数据
   * @param {Object} template - 模板对象
   * @param {Object} invoiceData - 现有发票数据
   * @returns {Object} 应用模板后的发票数据
   */
  applyTemplateToInvoice(template, invoiceData = {}) {
    if (!template || !template.fields) {
      return invoiceData;
    }

    const appliedData = { ...invoiceData };
    
    // 应用模板字段
    template.fields.forEach(field => {
      const { name, fieldType, fixedValue, defaultValue, targetEntity } = field;
      
      // 根据目标实体确定数据存储位置
      let targetObject = appliedData;
      if (targetEntity === 'client') {
        if (!appliedData.client) appliedData.client = {};
        targetObject = appliedData.client;
      } else if (targetEntity === 'item') {
        if (!appliedData.items) appliedData.items = [{}];
        targetObject = appliedData.items[0];
      }
      
      // 应用字段值
      if (fieldType === 'fixed' && fixedValue !== undefined) {
        // 固定值字段：直接设置值，不允许修改
        targetObject[name] = fixedValue;
        // 标记为只读字段
        if (!appliedData._readOnlyFields) appliedData._readOnlyFields = [];
        appliedData._readOnlyFields.push(`${targetEntity}.${name}`);
      } else if (fieldType === 'flexible' && defaultValue !== undefined) {
        // 灵活值字段：设置默认值，允许修改
        if (targetObject[name] === undefined || targetObject[name] === '') {
          targetObject[name] = defaultValue;
        }
      }
    });

    return appliedData;
  }

  /**
   * 验证发票数据是否符合模板要求
   * @param {Object} template - 模板对象
   * @param {Object} invoiceData - 发票数据
   * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
   */
  validateInvoiceAgainstTemplate(template, invoiceData) {
    const errors = [];
    
    if (!template || !template.fields) {
      return { isValid: true, errors: [] };
    }

    template.fields.forEach(field => {
      const { name, label, isRequired, targetEntity } = field;
      
      // 获取目标对象
      let targetObject = invoiceData;
      if (targetEntity === 'client' && invoiceData.client) {
        targetObject = invoiceData.client;
      } else if (targetEntity === 'item' && invoiceData.items && invoiceData.items[0]) {
        targetObject = invoiceData.items[0];
      }
      
      // 检查必填字段
      if (isRequired && (!targetObject[name] || targetObject[name].toString().trim() === '')) {
        errors.push(`${label || name} 是必填字段`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const templateService = new TemplateService();

export default templateService;
export { templateService };