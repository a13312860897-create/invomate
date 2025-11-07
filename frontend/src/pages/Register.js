import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEyeOff, FiUser, FiMail, FiBuilding, FiPhone, FiLock, FiFileText, FiHash, FiGlobe, FiBriefcase } from 'react-icons/fi';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user, register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'routes', 'auth']);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm();
  
  const password = watch('password');
  
  const onSubmit = async (data) => {
    try {
      // 映射字段到统一键名，便于上下文与后端处理
      const payload = {
        ...data,
        siren: data.siren || data.sirenNumber || '',
        siret: data.siret || data.siretNumber || ''
      };

      // 使用认证上下文注册，以支持DEV模式与统一用户态
      const result = await authRegister(payload);

      if (result?.success) {
        // 注册成功后，为法国模式写入本地预填设置，便于 Settings 预填
        if ((payload.invoiceMode || 'fr') === 'fr') {
          const frenchSettings = {
            sellerCompanyName: payload.companyName || '',
            sellerVATNumber: payload.vatNumber || '',
            sellerSIREN: payload.siren || '',
            sellerSIRET: payload.siret || '',
            sellerLegalForm: payload.legalForm || '',
            sellerRegisteredCapital: payload.registeredCapital || '',
            sellerRcsNumber: payload.rcsNumber || '',
            sellerNafCode: payload.nafCode || '',
            bankIBAN: payload.bankIBAN || '',
            bankBIC: payload.bankBIC || '',
            bankName: payload.bankName || '',
            accountHolder: payload.accountHolder || ''
          };
          try {
            localStorage.setItem('frenchCompanySettings', JSON.stringify(frenchSettings));
          } catch (e) {
            console.warn('Failed to persist frenchCompanySettings:', e);
          }
        }

        navigate('/dashboard');
      } else {
        navigate(`/${t('routes:dashboard')}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed, please try again');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth:createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('common:or')}{' '}
            <Link to={`/${t('routes:login')}`} className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth:signInToExistingAccount')}
            </Link>
          </p>
          <p className="mt-4 text-center text-lg font-semibold text-primary-600">
            {t('auth:taxIntegration')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center mb-2">
              <FiGlobe className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">{t('auth:selectInvoiceMode')}</span>
            </div>
            <div className="p-4 rounded-lg border-2 border-primary-500 bg-primary-50">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-blue-800">FR</span>
                </div>
                <span className="font-medium text-gray-900">{t('auth:france')}</span>
              </div>
              <p className="mt-2 text-xs text-gray-600">{t('auth:franceTaxInfo')}</p>
            </div>
            <input
              type="hidden"
              value="fr"
              {...register('invoiceMode')}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  {t('auth:firstName')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    className="form-input-with-icon"
                    placeholder={t('auth:firstNamePlaceholder')}
                    {...register('firstName', {
                      required: t('auth:firstNameRequired')
                    })}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="w-1/2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  {t('auth:lastName')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    className="form-input-with-icon"
                    placeholder={t('auth:lastNamePlaceholder')}
                    {...register('lastName', {
                      required: t('auth:lastNameRequired')
                    })}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth:emailAddress')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="form-input-with-icon"
                  placeholder={t('auth:emailAddressPlaceholder')}
                  {...register('email', {
                    required: t('auth:emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('auth:invalidEmail')
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                {t('auth:companyNameOptional')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBriefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  className="form-input-with-icon"
                  placeholder={t('auth:companyNamePlaceholder')}
                  {...register('companyName')}
                />
              </div>
            </div>
            
            {/* French fields and bank info as an optional, collapsible section */}
            {watch('invoiceMode') === 'fr' && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    <span>{t('auth:optionalDetails')}</span>
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-500">{t('auth:optionalDetailsDescription')}</span>
                </div>

                {showAdvanced && (
                  <>
                    <div>
                      <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700">
                        {t('auth:vatNumber')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="vatNumber"
                          type="text"
                          className="form-input-with-icon"
                          placeholder="FR12345678901"
                          {...register('vatNumber', {
                            pattern: {
                              value: /^FR\d{11}$/,
                              message: t('auth:invalidVatNumber')
                            }
                          })}
                        />
                      </div>
                      {errors.vatNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.vatNumber.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Format: FR + 11 chiffres (ex: FR12345678901)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="sirenNumber" className="block text-sm font-medium text-gray-700">
                        {t('auth:sirenNumber')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="sirenNumber"
                          type="text"
                          className="form-input-with-icon"
                          placeholder={t('auth:sirenNumberPlaceholder')}
                          {...register('sirenNumber', {
                            pattern: {
                              value: /^\d{9}$/,
                              message: t('auth:invalidSiren')
                            }
                          })}
                        />
                      </div>
                      {errors.sirenNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.sirenNumber.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">9 chiffres (ex: 123456789)</p>
                    </div>

                    <div>
                      <label htmlFor="siretNumber" className="block text-sm font-medium text-gray-700">
                        {t('auth:siret')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiBriefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="siretNumber"
                          type="text"
                          className="form-input-with-icon"
                          placeholder={t('auth:siretFormat')}
                          {...register('siretNumber', {
                            pattern: {
                              value: /^\d{14}$/,
                              message: t('auth:siretInvalid')
                            }
                          })}
                        />
                      </div>
                      {errors.siretNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.siretNumber.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{t('auth:siretDescription')}</p>
                    </div>

                    <div>
                      <label htmlFor="legalForm" className="block text-sm font-medium text-gray-700">
                        {t('auth:legalForm')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="legalForm"
                          type="text"
                          className="form-input-with-icon"
                          placeholder={t('auth:selectLegalForm')}
                          {...register('legalForm')}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="registeredCapital" className="block text-sm font-medium text-gray-700">
                        {t('auth:registeredCapital.label')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHash className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="registeredCapital"
                          type="text"
                          className="form-input-with-icon"
                          placeholder="10 000 €"
                          {...register('registeredCapital', {
                            pattern: {
                              value: /^[0-9\s,.]+$/,
                              message: t('auth:registeredCapital.invalid')
                            }
                          })}
                        />
                      </div>
                      {errors.registeredCapital && (
                        <p className="mt-1 text-sm text-red-600">{errors.registeredCapital.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{t('auth:registeredCapital.description')}</p>
                    </div>

                    <div>
                      <label htmlFor="rcsNumber" className="block text-sm font-medium text-gray-700">
                        {t('auth:rcsNumber.label')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="rcsNumber"
                          type="text"
                          className="form-input-with-icon"
                          placeholder="RCS PARIS 123 456 789"
                          {...register('rcsNumber', {
                            pattern: {
                              value: /^RCS\s+[A-Za-zÀ-ÖØ-öø-ÿ\s-]+\s+\d{3}\s?\d{3}\s?\d{3}$/,
                              message: t('auth:rcsNumber.invalid')
                            }
                          })}
                        />
                      </div>
                      {errors.rcsNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.rcsNumber.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{t('auth:rcsNumberFormat')}</p>
                    </div>

                    <div>
                      <label htmlFor="nafCode" className="block text-sm font-medium text-gray-700">
                        {t('auth:nafCode.label')}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiFileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="nafCode"
                          type="text"
                          className="form-input-with-icon"
                          placeholder="62.02A"
                          {...register('nafCode', {
                            pattern: {
                              value: /^(\d{4}[A-Za-z]|\d{2}\.\d{2}[A-Za-z])$/,
                              message: t('auth:nafCode.invalid')
                            }
                          })}
                        />
                      </div>
                      {errors.nafCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.nafCode.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{t('auth:nafCodeFormat')}</p>

                    </div>

                    {/* Bank information (optional) */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700">{t('auth:bankInformation')}</h3>
                      <p className="mt-1 text-xs text-gray-500">{t('auth:bankPrivacyNote')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="bankIBAN" className="block text-sm font-medium text-gray-700">{t('auth:iban')}</label>
                        <input
                          id="bankIBAN"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="FR76 1234 5678 9012 3456 7890 123"
                          {...register('bankIBAN', {
                            pattern: {
                              value: /^FR\d{2}(\s?\d{4}){5}\s?\d{3}$/,
                              message: t('auth:ibanInvalid')
                            }
                          })}
                        />
                        {errors.bankIBAN && (
                          <p className="mt-1 text-xs text-red-600">{errors.bankIBAN.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="bankBIC" className="block text-sm font-medium text-gray-700">{t('auth:bic')}</label>
                        <input
                          id="bankBIC"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="BNPAFRPPXXX"
                          {...register('bankBIC', {
                            pattern: {
                              value: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
                              message: t('auth:bicInvalid')
                            }
                          })}
                        />
                        {errors.bankBIC && (
                          <p className="mt-1 text-xs text-red-600">{errors.bankBIC.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">{t('auth:bankName')}</label>
                        <input
                          id="bankName"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="La Banque Postale"
                          {...register('bankName')}
                        />
                      </div>
                      <div>
                        <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">{t('auth:accountHolder')}</label>
                        <input
                          id="accountHolder"
                          type="text"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={t('auth:companyNamePlaceholder')}
                          {...register('accountHolder')}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('auth:phoneOptional')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="form-input-with-icon"
                  placeholder={t('auth:phonePlaceholder')}
                  {...register('phone')}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth:password')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="form-input-with-icon"
                  placeholder={t('auth:passwordPlaceholder')}
                  {...register('password', {
                    required: t('auth:passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('auth:passwordMinLength')
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth:confirmPassword')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="form-input-with-icon"
                  placeholder={t('auth:confirmPasswordPlaceholder')}
                  {...register('confirmPassword', {
                    required: t('auth:confirmPasswordRequired'),
                    validate: value => value === password || t('auth:passwordsDontMatch')
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            
            

          </div>
          
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              {...register('terms', {
                required: t('auth:termsRequired')
              })}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              {t('auth:agreeToTerms')} <button type="button" className="text-indigo-600 hover:text-indigo-500 underline bg-transparent border-none cursor-pointer">{t('auth:termsOfService')}</button> {t('auth:and')} <button type="button" className="text-indigo-600 hover:text-indigo-500 underline bg-transparent border-none cursor-pointer">{t('auth:privacyPolicy')}</button>
            </label>
          </div>
          {errors.terms && (
            <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isSubmitting ? t('auth:creatingAccount') : t('auth:createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;