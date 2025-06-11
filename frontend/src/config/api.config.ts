/**
 * @file: api.config.ts
 * @description: Конфигурация API для автоматического определения порта backend
 * @created: 2025-06-11
 */

// Простая функция для определения доступного порта backend
export const getBackendUrl = async (): Promise<string> => {
  const ports = [5100, 3001, 5101]; // Возможные порты
  
  for (const port of ports) {
    try {
      // Простая проверка без таймаута
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        console.log(`✅ Backend найден на порту ${port}`);
        return `http://localhost:${port}`;
      }
    } catch (error) {
      console.log(`❌ Backend недоступен на порту ${port}`);
    }
  }
  
  // Если не найден, используем порт по умолчанию
  console.warn('⚠️ Backend не найден, используем порт 5100 по умолчанию');
  return 'http://localhost:5100';
};

// Кэшированный URL
let cachedBackendUrl: string | null = null;

export const getApiUrl = async (): Promise<string> => {
  if (!cachedBackendUrl) {
    cachedBackendUrl = await getBackendUrl();
  }
  return cachedBackendUrl;
};

// Простое синхронное получение URL (для обратной совместимости)
export const getApiUrlSync = (): string => {
  return cachedBackendUrl || 'http://localhost:5100';
};

// Сброс кэша (для переподключения)
export const resetApiUrl = () => {
  cachedBackendUrl = null;
};
