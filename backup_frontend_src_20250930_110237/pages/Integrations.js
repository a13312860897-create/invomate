import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import IntegrationCard from '../components/integrations/IntegrationCard';
import IntegrationModal from '../components/integrations/IntegrationModal';
import SyncStatusModal from '../components/integrations/SyncStatusModal';
import { integrationService } from '../services/integrationService';
import LoadingSpinner from '../components/LoadingSpinner';

const Integrations = () => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, platformsRes] = await Promise.all([
        integrationService.getIntegrations(),
        integrationService.getSupportedPlatforms()
      ]);
      
      setIntegrations(integrationsRes.data || []);
      setPlatforms(platformsRes.data || []);
    } catch (error) {
      console.error('加载集成数据失败:', error);
      toast.error(t('integrations.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEditIntegration = (integration) => {
    setSelectedIntegration(integration);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!window.confirm(t('integrations.confirmDelete'))) {
      return;
    }

    try {
      await integrationService.deleteIntegration(integrationId);
      toast.success(t('integrations.deleteSuccess'));
      loadData();
    } catch (error) {
      console.error('删除集成失败:', error);
      toast.error(t('integrations.deleteError'));
    }
  };

  const handleTestConnection = async (integrationId) => {
    try {
      const response = await integrationService.testConnection(integrationId);
      if (response.success) {
        toast.success(t('integrations.connectionSuccess'));
      } else {
        toast.error(t('integrations.connectionError') + ': ' + response.error);
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      toast.error(t('integrations.connectionError'));
    }
  };

  const handleSync = async (integrationId) => {
    try {
      const response = await integrationService.triggerSync(integrationId);
      if (response.success) {
        toast.success(t('integrations.syncStarted'));
        // 显示同步状态模态框
        const integration = integrations.find(i => i.id === integrationId);
        setSelectedIntegration(integration);
        setShowSyncModal(true);
      } else {
        toast.error(t('integrations.syncError') + ': ' + response.error);
      }
    } catch (error) {
      console.error('同步失败:', error);
      toast.error(t('integrations.syncError'));
    }
  };

  const handleModalSave = async (integrationData) => {
    try {
      if (modalMode === 'create') {
        await integrationService.createIntegration(integrationData);
        toast.success(t('integrations.createSuccess'));
      } else {
        await integrationService.updateIntegration(selectedIntegration.id, integrationData);
        toast.success(t('integrations.updateSuccess'));
      }
      
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('保存集成失败:', error);
      toast.error(modalMode === 'create' ? t('integrations.createError') : t('integrations.updateError'));
    }
  };

  const getIntegrationsByStatus = (status) => {
    return integrations.filter(integration => integration.status === status);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const activeIntegrations = getIntegrationsByStatus('active');
  const inactiveIntegrations = getIntegrationsByStatus('inactive');
  const errorIntegrations = getIntegrationsByStatus('error');

  return (
    <div className="p-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('integrations.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('integrations.description')}
          </p>
        </div>
        <button
          onClick={handleCreateIntegration}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('integrations.addIntegration')}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.active')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{activeIntegrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.inactive')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{inactiveIntegrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.errors')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{errorIntegrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.total')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{integrations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 集成列表 */}
      {integrations.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('integrations.noIntegrations')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('integrations.noIntegrationsDesc')}</p>
          <div className="mt-6">
            <button
              onClick={handleCreateIntegration}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('integrations.addFirstIntegration')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={handleEditIntegration}
              onDelete={handleDeleteIntegration}
              onTest={handleTestConnection}
              onSync={handleSync}
            />
          ))}
        </div>
      )}

      {/* 集成配置模态框 */}
      {showModal && (
        <IntegrationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
          integration={selectedIntegration}
          platforms={platforms}
          mode={modalMode}
        />
      )}

      {/* 同步状态模态框 */}
      {showSyncModal && (
        <SyncStatusModal
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          integration={selectedIntegration}
        />
      )}
    </div>
  );
};

export default Integrations;