import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { validateVATNumber } from '../../utils/vatValidator';

const RegisterForm = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
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
    invoiceMode: 'france',
    language: 'fr',
    currency: 'EUR',
    acceptTerms: false,
    acceptPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [vatValidating, setVatValidating] = useState(false);
  const [vatValidationResult, setVatValidationResult] = useState(null);
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 公司信息, 3: 法规合规

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
  };

  const validateStep1 = () => {
    const stepErrors = {};
    
    if (!formData.firstName.trim()) {
      stepErrors.firstName = t('auth:validation.firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      stepErrors.lastName = t('auth:validation.lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      stepErrors.email = t('auth:validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      stepErrors.email = t('auth:validation.emailInvalid');
    }
    
    if (!formData.password) {
      stepErrors.password = t('auth:validation.passwordRequired');
    } else if (formData.password.length < 8) {
      stepErrors.password = t('auth:validation.passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      stepErrors.password = t('auth:validation.passwordWeak');
    }
    
    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = t('auth:validation.passwordMismatch');
    }
    
    return stepErrors;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    
    if (!formData.companyName.trim()) {
      stepErrors.companyName = t('auth:validation.companyNameRequired');
    }
    
    if (!formData.address.trim()) {
      stepErrors.address = t('auth:validation.addressRequired');
    }
    
    if (!formData.city.trim()) {
      stepErrors.city = t('auth:validation.cityRequired');
    }
    
    if (!formData.postalCode.trim()) {
      stepErrors.postalCode = t('auth:validation.postalCodeRequired');
    } else if (formData.country === 'FR' && !/^\d{5}$/.test(formData.postalCode)) {
      stepErrors.postalCode = t('auth:validation.postalCodeInvalid');
    }
    
    if (formData.invoiceMode === 'france') {
      if (!formData.vatNumber.trim()) {
        stepErrors.vatNumber = t('auth:validation.vatNumberRequired');
      }
      
      if (!formData.siren.trim()) {
        stepErrors.siren = t('auth:validation.sirenRequired');
      } else if (!/^\d{9}$/.test(formData.siren)) {
        stepErrors.siren = t('auth:validation.sirenInvalid');
      }

      // 新增法国法律字段验证
      if (!formData.siret.trim()) {
        stepErrors.siret = t('auth:validation.siretRequired');
      } else if (!/^\d{14}$/.test(formData.siret)) {
        stepErrors.siret = t('auth:validation.siretInvalid');
      }

      if (!formData.rcsNumber.trim()) {
        stepErrors.rcsNumber = t('auth:validation.rcsNumberRequired');
      } else if (!/^RCS\s+[A-Za-zÀ-ÿ\s]+\s+\d{3}\s+\d{3}\s+\d{3}$/.test(formData.rcsNumber)) {
        stepErrors.rcsNumber = t('auth:validation.rcsNumberInvalid');
      }

      if (!formData.nafCode.trim()) {
        stepErrors.nafCode = t('auth:validation.nafCodeRequired');
      } else if (!/^\d{2}\.\d{2}[A-Za-z]$/.test(formData.nafCode)) {
        stepErrors.nafCode = t('auth:validation.nafCodeInvalid');
      }

      if (!formData.legalForm.trim()) {
        stepErrors.legalForm = t('auth:validation.legalFormRequired');
      }

      if (!formData.registeredCapital.trim()) {
        stepErrors.registeredCapital = t('auth:validation.registeredCapitalRequired');
      } else if (!/^\d{1,3}(?:\s?\d{3})*\s?[€$£]$/.test(formData.registeredCapital)) {
        stepErrors.registeredCapital = t('auth:validation.registeredCapitalInvalid');
      }
    }
    
    return stepErrors;
  };

  const validateStep3 = () => {
    const stepErrors = {};
    
    if (!formData.acceptTerms) {
      stepErrors.acceptTerms = t('auth:validation.termsRequired');
    }
    
    if (!formData.acceptPrivacy) {
      stepErrors.acceptPrivacy = t('auth:validation.privacyRequired');
    }
    
    return stepErrors;
  };

  const handleVATValidation = async () => {
    if (!formData.vatNumber.trim()) return;
    
    setVatValidating(true);
    setVatValidationResult(null);
    
    try {
      const result = await validateVATNumber(formData.vatNumber, formData.country);
      setVatValidationResult(result);
      
      if (!result.valid) {
        setErrors(prev => ({
          ...prev,
          vatNumber: t('auth:validation.vatNumberInvalid')
        }));
      } else {
        setErrors(prev => ({ ...prev, vatNumber: null }));
      }
    } catch (error) {
      console.error('VAT validation error:', error);
      setVatValidationResult({ valid: false, error: error.message });
    } finally {
      setVatValidating(false);
    }
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
      await register(formData);
      // 注册成功后，AuthContext会处理重定向
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || t('auth:errors.registrationFailed') });
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return t('auth:register.step1Title');
      case 2: return t('auth:register.step2Title');
      case 3: return t('auth:register.step3Title');
      default: return '';
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              stepNum === step
                ? 'bg-blue-600 text-white'
                : stepNum < step
                ? 'bg-green-600 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {stepNum < step ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNum
              )}
            </div>
            {stepNum < 3 && (
              <div className={`w-12 h-1 mx-2 ${
                stepNum < step ? 'bg-green-600' : 'bg-gray-300'
              }`} />
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
            {t('auth:fields.firstName')} *
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
            {t('auth:fields.lastName')} *
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
          {t('auth:fields.email')} *
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
          {t('auth:fields.password')} *
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
          {t('auth:validation.passwordRequirements')}
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:fields.confirmPassword')} *
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
            {t('auth:fields.language')}
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fr">{t('auth:languages.french')}</option>
            <option value="en">{t('auth:languages.english')}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth:fields.currency')}
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:fields.companyName')} *
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
          {t('auth:fields.phone')}
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:fields.address')} *
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
            {t('auth:fields.city')} *
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
            {t('auth:fields.postalCode')} *
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
            {t('auth:fields.country')}
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FR">{t('auth:countries.france')}</option>
            <option value="DE">{t('auth:countries.germany')}</option>
            <option value="ES">{t('auth:countries.spain')}</option>
            <option value="IT">{t('auth:countries.italy')}</option>
            <option value="BE">{t('auth:countries.belgium')}</option>
            <option value="NL">{t('auth:countries.netherlands')}</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth:fields.invoiceMode')}
        </label>
        <select
          name="invoiceMode"
          value={formData.invoiceMode}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="france">{t('auth:invoiceModes.france')}</option>
          <option value="international">{t('auth:invoiceModes.international')}</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {t('auth:invoiceModes.description')}
        </p>
      </div>
      
      {formData.invoiceMode === 'france' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
          <h3 className="text-lg font-medium text-blue-900">
            {t('auth:register.frenchComplianceTitle')}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth:fields.vatNumber')} *
            </label>
            <div className="flex">
              <input
                type="text"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleInputChange}
                placeholder="FR12345678901"
                className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vatNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={handleVATValidation}
                disabled={vatValidating || !formData.vatNumber.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {vatValidating ? t('auth:validation.validating') : t('auth:validation.validate')}
              </button>
            </div>
            {errors.vatNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.vatNumber}</p>
            )}
            {vatValidationResult && (
              <p className={`mt-1 text-sm ${
                vatValidationResult.valid ? 'text-green-600' : 'text-red-600'
              }`}>
                {vatValidationResult.valid 
                  ? t('auth:validation.vatNumberValid')
                  : t('auth:validation.vatNumberInvalid')
                }
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth:fields.siren')} *
            </label>
            <input
              type="text"
              name="siren"
              value={formData.siren}
              onChange={handleInputChange}
              placeholder="123456789"
              maxLength={9}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.siren ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.siren && (
              <p className="mt-1 text-sm text-red-600">{errors.siren}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('auth:fields.sirenDescription')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth:fields.peppolId')}
            </label>
            <input
              type="text"
              name="peppolId"
              value={formData.peppolId}
              onChange={handleInputChange}
              placeholder="0088:1234567890123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('auth:fields.peppolIdDescription')}
            </p>
          </div>

          {/* 新增法国法律字段 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth:fields.siret')} *
              </label>
              <input
                type="text"
                name="siret"
                value={formData.siret}
                onChange={handleInputChange}
                placeholder="12345678901234"
                maxLength={14}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.siret ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.siret && (
                <p className="mt-1 text-sm text-red-600">{errors.siret}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('auth:fields.siretDescription')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth:fields.rcsNumber')} *
              </label>
              <input
                type="text"
                name="rcsNumber"
                value={formData.rcsNumber}
                onChange={handleInputChange}
                placeholder="RCS PARIS 123 456 789"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rcsNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.rcsNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.rcsNumber}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('auth:fields.rcsNumberDescription')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth:fields.nafCode')} *
              </label>
              <input
                type="text"
                name="nafCode"
                value={formData.nafCode}
                onChange={handleInputChange}
                placeholder="62.02A"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nafCode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nafCode && (
                <p className="mt-1 text-sm text-red-600">{errors.nafCode}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('auth:fields.nafCodeDescription')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth:fields.legalForm')} *
              </label>
              <select
                name="legalForm"
                value={formData.legalForm}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.legalForm ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('auth:fields.selectLegalForm')}</option>
                <option value="SARL">SARL - 有限责任公司</option>
                <option value="SAS">SAS - 简化股份公司</option>
                <option value="SA">SA - 股份有限公司</option>
                <option value="SNC">SNC - 合伙公司</option>
                <option value="EURL">EURL - 单人有限责任公司</option>
                <option value="SASU">SASU - 单人简化股份公司</option>
                <option value="EI">EI - 个体工商户</option>
                <option value="Micro-entreprise">Micro-entreprise - 微型企业</option>
              </select>
              {errors.legalForm && (
                <p className="mt-1 text-sm text-red-600">{errors.legalForm}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth:fields.registeredCapital')} *
            </label>
            <input
              type="text"
              name="registeredCapital"
              value={formData.registeredCapital}
              onChange={handleInputChange}
              placeholder="10 000 €"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.registeredCapital ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.registeredCapital && (
              <p className="mt-1 text-sm text-red-600">{errors.registeredCapital}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('auth:fields.registeredCapitalDescription')}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-yellow-900 mb-2">
          {t('auth:register.gdprTitle')}
        </h3>
        <p className="text-yellow-800 text-sm">
          {t('auth:register.gdprDescription')}
        </p>
      </div>
      
      <div className="space-y-4">
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
            {t('auth:register.acceptTerms')}{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800">
              {t('auth:register.termsLink')}
            </a>
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
            {t('auth:register.acceptPrivacy')}{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800">
              {t('auth:register.privacyLink')}
            </a>
          </label>
        </div>
        {errors.acceptPrivacy && (
          <p className="text-sm text-red-600">{errors.acceptPrivacy}</p>
        )}
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-green-900 mb-2">
          {t('auth:register.freemiumTitle')}
        </h3>
        <ul className="text-green-800 text-sm space-y-1">
          <li>• {t('auth:register.freemiumFeature1')}</li>
          <li>• {t('auth:register.freemiumFeature2')}</li>
          <li>• {t('auth:register.freemiumFeature3')}</li>
          <li>• {t('auth:register.freemiumFeature4')}</li>
        </ul>
        <p className="text-green-700 text-xs mt-2">
          {t('auth:register.freemiumUpgrade')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('auth:register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth:register.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderStepIndicator()}
          
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              {getStepTitle()}
            </h3>
          </div>
          
          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
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
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth:register.registering') : t('auth:register.submit')}
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('auth:register.alreadyHaveAccount')}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={onSwitchToLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('auth:register.loginLink')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;