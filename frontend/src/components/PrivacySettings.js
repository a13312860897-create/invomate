import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AdvancedFeaturesGuard } from './SubscriptionGuard';

const PrivacySettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    dataProcessingConsent: false,
    marketingConsent: false,
    analyticsConsent: false,
    dataRetentionPeriod: '7years',
    dataExportFormat: 'json',
    twoFactorEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [deletionConfirmation, setDeletionConfirmation] = useState('');

  useEffect(() => {
    loadPrivacySettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/privacy/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ settings: newSettings })
      });

      if (response.ok) {
        setSettings(newSettings);
        alert(t('privacy:settingsUpdated'));
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      alert(t('privacy:updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
  };

  const requestDataExport = async () => {
    setExportProgress({ status: 'preparing', progress: 0 });
    
    try {
      const response = await fetch('/api/privacy/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ format: settings.dataExportFormat })
      });

      if (response.ok) {
        const { exportId } = await response.json();
        pollExportStatus(exportId);
      } else {
        throw new Error('Failed to start data export');
      }
    } catch (error) {
      console.error('Error requesting data export:', error);
      setExportProgress({ status: 'error', message: t('privacy:exportError') });
    }
  };

  const pollExportStatus = async (exportId) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/privacy/export-status/${exportId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const { status, progress, downloadUrl } = await response.json();
          
          setExportProgress({ status, progress });
          
          if (status === 'completed') {
            setExportProgress({ status: 'completed', downloadUrl });
          } else if (status === 'processing') {
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking export status:', error);
        setExportProgress({ status: 'error', message: t('privacy:exportError') });
      }
    };
    
    checkStatus();
  };

  const requestDataDeletion = async () => {
    if (deletionConfirmation !== 'DELETE') {
      alert(t('privacy:deletionConfirmationError'));
      return;
    }

    try {
      const response = await fetch('/api/privacy/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ confirmation: deletionConfirmation })
      });

      if (response.ok) {
        alert(t('privacy:deletionRequested'));
        // 登出用户
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        throw new Error('Failed to request account deletion');
      }
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      alert(t('privacy:deletionError'));
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled 
          ? 'bg-gray-200 cursor-not-allowed'
          : enabled 
          ? 'bg-blue-600' 
          : 'bg-gray-200'
      }`}
      disabled={disabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const DataExportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('privacy:dataExport.title')}
            </h3>
            <button
              onClick={() => setShowDataExport(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {!exportProgress ? (
            <div>
              <p className="text-gray-600 mb-4">
                {t('privacy:dataExport.description')}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('privacy:dataExport.format')}
                </label>
                <select
                  value={settings.dataExportFormat}
                  onChange={(e) => setSettings({ ...settings, dataExportFormat: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDataExport(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={requestDataExport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {t('privacy:dataExport.start')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {exportProgress.status === 'preparing' && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('privacy:dataExport.preparing')}</p>
                </div>
              )}
              
              {exportProgress.status === 'processing' && (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('privacy:dataExport.processing')}</span>
                      <span>{exportProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {exportProgress.status === 'completed' && (
                <div className="text-center">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 mb-4">{t('privacy:dataExport.completed')}</p>
                  <a
                    href={exportProgress.downloadUrl}
                    download
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    {t('privacy:dataExport.download')}
                  </a>
                </div>
              )}
              
              {exportProgress.status === 'error' && (
                <div className="text-center">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-600 mb-4">{exportProgress.message}</p>
                  <button
                    onClick={() => setExportProgress(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                  >
                    {t('common:close')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const DataDeletionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-red-600">
              {t('privacy:dataDeletion.title')}
            </h3>
            <button
              onClick={() => setShowDataDeletion(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    {t('privacy:dataDeletion.warning')}
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {t('privacy:dataDeletion.warningDescription')}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">
              {t('privacy:dataDeletion.description')}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('privacy:dataDeletion.confirmationLabel')}
              </label>
              <input
                type="text"
                value={deletionConfirmation}
                onChange={(e) => setDeletionConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('privacy:dataDeletion.confirmationHint')}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowDataDeletion(false);
                setDeletionConfirmation('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common:cancel')}
            </button>
            <button
              onClick={requestDataDeletion}
              disabled={deletionConfirmation !== 'DELETE'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('privacy:dataDeletion.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('privacy:title')}
        </h1>
        <p className="text-gray-600">
          {t('privacy:subtitle')}
        </p>
      </div>

      {/* 数据处理同意 */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('privacy:dataProcessing.title')}
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataProcessing.essential')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataProcessing.essentialDescription')}
              </p>
            </div>
            <ToggleSwitch 
              enabled={true} 
              onChange={() => {}} 
              disabled={true}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataProcessing.marketing')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataProcessing.marketingDescription')}
              </p>
            </div>
            <ToggleSwitch 
              enabled={settings.marketingConsent} 
              onChange={(value) => handleSettingChange('marketingConsent', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataProcessing.analytics')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataProcessing.analyticsDescription')}
              </p>
            </div>
            <ToggleSwitch 
              enabled={settings.analyticsConsent} 
              onChange={(value) => handleSettingChange('analyticsConsent', value)}
            />
          </div>
        </div>
      </div>

      {/* 数据保留 */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('privacy:dataRetention.title')}
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataRetention.period')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataRetention.description')}
              </p>
            </div>
            <select
              value={settings.dataRetentionPeriod}
              onChange={(e) => handleSettingChange('dataRetentionPeriod', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
              disabled={saving}
            >
              <option value="1year">{t('privacy:dataRetention.1year')}</option>
              <option value="3years">{t('privacy:dataRetention.3years')}</option>
              <option value="7years">{t('privacy:dataRetention.7years')}</option>
              <option value="indefinite">{t('privacy:dataRetention.indefinite')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 安全设置 */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('privacy:security.title')}
          </h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:security.twoFactor')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:security.twoFactorDescription')}
              </p>
            </div>
            <ToggleSwitch 
              enabled={settings.twoFactorEnabled} 
              onChange={(value) => handleSettingChange('twoFactorEnabled', value)}
            />
          </div>
        </div>
      </div>

      {/* 数据权利 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('privacy:dataRights.title')}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataRights.export')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataRights.exportDescription')}
              </p>
            </div>
            <AdvancedFeaturesGuard>
              <button
                onClick={() => setShowDataExport(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {t('privacy:dataRights.exportButton')}
              </button>
            </AdvancedFeaturesGuard>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {t('privacy:dataRights.delete')}
              </h4>
              <p className="text-sm text-gray-500">
                {t('privacy:dataRights.deleteDescription')}
              </p>
            </div>
            <button
              onClick={() => setShowDataDeletion(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              {t('privacy:dataRights.deleteButton')}
            </button>
          </div>
        </div>
      </div>

      {/* 模态框 */}
      {showDataExport && <DataExportModal />}
      {showDataDeletion && <DataDeletionModal />}
    </div>
  );
};

export default PrivacySettings;