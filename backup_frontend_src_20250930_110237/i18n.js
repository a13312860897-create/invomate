import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import main translation files
import enTranslation from './locales/en.json';

// Import namespace files
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import zhCommon from './locales/zh/common.json';
import enAuth from './locales/en/auth.json';
import frAuth from './locales/fr/auth.json';
import enNavigation from './locales/en/navigation.json';
import enRoutes from './locales/en/routes.json';
import enLogin from './locales/en/login.json';
import enReports from './locales/en/reports.json';
import enDashboard from './locales/en/dashboard.json';
import frDashboard from './locales/fr/dashboard.json';
import enInvoices from './locales/en/invoices.json';
import frInvoices from './locales/fr/invoices.json';
import zhInvoices from './locales/zh/invoices.json';
import enTerms from './locales/en/terms.json';
import enPrivacy from './locales/en/privacy.json';
import enRefund from './locales/en/refund.json';
import zhTerms from './locales/zh/terms.json';
import zhPrivacy from './locales/zh/privacy.json';
import zhRefund from './locales/zh/refund.json';

// Extract additional namespaces from main translation files
const extractNamespace = (translation, namespace) => {
  return translation[namespace] || {};
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
        common: enCommon,
        auth: enAuth,
        navigation: enNavigation,
        routes: enRoutes,
        login: enLogin,
        reports: enReports,
        dashboard: enDashboard,
        invoices: enInvoices,
        terms: enTerms,
        privacy: enPrivacy,
        refund: enRefund,
        invoiceform: extractNamespace(enTranslation, 'invoiceform'),
        clients: extractNamespace(enTranslation, 'clients'),
        profile: extractNamespace(enTranslation, 'profile'),
        sandboxSettings: extractNamespace(enTranslation, 'sandboxSettings'),
        clientform: extractNamespace(enTranslation, 'clientform'),
        payments: extractNamespace(enTranslation, 'payments'),
        payment: extractNamespace(enTranslation, 'payment'),
        paddle: extractNamespace(enTranslation, 'paddle'),
        sandbox: extractNamespace(enTranslation, 'sandbox')
      },
      fr: {
        common: frCommon,
        auth: frAuth,
        dashboard: frDashboard,
        invoices: frInvoices,
        terms: enTerms,
        privacy: enPrivacy,
        refund: enRefund,
        // Use English as fallback for missing French translations
        translation: enTranslation,
        navigation: enNavigation,
        routes: enRoutes,
        login: enLogin,
        reports: enReports,
        invoiceform: extractNamespace(enTranslation, 'invoiceform'),
        clients: extractNamespace(enTranslation, 'clients'),
        profile: extractNamespace(enTranslation, 'profile'),
        sandboxSettings: extractNamespace(enTranslation, 'sandboxSettings'),
        clientform: extractNamespace(enTranslation, 'clientform'),
        payments: extractNamespace(enTranslation, 'payments'),
        payment: extractNamespace(enTranslation, 'payment'),
        paddle: extractNamespace(enTranslation, 'paddle'),
        sandbox: extractNamespace(enTranslation, 'sandbox')
      },
      zh: {
        common: zhCommon,
        // Use English as fallback for missing Chinese translations
        translation: enTranslation,
        auth: enAuth,
        navigation: enNavigation,
        routes: enRoutes,
        login: enLogin,
        reports: enReports,
        dashboard: enDashboard,
        invoices: zhInvoices,
        terms: zhTerms,
        privacy: zhPrivacy,
        refund: zhRefund,
        invoiceform: extractNamespace(enTranslation, 'invoiceform'),
        clients: extractNamespace(enTranslation, 'clients'),
        profile: extractNamespace(enTranslation, 'profile'),
        sandboxSettings: extractNamespace(enTranslation, 'sandboxSettings'),
        clientform: extractNamespace(enTranslation, 'clientform'),
        payments: extractNamespace(enTranslation, 'payments'),
        payment: extractNamespace(enTranslation, 'payment'),
        paddle: extractNamespace(enTranslation, 'paddle'),
        sandbox: extractNamespace(enTranslation, 'sandbox')
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if translation is missing
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;