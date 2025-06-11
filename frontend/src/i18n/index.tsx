/**
 * @file: i18n/index.tsx
 * @description: Система интернационализации с реактивностью
 * @created: 2025-01-28
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from './translations';
import { fetchTranslations } from './api';
import type { Language } from './types';

// Переэкспортируем только используемые типы
export type { Language, TranslationAPI, ClientTranslations, TranslationFormData } from './types';

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

  constructor() {
    // Инициализируем как загруженные сразу со статическими переводами
    this.isLoaded = true;
    console.log('I18nService initialized with static translations');
    console.log('Static order_form keys:', Object.keys(this.translations.ru).filter(k => k.startsWith('order_form')));
  }

  /**
   * Получить перевод по ключу
   */
  t(key: string, language: Language): string {
    try {
      const translation = this.translations[language][key];
      if (translation) {
        return translation;
      }
      
      // Отладка для order_form ключей
      if (key.startsWith('order_form')) {
        console.warn(`Перевод не найден для ключа: ${key}`);
        console.log(`Доступные order_form ключи:`, Object.keys(this.translations[language]).filter(k => k.startsWith('order_form')));
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
    // Уже загружены статические переводы, но можем дополнить из API
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performLoad();
    return this.loadPromise;
  }

  private async performLoad(): Promise<void> {
    try {
      console.log('Loading translations from API...');
      const apiTranslations = await fetchTranslations();
      
      console.log('Static translations RU keys:', Object.keys(this.translations.ru).filter(k => k.startsWith('order_form')));
      console.log('API translations RU keys:', Object.keys(apiTranslations.ru || {}).filter(k => k.startsWith('order_form')));
      
      // Объединяем статические переводы с переводами из API
      // ВАЖНО: статические переводы имеют приоритет!
      const mergedTranslations: Record<Language, Record<string, string>> = {
        ru: { ...apiTranslations.ru, ...this.translations.ru },
        en: { ...apiTranslations.en, ...this.translations.en },
      };
      
      console.log('Merged translations RU order_form keys:', Object.keys(mergedTranslations.ru).filter(k => k.startsWith('order_form')));
      
      this.translations = mergedTranslations;
      this.isLoaded = true;
      
      console.log('Translations loaded and merged successfully');
    } catch (error) {
      console.error('Error loading translations from API:', error);
      // В случае ошибки продолжаем работать со статическими переводами
      console.log('Using static translations only');
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
  const [isLoaded] = useState(true); // Начинаем с true, так как статические переводы уже доступны

  // Дополнительно загружаем переводы с API (необязательно)
  useEffect(() => {
    const loadApiTranslations = async () => {
      try {
        await i18nService.loadTranslationsFromAPI();
        console.log('API translations loaded successfully');
      } catch (error) {
        console.warn('Failed to load API translations, using static only:', error);
      }
    };
    loadApiTranslations();
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
