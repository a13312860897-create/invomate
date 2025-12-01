import React, { useState, useEffect } from 'react';
import { getCommonTimezones } from '../../utils/timezone';
import { 
  FiUser, FiMail, FiLock, FiDollarSign, FiSave, FiUpload, 
  FiTrash2, FiImage, FiBell, FiCreditCard, FiSettings,
  FiShield, FiDownload, FiEye, FiEyeOff, FiGlobe
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUnifiedData } from '../../contexts/UnifiedDataContext';
import settingsService from '../../services/settingsService';
import notificationService from '../../services/notificationService';
import api from '../../services/api';
import LanguageSelector from './LanguageSelector';
import { getVATFormatDescription } from '../../utils/vatValidator';

const EnhancedSettings = () => {
  const { user, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, loading: unifiedLoading } = useUnifiedData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    currency: 'EUR',
    timezone: 'Europe/Paris', // default timezone
    vatNumber: '',
    sirenNumber: '',
    siretNumber: '',
    legalForm: '',
    registeredCapital: '',
    rcsNumber: '',
    nafCode: '',
    // Bank information fields
    bankIBAN: '',
    bankBIC: '',
    bankName: '',
    accountHolder: '',
    peppolId: ''
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Tax settings removed
  

  

  
  // Show password toggles
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Field validation function
  const validateField = (fieldName, value) => {
    const errors = {};
    
    switch (fieldName) {
      case 'sirenNumber':
        if (value && !/^[0-9]{9}$/.test(value)) {
          errors.sirenNumber = 'SIREN must be 9 digits';
        }
        break;
      case 'siretNumber':
        if (value && !/^[0-9]{14}$/.test(value)) {
          errors.siretNumber = 'SIRET must be 14 digits';
        }
        break;
      case 'rcsNumber':
        if (value && !/^RCS\s+[A-Z]+\s+[0-9\s]+$/.test(value)) {
          errors.rcsNumber = 'RCS format: RCS + city + number (e.g., RCS PARIS 123 456 789)';
        }
        break;
      case 'nafCode':
        if (value && !/^[0-9]{4}[A-Z]$/.test(value)) {
          errors.nafCode = 'NAF code format: 4 digits + 1 letter (e.g., 6201Z)';
        }
        break;
      case 'bankIBAN':
        if (value && !/^FR[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{3}$/.test(value.replace(/\s/g, ''))) {
          errors.bankIBAN = 'IBAN format: FR + 2 digits + 23 digits (e.g., FR76 1234 5678 9012 3456 7890 123)';
        }
        break;
      case 'bankBIC':
        if (value && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value)) {
          errors.bankBIC = 'BIC format: 6 letters + 2 letters or digits + optional 3 letters or digits (e.g., BNPAFRPPXXX)';
        }
        break;
    }
    
    return errors;
  };

  // 处理字段变更并验证
  const handleFieldChange = (fieldName, value) => {
    setProfileForm({...profileForm, [fieldName]: value});
    
    // 实时验证
    const fieldValidationErrors = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: fieldValidationErrors[fieldName] || null
    }));
    
    // 清除成功消息
    if (success) setSuccess(null);
  };

  useEffect(() => {
    if (userProfile) {
      let merged = userProfile;
      try {
        const rp = localStorage.getItem('registrationProfile');
        if (rp) merged = { ...merged, ...JSON.parse(rp) };
      } catch (_) {}
      setProfileForm({
        firstName: merged.firstName || '',
        lastName: merged.lastName || '',
        email: merged.email || '',
        companyName: merged.companyName || '',
        phone: merged.phone || '',
        address: merged.address || '',
        city: merged.city || '',
        postalCode: merged.postalCode || '',
        country: merged.country || '',
        currency: merged.currency || 'EUR',
        timezone: merged.timezone || 'Europe/Paris',
        vatNumber: merged.vatNumber || '',
        sirenNumber: merged.siren || merged.sirenNumber || '',
        siretNumber: merged.siretNumber || '',
        legalForm: merged.legalForm || '',
        registeredCapital: merged.registeredCapital || '',
        rcsNumber: merged.rcsNumber || '',
        nafCode: merged.nafCode || '',
        bankIBAN: merged.bankIBAN || '',
        bankBIC: merged.bankBIC || '',
        bankName: merged.bankName || '',
        accountHolder: merged.accountHolder || '',
        peppolId: merged.peppolId || ''
      });
    } else {
      loadSettings();
    }
  }, [userProfile]);

  // 根据 URL 查询参数设置当前标签，如 /settings?tab=email
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 加载个人资料
      const profile = await settingsService.getProfile();
      let merged = profile;
      try {
        const rp = localStorage.getItem('registrationProfile');
        if (rp) merged = { ...merged, ...JSON.parse(rp) };
      } catch (_) {}
      setProfileForm({
        firstName: merged.firstName || '',
        lastName: merged.lastName || '',
        email: merged.email || '',
        companyName: merged.companyName || '',
        phone: merged.phone || '',
        address: merged.address || '',
        city: merged.city || '',
        postalCode: merged.postalCode || '',
        country: merged.country || '',
        currency: merged.currency || 'EUR',
        timezone: merged.timezone || 'Europe/Paris',
        vatNumber: merged.vatNumber || '',
        sirenNumber: merged.siren || '',
        siretNumber: merged.siretNumber || '',
        legalForm: merged.legalForm || '',
        registeredCapital: merged.registeredCapital || '',
        rcsNumber: merged.rcsNumber || '',
        nafCode: merged.nafCode || '',
        bankIBAN: merged.bankIBAN || '',
        bankBIC: merged.bankBIC || '',
        bankName: merged.bankName || '',
        accountHolder: merged.accountHolder || '',
        peppolId: merged.peppolId || ''
      });
      
      // 税务设置功能已移除
      // 加载用户邮件配置
      try {
        const cfg = await settingsService.getEmailConfig();
        if (cfg) {
          setEmailConfig(prev => ({
            ...prev,
            email: cfg.email || prev.email,
            provider: cfg.provider || prev.provider,
            smtpHost: cfg.smtpHost || prev.smtpHost,
            smtpPort: typeof cfg.smtpPort === 'number' ? cfg.smtpPort : prev.smtpPort,
            smtpSecure: typeof cfg.smtpSecure === 'boolean' ? cfg.smtpSecure : prev.smtpSecure,
            isActive: typeof cfg.isActive === 'boolean' ? cfg.isActive : prev.isActive
          }));
          if (cfg.isVerified) {
            setVerifyStatus({ ok: true, message: 'User SMTP verified' });
          }
        }
      } catch (e) {
        console.warn('加载邮件配置失败:', e.message);
      }
      
    } catch (err) {
      setError('Failed to load settings: ' + err.message);
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
      setSuccess('Profile updated successfully');
      
      // 更新认证上下文中的用户信息
      if (updateProfile) {
        updateProfile(profileForm);
      }
      
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email configuration form state and actions
  const [emailConfig, setEmailConfig] = useState({
    email: user?.email || '',
    provider: 'custom',
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    password: '',
    isActive: true
  });
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [emailMsg, setEmailMsg] = useState(null);

  const presetProviders = {
    '163': { smtpHost: 'smtp.163.com', smtpPort: 465, smtpSecure: true },
    'qq': { smtpHost: 'smtp.qq.com', smtpPort: 465, smtpSecure: true },
    'gmail': { smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpSecure: true },
    'outlook': { smtpHost: 'smtp.office365.com', smtpPort: 587, smtpSecure: false },
    'orange': { smtpHost: 'smtp.orange.fr', smtpPort: 465, smtpSecure: true },
    'free': { smtpHost: 'smtp.free.fr', smtpPort: 587, smtpSecure: false },
    'sfr': { smtpHost: 'smtp.sfr.fr', smtpPort: 465, smtpSecure: true },
    'laposte': { smtpHost: 'smtp.laposte.net', smtpPort: 465, smtpSecure: true },
    'ovh': { smtpHost: 'smtp.ovh.net', smtpPort: 587, smtpSecure: false },
    'gandi': { smtpHost: 'mail.gandi.net', smtpPort: 587, smtpSecure: false },
    'brevo': { smtpHost: 'smtp-relay.brevo.com', smtpPort: 587, smtpSecure: false },
    'mailjet': { smtpHost: 'smtp.mailjet.com', smtpPort: 587, smtpSecure: false },
    'proton-bridge': { smtpHost: '127.0.0.1', smtpPort: 1025, smtpSecure: false },
    'yahoo': { smtpHost: 'smtp.mail.yahoo.com', smtpPort: 465, smtpSecure: true },
    'custom': { smtpHost: '', smtpPort: 465, smtpSecure: true }
  };

  const applyProviderPreset = (provider) => {
    const preset = presetProviders[provider] || presetProviders.custom;
    setEmailConfig(prev => ({ ...prev, provider, ...preset }));
  };

  const handleSaveEmailConfig = async (e) => {
    e?.preventDefault();
    setEmailMsg(null);
    // 基本校验
    if (!emailConfig.email) {
      setEmailMsg({ type: 'error', text: '请输入发件邮箱地址' });
      return;
    }
    if (!emailConfig.smtpHost) {
      setEmailMsg({ type: 'error', text: '请输入SMTP服务器地址' });
      return;
    }
    if (!emailConfig.password) {
      setEmailMsg({ type: 'error', text: '请输入邮箱授权码或密码' });
      return;
    }
    try {
      const saved = await settingsService.saveEmailConfig(emailConfig);
      setEmailMsg({ type: 'success', text: '邮件配置已保存' });
      if (saved?.isVerified) {
        setVerifyStatus({ ok: true, message: 'User SMTP verified' });
      }
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message || '保存失败' });
    }
  };

  const handleTestEmail = async () => {
    setEmailMsg(null);
    try {
      const res = await notificationService.testEmailConfiguration(testEmail);
      const ok = res?.success || res?.status === 'ok';
      setEmailMsg({ type: ok ? 'success' : 'error', text: ok ? 'Test email sent. Please check your inbox.' : 'Sending failed. Please check related data.' });
    } catch (err) {
      setEmailMsg({ type: 'error', text: 'Sending failed. Please check related data.' });
    }
  };

  const handleVerifyServerConfig = async () => {
    setVerifyStatus(null);
    try {
      const res = await settingsService.verifyEmailConfig(emailConfig);
      setVerifyStatus({ ok: !!res?.ok, message: res?.message });
    } catch (err) {
      setVerifyStatus({ ok: false, message: err?.message || '验证失败' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      setError('Failed to change password: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Settings</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-8">
              
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={profileForm.currency}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="CNY">Chinese Yuan (CNY)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Zone
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {getCommonTimezones().map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Category 1 (Required)</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={profileForm.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={profileForm.postalCode}
                      onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
                  <h3 className="text-lg font-medium text-blue-900">Category 2 (Selectively Required)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TVA Number</label>
                    <div>
                      <input
                        type="text"
                        value={profileForm.vatNumber}
                        onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.vatNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      />
                      <p className="mt-1 text-xs text-gray-500">{getVATFormatDescription(profileForm.country || 'FR')}</p>
                      <p className="mt-1 text-xs text-gray-500">Optional. Only for businesses registered for VAT. If you are VAT-exempt, leave empty and use “TVA non applicable, art. 293 B du CGI”.</p>
                    </div>
                    {fieldErrors.vatNumber && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.vatNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
                    <input
                      type="text"
                      value={profileForm.sirenNumber}
                      onChange={(e) => handleFieldChange('sirenNumber', e.target.value)}
                      maxLength={9}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.sirenNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    />
                    {fieldErrors.sirenNumber && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.sirenNumber}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">9-digit company identifier</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                      <input
                        type="text"
                        value={profileForm.siretNumber}
                        onChange={(e) => handleFieldChange('siretNumber', e.target.value)}
                        maxLength={14}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.siretNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      />
                      {fieldErrors.siretNumber && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.siretNumber}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Optional for registration. Required only for officially registered French businesses. If you do not have it yet, you can leave this empty.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Legal Form</label>
                      <select
                        value={profileForm.legalForm || ''}
                        onChange={(e) => handleFieldChange('legalForm', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Please select</option>
                        <option value="SAS">SAS (Simplified joint-stock company)</option>
                        <option value="SARL">SARL (Limited liability company)</option>
                        <option value="SA">SA (Public limited company)</option>
                        <option value="EURL">EURL (Single-member limited liability company)</option>
                        <option value="SNC">SNC (General partnership)</option>
                        <option value="Auto-entrepreneur">Auto-entrepreneur (Sole proprietor)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RCS Number</label>
                    <input
                      type="text"
                      value={profileForm.rcsNumber || ''}
                      onChange={(e) => handleFieldChange('rcsNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.rcsNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    />
                    {fieldErrors.rcsNumber && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.rcsNumber}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Optional. For companies registered in the French Trade and Companies Register (RCS). Freelancers and micro-entrepreneurs usually do not have this.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NAF Code</label>
                    <input
                      type="text"
                      value={profileForm.nafCode || ''}
                      onChange={(e) => handleFieldChange('nafCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.nafCode ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      maxLength={5}
                    />
                    {fieldErrors.nafCode && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.nafCode}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Optional. Your official business activity code assigned by INSEE. Not required on invoices but some businesses include it.</p>
                  </div>
                </div>

                <div className="mt-6 bg-white border border-gray-200 rounded-md p-4 space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Category 3 (Strongly Recommended)</h3>
                  <div className="border border-gray-200 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                        <input
                          type="text"
                          value={profileForm.bankIBAN || ''}
                          onChange={(e) => handleFieldChange('bankIBAN', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.bankIBAN ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {fieldErrors.bankIBAN && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.bankIBAN}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">BIC/SWIFT</label>
                        <input
                          type="text"
                          value={profileForm.bankBIC || ''}
                          onChange={(e) => handleFieldChange('bankBIC', e.target.value.toUpperCase())}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.bankBIC ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {fieldErrors.bankBIC && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.bankBIC}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={profileForm.bankName || ''}
                          onChange={(e) => handleFieldChange('bankName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
                        <input
                          type="text"
                          value={profileForm.accountHolder || ''}
                          onChange={(e) => handleFieldChange('accountHolder', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Recommended. Used to let your clients pay by bank transfer. Not required for registration, but important if you use bank transfers as a payment method.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional. A contact number your clients can use if needed. Not required for invoice compliance.</p>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4 space-y-4">
                  <h3 className="text-md font-medium text-gray-900">Category 4 (Fully Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PEPPOL ID</label>
                      <input
                        type="text"
                        value={profileForm.peppolId || ''}
                        onChange={(e) => handleFieldChange('peppolId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional. Needed only if your business uses the PEPPOL network for electronic invoicing. Leave empty if you do not use PEPPOL.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registered Capital</label>
                      <input
                        type="text"
                        value={profileForm.registeredCapital || ''}
                        onChange={(e) => handleFieldChange('registeredCapital', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.registeredCapital ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                      />
                      {fieldErrors.registeredCapital && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.registeredCapital}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Optional. The company’s registered share capital. Required only for certain legal forms (e.g., SARL, SAS). Not mandatory for issuing invoices.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'password':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
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
                  New Password
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
                  Confirm New Password
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
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'language':
        return <LanguageSelector />;
      case 'email':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h3>
              <form className="space-y-4" onSubmit={handleSaveEmailConfig}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender Email</label>
                  <input type="email" value={emailConfig.email} onChange={e => setEmailConfig(prev => ({ ...prev, email: e.target.value }))} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g., name@163.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <select value={emailConfig.provider} onChange={e => applyProviderPreset(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                      <option value="orange">Orange</option>
                      <option value="free">Free</option>
                      <option value="sfr">SFR</option>
                      <option value="laposte">LaPoste</option>
                      <option value="ovh">OVHcloud</option>
                      <option value="gandi">Gandi</option>
                      <option value="brevo">Brevo</option>
                      <option value="mailjet">Mailjet</option>
                      <option value="gmail">Gmail</option>
                      <option value="outlook">Outlook</option>
                      <option value="yahoo">Yahoo</option>
                      <option value="proton-bridge">ProtonMail Bridge</option>
                      <option value="163">163</option>
                      <option value="qq">QQ</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                    <input type="text" value={emailConfig.smtpHost} onChange={e => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))} className="mt-1 block w-full border rounded-md p-2" placeholder="e.g., smtp.163.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port</label>
                    <input type="number" value={emailConfig.smtpPort} onChange={e => setEmailConfig(prev => ({ ...prev, smtpPort: Number(e.target.value) }))} className="mt-1 block w-full border rounded-md p-2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input id="secure" type="checkbox" checked={emailConfig.smtpSecure} onChange={e => setEmailConfig(prev => ({ ...prev, smtpSecure: e.target.checked }))} />
                    <label htmlFor="secure" className="text-sm text-gray-700">Use SSL/TLS</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Auth Code / Password</label>
                    <input type="password" value={emailConfig.password} onChange={e => setEmailConfig(prev => ({ ...prev, password: e.target.value }))} className="mt-1 block w-full border rounded-md p-2" placeholder="SMTP authorization code or password from your email provider" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input id="active" type="checkbox" checked={emailConfig.isActive} onChange={e => setEmailConfig(prev => ({ ...prev, isActive: e.target.checked }))} />
                    <label htmlFor="active" className="text-sm text-gray-700">Enable configuration</label>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Save</button>
                </div>
                {emailMsg && (
                  <div className={`mt-2 text-sm ${emailMsg.type === 'success' ? 'text-green-600' : emailMsg.type === 'error' ? 'text-red-600' : 'text-gray-600'}`}>{emailMsg.text}</div>
                )}
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Email</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                  <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="mt-1 block w-full border rounded-md p-2" placeholder="Enter an email to receive the test email" />
                </div>
                <button type="button" onClick={handleTestEmail} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Test</button>
              </div>
              {emailMsg && emailMsg.type !== 'info' && (
                <div className={`mt-2 text-sm ${emailMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{emailMsg.text}</div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Server Email Config</h3>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleVerifyServerConfig} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Verify</button>
                {verifyStatus && (
                  <span className={`text-sm ${verifyStatus.ok ? 'text-green-600' : 'text-red-600'}`}>{verifyStatus.ok ? 'Server email config is OK' : `Not OK: ${verifyStatus.message || 'Unknown'}`}</span>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-500">Tip: Configure your SMTP here and verify connectivity before sending invoices.</p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'password', name: 'Password', icon: FiLock },
    { id: 'language', name: 'Language Settings', icon: FiGlobe },
    { id: 'email', name: 'Email Settings', icon: FiMail }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
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
                          const params = new URLSearchParams(location.search);
                          params.set('tab', tab.id);
                          navigate({ pathname: '/settings', search: `?${params.toString()}` }, { replace: true });
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
          
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettings;
