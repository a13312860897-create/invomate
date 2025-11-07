import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enInvoices from './locales/en/invoices.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enIntegrations from './locales/en/integrations.json';
import enNavigation from './locales/en/navigation.json';
import enLogin from './locales/en/login.json';
import enPrivacy from './locales/en/privacy.json';
import enTerms from './locales/en/terms.json';
import enRefund from './locales/en/refund.json';
import enRoutes from './locales/en/routes.json';
import enPricing from './locales/en/pricing.json';

// Helper function to extract namespace from translation object
function extractNamespace(translation, namespace) {
  return translation[namespace] || {};
}

// Main translation object (fallback for legacy code)
const enTranslation = {
  ...enCommon,
  ...enAuth,
  ...enDashboard,
  ...enInvoices,
  ...enNavigation,
  ...enRoutes,
  ...enLogin,
  ...enReports,
  ...enSettings,
  ...enIntegrations
};

// Supported languages configuration
const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    resources: {
      common: enCommon,
      auth: enAuth,
      dashboard: enDashboard,
      invoices: enInvoices,
      reports: enReports,
      settings: enSettings,
      integrations: enIntegrations,
      navigation: enNavigation,
      login: enLogin,
      privacy: enPrivacy,
      terms: enTerms,
      refund: enRefund,
      routes: enRoutes,
      pricing: enPricing
    }
  }
  // Add more languages here as needed
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: SUPPORTED_LANGUAGES.en.resources
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    // Namespace configuration
    defaultNS: 'common',
    ns: [
      'common', 'auth', 'dashboard', 'invoices', 'navigation', 
      'routes', 'login', 'reports', 'settings', 'integrations',
      'terms', 'privacy', 'refund', 'pricing'
    ]
  });

// Language utility functions
export const getAvailableLanguages = () => Object.keys(SUPPORTED_LANGUAGES);
export const getCurrentLanguage = () => i18n.language || 'en';
export const changeLanguage = (lng) => {
  if (SUPPORTED_LANGUAGES[lng]) {
    return i18n.changeLanguage(lng);
  }
  console.warn(`Language ${lng} is not supported. Falling back to English.`);
  return i18n.changeLanguage('en');
};

export { SUPPORTED_LANGUAGES };
export default i18n;