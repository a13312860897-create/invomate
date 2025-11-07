import api from './api';

class NotificationService {
  // Get user notifications
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get notifications');
    }
  }

  // Send invoice email
  async sendInvoiceEmail(invoiceId, options = {}) {
    try {
      const response = await api.post(`/notifications/send-invoice/${invoiceId}`, options);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send invoice email');
    }
  }

  // Send payment reminder
  async sendPaymentReminder(invoiceId, reminderType = 'gentle') {
    try {
      const response = await api.post(`/notifications/payment-reminder/${invoiceId}`, {
        reminderType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
    }
  }

  // Batch send payment reminders
  async sendBulkPaymentReminders(invoiceIds, reminderType = 'gentle') {
    try {
      const response = await api.post('/notifications/bulk-payment-reminders', {
        invoiceIds,
        reminderType
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to batch send payment reminders');
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds) {
    try {
      const response = await api.put('/notifications/mark-read', {
        notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark notifications as read');
    }
  }

  // Get email sending history
  async getEmailHistory(params = {}) {
    try {
      const response = await api.get('/notifications/email-history', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get email history');
    }
  }

  // Test email configuration
  async testEmailConfiguration(testEmail) {
    try {
      const response = await api.post('/notifications/test-email', {
        email: testEmail
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to test email configuration');
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get notification statistics');
    }
  }

  // Send report email
  async sendReportEmail(reportType, params = {}) {
    try {
      const response = await api.post('/notifications/send-report', {
        reportType,
        ...params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send report email');
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;