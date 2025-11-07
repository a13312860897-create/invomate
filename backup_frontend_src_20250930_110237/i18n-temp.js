import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import only English translation file
import enTranslation from './locales/en.json';

// Initialize i18n with only English
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
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