import api from './api';

class SettingsService {
  // 获取用户个人资料
  async getProfile() {
    try {
      const response = await api.get('/settings/profile');
      return response.data.data; // 返回实际的用户数据
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取个人资料失败');
    }
  }

  // 更新用户个人资料
  async updateProfile(profileData) {
    try {
      const response = await api.put('/settings/profile', profileData);
      return response.data.data; // 返回实际的用户数据
    } catch (error) {
      throw new Error(error.response?.data?.message || '更新个人资料失败');
    }
  }

  // 更改密码
  async changePassword(passwordData) {
    try {
      const response = await api.put('/settings/password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '更改密码失败');
    }
  }

  // 税务设置功能已移除

  // 获取订阅信息
  async getSubscription() {
    try {
      const response = await api.get('/settings/subscription');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取订阅信息失败');
    }
  }

  // 升级订阅
  async upgradeSubscription(planData) {
    try {
      const response = await api.post('/settings/subscription/upgrade', planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '升级订阅失败');
    }
  }

  // 取消订阅
  async cancelSubscription() {
    try {
      const response = await api.post('/settings/subscription/cancel');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '取消订阅失败');
    }
  }

  // 获取通知设置
  async getNotificationSettings() {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '获取通知设置失败');
    }
  }

  // 更新通知设置
  async updateNotificationSettings(notificationData) {
    try {
      const response = await api.put('/notifications', notificationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '更新通知设置失败');
    }
  }

  // 删除账户
  async deleteAccount(confirmationData) {
    try {
      const response = await api.delete('/settings/account', {
        data: confirmationData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || '删除账户失败');
    }
  }
}

export default new SettingsService();