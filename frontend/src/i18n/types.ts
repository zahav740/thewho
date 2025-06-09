/**
 * @file: i18n/types.ts
 * @description: Типы для системы интернационализации
 * @created: 2025-01-28
 */

// Типы для поддерживаемых языков
export type Language = 'ru' | 'en';

// Интерфейс для API переводов
export interface TranslationAPI {
  id: number;
  key: string;
  ru: string;
  en: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Тип для клиентских переводов
export interface ClientTranslations {
  ru: Record<string, string>;
  en: Record<string, string>;
}

// Форма для создания/редактирования перевода
export interface TranslationFormData {
  key: string;
  ru: string;
  en: string;
  category: string;
}

// Типы ключей переводов (будут дополнены автоматически)
export type TranslationKey = string;
