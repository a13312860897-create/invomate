const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class InvoiceService {
  async createInvoice(invoiceData) {
    try {
      console.log('=== InvoiceService.createInvoice 调试 ===');
      console.log('1. 原始发票数据:', invoiceData);
      console.log('2. 数据类型检查:');
      console.log('   - clientId:', invoiceData.clientId, '(类型:', typeof invoiceData.clientId, ')');
      console.log('   - issueDate:', invoiceData.issueDate, '(类型:', typeof invoiceData.issueDate, ')');
      console.log('   - dueDate:', invoiceData.dueDate, '(类型:', typeof invoiceData.dueDate, ')');
      console.log('   - items:', invoiceData.items, '(长度:', invoiceData.items?.length, ')');
      console.log('   - subtotal:', invoiceData.subtotal, '(类型:', typeof invoiceData.subtotal, ')');
      console.log('   - total:', invoiceData.total, '(类型:', typeof invoiceData.total, ')');
      
      const token = localStorage.getItem('token');
      const requestBody = JSON.stringify(invoiceData);
      
      console.log('3. 请求体 JSON:', requestBody);
      console.log('4. 请求头:', {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'No token'
      });
      
      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      console.log('5. 响应状态:', response.status, response.statusText);
      console.log('6. 响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('7. 错误响应内容:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.log('8. 解析的错误JSON:', errorJson);
        } catch (e) {
          console.log('8. 无法解析错误响应为JSON');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('7. 成功响应:', result);
      return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getAllInvoices() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getDefaultInvoice() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/default`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching default invoice:', error);
      throw error;
    }
  }

  async getInvoice(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id, invoiceData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // PDF generation functionality
  async generatePDF(id, options = {}) {
    try {
      const token = localStorage.getItem('token');
      console.log('=== PDF生成调试 ===');
      console.log('1. 发票ID:', id);
      console.log('2. API_BASE_URL:', API_BASE_URL);
      console.log('3. 完整URL:', `${API_BASE_URL}/api/invoices/${id}/pdf`);
      
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/pdf`, {
        method: 'GET',  // 改为GET方法
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('4. 响应状态:', response.status);
      console.log('5. 响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('6. 错误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Return PDF blob
      const blob = await response.blob();
      console.log('7. PDF blob大小:', blob.size, '字节');
      return blob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // XML generation functionality (Factur-X format)
  async generateXML(id, format = 'factur-x') {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/xml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error generating XML:', error);
      throw error;
    }
  }

  // Send invoice
  async sendInvoice(id, recipientData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recipientData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  // Get invoice statistics
  async getInvoiceStats(period = 'month') {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/invoices/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;
export { invoiceService };