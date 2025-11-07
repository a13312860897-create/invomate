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
      
      // 确保返回一致的数据结构
      const data = response.data || {};
      return {
        monthlyData: data.monthlyData || [],
        totalRevenue: data.totalRevenue || 0,
        totalInvoices: data.totalInvoices || 0,
        success: data.success !== false, // 默认为true
        message: data.message || '收入报告获取成功'
      };
    } catch (error) {
      console.error('❌ [reportService] 收入报告API调用失败:', error);
      console.error('❌ [reportService] 错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // 返回默认数据结构，确保前端图表能正常渲染
      if (error.response?.status === 401) {
        console.warn('⚠️ [reportService] Token失效，返回默认数据结构');
      }
      
      return {
        monthlyData: [],
        totalRevenue: 0,
        totalInvoices: 0,
        success: false,
        message: error.response?.data?.message || '获取收入报告失败'
      };
    }
  }

  // 获取应收账款报告
  async getAccountsReceivableReport(params = {}) {
    try {
      const response = await api.get('/reports/accounts-receivable', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取应收账款报告失败');
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

  // 获取发票状态概览报告
  async getInvoiceStatusOverview(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/reports/invoice-status-overview?${params.toString()}`);
      
      // 将数组格式的statusBreakdown转换为对象格式
      const statusBreakdownArray = response.data.statusBreakdown || [];
      const statusBreakdownObject = {};
      
      statusBreakdownArray.forEach((item, index) => {
        statusBreakdownObject[index] = {
          count: item.count || 0,
          amount: item.amount || 0,
          status: item.status,
          percentage: item.percentage || 0
        };
      });
      
      return {
        summary: response.data.summary || {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          overdue: 0,
          cancelled: 0
        },
        statusBreakdown: statusBreakdownObject,
        monthlyTrends: response.data.monthlyTrends || [],
        statusDetails: response.data.statusBreakdown || []
      };
    } catch (error) {
      console.error('Error fetching invoice status overview:', error);
      throw error;
    }
  }
}

const reportService = new ReportService();
export default reportService;