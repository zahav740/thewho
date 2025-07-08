/**
 * @file: pdfApi.EMERGENCY_FIX.ts
 * @description: АВАРИЙНОЕ ИСПРАВЛЕНИЕ PDF API для совместимости со всеми endpoints
 * @dependencies: api
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Аварийное исправление для поддержки всех форматов
 */
import api from './api';

// Интерфейсы для всех возможных ответов API
export interface PdfUploadResult {
  success: boolean;
  filename?: string;
  fileName?: string; // Альтернативное имя
  path?: string;
  filePath?: string; // Альтернативное имя
  pdfPath?: string; // Legacy
  size?: number;
  hash?: string;
  fileHash?: string; // Альтернативное имя
  orderId?: number;
  drawingNumber?: string;
  action?: string;
  message: string;
  url?: string;
  previewUrl?: string;
}

export interface PdfUploadOptions {
  replaceDuplicate?: boolean;
  useExisting?: boolean;
  createRevision?: boolean;
}

// Дополнительные интерфейсы для совместимости
export interface PdfDuplicateCheck {
  isDuplicate: boolean;
  existingFiles: Array<{
    filename: string;
    path: string;
    orderId: number;
    drawingNumber: string;
    hash: string;
    size: number;
    createdAt: Date;
  }>;
  duplicateType: 'none' | 'hash' | 'name' | 'both';
  hash: string;
}

export interface PdfInfo {
  orderId: number;
  drawingNumber: string;
  hasPdf: boolean;
  filename?: string;
  exists?: boolean;
  fileInfo?: {
    filename: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    hash: string;
    path: string;
  };
  url?: string;
  previewUrl?: string;
  downloadUrl?: string;
  message?: string;
}

