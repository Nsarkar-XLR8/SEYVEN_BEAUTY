'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (enText: string, bnText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (enText) => enText,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clear legacy Bengali language preference if stored
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seyven_lang');
    }
  }, []);

  const setLang = () => {};
  const toggleLang = () => {};
  const t = (enText: string): string => enText;

  return (
    <LanguageContext.Provider value={{ lang: 'en', setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

