import api from './api';

class NotificationService {
  // 获取用户通知
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取通知失败');
    }
  }

  // 发送发票邮件
  async sendInvoiceEmail(invoiceId, options = {}) {
    try {
      const response = await api.post(`/notifications/send-invoice/${invoiceId}`, options);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '发送发票邮件失败');
    }
  }

  // 发送付款提醒
  async sendPaymentReminder(invoiceId, reminderType = 'gentle') {
    try {
      const response = await api.post(`/notifications/payment-reminder/${invoiceId}`, {
        reminderType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '发送付款提醒失败');
    }
  }

  // 批量发送付款提醒
  async sendBulkPaymentReminders(invoiceIds, reminderType = 'gentle') {
    try {
      const response = await api.post('/notifications/bulk-payment-reminders', {
        invoiceIds,
        reminderType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '批量发送付款提醒失败');
    }
  }

  // 标记通知为已读
  async markAsRead(notificationIds) {
    try {
      const response = await api.put('/notifications/mark-read', {
        notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '标记通知为已读失败');
    }
  }

  // 获取邮件发送历史
  async getEmailHistory(params = {}) {
    try {
      const response = await api.get('/notifications/email-history', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取邮件历史失败');
    }
  }

  // 测试邮件配置
  async testEmailConfiguration(testEmail) {
    try {
      const response = await api.post('/notifications/test-email', {
        email: testEmail
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '测试邮件配置失败');
    }
  }

  // 获取通知统计
  async getNotificationStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取通知统计失败');
    }
  }

  // 发送报告邮件
  async sendReportEmail(reportType, params = {}) {
    try {
      const response = await api.post('/notifications/send-report', {
        reportType,
        ...params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '发送报告邮件失败');
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;