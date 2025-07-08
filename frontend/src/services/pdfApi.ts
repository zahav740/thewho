/**
 * @file: pdfApi.ts (ИСПРАВЛЕННЫЙ)
 * @description: API для работы с PDF файлами - исправленная версия
 * @dependencies: api
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Полное исправление PDF API
 */
import api from './api';

export interface PdfUploadResult {
  success: boolean;
  filename: string;
  path: string;
  size: number;
  hash: string;
  orderId: number;
  drawingNumber: string;
  action: 'uploaded' | 'replaced' | 'revision' | 'existing';
  message: string;
  url: string;
  previewUrl: string;
}

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

export interface PdfUploadOptions {
  replaceDuplicate?: boolean;
  useExisting?: boolean;
  createRevision?: boolean;
}

// Интерфейсы для совместимости со старыми компонентами
export interface PdfDuplicateConflict {
  error: string;
  message: string;
  existingOrder?: any;
  actions: Array<{
    key: string;
    label: string;
    description: string;
  }>;
}

export interface PdfUploadResponse {
  success: boolean;
  filename: string;
  pdfPath: string;
  message: string;
}

export const pdfApiFixed = {
  /**
   * Проверить дубликат PDF по номеру чертежа
   */
  checkDuplicateByDrawingNumber: async (drawingNumber: string): Promise<PdfDuplicateCheck> => {
    console.log('🔍 Проверка дубликата PDF по номеру чертежа:', drawingNumber);
    try {
      const response = await api.get(`/pdf-enhanced/check-duplicate/${encodeURIComponent(drawingNumber)}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка проверки дубликата:', error);
      throw new Error(error.response?.data?.message || 'Ошибка проверки дубликата');
    }
  },

  /**
   * Проверить дубликат PDF по хешу файла
   */
  checkDuplicateByHash: async (file: File): Promise<PdfDuplicateCheck> => {
    console.log('🔍 Проверка дубликата PDF по хешу файла:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/pdf-enhanced/check-hash', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка проверки дубликата по хешу:', error);
      throw new Error(error.response?.data?.message || 'Ошибка проверки дубликата по хешу');
    }
  },

  /**
   * Загрузить PDF файл для заказа
   */
  uploadPdf: async (
    orderId: number,
    drawingNumber: string,
    file: File,
    options: PdfUploadOptions = {}
  ): Promise<PdfUploadResult> => {
    console.log('📄 Загрузка PDF:', { orderId, drawingNumber, fileName: file.name, options });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('drawingNumber', drawingNumber);
      
      if (options.replaceDuplicate) formData.append('replaceDuplicate', 'true');
      if (options.useExisting) formData.append('useExisting', 'true');
      if (options.createRevision) formData.append('createRevision', 'true');

      const response = await api.post(`/pdf-enhanced/orders/${orderId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 секунд для загрузки больших файлов
      });

      console.log('✅ PDF загружен успешно:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка загрузки PDF файла');
    }
  },

  /**
   * СОВМЕСТИМОСТЬ: Загрузить PDF (старый формат с 2 параметрами)
   */
  uploadPdfLegacy: async (orderId: number, file: File): Promise<PdfUploadResponse> => {
    console.log('📄 Загрузка PDF (legacy):', { orderId, fileName: file.name });
    try {
      // Пытаемся извлечь номер чертежа из имени файла
      const drawingMatch = file.name.match(/^([^_\s]+)/);
      const drawingNumber = drawingMatch ? drawingMatch[1] : `order_${orderId}`;
      
      const result = await pdfApiFixed.uploadPdf(orderId, drawingNumber, file);
      
      // Преобразуем результат в старый формат
      return {
        success: result.success,
        filename: result.filename,
        pdfPath: result.filename, // Для совместимости
        message: result.message
      };
    } catch (error: any) {
      console.error('❌ Ошибка загрузки PDF (legacy):', error);
      throw error;
    }
  },

  /**
   * Получить информацию о PDF файле заказа
   */
  getPdfInfo: async (orderId: number): Promise<PdfInfo> => {
    console.log('📋 Получение информации о PDF для заказа:', orderId);
    try {
      const response = await api.get(`/pdf-enhanced/orders/${orderId}/info`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения информации о PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка получения информации о PDF');
    }
  },

  /**
   * Получить список PDF файлов для чертежа
   */
  getPdfsByDrawingNumber: async (drawingNumber: string) => {
    console.log('📋 Получение PDF файлов для чертежа:', drawingNumber);
    try {
      const response = await api.get(`/pdf-enhanced/by-drawing/${encodeURIComponent(drawingNumber)}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения PDF для чертежа:', error);
      throw new Error(error.response?.data?.message || 'Ошибка получения PDF для чертежа');
    }
  },

  /**
   * Удалить PDF файл заказа
   */
  deletePdf: async (orderId: number, archive: boolean = false): Promise<{ success: boolean; message: string }> => {
    console.log('🗑️ Удаление PDF для заказа:', orderId, archive ? '(архивирование)' : '');
    try {
      const params = archive ? '?archive=true' : '';
      const response = await api.delete(`/pdf-enhanced/orders/${orderId}${params}`);
      console.log('✅ PDF удален успешно');
      return { success: true, message: response.data.message || 'PDF файл удален' };
    } catch (error: any) {
      console.error('❌ Ошибка удаления PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка удаления PDF файла');
    }
  },

  /**
   * Получить URL для просмотра PDF файла
   */
  getPdfUrl: (drawingNumber: string, filename: string): string => {
    const baseURL = api.defaults.baseURL || '';
    return `${baseURL}/pdf-enhanced/file/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}`;
  },

  /**
   * СОВМЕСТИМОСТЬ: Получить PDF URL по пути (для старых компонентов)
   */
  getPdfUrlByPath: (pdfPath: string): string => {
    // Извлекаем имя файла из пути
    const filename = pdfPath.split('/').pop() || pdfPath;
    // Пытаемся извлечь номер чертежа из имени файла
    const drawingMatch = filename.match(/^([^_]+)_/);
    const drawingNumber = drawingMatch ? drawingMatch[1] : 'unknown';
    
    return pdfApiFixed.getPdfUrl(drawingNumber, filename);
  },

  /**
   * Получить URL для скачивания PDF файла
   */
  getDownloadUrl: (drawingNumber: string, filename: string): string => {
    const baseURL = api.defaults.baseURL || '';
    return `${baseURL}/pdf-enhanced/file/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}?download=true`;
  },

  /**
   * Получить URL для превью PDF файла
   */
  getPreviewUrl: (drawingNumber: string, filename: string, page: number = 1): string => {
    const baseURL = api.defaults.baseURL || '';
    return `${baseURL}/pdf-enhanced/preview/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}?page=${page}`;
  },

  /**
   * Получить статистику по PDF файлам
   */
  getStatistics: async () => {
    console.log('📊 Получение статистики PDF файлов');
    try {
      const response = await api.get('/pdf-enhanced/statistics');
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения статистики:', error);
      throw new Error(error.response?.data?.message || 'Ошибка получения статистики');
    }
  },

  /**
   * Очистить устаревшие PDF файлы
   */
  cleanup: async () => {
    console.log('🧹 Очистка устаревших PDF файлов');
    try {
      const response = await api.post('/pdf-enhanced/cleanup');
      console.log('✅ Очистка завершена:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка очистки:', error);
      throw new Error(error.response?.data?.message || 'Ошибка очистки файлов');
    }
  },

  /**
   * ДИАГНОСТИКА: Проверить структуру папок PDF
   */
  debugStructure: async () => {
    console.log('🔧 Диагностика структуры PDF папок');
    try {
      const response = await api.get('/pdf-enhanced/debug/structure');
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка диагностики структуры:', error);
      throw new Error(error.response?.data?.message || 'Ошибка диагностики структуры');
    }
  },

  /**
   * ДИАГНОСТИКА: Получить информацию о конкретном файле
   */
  debugFile: async (drawingNumber: string, filename: string) => {
    console.log('🔧 Диагностика файла:', drawingNumber, filename);
    try {
      const response = await api.get(`/pdf-enhanced/debug/file/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка диагностики файла:', error);
      throw new Error(error.response?.data?.message || 'Ошибка диагностики файла');
    }
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
   * Тестовое подключение к PDF API
   */
  testConnection: async (): Promise<boolean> => {
    console.log('🔗 Тестирование подключения к PDF API');
    try {
      const response = await api.get('/pdf-enhanced/statistics');
      console.log('✅ PDF API доступно');
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ PDF API недоступно:', error);
      return false;
    }
  },

  /**
   * Получить превью информацию о PDF файле
   */
  getPreviewInfo: async (drawingNumber: string, filename: string, page: number = 1) => {
    console.log('📋 Получение превью информации:', drawingNumber, filename, page);
    try {
      const response = await api.get(`/pdf-enhanced/preview/${encodeURIComponent(drawingNumber)}/${encodeURIComponent(filename)}?page=${page}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения превью информации:', error);
      throw new Error(error.response?.data?.message || 'Ошибка получения превью информации');
    }
  },

  /**
   * Использовать существующий PDF файл для заказа
   */
  useExistingPdf: async (orderId: number, existingFilename: string, drawingNumber: string): Promise<PdfUploadResult> => {
    console.log('🔄 Использование существующего PDF:', { orderId, existingFilename, drawingNumber });
    try {
      // Создаем пустой файл для триггера API
      const emptyFile = new File([''], existingFilename, { type: 'application/pdf' });
      
      return await pdfApiFixed.uploadPdf(orderId, drawingNumber, emptyFile, { useExisting: true });
    } catch (error: any) {
      console.error('❌ Ошибка использования существующего PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка использования существующего PDF');
    }
  },

  /**
   * Создать ревизию PDF файла
   */
  createRevision: async (orderId: number, drawingNumber: string, file: File): Promise<PdfUploadResult> => {
    console.log('📄 Создание ревизии PDF:', { orderId, drawingNumber, fileName: file.name });
    try {
      return await pdfApiFixed.uploadPdf(orderId, drawingNumber, file, { createRevision: true });
    } catch (error: any) {
      console.error('❌ Ошибка создания ревизии PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка создания ревизии PDF');
    }
  },

  /**
   * Заменить существующий PDF файл
   */
  replacePdf: async (orderId: number, drawingNumber: string, file: File): Promise<PdfUploadResult> => {
    console.log('🔄 Замена PDF файла:', { orderId, drawingNumber, fileName: file.name });
    try {
      return await pdfApiFixed.uploadPdf(orderId, drawingNumber, file, { replaceDuplicate: true });
    } catch (error: any) {
      console.error('❌ Ошибка замены PDF:', error);
      throw new Error(error.response?.data?.message || 'Ошибка замены PDF файла');
    }
  },
};

// Экспорты для совместимости
export const pdfApi = pdfApiFixed;
export default pdfApiFixed;
