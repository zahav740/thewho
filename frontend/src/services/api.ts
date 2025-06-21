/**
 * @file: api.ts
 * @description: Улучшенная настройка API клиента с поддержкой мобильных устройств
 * @dependencies: axios
 * @created: 2025-01-28
 * @updated: 2025-06-21 - Добавлена поддержка мобильного доступа
 */
import axios from 'axios';
import { formatOrderData } from '../utils/operation-formatter';
import { getApiUrl, getApiUrlSync, checkCurrentConnection, refreshApiUrl } from '../config/api.config';

// Создаем экземпляр axios с базовой конфигурацией
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
    timeout: 15000, // Увеличенный таймаут для мобильных сетей
  });

  // Interceptor для логирования запросов
  instance.interceptors.request.use(
    (config) => {
      console.log('🔍 API REQUEST:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
      });
      
      // Форматируем данные для PUT/POST запросов
      if ((config.method === 'put' || config.method === 'post') && config.data) {
        if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
          const formattedData = formatOrderData(config.data);
          config.data = formattedData;
          console.log('🔄 Отформатированные данные:', config.data);
        }
      }
      
      return config;
    },
    (error) => {
      console.error('❌ API REQUEST ERROR:', error);
      return Promise.reject(error);
    }
  );

  // Interceptor для обработки ответов
  instance.interceptors.response.use(
    (response) => {
      console.log('✅ API RESPONSE:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
      });
      return response;
    },
    async (error) => {
      console.error('❌ API ERROR:', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        code: error.code,
      });

      // Если ошибка сети и это мобильное устройство, пробуем переподключиться
      if (
        (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || !error.response) &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ) {
        console.log('📱 Мобильное устройство: попытка переподключения...');
        
        try {
          const newApiUrl = await refreshApiUrl();
          console.log(`🔄 Попытка с новым URL: ${newApiUrl}`);
          
          // Обновляем baseURL текущего экземпляра
          instance.defaults.baseURL = newApiUrl;
          
          // Повторяем запрос с новым URL
          if (error.config && !error.config.__isRetryRequest) {
            error.config.__isRetryRequest = true;
            error.config.baseURL = newApiUrl;
            return instance(error.config);
          }
        } catch (reconnectError) {
          console.error('❌ Ошибка переподключения:', reconnectError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Инициализируем API с начальным URL
let api = createApiInstance(getApiUrlSync());

// Функция для обновления API instance с новым URL
export const updateApiInstance = async (): Promise<void> => {
  try {
    const newUrl = await getApiUrl();
    api = createApiInstance(newUrl);
    console.log(`🔄 API instance обновлен с URL: ${newUrl}`);
  } catch (error) {
    console.error('❌ Ошибка обновления API instance:', error);
  }
};

// Функция для проверки и восстановления соединения
export const ensureApiConnection = async (): Promise<boolean> => {
  try {
    const isConnected = await checkCurrentConnection();
    
    if (!isConnected) {
      console.log('🔄 Соединение потеряно, попытка восстановления...');
      await updateApiInstance();
      return await checkCurrentConnection();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка проверки соединения:', error);
    return false;
  }
};

// Автоматическая инициализация
(async () => {
  try {
    await updateApiInstance();
    console.log('✅ API успешно инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации API:', error);
  }
})();

// Экспортируем главный API instance
export { api };
export default api;

// Дополнительные утилиты
export const getCurrentApiUrl = (): string => api.defaults.baseURL || '';
export const isApiHealthy = checkCurrentConnection;
