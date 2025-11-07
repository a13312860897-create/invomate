import api from './api';

class DashboardService {
  // 获取仪表板统计数据
  async getStats() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式
      const response = await api.get(`/dashboard/stats?month=${currentMonth}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取统计数据失败');
    }
  }

  // 获取仪表板数据（包含最近发票和逾期发票）
  async getDashboardStats() {
    try {
      const response = await api.get('/invoices/stats/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // 获取发票状态分布数据
  async getInvoiceStatusDistribution() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式
      const response = await api.get(`/dashboard/unified-chart-data?month=${currentMonth}`);
      return response.data?.data?.statusDistribution || {};
    } catch (error) {
      console.error('Error fetching invoice status distribution:', error);
      throw error;
    }
  }

  // 获取月度收入趋势数据
  async getMonthlyRevenueTrend() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM格式
      const response = await api.get(`/dashboard/unified-chart-data?month=${currentMonth}`);
      return response.data?.data?.revenueTrend || {};
    } catch (error) {
      console.error('Error fetching monthly revenue trend:', error);
      throw error;
    }
  }



  // 获取通知数据
  async getNotifications(limit = 10) {
    try {
      console.log('=== 前端开始调用通知接口 ===');
      console.log('请求URL:', '/dashboard/notifications');
      console.log('请求参数:', { limit });
      
      const response = await api.get('/dashboard/notifications', { params: { limit } });
      
      console.log('通知接口响应:', response.data);
      return response.data;
    } catch (error) {
      console.error('获取通知失败:', error);
      throw error;
    }
  }

  // 获取仪表盘数据（保持向后兼容）
  async getDashboardData() {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取仪表盘数据失败');
    }
  }

  // 发送发票（从仪表板快速操作）
  async sendInvoice(invoiceId) {
    try {
      const response = await api.post(`/dashboard/send-invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '发送发票失败');
    }
  }

  // 标记发票为已支付（从仪表板快速操作）
  async markInvoiceAsPaid(invoiceId) {
    try {
      const response = await api.post(`/dashboard/mark-paid/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '标记发票为已支付失败');
    }
  }

  // 获取月度目标进度
  async getMonthlyGoalProgress() {
    try {
      const response = await api.get('/dashboard/monthly-goal-progress');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly goal progress:', error);
      throw error;
    }
  }

  // 获取客户活动
  async getClientActivity(limit = 10) {
    try {
      const response = await api.get('/dashboard/client-activity', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取客户活动失败');
    }
  }

  // 获取现金流预测
  async getCashFlowForecast(months = 3) {
    try {
      const response = await api.get('/dashboard/cash-flow-forecast', {
        params: { months }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取现金流预测失败');
    }
  }

  // 获取客户分析数据
  async getCustomerAnalytics(period = '6months') {
    try {
      const response = await api.get(`/dashboard/customer-analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  // Paddle支付相关接口
  async createPaddlePaymentLink(invoiceId, amount, currency = 'EUR') {
    try {
      const response = await api.post('/dashboard/paddle/create-payment-link', {
        invoiceId,
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Paddle payment link:', error);
      throw error;
    }
  }

  async getPaddlePaymentStatus(invoiceId) {
    try {
      const response = await api.get(`/dashboard/paddle/payment-status/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Paddle payment status:', error);
      throw error;
    }
  }

  async syncPaddlePayment(invoiceId) {
    try {
      const response = await api.post(`/dashboard/paddle/sync-payment/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error syncing Paddle payment:', error);
      throw error;
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;