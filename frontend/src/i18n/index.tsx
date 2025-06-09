/**
 * @file: i18n/index.tsx
 * @description: Система интернационализации с реактивностью
 * @created: 2025-01-28
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from './translations';
import { fetchTranslations } from './api';
import type { Language, TranslationKey, ClientTranslations, TranslationAPI, TranslationFormData } from './types';

// Переэкспортируем типы
export type { Language, TranslationKey, ClientTranslations, TranslationAPI, TranslationFormData } from './types';

interface I18nContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  tWithParams: (key: string, params: Record<string, string | number>) => string;
  isLoaded: boolean;
}

// Создаем контекст
const I18nContext = createContext<I18nContextType | null>(null);

// Класс для работы с переводами
class I18nService {
  private translations: Record<Language, Record<string, string>> = translations as Record<Language, Record<string, string>>;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Получить перевод по ключу
   */
  t(key: string, language: Language): string {
    try {
      const translation = this.translations[language][key];
      if (translation) {
        return translation;
      }
      
      // Если перевод не найден, возвращаем ключ
      console.warn(`Translation not found for key: ${key}`);
      return key;
    } catch (error) {
      console.error(`Error getting translation for key: ${key}`, error);
      return key;
    }
  }

  /**
   * Получить перевод с подстановкой параметров
   */
  tWithParams(key: string, params: Record<string, string | number>, language: Language): string {
    let translation = this.t(key, language);
    
    Object.entries(params).forEach(([param, value]) => {
      const pattern = '{{' + param + '}}';
      translation = translation.replaceAll(pattern, String(value));
    });
    
    return translation;
  }

  /**
   * Загрузить переводы с сервера
   */
  async loadTranslationsFromAPI(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<void> {
    try {
      const apiTranslations = await fetchTranslations();
      
      // Объединяем статические переводы с переводами из API
      const mergedTranslations: Record<Language, Record<string, string>> = {
        ru: { ...this.translations.ru, ...apiTranslations.ru },
        en: { ...this.translations.en, ...apiTranslations.en },
      };
      
      this.translations = mergedTranslations;
      this.isLoaded = true;
      
      console.log('Translations loaded from API');
    } catch (error) {
      console.error('Error loading translations from API:', error);
      // В случае ошибки продолжаем работать со статическими переводами
      this.isLoaded = true;
    }
  }

  /**
   * Проверить, загружены ли переводы
   */
  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Обновить переводы из API
   */
  async updateTranslationsFromAPI(): Promise<void> {
    this.isLoaded = false;
    this.loadPromise = null;
    await this.loadTranslationsFromAPI();
  }
}

// Создаем синглтон сервиса
const i18nService = new I18nService();

// Провайдер для контекста
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Загружаем язык из localStorage или используем по умолчанию
  const getInitialLanguage = (): Language => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      return savedLanguage;
    }
    return 'ru';
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getInitialLanguage);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем переводы при инициализации
  useEffect(() => {
    const loadTranslations = async () => {
      await i18nService.loadTranslationsFromAPI();
      setIsLoaded(true);
    };
    loadTranslations();
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  const t = (key: string): string => {
    return i18nService.t(key, currentLanguage);
  };

  const tWithParams = (key: string, params: Record<string, string | number>): string => {
    return i18nService.tWithParams(key, params, currentLanguage);
  };

  const contextValue: I18nContextType = {
    currentLanguage,
    setLanguage,
    t,
    tWithParams,
    isLoaded,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Хук для использования в компонентах
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

// Экспортируем сервис для прямого использования (если нужно)
export const i18n = i18nService;
