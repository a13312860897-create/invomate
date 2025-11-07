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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'routes', 'auth']);
  
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
      const result = await authService.register(data);
      // Handle successful registration
      if (result.token) {
        toast.success('注册成功！');
        navigate('/dashboard');
      } else {
         navigate(`/${t('routes:dashboard')}`);
       }
     } catch (error) {
       console.error('Registration error:', error);
       toast.error('注册失败，请重试');
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
            
            {/* French VAT and SIREN fields - only show when France is selected */}
            {watch('invoiceMode') === 'fr' && (
              <>
                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700">
                    {t('auth:vatNumber')} <span className="text-red-500">*</span>
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
                        required: watch('invoiceMode') === 'fr' ? t('auth:vatNumberRequired') : false,
                        pattern: watch('invoiceMode') === 'fr' ? {
                          value: /^FR\d{11}$/,
                          message: t('auth:invalidVatNumber')
                        } : undefined
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
                    {t('auth:sirenNumber')} <span className="text-red-500">*</span>
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
                        required: watch('invoiceMode') === 'fr' ? t('auth:sirenRequired') : false,
                        pattern: watch('invoiceMode') === 'fr' ? {
                          value: /^\d{9}$/,
                          message: t('auth:invalidSiren')
                        } : undefined
                      })}
                    />
                  </div>
                  {errors.sirenNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.sirenNumber.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    9 chiffres (ex: 123456789)
                  </p>
                </div>
              </>
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
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                {t('auth:defaultCurrency')}
              </label>
              <select
                id="currency"
                className="form-input"
                defaultValue="USD"
                {...register('currency')}
              >
                <option value="USD">{t('auth:usDollar')}</option>
                <option value="EUR">{t('auth:euro')}</option>
                <option value="GBP">{t('auth:britishPound')}</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {t('auth:language')}
              </label>
              <select
                id="language"
                className="form-input"
                defaultValue={watch('invoiceMode') === 'fr' ? 'fr' : 'en'}
                {...register('language')}
                onChange={(e) => {
                  // Change language immediately when selected
                  i18n.changeLanguage(e.target.value);
                }}
              >
                <option value="en">{t('auth:english')}</option>
                <option value="fr">{t('auth:french')}</option>
                <option value="es">{t('auth:spanish')}</option>
                <option value="de">{t('auth:german')}</option>
              </select>
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