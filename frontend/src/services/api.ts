/**
 * @file: api.ts
 * @description: Базовая настройка API клиента
 * @dependencies: axios
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Добавлена надежная обработка форматирования операций
 */
import axios from 'axios';
import { formatOrderData } from '../utils/operation-formatter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5101/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Отключаем отправку cookies для уменьшения размера заголовков
  timeout: 10000, // 10 секунд таймаут
});

// Interceptor для логирования запросов и форматирования данных
api.interceptors.request.use(
  (config) => {
    if (config.method === 'put' || config.method === 'post') {
      console.log('🔍 API REQUEST:', {
        url: config.url,
        method: config.method.toUpperCase(),
        data: config.data,
        headers: config.headers,
      });
      
      // Форматируем данные, если это объект
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        // Используем универсальный форматтер для приведения данных к нужному формату
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
api.interceptors.response.use(
  (response) => {
    console.log('✅ API RESPONSE:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // Сервер ответил с ошибкой
      console.error('❌ API ERROR:', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method?.toUpperCase(),
        data: error.response.data,
        requestData: error.config.data,
      });
      
      // Попытка повторить запрос с измененным форматом данных при ошибке 400 или 500
      if (
        (error.response.status === 400 || error.response.status === 500) && 
        error.config && 
        !error.config.__isRetryRequest &&
        (error.config.method === 'put' || error.config.method === 'post') &&
        typeof error.config.data === 'object'
      ) {
        console.log('⚠️ Попытка повторить запрос с альтернативным форматом данных...');
        
        try {
          // Клонируем конфигурацию для повторного запроса
          const newConfig = { ...error.config };
          newConfig.__isRetryRequest = true;
          
          // Парсим данные запроса
          const originalData = JSON.parse(newConfig.data);
          
          // Применяем альтернативное форматирование
          if (originalData.operations && Array.isArray(originalData.operations)) {
            originalData.operations = originalData.operations.map((op: any) => ({
              ...op,
              // Принудительно преобразуем все числовые поля в строки
              operationNumber: String(op.operationNumber),
              machineAxes: typeof op.machineAxes === 'number' ? `${op.machineAxes}-axis` : op.machineAxes,
              estimatedTime: String(op.estimatedTime)
            }));
          }
          
          // Преобразуем priority в строку
          if (originalData.priority !== undefined) {
            originalData.priority = String(originalData.priority);
          }
          
          // Обновляем данные запроса
          newConfig.data = JSON.stringify(originalData);
          
          console.log('🔄 Повторная попытка с данными:', newConfig.data);
          
          // Отправляем запрос повторно
          return axios(newConfig);
        } catch (retryError) {
          console.error('❌ Ошибка при попытке повторить запрос:', retryError);
        }
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      console.error('❌ NETWORK ERROR:', error.request);
    } else {
      // Что-то произошло при настройке запроса
      console.error('❌ ERROR:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
