import api from './api';

class TemplateService {
  async getAllTemplates() {
    try {
      const response = await api.get('/invoice-templates');
      return response.data;
    } catch (error) {
      console.error('Failed to get template list:', error);
      throw error;
    }
  }

  async getDefaultTemplate() {
    try {
      const response = await api.get('/invoice-templates/default');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No default template
      }
      console.error('Failed to get default template:', error);
      throw error;
    }
  }

  async getTemplate(id) {
    try {
      const response = await api.get(`/invoice-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await api.post('/templates', templateData);
      return response.data;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  async updateTemplate(id, templateData) {
    try {
      const response = await api.put(`/templates/${id}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  async deleteTemplate(id) {
    try {
      const response = await api.delete(`/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  async setDefaultTemplate(id) {
    try {
      const response = await api.put(`/templates/${id}/default`);
      return response.data;
    } catch (error) {
      console.error('Failed to set default template:', error);
      throw error;
    }
  }

  /**
   * Apply template to invoice data
   * @param {Object} template - Template object
   * @param {Object} invoiceData - Existing invoice data
   * @returns {Object} Invoice data after applying template
   */
  applyTemplateToInvoice(template, invoiceData = {}) {
    if (!template || !template.fields) {
      return invoiceData;
    }

    const appliedData = { ...invoiceData };
    
    // Apply template fields
    template.fields.forEach(field => {
      const { name, value, targetEntity, fieldType } = field;
      
      // Determine data storage location based on target entity
      let targetObject = appliedData;
      if (targetEntity === 'client') {
        targetObject = appliedData.client = appliedData.client || {};
      } else if (targetEntity === 'company') {
        targetObject = appliedData.company = appliedData.company || {};
      }
      
      // Apply field value
      if (fieldType === 'fixed') {
        // Fixed value field: set value directly, not editable
        targetObject[name] = value;
        // Mark as read-only field
        if (!appliedData._readOnlyFields) appliedData._readOnlyFields = [];
        appliedData._readOnlyFields.push(`${targetEntity}.${name}`);
      } else if (fieldType === 'flexible') {
        // Flexible value field: set default value, editable
        if (!targetObject[name]) {
          targetObject[name] = value;
        }
      }
    });

    return appliedData;
  }

  /**
   * Validate if invoice data meets template requirements
   * @param {Object} template - Template object
   * @param {Object} invoiceData - Invoice data
   * @returns {Object} Validation result { isValid: boolean, errors: string[] }
   */
  validateInvoiceAgainstTemplate(template, invoiceData) {
    const errors = [];
    
    if (!template || !template.fields) {
      return { isValid: true, errors: [] };
    }

    template.fields.forEach(field => {
      const { name, label, required, targetEntity } = field;
      
      // Get target object
      let targetObject = invoiceData;
      if (targetEntity === 'client') {
        targetObject = invoiceData.client || {};
      } else if (targetEntity === 'company') {
        targetObject = invoiceData.company || {};
      }
      
      // Check required fields
      if (required && (!targetObject[name] || targetObject[name].toString().trim() === '')) {
        errors.push(`${label || name} is a required field`);
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