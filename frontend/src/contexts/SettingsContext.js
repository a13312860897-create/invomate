import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import settingsService from '../services/settingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从后端加载用户设置
  const loadSettings = useCallback(async () => {
    if (authLoading || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const profileData = await settingsService.getProfile();
      
      // 转换后端数据格式为统一格式
      // 优先从Company字段获取数据，如果不存在则从顶级字段获取
      const companyData = profileData.Company || {};
      const bankInfoData = (companyData.bankInfo || {});
      const unifiedSettings = {
        company: {
          name: companyData.name || profileData.companyName || '',
          address: companyData.address || profileData.address || '',
          city: companyData.city || profileData.city || '',
          postalCode: companyData.postalCode || profileData.postalCode || '',
          country: companyData.country || profileData.country || '',
          phone: companyData.phone || profileData.phone || '',
          email: companyData.email || profileData.email || '',
          vatNumber: companyData.vatNumber || profileData.vatNumber || '',
          siren: companyData.siren || profileData.siren || profileData.sirenNumber || '',
          siret: companyData.siret || profileData.siretNumber || '',
          legalForm: companyData.legalForm || profileData.legalForm || '',
          registeredCapital: companyData.capital || profileData.registeredCapital || '',
          rcsNumber: companyData.rcs || profileData.rcsNumber || '',
          nafCode: companyData.naf || profileData.nafCode || ''
        },
        user: {
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          language: profileData.language || 'fr',
          timezone: profileData.timezone || 'Europe/Paris'
        },
        bank: {
          iban: bankInfoData.iban || profileData.bankIBAN || '',
          bic: bankInfoData.bic || profileData.bankBIC || '',
          bankName: bankInfoData.bankName || profileData.bankName || '',
          accountHolder: bankInfoData.accountHolder || profileData.accountHolder || ''
        }
      };
      
      setSettings(unifiedSettings);
      
      // 同步到localStorage以保持兼容性
      localStorage.setItem('unifiedSettings', JSON.stringify(unifiedSettings));
      
      // 如果是法国用户，也同步到frenchCompanySettings
      if (profileData.country === 'France' || profileData.vatNumber) {
        const frenchSettings = {
          sellerCompanyName: profileData.companyName || '',
          sellerAddress: `${profileData.address || ''} ${profileData.city || ''} ${profileData.postalCode || ''}`.trim(),
          sellerVATNumber: profileData.vatNumber || '',
          sellerSIREN: profileData.sirenNumber || profileData.siren || '',
          sellerSIRET: profileData.siretNumber || '',
          sellerLegalForm: profileData.legalForm || '',
          sellerRegisteredCapital: profileData.registeredCapital || '',
          sellerRcsNumber: profileData.rcsNumber || '',
          sellerNafCode: profileData.nafCode || ''
        };
        localStorage.setItem('frenchCompanySettings', JSON.stringify(frenchSettings));
      }
      
    } catch (error) {
      console.error('加载设置失败:', error);
      setError(error.message);
      
      // 如果后端加载失败，尝试从localStorage恢复
      try {
        const savedSettings = localStorage.getItem('unifiedSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (localError) {
        console.error('从localStorage恢复设置失败:', localError);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // 更新设置
  const updateSettings = useCallback(async (updatedSettings) => {
    try {
      setLoading(true);
      setError(null);
      
      // 准备后端API数据格式
      const profileData = {
        firstName: updatedSettings.user?.firstName || settings?.user?.firstName || '',
        lastName: updatedSettings.user?.lastName || settings?.user?.lastName || '',
        companyName: updatedSettings.company?.name || settings?.company?.name || '',
        phone: updatedSettings.company?.phone || settings?.company?.phone || '',
        address: updatedSettings.company?.address || settings?.company?.address || '',
        city: updatedSettings.company?.city || settings?.company?.city || '',
        postalCode: updatedSettings.company?.postalCode || settings?.company?.postalCode || '',
        country: updatedSettings.company?.country || settings?.company?.country || '',
        vatNumber: updatedSettings.company?.vatNumber || settings?.company?.vatNumber || '',
        sirenNumber: updatedSettings.company?.siren || settings?.company?.siren || '',
        siretNumber: updatedSettings.company?.siret || settings?.company?.siret || '',
        rcsNumber: updatedSettings.company?.rcsNumber || settings?.company?.rcsNumber || '',
        nafCode: updatedSettings.company?.nafCode || settings?.company?.nafCode || '',
        legalForm: updatedSettings.company?.legalForm || settings?.company?.legalForm || '',
        registeredCapital: updatedSettings.company?.registeredCapital || settings?.company?.registeredCapital || '',
        language: updatedSettings.user?.language || settings?.user?.language || 'fr',
        timezone: updatedSettings.user?.timezone || settings?.user?.timezone || 'Europe/Paris',
        // 银行信息字段
        bankIBAN: updatedSettings.bank?.iban || settings?.bank?.iban || '',
        bankBIC: updatedSettings.bank?.bic || settings?.bank?.bic || '',
        bankName: updatedSettings.bank?.bankName || settings?.bank?.bankName || '',
        accountHolder: updatedSettings.bank?.accountHolder || settings?.bank?.accountHolder || ''
      };
      
      // 调用后端API更新
      const response = await settingsService.updateProfile(profileData);
      
      // 更新本地状态
      const newSettings = {
        company: {
          name: response.companyName || '',
          address: response.address || '',
          city: response.city || '',
          postalCode: response.postalCode || '',
          country: response.country || '',
          phone: response.phone || '',
          email: response.email || '',
          vatNumber: response.vatNumber || '',
          siren: response.siren || response.sirenNumber || '',
          siret: response.siretNumber || '',
          rcsNumber: response.rcsNumber || '',
          nafCode: response.nafCode || '',
          legalForm: response.legalForm || '',
          registeredCapital: response.registeredCapital || ''
        },
        user: {
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
          language: response.language || 'fr',
          timezone: response.timezone || 'Europe/Paris'
        },
        bank: {
          iban: response.bankIBAN || response.iban || '',
          bic: response.bankBIC || response.bic || '',
          bankName: response.bankName || '',
          accountHolder: response.accountHolder || ''
        }
      };
      
      setSettings(newSettings);
      
      // 同步到localStorage
      localStorage.setItem('unifiedSettings', JSON.stringify(newSettings));
      
      // 同步法国公司设置
      if (response.country === 'France' || response.vatNumber) {
        const frenchSettings = {
          sellerCompanyName: response.companyName || '',
          sellerAddress: `${response.address || ''} ${response.city || ''} ${response.postalCode || ''}`.trim(),
          sellerVATNumber: response.vatNumber || '',
          sellerSIREN: response.siren || response.sirenNumber || '',
          sellerSIRET: response.siretNumber || '',
          sellerLegalForm: response.legalForm || '',
          sellerRegisteredCapital: response.registeredCapital || '',
          sellerRcsNumber: response.rcsNumber || '',
          sellerNafCode: response.nafCode || ''
        };
        localStorage.setItem('frenchCompanySettings', JSON.stringify(frenchSettings));
      }
      
      return { success: true, data: newSettings };
      
    } catch (error) {
      console.error('更新设置失败:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // 获取公司设置（用于发票）
  const getCompanySettings = useCallback(() => {
    if (!settings?.company) {
      // 如果没有设置，尝试从localStorage获取
      try {
        const savedSettings = localStorage.getItem('unifiedSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          return parsed.company || {};
        }
      } catch (error) {
        console.error('从localStorage获取公司设置失败:', error);
      }
      return {};
    }
    return settings.company;
  }, [settings]);

  // 初始化加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 监听用户变化
  useEffect(() => {
    if (user && !authLoading) {
      loadSettings();
    }
  }, [user, authLoading, loadSettings]);

  const value = {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    getCompanySettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};