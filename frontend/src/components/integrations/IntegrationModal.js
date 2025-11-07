import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { integrationService } from '../../services/integrationService';

const IntegrationModal = ({ isOpen, onClose, onSave, integration, platforms, mode }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    config: {},
    sync_enabled: true,
    sync_interval: 15
  });
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [step, setStep] = useState(1); // 1: 选择平台, 2: 配置参数, 3: 测试连接

  useEffect(() => {
    if (integration && mode === 'edit') {
      setFormData({
        name: integration.name || '',
        platform: integration.platform || '',
        config: integration.config || {},
        sync_enabled: integration.sync_enabled !== false,
        sync_interval: integration.sync_interval || 15
      });
      setStep(2); // 编辑模式直接跳到配置步骤
    } else {
      // 重置表单
      setFormData({
        name: '',
        platform: '',
        config: {},
        sync_enabled: true,
        sync_interval: 15
      });
      setStep(1);
    }
    setConnectionResult(null);
  }, [integration, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const handlePlatformSelect = (platform) => {
    setFormData(prev => ({
      ...prev,
      platform: platform.id,
      name: prev.name || `${platform.name} Integration`,
      config: platform.defaultConfig || {}
    }));
    setStep(2);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    
    try {
      // 如果是编辑模式且已有集成，直接测试
      if (mode === 'edit' && integration) {
        const result = await integrationService.testConnection(integration.id);
        setConnectionResult(result);
      } else {
        // 创建模式，先创建临时集成进行测试
        const tempIntegration = {
          ...formData,
          test_mode: true
        };
        const result = await integrationService.testIntegrationConfig(tempIntegration);
        setConnectionResult(result);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      setConnectionResult({
        success: false,
        error: error.message || t('integrations.connectionTestFailed')
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!formData.platform) {
      toast.error(t('integrations.selectPlatform'));
      return;
    }

    if (!formData.name.trim()) {
      toast.error(t('integrations.enterName'));
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('保存集成失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthStart = async (platform) => {
    try {
      const response = await integrationService.startOAuth(platform, {
        redirect_uri: `${window.location.origin}/integrations/oauth/callback`
      });
      
      if (response.auth_url) {
        // 打开OAuth授权窗口
        const authWindow = window.open(
          response.auth_url,
          'oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // 监听OAuth回调
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // 检查是否授权成功
            checkOAuthResult(response.state);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('启动OAuth失败:', error);
      toast.error(t('integrations.oauthStartFailed'));
    }
  };

  const checkOAuthResult = async (state) => {
    try {
      const result = await integrationService.checkOAuthResult(state);
      if (result.success) {
        // 更新配置
        setFormData(prev => ({
          ...prev,
          config: {
            ...prev.config,
            ...result.config
          }
        }));
        toast.success(t('integrations.oauthSuccess'));
        setStep(3); // 跳到测试连接步骤
      } else {
        toast.error(result.error || t('integrations.oauthFailed'));
      }
    } catch (error) {
      console.error('检查OAuth结果失败:', error);
      toast.error(t('integrations.oauthCheckFailed'));
    }
  };

  const renderPlatformSelection = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('integrations.selectPlatform')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handlePlatformSelect(platform)}
              className="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  platform.id === 'salesforce' ? 'bg-blue-500' :
                  platform.id === 'hubspot' ? 'bg-orange-500' :
                  platform.id === 'trello' ? 'bg-blue-600' :
                  platform.id === 'asana' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}>
                  <span className="text-white font-bold text-sm">
                    {platform.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{platform.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{platform.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderConfigurationForm = () => {
    const selectedPlatform = platforms.find(p => p.id === formData.platform);
    if (!selectedPlatform) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStep(1)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('integrations.configure')} {selectedPlatform.name}
          </h3>
        </div>

        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('integrations.integrationName')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('integrations.integrationNamePlaceholder')}
            />
          </div>

          {/* 平台特定配置 */}
          {selectedPlatform.authType === 'oauth' ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                {t('integrations.oauthAuth')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                {t('integrations.oauthDescription')}
              </p>
              <button
                onClick={() => handleOAuthStart(formData.platform)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t('integrations.startOAuth')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPlatform.configFields?.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'password' ? (
                    <input
                      type="password"
                      value={formData.config[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData.config[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required={field.required}
                    >
                      <option value="">{t('integrations.selectOption')}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData.config[field.name] || ''}
                      onChange={(e) => handleConfigChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                  {field.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {field.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 同步设置 */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('integrations.syncSettings')}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sync_enabled"
                  checked={formData.sync_enabled}
                  onChange={(e) => handleInputChange('sync_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sync_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('integrations.enableAutoSync')}
                </label>
              </div>
              {formData.sync_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('integrations.syncInterval')} ({t('integrations.minutes')})
                  </label>
                  <select
                    value={formData.sync_interval}
                    onChange={(e) => handleInputChange('sync_interval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={5}>5 {t('integrations.minutes')}</option>
                    <option value={15}>15 {t('integrations.minutes')}</option>
                    <option value={30}>30 {t('integrations.minutes')}</option>
                    <option value={60}>1 {t('integrations.hour')}</option>
                    <option value={240}>4 {t('integrations.hours')}</option>
                    <option value={1440}>24 {t('integrations.hours')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConnectionTest = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStep(2)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('integrations.testConnection')}
          </h3>
        </div>

        <div className="text-center py-8">
          {connectionResult ? (
            <div className={`p-4 rounded-lg ${
              connectionResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center justify-center mb-2">
                {connectionResult.success ? (
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h4 className="font-medium mb-1">
                {connectionResult.success ? t('integrations.connectionSuccess') : t('integrations.connectionFailed')}
              </h4>
              {connectionResult.message && (
                <p className="text-sm">{connectionResult.message}</p>
              )}
              {connectionResult.error && (
                <p className="text-sm">{connectionResult.error}</p>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('integrations.readyToTest')}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('integrations.testDescription')}
              </p>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                {testingConnection ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {testingConnection ? t('integrations.testing') : t('integrations.testConnection')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'edit' ? t('integrations.editIntegration') : t('integrations.addIntegration')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 步骤指示器 */}
          {mode === 'create' && (
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  1
                </div>
                <div className={`w-12 h-0.5 ${
                  step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  2
                </div>
                <div className={`w-12 h-0.5 ${
                  step >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  3
                </div>
              </div>
            </div>
          )}

          {/* 内容 */}
          <div className="mb-6">
            {mode === 'create' && step === 1 && renderPlatformSelection()}
            {(mode === 'edit' || step === 2) && renderConfigurationForm()}
            {step === 3 && renderConnectionTest()}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {t('common.cancel')}
            </button>
            {(mode === 'edit' || step === 2) && (
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                {t('integrations.testConnection')}
              </button>
            )}
            {(mode === 'edit' || step >= 2) && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center gap-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? t('common.saving') : t('common.save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationModal;