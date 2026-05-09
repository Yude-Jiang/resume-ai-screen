import React, { createContext, useContext, ReactNode } from 'react';
import { translations, Language } from '../translations';

interface LanguageContextType {
  t: (key: string) => string;
  lang: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ 
  children: ReactNode; 
  lang: Language;
}> = ({ children, lang }) => {
  const t = (key: string): string => {
    const section = translations[lang];
    // @ts-ignore - dynamic key access
    return section[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t, lang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
};
