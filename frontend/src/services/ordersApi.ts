/**
 * @file: ordersApi.ts
 * @description: API для работы с заказами
 * @dependencies: api, order.types, operation-formatter
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Добавлена дополнительная обработка ошибок
 */
import api from './api';
import {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  OrdersFilter,
  OrdersResponse
} from '../types/order.types';

// Оставляем комментарий о неиспользуемом типе:
// OrderFormOperationDto - неиспользуемый тип

export const ordersApi = {
  // Получить все заказы с фильтрацией
  getAll: async (filter?: OrdersFilter): Promise<OrdersResponse> => {
    const response = await api.get('/orders', { params: filter });
    return response.data;
  },

  // Получить заказ по ID
  getById: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Создать новый заказ
  create: async (data: CreateOrderDto): Promise<Order> => {
    console.log('📝 Создание заказа:', data);
    
    try {
      // Преобразуем приоритет в строку, если нужно
      const preparedData = {
        ...data,
        priority: String(data.priority),
        operations: data.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        }))
      };
      
      console.log('📝 Отформатированные данные:', preparedData);
      
      const response = await api.post('/orders', preparedData);
      return response.data;
    } catch (error: any) {
      if (error.response && (error.response.status === 400 || error.response.status === 500)) {
        console.error(`❌ Ошибка ${error.response.status} при создании заказа:`, error.response.data);
        
        // Попытка с числовым приоритетом, если первая попытка не удалась
        if (typeof error.response.data === 'string' && error.response.data.includes('priority must be a number')) {
          console.log('⚠️ Повторная попытка с числовым приоритетом...');
          
          const preparedData = {
            ...data,
            priority: Number(data.priority),
            operations: data.operations.map(op => ({
              ...op,
              operationNumber: Number(op.operationNumber),
              machineAxes: Number(op.machineAxes),
              estimatedTime: Number(op.estimatedTime)
            }))
          };
          
          const response = await api.post('/orders', preparedData);
          return response.data;
        }
      }
      
      throw error;
    }
  },

  // Обновить заказ
  update: async (id: number, data: UpdateOrderDto): Promise<Order> => {
    console.log(`📝 Обновление заказа ${id}:`, data);
    
    try {
      // Преобразуем приоритет в строку, если нужно
      const preparedData = {
        ...data,
        priority: String(data.priority),
        operations: data.operations ? data.operations.map(op => ({
          ...op,
          operationNumber: Number(op.operationNumber),
          machineAxes: Number(op.machineAxes),
          estimatedTime: Number(op.estimatedTime)
        })) : undefined
      };
      
      console.log('📝 Отформатированные данные:', preparedData);
      
      const response = await api.put(`/orders/${id}`, preparedData);
      return response.data;
    } catch (error: any) {
      if (error.response && (error.response.status === 400 || error.response.status === 500)) {
        console.error(`❌ Ошибка ${error.response.status} при обновлении заказа:`, error.response.data);
        
        // Для отладки: выводим подробную информацию о данных запроса
        console.log('📊 Данные запроса:', data);
        
        if (data.operations) {
          console.log('📊 Типы данных операций:');
          data.operations.forEach((op: any, index: number) => {
            console.log(`Операция ${index}:`, {
              operationNumber: `${op.operationNumber} (${typeof op.operationNumber})`,
              operationType: `${op.operationType} (${typeof op.operationType})`,
              machineAxes: `${op.machineAxes} (${typeof op.machineAxes})`,
              estimatedTime: `${op.estimatedTime} (${typeof op.estimatedTime})`
            });
          });
        }
        
        // Попытка с числовым приоритетом, если первая попытка не удалась
        if (typeof error.response.data === 'string' && error.response.data.includes('priority must be a number')) {
          console.log('⚠️ Повторная попытка с числовым приоритетом...');
          
          const preparedData = {
            ...data,
            priority: Number(data.priority),
            operations: data.operations ? data.operations.map(op => ({
              ...op,
              operationNumber: Number(op.operationNumber),
              machineAxes: Number(op.machineAxes),
              estimatedTime: Number(op.estimatedTime)
            })) : undefined
          };
          
          const response = await api.put(`/orders/${id}`, preparedData);
          return response.data;
        }
      }
      
      throw error;
    }
  },

  // Удалить заказ
  delete: async (id: number): Promise<void> => {
    console.log('🗑️ API: Удаляем заказ с ID:', id);
    const response = await api.delete(`/orders/${id}`);
    console.log('✅ API: Заказ успешно удалён:', response.status);
  },

  // Удалить выбранные заказы
  deleteBatch: async (ids: string[]): Promise<{ deleted: number }> => {
    console.log('API: Удаление выбранных заказов:', ids);
    const response = await api.delete('/orders/batch/selected', {
      data: { ids }
    });
    console.log('API: Результат удаления выбранных:', response.data);
    return response.data;
  },

  // Удалить все заказы
  deleteAll: async (): Promise<{ deleted: number }> => {
    console.log('API: Удаление всех заказов');
    const response = await api.delete('/orders/all/confirm', {
      data: { confirm: true }
    });
    console.log('API: Результат удаления всех:', response.data);
    return response.data;
  },

  // Получить все ID заказов
  getAllIds: async (): Promise<{ ids: string[], total: number }> => {
    console.log('API: Получение всех ID заказов');
    const response = await api.get('/orders/ids');
    console.log('API: Получено ID:', response.data);
    return response.data;
  },

  // Импортировать заказы из Excel - ТОЛЬКО РЕАЛЬНЫЕ ДАННЫЕ
  importExcel: async (file: File, colorFilters?: string[]): Promise<any> => {
    console.log('📋 Начало реального импорта файла:', file.name, 'Размер:', Math.round(file.size / 1024), 'KB');
    
    const formData = new FormData();
    formData.append('excel', file); // Правильное имя поля для backend
    
    // Добавляем фильтры цветов, если есть
    if (colorFilters && colorFilters.length > 0) {
      formData.append('colorFilters', JSON.stringify(colorFilters));
      console.log('🎨 Применяем цветовые фильтры:', colorFilters);
    } else {
      console.log('📈 Импорт всех строк без фильтров');
    }

    const response = await api.post('/orders/upload-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Результат реального импорта:', response.data);
    
    // Проверяем, что получили реальные данные
    if (response.data.success === false) {
      console.error('❌ Ошибка импорта:', response.data.error);
      throw new Error(response.data.message || 'Ошибка при импорте Excel');
    }
    
    return response.data.data || response.data; // Возвращаем реальные данные
  },

  // Предварительный просмотр Excel файла - ИСПОЛЬЗУЕТ РЕАЛЬНЫЕ ДАННЫЕ
  previewExcel: async (file: File): Promise<any[]> => {
    console.log('🔍 Реальный превью для файла:', file.name);
    
    const formData = new FormData();
    formData.append('file', file); // Используем 'file' для парсинга
    
    try {
      // Используем Files API для парсинга Excel
      const response = await api.post('/files/excel/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Реальные данные из Excel:', response.data);
      
      // Возвращаем первые 5 строк для превью
      const previewData = response.data.rows?.slice(0, 5).map((row: any, index: number) => ({
        id: index + 1,
        ...row
      })) || [];
      
      console.log('📊 Превью данных:', previewData);
      return previewData;
    } catch (error) {
      console.error('❌ Ошибка получения реальных данных из Excel:', error);
      return [];
    }
  },

  // Загрузить PDF для заказа
  uploadPdf: async (orderId: number, file: File): Promise<Order> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/orders/${orderId}/upload-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Получить PDF файл заказа по ID
  getPdfUrl: (orderId: number): string => {
    return `${api.defaults.baseURL}/orders/${orderId}/pdf`;
  },

  // Получить PDF файл по пути
  getPdfUrlByPath: (pdfPath: string): string => {
    // Извлекаем только имя файла из полного пути
    const filename = pdfPath.split('/').pop() || pdfPath;
    return `${api.defaults.baseURL}/orders/pdf/${filename}`;
  },

  // Удалить PDF файл заказа
  deletePdf: async (orderId: number): Promise<Order> => {
    const response = await api.delete(`/orders/${orderId}/pdf`);
    return response.data;
  },
};

export default ordersApi;
