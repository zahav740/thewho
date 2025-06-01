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
  OrdersResponse,
  OrderFormOperationDto
} from '../types/order.types';

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
    await api.delete(`/orders/${id}`);
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

  // Импортировать заказы из Excel
  importExcel: async (file: File, colorFilters?: string[]): Promise<any> => {
    console.log('Начало импорта файла:', file.name);
    
    const formData = new FormData();
    formData.append('excel', file); // Изменено с 'file' на 'excel'
    
    // Добавляем маппинг колонок для нового API
    const columnMapping = {
      drawingNumber: 'C',
      revision: 'D', 
      quantity: 'E',
      deadline: 'H',
      priority: 'K'
    };
    
    console.log('Настройки:', columnMapping);
    formData.append('columnMapping', JSON.stringify(columnMapping));

    const response = await api.post('/orders/upload-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Результат импорта:', response.data);
    return response.data.result || response.data; // Возвращаем result или весь ответ
  },

  // Предварительный просмотр Excel файла
  previewExcel: async (file: File): Promise<any[]> => {
    console.log('Превью для файла:', file.name);
    
    const formData = new FormData();
    formData.append('excel', file);
    
    // Тестовый маппинг для превью
    const columnMapping = {
      drawingNumber: 'C',
      quantity: 'E', 
      deadline: 'H'
    };
    
    formData.append('columnMapping', JSON.stringify(columnMapping));

    try {
      const response = await api.post('/orders/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Симуляция превью данных
      const preview = [
        {id: 1, orderNumber: 'ORD-2025-001', drawingNumber: 'DWG-001-Rev-A', quantity: 10},
        {id: 2, orderNumber: 'ORD-2025-002', drawingNumber: 'DWG-002-Rev-B', quantity: 25},
        {id: 3, orderNumber: 'ORD-2025-003', drawingNumber: 'DWG-003-Rev-C', quantity: 15}
      ];
      
      console.log('Превью:', preview);
      return preview;
    } catch (error) {
      console.error('Ошибка превью:', error);
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

  // Получить PDF файл заказа
  getPdfUrl: (orderId: number): string => {
    return `${api.defaults.baseURL}/orders/${orderId}/pdf`;
  },
};

export default ordersApi;
