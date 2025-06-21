/**
 * @file: i18n/api.ts
 * @description: API для работы с переводами
 * @created: 2025-01-28
 */

import type { TranslationAPI, ClientTranslations } from './types';

// Экспортируем типы из types.ts
export type { TranslationAPI, ClientTranslations } from './types';

// API URL для backend
const FORCED_API_URL = 'http://localhost:5100/api';
const API_URL = process.env.REACT_APP_API_URL || FORCED_API_URL;

console.log('🌍 I18N API URL:', API_URL);

if (API_URL.includes('5200')) {
  console.error('❌ I18N: Обнаружен неправильный порт 5200!');
}

/**
 * Получить переводы с сервера
 */
export const fetchTranslations = async (): Promise<ClientTranslations> => {
  try {
    const response = await fetch(`${API_URL}/translations/client`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching translations:', error);
    // Возвращаем пустой объект в случае ошибки
    return { ru: {}, en: {} };
  }
};

/**
 * Получить все переводы (для админки)
 */
export const fetchAllTranslations = async (): Promise<TranslationAPI[]> => {
  try {
    const response = await fetch(`${API_URL}/translations`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all translations:', error);
    return [];
  }
};

/**
 * Создать или обновить перевод
 */
export const upsertTranslation = async (translation: {
  key: string;
  ru: string;
  en: string;
  category?: string;
}): Promise<TranslationAPI> => {
  const response = await fetch(`${API_URL}/translations/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(translation),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Удалить перевод
 */
export const deleteTranslation = async (key: string): Promise<void> => {
  const response = await fetch(`${API_URL}/translations/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};
