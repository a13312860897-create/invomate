import React from 'react';
import { useTranslation } from 'react-i18next';

const IntegrationCard = ({ integration, onEdit, onDelete, onTest, onSync }) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'inactive':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'syncing':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'inactive':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'syncing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'salesforce':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
        );
      case 'hubspot':
        return (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HS</span>
          </div>
        );
      case 'trello':
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TR</span>
          </div>
        );
      case 'asana':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AS</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('integrations.never');
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* 头部 - 平台图标和状态 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getPlatformIcon(integration.platform)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {integration.platform}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {integration.name || t('integrations.defaultName', { platform: integration.platform })}
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
            {getStatusIcon(integration.status)}
            <span className="ml-1">{t(`integrations.status.${integration.status}`)}</span>
          </div>
        </div>

        {/* 同步信息 */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('integrations.lastSync')}:</span>
            <span className="text-gray-900 dark:text-white">{formatDate(integration.last_sync_at)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('integrations.syncStatus')}:</span>
            <span className={`font-medium ${
              integration.sync_status === 'success' ? 'text-green-600 dark:text-green-400' :
              integration.sync_status === 'error' ? 'text-red-600 dark:text-red-400' :
              integration.sync_status === 'running' ? 'text-blue-600 dark:text-blue-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {t(`integrations.syncStatus.${integration.sync_status || 'none'}`)}
            </span>
          </div>
          {integration.sync_error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {integration.sync_error}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {integration.sync_stats?.total_synced || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('integrations.totalSynced')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {integration.sync_stats?.last_batch_size || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t('integrations.lastBatch')}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={() => onTest(integration.id)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
            disabled={integration.status === 'syncing'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('integrations.test')}
          </button>
          
          <button
            onClick={() => onSync(integration.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
            disabled={integration.status === 'syncing' || integration.status === 'error'}
          >
            {integration.status === 'syncing' ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {integration.status === 'syncing' ? t('integrations.syncing') : t('integrations.sync')}
          </button>
        </div>

        {/* 更多操作菜单 */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('integrations.created')}: {formatDate(integration.created_at)}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(integration)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={t('integrations.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(integration.id)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title={t('integrations.delete')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;