import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { integrationService } from '../../services/integrationService';

const SyncStatusModal = ({ isOpen, onClose, integration }) => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && integration) {
      loadSyncStatus();
      if (autoRefresh) {
        startAutoRefresh();
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, integration, autoRefresh]);

  useEffect(() => {
    // 自动滚动到底部
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      loadSyncStatus();
    }, 2000); // 每2秒刷新一次
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const loadSyncStatus = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([
        integrationService.getSyncStatus(integration.id),
        integrationService.getSyncLogs(integration.id, { limit: 100 })
      ]);
      
      setSyncStatus(statusRes.data);
      setSyncLogs(logsRes.data || []);
      
      // 如果同步完成，停止自动刷新
      if (statusRes.data?.status && !['running', 'pending'].includes(statusRes.data.status)) {
        setAutoRefresh(false);
        stopAutoRefresh();
      }
    } catch (error) {
      console.error('加载同步状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRefresh = () => {
    const newAutoRefresh = !autoRefresh;
    setAutoRefresh(newAutoRefresh);
    
    if (newAutoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSyncStatus();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'success':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('integrations.syncStatus')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {integration?.platform} - {integration?.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleAutoRefresh}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {autoRefresh ? t('integrations.autoRefreshOn') : t('integrations.autoRefreshOff')}
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={t('integrations.refresh')}
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 状态概览 */}
        {syncStatus && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.status')}</p>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(syncStatus.status)}`}>
                      {getStatusIcon(syncStatus.status)}
                      <span className="ml-1">{t(`integrations.syncStatus.${syncStatus.status}`)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.progress')}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-900 dark:text-white mb-1">
                    <span>{syncStatus.processed || 0} / {syncStatus.total || 0}</span>
                    <span>{Math.round(((syncStatus.processed || 0) / (syncStatus.total || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(((syncStatus.processed || 0) / (syncStatus.total || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.duration')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {formatDuration(syncStatus.started_at, syncStatus.completed_at)}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('integrations.errors')}</p>
                <p className={`text-lg font-semibold mt-1 ${
                  (syncStatus.errors || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {syncStatus.errors || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 同步日志 */}
        <div className="flex-1 p-6 overflow-hidden">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('integrations.syncLogs')}
          </h3>
          
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {syncLogs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {loading ? t('integrations.loadingLogs') : t('integrations.noLogs')}
              </div>
            ) : (
              <div className="space-y-1">
                {syncLogs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-gray-500 text-xs mt-0.5 w-16 flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`text-xs font-medium w-16 flex-shrink-0 ${getLogLevelColor(log.level)}`}>
                      {log.level?.toUpperCase()}
                    </span>
                    <span className="text-gray-300 flex-1">
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {syncStatus?.started_at && (
                <span>
                  {t('integrations.startedAt')}: {new Date(syncStatus.started_at).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusModal;