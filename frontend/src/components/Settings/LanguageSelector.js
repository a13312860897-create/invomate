import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { SUPPORTED_LANGUAGES, getCurrentLanguage, changeLanguage } from '../../i18n';

const LanguageSelector = () => {
  const { t } = useTranslation(['settings', 'common']);
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = Object.entries(SUPPORTED_LANGUAGES);

  const handleLanguageChange = async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      // Save user preference to localStorage for persistence
      localStorage.setItem('preferredLanguage', languageCode);
      
      // Optional: Save to backend if user is logged in
      // This can be implemented later when backend language preference is needed
      
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <FiGlobe className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('settings:language')}
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings:selectLanguage')}
          </label>
          
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              {availableLanguages.map(([code, language]) => (
                <option key={code} value={code}>
                  {language.flag} {language.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>{t('settings:languageDescription')}</p>
          
          {/* Future expansion notice */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              <strong>{t('settings:comingSoon')}:</strong> {t('settings:moreLanguagesComingSoon')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;