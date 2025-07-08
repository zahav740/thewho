/**
 * @file: pdfEnhancedApi.ts
 * @description: Улучшенный API для работы с PDF файлами заказов
 * @created: 2025-07-07
 */
import api from './api';

export interface PdfUploadResult {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  isDuplicate?: boolean;
  duplicateInfo?: {
    originalOrderId: number;
    originalDrawingNumber: string;
    originalFilePath: string;
  };
}

export interface PdfDuplicateCheck {
  isDuplicate: boolean;
  existingFile?: {
    orderId: number;
    drawingNumber: string;
    filePath: string;
    uploadedAt: string;
  };
}

export const pdfEnhancedApi = {
  /**
   * Проверка дубликатов PDF по номеру чертежа
   */
  checkDuplicate: async (drawingNumber: string): Promise<PdfDuplicateCheck> => {
    try {
      const response = await api.get(`/pdf/check-duplicate/${encodeURIComponent(drawingNumber)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { isDuplicate: false };
      }
      throw error;
    }
  },

  /**
   * Проверка дубликатов PDF по хешу файла
   */
  checkFileHash: async (file: File): Promise<PdfDuplicateCheck> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/pdf/check-hash', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { isDuplicate: false };
      }
      throw error;
    }
  },

  /**
   * Загрузка PDF с организацией по папкам (номер чертежа)
   */
  uploadPdf: async (
    orderId: number, 
    drawingNumber: string, 
    file: File,
    options?: {
      replaceDuplicate?: boolean;
      useExisting?: boolean;
    }
  ): Promise<PdfUploadResult> => {
    console.log(`📁 Загрузка PDF для заказа ${orderId}, чертеж: ${drawingNumber}`);
    console.log(`📄 Файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('drawingNumber', drawingNumber);
    
    if (options?.replaceDuplicate) {
      formData.append('replaceDuplicate', 'true');
    }
    if (options?.useExisting) {
      formData.append('useExisting', 'true');
    }

    const response = await api.post(`/orders/${orderId}/upload-pdf-enhanced`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log('✅ PDF загружен успешно:', response.data);
    return response.data;
  },

  /**
   * Получение информации о PDF файле заказа
   */
  getPdfInfo: async (orderId: number): Promise<{
    exists: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
  }> => {
    try {
      const response = await api.get(`/orders/${orderId}/pdf-info`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw error;
    }
  },

  /**
   * Получение списка всех PDF файлов для чертежа
   */
  getPdfsByDrawingNumber: async (drawingNumber: string): Promise<Array<{
    orderId: number;
    filePath: string;
    fileName: string;
    uploadedAt: string;
  }>> => {
    const response = await api.get(`/pdf/by-drawing/${encodeURIComponent(drawingNumber)}`);
    return response.data;
  },

  /**
   * Удаление PDF файла с возможностью сохранения в архиве
   */
  deletePdf: async (orderId: number, options?: { archive?: boolean }): Promise<void> => {
    console.log(`🗑️ Удаление PDF для заказа ${orderId}`);
    
    const params = options?.archive ? { archive: 'true' } : {};
    await api.delete(`/orders/${orderId}/pdf-enhanced`, { params });
    
    console.log('✅ PDF удален успешно');
  },

  /**
   * Массовая загрузка PDF файлов
   */
  bulkUploadPdf: async (uploads: Array<{
    orderId: number;
    drawingNumber: string;
    file: File;
  }>): Promise<Array<PdfUploadResult & { orderId: number }>> => {
    console.log(`📁 Массовая загрузка ${uploads.length} PDF файлов`);

    const formData = new FormData();
    
    uploads.forEach((upload, index) => {
      formData.append(`files[${index}]`, upload.file);
      formData.append(`orderIds[${index}]`, upload.orderId.toString());
      formData.append(`drawingNumbers[${index}]`, upload.drawingNumber);
    });

    const response = await api.post('/pdf/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log('✅ Массовая загрузка завершена:', response.data);
    return response.data;
  },

  /**
   * Получение статистики по PDF файлам
   */
  getPdfStatistics: async (): Promise<{
    totalFiles: number;
    totalSize: number;
    byDrawingNumber: Record<string, number>;
    recentUploads: Array<{
      orderId: number;
      drawingNumber: string;
      fileName: string;
      uploadedAt: string;
    }>;
  }> => {
    const response = await api.get('/pdf/statistics');
    return response.data;
  },

  /**
   * Очистка устаревших файлов
   */
  cleanupOrphanedFiles: async (): Promise<{
    deletedFiles: number;
    freedSpace: number;
  }> => {
    const response = await api.post('/pdf/cleanup');
    return response.data;
  },

  /**
   * Создание резервной копии PDF файлов
   */
  createBackup: async (drawingNumbers?: string[]): Promise<{
    backupId: string;
    fileName: string;
    fileCount: number;
    fileSize: number;
  }> => {
    const data = drawingNumbers ? { drawingNumbers } : {};
    const response = await api.post('/pdf/backup', data);
    return response.data;
  }
};

export default pdfEnhancedApi;