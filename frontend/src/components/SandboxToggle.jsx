import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SandboxToggle = () => {
  const { t } = useTranslation(['common', 'sandbox']);
  const { user } = useAuth();
  const [isSandbox, setIsSandbox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 从用户设置加载沙盒模式状态
  useEffect(() => {
    if (user && user.settings) {
      setIsSandbox(user.settings.sandboxMode || false);
    }
  }, [user]);

  // 切换沙盒模式
  const toggleSandbox = async () => {
    setIsLoading(true);
    try {
      const newSandboxState = !isSandbox;
      setIsSandbox(newSandboxState);
      
      // 更新用户设置
      await api.put('/auth/profile', {
        settings: {
          ...user.settings,
          sandboxMode: newSandboxState
        }
      });
      
      // 保存到本地存储
      localStorage.setItem('sandboxMode', JSON.stringify(newSandboxState));
      
      // 刷新页面以应用新设置
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error(t('common:sandbox.toggleError'), error);
      // 恢复原始状态
      setIsSandbox(!isSandbox);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sandbox-toggle-container p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{t('common:sandbox.title')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isSandbox ? t('common:sandbox.activeDescription') : t('common:sandbox.inactiveDescription')}
          </p>
        </div>
        
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isSandbox}
              onChange={toggleSandbox}
              disabled={isLoading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">
              {isLoading ? t('common:loading') : (isSandbox ? t('common:sandbox.on') : t('common:sandbox.off'))}
            </span>
          </label>
        </div>
      </div>
      
      {isSandbox && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{t('common:sandbox.warningTitle')}</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{t('common:sandbox.warningMessage')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>{t('common:sandbox.learnMore')} <a href="https://docs.invomate.app/sandbox" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{t('common:sandbox.documentation')}</a></p>
      </div>
    </div>
  );
};

export default SandboxToggle;