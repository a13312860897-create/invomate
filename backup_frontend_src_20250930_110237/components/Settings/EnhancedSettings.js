import React, { useState, useEffect } from 'react';
import { 
  FiUser, FiMail, FiLock, FiDollarSign, FiSave, FiUpload, 
  FiTrash2, FiImage, FiBell, FiCreditCard, FiSettings,
  FiShield, FiDownload, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useUnifiedData } from '../../contexts/UnifiedDataContext';
import settingsService from '../../services/settingsService';
import notificationService from '../../services/notificationService';

const EnhancedSettings = () => {
  const { user, updateProfile } = useAuth();
  const { userProfile, updateUserProfile, loading: unifiedLoading } = useUnifiedData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // 个人资料表单
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    address: '',
    currency: 'EUR',
    vatNumber: '',
    sirenNumber: '',
    siretNumber: '',
    legalForm: '',
    registeredCapital: ''
  });
  
  // 密码表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 税务设置功能已移除
  

  

  
  // 显示密码
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // 如果统一数据管理中已有用户资料，直接使用
    if (userProfile) {
      setProfileForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        companyName: userProfile.companyName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        currency: userProfile.currency || 'EUR',
        vatNumber: userProfile.vatNumber || '',
        sirenNumber: userProfile.sirenNumber || '',
        siretNumber: userProfile.siretNumber || '',
        legalForm: userProfile.legalForm || '',
        registeredCapital: userProfile.registeredCapital || ''
      });
    } else {
      loadSettings();
    }
  }, [userProfile]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 加载个人资料
      const profile = await settingsService.getProfile();
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        companyName: profile.companyName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        currency: profile.currency || 'EUR',
        vatNumber: profile.vatNumber || '',
        sirenNumber: profile.siren || '',
        siretNumber: profile.siretNumber || '',
        legalForm: profile.legalForm || '',
        registeredCapital: profile.registeredCapital || ''
      });
      
      // 税务设置功能已移除
      
    } catch (err) {
      setError('加载设置失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // 使用统一数据管理更新用户资料
      await updateUserProfile(profileForm);
      setSuccess('个人资料更新成功');
      
      // 更新认证上下文中的用户信息
      if (updateProfile) {
        updateProfile(profileForm);
      }
      
    } catch (err) {
      setError('更新个人资料失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setSuccess('密码更改成功');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      setError('更改密码失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 税务设置提交函数已移除

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">个人资料</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名字
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓氏
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公司名称 {user?.invoiceMode === 'france' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({...profileForm, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={user?.invoiceMode === 'france' ? '营业执照上的完整公司名称' : ''}
                />
                {user?.invoiceMode === 'france' && (
                  <p className="mt-1 text-xs text-gray-500">必须与营业执照上的名称完全一致</p>
                )}
              </div>
              
              {/* 法国公司特有字段 */}
              {user?.invoiceMode === 'france' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">法国公司信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司法律形式
                      </label>
                      <select
                        value={profileForm.legalForm || ''}
                        onChange={(e) => setProfileForm({...profileForm, legalForm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择</option>
                        <option value="SAS">SAS (简化股份公司)</option>
                        <option value="SARL">SARL (有限责任公司)</option>
                        <option value="SA">SA (股份公司)</option>
                        <option value="EURL">EURL (单人有限责任公司)</option>
                        <option value="SNC">SNC (无限责任公司)</option>
                        <option value="Auto-entrepreneur">Auto-entrepreneur (个体经营者)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        注册资本 (EUR)
                      </label>
                      <input
                        type="number"
                        value={profileForm.registeredCapital || ''}
                        onChange={(e) => setProfileForm({...profileForm, registeredCapital: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="例如：10000"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电话号码
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    货币
                  </label>
                  <select
                    value={profileForm.currency}
                    onChange={(e) => setProfileForm({...profileForm, currency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EUR">欧元 (EUR)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="GBP">英镑 (GBP)</option>
                    <option value="EUR">欧元 (EUR)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT号码
                  </label>
                  <input
                    type="text"
                    value={profileForm.vatNumber}
                    onChange={(e) => setProfileForm({...profileForm, vatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="FR12345678901"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SIREN号码 {user?.invoiceMode === 'france' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={profileForm.sirenNumber}
                    onChange={(e) => setProfileForm({...profileForm, sirenNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789"
                    maxLength="9"
                  />
                  <p className="mt-1 text-xs text-gray-500">9位企业识别号码</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SIRET号码
                  </label>
                  <input
                    type="text"
                    value={profileForm.siretNumber}
                    onChange={(e) => setProfileForm({...profileForm, siretNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12345678901234"
                    maxLength="14"
                  />
                  <p className="mt-1 text-xs text-gray-500">14位机构识别号码</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  {loading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'password':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">更改密码</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  当前密码
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FiLock className="w-4 h-4" />
                  {loading ? '更改中...' : '更改密码'}
                </button>
              </div>
            </form>
          </div>
        );
        
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', name: '个人资料', icon: FiUser },
    { id: 'password', name: '密码', icon: FiLock }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">设置</h1>
          <p className="mt-2 text-gray-600">管理您的账户设置和偏好</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 侧边栏导航 */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          setError(null);
                          setSuccess(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          
          {/* 主内容区域 */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettings;