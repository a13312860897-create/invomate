import api from './api';

class IntegrationService {
  // 获取支持的平台列表
  async getSupportedPlatforms() {
    const response = await api.get('/integrations/platforms');
    return response.data;
  }

  // 获取用户的所有集成
  async getIntegrations() {
    const response = await api.get('/integrations');
    return response.data;
  }

  // 获取单个集成详情
  async getIntegration(id) {
    const response = await api.get(`/integrations/${id}`);
    return response.data;
  }

  // 创建新集成
  async createIntegration(data) {
    const response = await api.post('/integrations', data);
    return response.data;
  }

  // 更新集成
  async updateIntegration(id, data) {
    const response = await api.put(`/integrations/${id}`, data);
    return response.data;
  }

  // 删除集成
  async deleteIntegration(id) {
    const response = await api.delete(`/integrations/${id}`);
    return response.data;
  }

  // 测试连接
  async testConnection(id) {
    const response = await api.post(`/integrations/${id}/test`);
    return response.data;
  }

  // 手动触发同步
  async triggerSync(id, options = {}) {
    const response = await api.post(`/integrations/${id}/sync`, options);
    return response.data;
  }

  // 获取同步状态
  async getSyncStatus(id) {
    const response = await api.get(`/integrations/${id}/sync/status`);
    return response.data;
  }

  // 获取同步日志
  async getSyncLogs(id, params = {}) {
    const response = await api.get(`/integrations/${id}/sync/logs`, { params });
    return response.data;
  }

  // 获取数据映射
  async getDataMapping(id) {
    const response = await api.get(`/integrations/${id}/mapping`);
    return response.data;
  }

  // 更新数据映射
  async updateDataMapping(id, mapping) {
    const response = await api.put(`/integrations/${id}/mapping`, { mapping });
    return response.data;
  }

  // OAuth相关方法
  async startOAuthFlow(platform, redirectUri) {
    const response = await api.post('/integrations/oauth/authorize', {
      platform,
      redirect_uri: redirectUri
    });
    return response.data;
  }

  async handleOAuthCallback(code, state) {
    const response = await api.post('/integrations/oauth/callback', {
      code,
      state
    });
    return response.data;
  }

  async refreshOAuthToken(id) {
    const response = await api.post(`/integrations/${id}/oauth/refresh`);
    return response.data;
  }

  // 获取集成统计信息
  async getIntegrationStats(id, period = '7d') {
    const response = await api.get(`/integrations/${id}/stats`, {
      params: { period }
    });
    return response.data;
  }

  // 获取所有集成的概览统计
  async getOverviewStats() {
    const response = await api.get('/integrations/stats/overview');
    return response.data;
  }

  // 暂停/恢复集成
  async pauseIntegration(id) {
    const response = await api.post(`/integrations/${id}/pause`);
    return response.data;
  }

  async resumeIntegration(id) {
    const response = await api.post(`/integrations/${id}/resume`);
    return response.data;
  }

  // 重置集成
  async resetIntegration(id) {
    const response = await api.post(`/integrations/${id}/reset`);
    return response.data;
  }

  // 导出集成配置
  async exportIntegrationConfig(id) {
    const response = await api.get(`/integrations/${id}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // 导入集成配置
  async importIntegrationConfig(file) {
    const formData = new FormData();
    formData.append('config', file);
    
    const response = await api.post('/integrations/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // 获取集成健康状态
  async getHealthStatus(id) {
    const response = await api.get(`/integrations/${id}/health`);
    return response.data;
  }

  // 获取错误报告
  async getErrorReports(id, params = {}) {
    const response = await api.get(`/integrations/${id}/errors`, { params });
    return response.data;
  }

  // 清除错误
  async clearErrors(id) {
    const response = await api.post(`/integrations/${id}/errors/clear`);
    return response.data;
  }

  // 获取同步历史
  async getSyncHistory(id, params = {}) {
    const response = await api.get(`/integrations/${id}/sync/history`, { params });
    return response.data;
  }

  // 取消正在进行的同步
  async cancelSync(id) {
    const response = await api.post(`/integrations/${id}/sync/cancel`);
    return response.data;
  }

  // 验证配置
  async validateConfig(platform, config) {
    const response = await api.post('/integrations/validate', {
      platform,
      config
    });
    return response.data;
  }

  // 获取平台特定的配置模板
  async getConfigTemplate(platform) {
    const response = await api.get(`/integrations/platforms/${platform}/template`);
    return response.data;
  }

  // 获取平台特定的字段映射选项
  async getFieldMappingOptions(platform) {
    const response = await api.get(`/integrations/platforms/${platform}/fields`);
    return response.data;
  }

  // 预览同步数据
  async previewSyncData(id, options = {}) {
    const response = await api.post(`/integrations/${id}/sync/preview`, options);
    return response.data;
  }

  // 批量操作
  async bulkOperation(operation, integrationIds, options = {}) {
    const response = await api.post('/integrations/bulk', {
      operation,
      integration_ids: integrationIds,
      options
    });
    return response.data;
  }

  // 获取Webhook配置
  async getWebhookConfig(id) {
    const response = await api.get(`/integrations/${id}/webhook`);
    return response.data;
  }

  // 更新Webhook配置
  async updateWebhookConfig(id, config) {
    const response = await api.put(`/integrations/${id}/webhook`, config);
    return response.data;
  }

  // 测试Webhook
  async testWebhook(id) {
    const response = await api.post(`/integrations/${id}/webhook/test`);
    return response.data;
  }

  // 获取API使用统计
  async getApiUsageStats(id, period = '24h') {
    const response = await api.get(`/integrations/${id}/usage`, {
      params: { period }
    });
    return response.data;
  }

  // 获取数据同步冲突
  async getSyncConflicts(id) {
    const response = await api.get(`/integrations/${id}/conflicts`);
    return response.data;
  }

  // 解决数据同步冲突
  async resolveSyncConflict(id, conflictId, resolution) {
    const response = await api.post(`/integrations/${id}/conflicts/${conflictId}/resolve`, {
      resolution
    });
    return response.data;
  }

  // 获取集成活动日志
  async getActivityLogs(id, params = {}) {
    const response = await api.get(`/integrations/${id}/activity`, { params });
    return response.data;
  }

  // 创建备份
  async createBackup(id) {
    const response = await api.post(`/integrations/${id}/backup`);
    return response.data;
  }

  // 恢复备份
  async restoreBackup(id, backupId) {
    const response = await api.post(`/integrations/${id}/restore`, {
      backup_id: backupId
    });
    return response.data;
  }

  // 获取备份列表
  async getBackups(id) {
    const response = await api.get(`/integrations/${id}/backups`);
    return response.data;
  }

  // 删除备份
  async deleteBackup(id, backupId) {
    const response = await api.delete(`/integrations/${id}/backups/${backupId}`);
    return response.data;
  }
}

// 创建单例实例
const integrationService = new IntegrationService();

export { integrationService };
export default integrationService;