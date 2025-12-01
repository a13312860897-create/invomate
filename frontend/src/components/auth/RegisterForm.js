import React, { useState } from 'react';
import settingsService from '../../services/settingsService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getVATFormatDescription } from '../../utils/vatValidator';
import EnhancedTerms from '../Legal/EnhancedTerms';
import EnhancedPrivacy from '../Legal/EnhancedPrivacy';

const RegisterForm = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
    vatNumber: '',
    siren: '',
    siret: '',
      rcsNumber: '',
      nafCode: '',
      legalForm: '',
      registeredCapital: '',
    peppolId: '',
    bankIBAN: '',
    bankBIC: '',
    bankName: '',
    accountHolder: '',
    invoiceMode: 'french',
    language: 'en',
    currency: 'EUR',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState(1);
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    provider: 'custom',
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
    password: '',
    isActive: true
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const providerPresets = {
    'orange': { smtpHost: 'smtp.orange.fr', smtpPort: 465, smtpSecure: true },
    'free': { smtpHost: 'smtp.free.fr', smtpPort: 587, smtpSecure: false },
    'sfr': { smtpHost: 'smtp.sfr.fr', smtpPort: 465, smtpSecure: true },
    'laposte': { smtpHost: 'smtp.laposte.net', smtpPort: 465, smtpSecure: true },
    'ovh': { smtpHost: 'smtp.ovh.net', smtpPort: 587, smtpSecure: false },
    'gandi': { smtpHost: 'mail.gandi.net', smtpPort: 587, smtpSecure: false },
    'brevo': { smtpHost: 'smtp-relay.brevo.com', smtpPort: 587, smtpSecure: false },
    'mailjet': { smtpHost: 'smtp.mailjet.com', smtpPort: 587, smtpSecure: false },
    'gmail': { smtpHost: 'smtp.gmail.com', smtpPort: 465, smtpSecure: true },
    'outlook': { smtpHost: 'smtp.office365.com', smtpPort: 587, smtpSecure: false },
    'yahoo': { smtpHost: 'smtp.mail.yahoo.com', smtpPort: 465, smtpSecure: true },
    'proton-bridge': { smtpHost: '127.0.0.1', smtpPort: 1025, smtpSecure: false },
    '163': { smtpHost: 'smtp.163.com', smtpPort: 465, smtpSecure: true },
    'qq': { smtpHost: 'smtp.qq.com', smtpPort: 465, smtpSecure: true },
    'custom': { smtpHost: '', smtpPort: 465, smtpSecure: true }
  };

  const applyProviderPreset = (provider) => {
    const preset = providerPresets[provider] || providerPresets.custom;
    setEmailConfig(prev => ({ ...prev, provider, ...preset }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除相关错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'vatNumber') {
      setErrors(prev => ({ ...prev, vatNumber: null }));
    }
  };

  const validateStep1 = () => {
    const stepErrors = {};
    
    if (!formData.firstName.trim()) {
      stepErrors.firstName = t('auth:firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      stepErrors.lastName = t('auth:lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      stepErrors.email = t('auth:emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      stepErrors.email = t('auth:invalidEmail');
    }
    
    if (!formData.password) {
      stepErrors.password = t('auth:passwordRequired');
    } else if (formData.password.length < 8) {
      stepErrors.password = t('auth:passwordMinLength');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      stepErrors.password = t('auth:passwordWeak');
    }
    
    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = t('auth:passwordsDontMatch');
    }

    if (!formData.acceptTerms) {
      stepErrors.acceptTerms = t('auth:termsRequired');
    }
    if (!formData.acceptPrivacy) {
      stepErrors.acceptPrivacy = t('auth:privacyRequired');
    }
    
    return stepErrors;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    if (!formData.companyName.trim()) {
      stepErrors.companyName = t('auth:companyNameRequired');
    }
    if (!formData.address.trim()) {
      stepErrors.address = t('auth:addressRequired');
    }
    if (!formData.city.trim()) {
      stepErrors.city = t('auth:cityRequired');
    }
    if (!formData.postalCode.trim()) {
      stepErrors.postalCode = t('auth:postalCodeRequired');
    }
    if (!formData.country.trim()) {
      stepErrors.country = t('auth:countryRequired');
    }
    return stepErrors;
  };

  const validateStep3 = () => {
    const stepErrors = {};
    if (!formData.acceptTerms) {
      stepErrors.acceptTerms = t('auth:termsRequired');
    }
    if (!formData.acceptPrivacy) {
      stepErrors.acceptPrivacy = t('auth:privacyRequired');
    }
    return stepErrors;
  };

  

  const handleNextStep = () => {
    let stepErrors = {};
    
    if (step === 1) {
      stepErrors = validateStep1();
    } else if (step === 2) {
      stepErrors = validateStep2();
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrorKey = Object.keys(stepErrors)[0];
      try {
        const el = document.querySelector(`[name="${firstErrorKey}"]`);
        if (el && typeof el.focus === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      } catch (_) {}
      return;
    }
    
    setErrors({});
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const stepErrors = validateStep3();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const registerPayload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      const res = await register(registerPayload);
      try {
        await settingsService.saveEmailConfig(emailConfig);
      } catch (_) {}
      if (res?.success) {
        try { localStorage.setItem('trialGift', 'true'); } catch (_) {}
        try {
          await settingsService.updateProfile({
            firstName: formData.firstName,
            lastName: formData.lastName,
            companyName: formData.companyName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
            vatNumber: formData.vatNumber,
            sirenNumber: formData.siren,
            siretNumber: formData.siret,
            registeredCapital: formData.registeredCapital,
            rcsNumber: formData.rcsNumber,
            nafCode: formData.nafCode,
            language: formData.language,
            bankIBAN: formData.bankIBAN,
            bankBIC: formData.bankBIC,
            bankName: formData.bankName,
            accountHolder: formData.accountHolder
          });
        } catch (e1) {
          try { localStorage.setItem('registrationProfile', JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            companyName: formData.companyName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
            vatNumber: formData.vatNumber,
            sirenNumber: formData.siren,
            siretNumber: formData.siret,
            registeredCapital: formData.registeredCapital,
            rcsNumber: formData.rcsNumber,
            nafCode: formData.nafCode,
            bankIBAN: formData.bankIBAN,
            bankBIC: formData.bankBIC,
            bankName: formData.bankName,
            accountHolder: formData.accountHolder
          })); } catch (_) {}
        }
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.response?.data?.message || error.message || t('auth:errors.registrationFailed') });
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'step1';
      case 2: return 'step2';
      case 3: return 'step3';
      default: return '';
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((stepNum) => (
          <React.Fragment key={stepNum}>
            {(() => {
              const isDone = stepNum < step;
              const bg = isDone ? '#16a34a' : '#2563eb'; // green-600 or blue-600
              const fg = '#ffffff';
              return (
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                  style={{ backgroundColor: bg, color: fg }}
                >
                  {isDone ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  ) : (
                    stepNum
                  )}
                </div>
              );
            })()}
            {stepNum < 3 && (
              (() => {
                const isDone = stepNum < step;
                const bg = isDone ? '#16a34a' : '#2563eb';
                return (
                  <div className="w-12 h-1 mx-2" style={{ backgroundColor: bg }} />
                );
              })()
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:firstName')} *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:lastName')} *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:emailAddress')} *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:password')} *
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {t('auth:passwordRequirements')}
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:confirmPassword')} *
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:language')}
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:currency')}
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 mt-3">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className={`mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              errors.acceptTerms ? 'border-red-500' : ''
            }`}
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            {t('auth:acceptTerms')}{' '}
            <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 hover:text-blue-800 underline">
              {t('auth:termsLink')}
            </button>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms}</p>
        )}
        
        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptPrivacy"
            name="acceptPrivacy"
            checked={formData.acceptPrivacy}
            onChange={handleInputChange}
            className={`mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              errors.acceptPrivacy ? 'border-red-500' : ''
            }`}
          />
          <label htmlFor="acceptPrivacy" className="text-sm text-gray-700">
            {t('auth:acceptPrivacy')}{' '}
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-blue-600 hover:text-blue-800 underline">
              {t('auth:privacyLink')}
            </button>
          </label>
        </div>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-600">{errors.acceptPrivacy}</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-900">Category 1 (Required)</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:companyName')} *
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.companyName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.companyName && (
          <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
        )}
      </div>
      
      
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:address')} *
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:city')} *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:postalCode')} *
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.postalCode ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:country')} *
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
          <h3 className="text-lg font-medium text-blue-900">Category 2 (Selectively Required)</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TVA Number</label>
            <div>
              <input
                type="text"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vatNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                {getVATFormatDescription(formData.country || 'FR')}
              </p>
              <p className="mt-1 text-xs text-gray-500">Optional. Only for businesses registered for VAT. If you are VAT-exempt, leave empty and use “TVA non applicable, art. 293 B du CGI”.</p>
            </div>
            {errors.vatNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.vatNumber}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth:siren')}
            </label>
              <input
                type="text"
                name="siren"
                value={formData.siren}
                onChange={handleInputChange}
                maxLength={9}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.siren ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            {errors.siren && (
              <p className="mt-1 text-sm text-red-600">{errors.siren}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('auth:sirenDescription')}
            </p>
          </div>
          
          

          {/* 新增法国法律字段 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth:siret')}
              </label>
              <input
                type="text"
                name="siret"
                value={formData.siret}
                onChange={handleInputChange}
                maxLength={14}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.siret ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.siret && (
                <p className="mt-1 text-sm text-red-600">{errors.siret}</p>
              )}
            <p className="mt-1 text-xs text-gray-500">Optional for registration. Required only for officially registered French businesses. If you do not have it yet, you can leave this empty.</p>
          </div>

            
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth:rcsNumber')}</label>
            <input
              type="text"
              name="rcsNumber"
              value={formData.rcsNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.rcsNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.rcsNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.rcsNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Optional. For companies registered in the French Trade and Companies Register (RCS). Freelancers and micro-entrepreneurs usually do not have this.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth:nafCode')}</label>
            <input
              type="text"
              name="nafCode"
              value={formData.nafCode}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nafCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.nafCode && (
              <p className="mt-1 text-sm text-red-600">{errors.nafCode}</p>
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
                name="bankIBAN"
                value={formData.bankIBAN}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankIBAN ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bankIBAN && (
                <p className="mt-1 text-sm text-red-600">{errors.bankIBAN}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BIC/SWIFT</label>
              <input
                type="text"
                name="bankBIC"
                value={formData.bankBIC}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankBIC ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bankBIC && (
                <p className="mt-1 text-sm text-red-600">{errors.bankBIC}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.accountHolder ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              {errors.accountHolder && (
                <p className="mt-1 text-sm text-red-600">{errors.accountHolder}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended. Used to let your clients pay by bank transfer. Not required for registration, but important if you use bank transfers as a payment method.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth:phone')}</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Optional. A contact number your clients can use if needed. Not required for invoice compliance.</p>
        </div>
      </div>

      

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4 space-y-4">
        <h3 className="text-md font-medium text-gray-900">Category 4 (Fully Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth:peppolId')}</label>
            <input
              type="text"
              name="peppolId"
              value={formData.peppolId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Optional. Needed only if your business uses the PEPPOL network for electronic invoicing. Leave empty if you do not use PEPPOL.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth:registeredCapital')}</label>
            <input
              type="text"
              name="registeredCapital"
              value={formData.registeredCapital}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.registeredCapital ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.registeredCapital && (
              <p className="mt-1 text-sm text-red-600">{errors.registeredCapital}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Optional. The company’s registered share capital. Required only for certain legal forms (e.g., SARL, SAS). Not mandatory for issuing invoices.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Email Settings (Strongly Recommended)</h3>
        <p className="text-xs text-gray-500 mb-2">Recommended. Used to send invoices directly to your clients by email. If empty, email delivery features will be disabled.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sender Email</label>
              <input
                type="email"
                value={emailConfig.email}
                onChange={e => setEmailConfig(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full border rounded-md p-2"
              />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={emailConfig.provider}
                onChange={e => applyProviderPreset(e.target.value)}
                className="mt-1 block w-full border rounded-md p-2"
              >
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
              <input
                type="text"
                value={emailConfig.smtpHost}
                onChange={e => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                className="mt-1 block w-full border rounded-md p-2"
                placeholder="e.g., smtp.163.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="number"
                value={emailConfig.smtpPort}
                onChange={e => setEmailConfig(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                className="mt-1 block w-full border rounded-md p-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="secure" type="checkbox" checked={emailConfig.smtpSecure} onChange={e => setEmailConfig(prev => ({ ...prev, smtpSecure: e.target.checked }))} />
              <label htmlFor="secure" className="text-sm text-gray-700">Use SSL/TLS</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Auth Code / Password</label>
              <input
                type="password"
                value={emailConfig.password}
                onChange={e => setEmailConfig(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 block w-full border rounded-md p-2"
                placeholder="SMTP authorization code or password"
              />
            </div>
          </div>
        </div>
      </div>
      {errors.emailConfig && (
        <div className="text-sm text-red-600">{errors.emailConfig}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('auth:registerTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth:registerSubtitle')}
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-indigo-900">Complete registration to get 15 days of Professional</h3>
          <p className="text-sm text-indigo-800 mt-1">After finishing all steps, your account will be upgraded temporarily to Professional for 15 days.</p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderStepIndicator()}
          
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              {getStepTitle()}
            </h3>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => { if (step === 3 && e.key === 'Enter') { e.preventDefault(); } }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('common:previous')}
                </button>
              )}
              
              <div className="flex-1" />
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('common:next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth:registering') : t('auth:submit')}
                </button>
              )}
            </div>
          </form>
          
          
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 overflow-auto relative">
            <button type="button" onClick={() => setShowTermsModal(false)} className="absolute top-3 right-3 px-3 py-1 border rounded text-sm">Close</button>
            <EnhancedTerms />
            <div className="sticky bottom-0 bg-white border-t p-3 text-right">
              <button type="button" onClick={() => setShowTermsModal(false)} className="px-4 py-2 border rounded-md text-sm bg-gray-100 hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 overflow-auto relative">
            <button type="button" onClick={() => setShowPrivacyModal(false)} className="absolute top-3 right-3 px-3 py-1 border rounded text-sm">Close</button>
            <EnhancedPrivacy />
            <div className="sticky bottom-0 bg-white border-t p-3 text-right">
              <button type="button" onClick={() => setShowPrivacyModal(false)} className="px-4 py-2 border rounded-md text-sm bg-gray-100 hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
