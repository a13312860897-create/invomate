import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import clientService from '../services/clientService';
import settingsService from '../services/settingsService';

// 统一数据管理上下文
const UnifiedDataContext = createContext();

// 统一数据提供者组件
export function UnifiedDataProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // 加载用户资料
  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const profile = await settingsService.getProfile();
      setUserProfile(profile);
      setError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // 加载客户列表
  const loadClients = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const clientsData = await clientService.getClients();
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setError(null);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // 更新用户资料
  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      const updatedProfile = await settingsService.updateProfile(profileData);
      setUserProfile(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 创建客户
  const createClient = async (clientData) => {
    try {
      setLoading(true);
      const newClient = await clientService.createClient(clientData);
      setClients(prevClients => [...prevClients, newClient]);
      setError(null);
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 更新客户
  const updateClient = async (clientId, clientData) => {
    try {
      setLoading(true);
      const updatedClient = await clientService.updateClient(clientId, clientData);
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId ? updatedClient : client
        )
      );
      setError(null);
      return updatedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 删除客户
  const deleteClient = async (clientId) => {
    try {
      setLoading(true);
      await clientService.deleteClient(clientId);
      setClients(prevClients => 
        prevClients.filter(client => client.id !== clientId)
      );
      setError(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 根据用户资料创建客户
  const createClientFromProfile = async (additionalData = {}) => {
    if (!userProfile) {
      throw new Error('用户资料未加载，请先完善个人资料');
    }

    const firstName = userProfile.firstName || '';
    const lastName = userProfile.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (!fullName) {
      throw new Error('请先在设置页面填写您的姓名信息');
    }

    const clientData = {
      name: fullName,
      company: userProfile.companyName || '',
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      city: userProfile.city || '',
      postalCode: userProfile.postalCode || '',
      country: userProfile.country || 'France',
      vatNumber: userProfile.vatNumber || '',
      siren: userProfile.sirenNumber || userProfile.siren || '',
      siret: userProfile.siretNumber || userProfile.siret || '',
      ...additionalData
    };

    return await createClient(clientData);
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 初始化数据加载
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
      loadClients();
    } else {
      setUserProfile(null);
      setClients([]);
      setError(null);
    }
  }, [isAuthenticated, user, loadUserProfile, loadClients]);

  // 提供的上下文值
  const contextValue = {
    // 状态
    userProfile,
    clients,
    loading,
    error,
    
    // 操作方法
    loadUserProfile,
    loadClients,
    updateUserProfile,
    createClient,
    updateClient,
    deleteClient,
    createClientFromProfile,
    clearError,
    
    // 工具方法
    refresh: () => {
      loadUserProfile();
      loadClients();
    }
  };

  return (
    <UnifiedDataContext.Provider value={contextValue}>
      {children}
    </UnifiedDataContext.Provider>
  );
}

// 自定义 Hook
export function useUnifiedData() {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  return context;
}

export default UnifiedDataContext;