const pdfApiEmergencyFix = {
  /**
   * АВАРИЙНАЯ ЗАГРУЗКА PDF - поддержка всех форматов API
   */
  uploadPdf: async (
    orderId: number,
    drawingNumber: string,
    file: File,
    options: PdfUploadOptions = {}
  ): Promise<PdfUploadResult> => {
    console.log('🚨 АВАРИЙНАЯ загрузка PDF:', { orderId, drawingNumber, fileName: file.name, options });
    
    // Список всех возможных endpoints для попытки загрузки
    const endpoints = [
      // Новые исправленные endpoints
      { url: `/orders/${orderId}/upload-pdf`, field: 'file' },
      { url: `/pdf-enhanced/orders/${orderId}/upload`, field: 'file' },
      
      // Legacy endpoints
      { url: `/orders/${orderId}/pdf`, field: 'file' },
      { url: `/orders/${orderId}/upload`, field: 'file' },
      { url: `/pdf/orders/${orderId}/upload`, field: 'file' },
      
      // Альтернативные поля
      { url: `/orders/${orderId}/upload-pdf`, field: 'pdf' },
      { url: `/pdf-enhanced/orders/${orderId}/upload`, field: 'pdf' },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Попытка загрузки через: ${endpoint.url} (поле: ${endpoint.field})`);
        
        const formData = new FormData();
        formData.append(endpoint.field, file);
        
        // Добавляем дополнительные параметры если есть
        if (drawingNumber) formData.append('drawingNumber', drawingNumber);
        if (options.replaceDuplicate) formData.append('action', 'replace');
        if (options.useExisting) formData.append('action', 'use_existing');
        if (options.createRevision) formData.append('action', 'create_revision');

        const response = await api.post(endpoint.url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        });

        console.log(`✅ PDF загружен успешно через ${endpoint.url}:`, response.data);
        
        // Нормализуем ответ для совместимости
        const result: PdfUploadResult = {
          success: true,
          filename: response.data.filename || response.data.fileName,
          path: response.data.path || response.data.filePath || response.data.pdfPath,
          hash: response.data.hash || response.data.fileHash,
          orderId: orderId,
          drawingNumber: drawingNumber,
          action: response.data.action || 'uploaded',
          message: response.data.message || 'PDF файл успешно загружен',
          url: response.data.url,
          previewUrl: response.data.previewUrl,
          ...response.data // Включаем все остальные поля
        };
        
        return result;
        
      } catch (error: any) {
        console.warn(`⚠️ Ошибка загрузки через ${endpoint.url}:`, error.response?.data?.message || error.message);
        
        // Если это не последний endpoint, продолжаем
        if (endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        
        // Если это последний endpoint, выбрасываем ошибку
        console.error('❌ Все endpoints недоступны, последняя ошибка:', error);
        throw new Error(error.response?.data?.message || 'Ошибка загрузки PDF файла');
      }
    }

    throw new Error('Все PDF endpoints недоступны');
  },

  /**
   * АВАРИЙНОЕ УДАЛЕНИЕ PDF - поддержка всех форматов API
   */
  deletePdf: async (orderId: number): Promise<{ success: boolean; message: string }> => {
    console.log('🚨 АВАРИЙНОЕ удаление PDF для заказа:', orderId);
    
    const endpoints = [
      `/orders/${orderId}/pdf`,
      `/pdf-enhanced/orders/${orderId}`,
      `/pdf/orders/${orderId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Попытка удаления через: ${endpoint}`);
        
        const response = await api.delete(endpoint);
        
        console.log(`✅ PDF удален успешно через ${endpoint}`);
        return {
          success: true,
          message: response.data?.message || 'PDF файл удален'
        };
        
      } catch (error: any) {
        console.warn(`⚠️ Ошибка удаления через ${endpoint}:`, error.response?.data?.message || error.message);
        
        if (endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        
        console.error('❌ Все endpoints для удаления недоступны');
        throw new Error(error.response?.data?.message || 'Ошибка удаления PDF файла');
      }
    }

    throw new Error('Все PDF endpoints для удаления недоступны');
  },

  /**
   * АВАРИЙНОЕ ПОЛУЧЕНИЕ URL PDF
   */
  getPdfUrlByPath: (pdfPath: string): string => {
    if (!pdfPath) return '';
    
    const baseURL = api.defaults.baseURL || '';
    
    // Различные форматы URL для попытки
    const possibleUrls = [
      `${baseURL}/orders/pdf/${pdfPath}`,
      `${baseURL}/pdf/${pdfPath}`,
      `${baseURL}/files/pdf/${pdfPath}`,
      `${baseURL}/uploads/pdf/${pdfPath}`,
    ];
    
    // Возвращаем первый URL (можно расширить логику проверки доступности)
    console.log('🔗 PDF URL сгенерирован:', possibleUrls[0]);
    return possibleUrls[0];
  },

  /**
   * ПРОСТАЯ ЗАГРУЗКА PDF для старых компонентов
   */
  uploadPdfSimple: async (orderId: number, file: File): Promise<PdfUploadResult> => {
    console.log('📄 Простая загрузка PDF (legacy):', { orderId, fileName: file.name });
    try {
      // Извлекаем номер чертежа из имени файла или используем fallback
      const drawingMatch = file.name.match(/^([^_\s\.]+)/);
      const drawingNumber = drawingMatch ? drawingMatch[1] : `order_${orderId}`;
      
      return await pdfApiEmergencyFix.uploadPdf(orderId, drawingNumber, file);
    } catch (error: any) {
      console.error('❌ Ошибка простой загрузки PDF:', error);
      throw error;
    }
  },

  /**
   * ДИАГНОСТИКА всех PDF endpoints
   */
  diagnosticPdfEndpoints: async (): Promise<{
    availableEndpoints: string[];
    unavailableEndpoints: string[];
    recommendations: string[];
  }> => {
    console.log('🔧 Диагностика PDF endpoints...');
    
    const testEndpoints = [
      '/pdf-enhanced/statistics',
      '/orders/1/pdf',
      '/pdf/statistics',
      '/files/pdf/test',
    ];
    
    const available: string[] = [];
    const unavailable: string[] = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await api.get(endpoint, { timeout: 5000 });
        available.push(endpoint);
        console.log(`✅ Endpoint доступен: ${endpoint}`);
      } catch (error: any) {
        unavailable.push(endpoint);
        console.log(`❌ Endpoint недоступен: ${endpoint} (${error.response?.status || 'timeout'})`);
      }
    }
    
    const recommendations = [];
    if (available.includes('/pdf-enhanced/statistics')) {
      recommendations.push('Используйте /pdf-enhanced/ endpoints для новых функций');
    }
    if (available.includes('/orders/1/pdf')) {
      recommendations.push('Доступны legacy /orders/ endpoints');
    }
    if (available.length === 0) {
      recommendations.push('Все PDF endpoints недоступны - проверьте backend');
    }
    
    return {
      availableEndpoints: available,
      unavailableEndpoints: unavailable,
      recommendations
    };
  },

  /**
   * Проверить доступность PDF файла
   */
  checkAvailability: async (url: string): Promise<{
    accessible: boolean;
    status: number;
    statusText: string;
    size?: number;
    lastModified?: string;
  }> => {
    console.log('🔍 Проверка доступности PDF по URL:', url);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      return {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText,
        size: response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : undefined,
        lastModified: response.headers.get('last-modified') || undefined,
      };
    } catch (error: any) {
      console.error('❌ Ошибка проверки доступности:', error);
      return {
        accessible: false,
        status: 0,
        statusText: error.message,
      };
    }
  },

  /**
   * Получить URL для просмотра PDF файла
   */
  getPdfUrl: (drawingNumber: string, filename: string): string => {
    const baseURL = api.defaults.baseURL || '';
    return `${baseURL}/pdf-enhanced/file/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}`;
  },
  testPdfConnection: async (): Promise<{
    connected: boolean;
    activeEndpoint: string | null;
    error?: string;
  }> => {
    console.log('🔗 Тестирование подключения к PDF системе...');
    
    const testEndpoints = [
      '/pdf-enhanced/statistics',
      '/orders/test/pdf',
      '/pdf/test',
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await api.get(endpoint, { 
          timeout: 5000,
          validateStatus: (status) => status < 500 // Принимаем 404 как рабочий endpoint
        });
        
        console.log(`✅ PDF система доступна через: ${endpoint}`);
        return {
          connected: true,
          activeEndpoint: endpoint
        };
      } catch (error: any) {
        console.log(`⚠️ Endpoint ${endpoint} недоступен`);
      }
    }
    
    console.error('❌ PDF система недоступна');
    return {
      connected: false,
      activeEndpoint: null,
      error: 'Все PDF endpoints недоступны'
    };
  }
};

// Для совместимости экспортируем под разными именами
export const pdfApi = pdfApiEmergencyFix;
export const pdfApiFixed = pdfApiEmergencyFix;
export default pdfApiEmergencyFix;
