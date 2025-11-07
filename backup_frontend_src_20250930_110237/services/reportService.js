import api from './api';

class ReportService {
  // 获取收入报告
  async getRevenueReport(params = {}) {
    try {
      console.log('🔍 [reportService] 调用 getRevenueReport，参数:', params);
      console.log('🔍 [reportService] API baseURL:', api.defaults.baseURL);
      
      const response = await api.get('/reports/revenue', { params });
      
      console.log('✅ [reportService] 收入报告API响应成功');
      console.log('📊 [reportService] 响应数据:', response.data);
      console.log('📊 [reportService] monthlyData长度:', response.data?.monthlyData?.length);
      
      return response.data;
    } catch (error) {
      console.error('❌ [reportService] 收入报告API调用失败:', error);
      console.error('❌ [reportService] 错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  // 获取客户报告
  async getClientReport(params = {}) {
    try {
      const response = await api.get('/reports/clients', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取客户报告失败');
    }
  }

  // 获取税务报告
  async getTaxReport(params = {}) {
    try {
      const response = await api.get('/reports/tax', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取税务报告失败');
    }
  }

  // 导出发票数据为CSV
  async exportInvoicesCSV(params = {}) {
    try {
      const response = await api.get('/reports/export/csv', {
        params,
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 从响应头获取文件名，或使用默认名称
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'invoices_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error(error.response?.data?.message || '导出CSV失败');
    }
  }

  // 生成PDF报告
  async generatePDFReport(reportType, params = {}) {
    try {
      const response = await api.post('/reports/pdf', {
        reportType,
        ...params
      }, {
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 从响应头获取文件名，或使用默认名称
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${reportType}_report.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error(error.response?.data?.message || '生成PDF报告失败');
    }
  }

  // 获取发票状态统计
  async getInvoiceStatusStats(params = {}) {
    try {
      const response = await api.get('/reports/invoice-status', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取发票状态统计失败');
    }
  }

  // 获取基础报告数据（保持向后兼容）
  async getReportData(params = {}) {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取报告数据失败');
    }
  }

  // 获取客户价值分析
  async getClientValueAnalysis(params = {}) {
    try {
      const response = await api.get('/reports/clients/value-analysis', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取客户价值分析失败');
    }
  }

  // 获取逾期发票报告
  async getOverdueInvoicesReport(params = {}) {
    try {
      const response = await api.get('/reports/overdue-invoices', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取逾期发票报告失败');
    }
  }

  // 导出收入CSV报告
  async exportRevenueCSV(params = {}) {
    try {
      const response = await api.get('/reports/export/revenue-csv', {
        params,
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 从响应头获取文件名，或使用默认名称
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'revenue_report.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/); 
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error(error.response?.data?.message || '导出收入CSV失败');
    }
  }
}

export default new ReportService();