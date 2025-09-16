import { useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import esTranslations from '../translations/es.json';
import frTranslations from '../translations/fr.json';

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Get nested property from object using dot notation
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Format string with placeholders
const formatString = (str, params) => {
  if (!params) return str;
  
  let formatted = str;
  Object.keys(params).forEach(key => {
    formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), params[key]);
  });
  
  return formatted;
};

const useTranslation = () => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState(SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || DEFAULT_LANGUAGE;
    if (SUPPORTED_LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
      setTranslations(SUPPORTED_LANGUAGES[savedLanguage]);
    }
  }, []);

  // Change language
  const changeLanguage = (newLanguage) => {
    if (SUPPORTED_LANGUAGES[newLanguage]) {
      setLanguage(newLanguage);
      setTranslations(SUPPORTED_LANGUAGES[newLanguage]);
      localStorage.setItem('language', newLanguage);
    }
  };

  // Translate function
  const t = (key, params = null) => {
    const translation = getNestedProperty(translations, key);
    
    if (translation === null) {
      // Fallback to English if translation not found
      const englishTranslation = getNestedProperty(SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE], key);
      if (englishTranslation !== null) {
        return formatString(englishTranslation, params);
      }
      
      // If no translation found, return the key
      return key;
    }
    
    return formatString(translation, params);
  };

  // Get available languages
  const getAvailableLanguages = () => {
    return Object.keys(SUPPORTED_LANGUAGES);
  };

  // Get language name
  const getLanguageName = (langCode) => {
    const languageNames = {
      en: 'English',
      es: 'Español',
      fr: 'Français'
    };
    
    return languageNames[langCode] || langCode;
  };

  return {
    t,
    language,
    changeLanguage,
    getAvailableLanguages,
    getLanguageName,
    translations
  };
};

export default useTranslation;