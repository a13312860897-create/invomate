import React, { createContext, useContext } from 'react';
import en from '../locales/en.json';

const LanguageContext = createContext();

const translations = {
  en
};

export const LanguageProvider = ({ children }) => {
  const t = (key) => {
    const keys = key.split('.');
    let value = translations.en;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return the key itself if no translation found
      }
    }
    
    return value;
  };
  
  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;