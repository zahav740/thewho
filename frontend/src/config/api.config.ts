/**
 * @file: api.config.ts
 * @description: Улучшенная конфигурация API с поддержкой мобильных устройств
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Добавлена поддержка мобильного доступа
 */

import { getOptimalApiUrl, findAvailableBackend, testApiConnection } from '../utils/network.utils';

// Кэш для URL
let cachedApiUrl: string | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 30000; // 30 секунд

// Функция для получения API URL с автоматическим определением
export const getApiUrl = async (): Promise<string> => {
  const now = Date.now();
  
  // Используем кэш, если он свежий
  if (cachedApiUrl && (now - lastCacheTime) < CACHE_DURATION) {
    return cachedApiUrl;
  }
  
  try {
    console.log('🔍 Определяем оптимальный API URL...');
    
    // Сначала пробуем оптимальный URL
    const optimalUrl = await getOptimalApiUrl();
    
    if (await testApiConnection(optimalUrl)) {
      cachedApiUrl = optimalUrl;
      lastCacheTime = now;
      console.log(`✅ Используем оптимальный API URL: ${optimalUrl}`);
      return optimalUrl;
    }
    
    // Если оптимальный не работает, ищем любой доступный
    console.log('⚠️ Оптимальный URL недоступен, ищем альтернативы...');
    const availableUrl = await findAvailableBackend();
    
    cachedApiUrl = availableUrl;
    lastCacheTime = now;
    console.log(`✅ Используем найденный API URL: ${availableUrl}`);
    return availableUrl;
    
  } catch (error) {
    console.error('❌ Ошибка при определении API URL:', error);
    
    // Возвращаем дефолтный URL
    const defaultUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
    cachedApiUrl = defaultUrl;
    lastCacheTime = now;
    return defaultUrl;
  }
};

// Синхронная версия для обратной совместимости
export const getApiUrlSync = (): string => {
  return cachedApiUrl || process.env.REACT_APP_API_URL || 'http://localhost:5100/api';
};

// Функция для сброса кэша
export const resetApiUrl = (): void => {
  cachedApiUrl = null;
  lastCacheTime = 0;
  console.log('🔄 Кэш API URL сброшен');
};

// Функция для принудительного обновления API URL
export const refreshApiUrl = async (): Promise<string> => {
  resetApiUrl();
  return await getApiUrl();
};

// Функция для проверки текущего соединения
export const checkCurrentConnection = async (): Promise<boolean> => {
  if (!cachedApiUrl) {
    return false;
  }
  
  return await testApiConnection(cachedApiUrl);
};

// Инициализация API URL при загрузке модуля
let initPromise: Promise<string> | null = null;

export const initializeApi = (): Promise<string> => {
  if (!initPromise) {
    initPromise = getApiUrl();
  }
  return initPromise;
};

// Автоматическая инициализация
initializeApi().then(url => {
  console.log(`🚀 API инициализирован: ${url}`);
}).catch(error => {
  console.error('❌ Ошибка инициализации API:', error);
});

// Экспорт устаревших функций для совместимости
export const getBackendUrl = getApiUrl;
