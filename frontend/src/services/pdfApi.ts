/**
 * @file: pdfApi.ts
 * @description: API для работы с PDF файлами заказов
 * @dependencies: axios
 * @created: 2025-06-21
 */
import { api } from './api';

export interface PdfUploadResponse {
  success: boolean;
  pdfPath?: string;
  pdfUrl?: string;
  message?: string;
}

export class PdfApi {
  /**
   * Загрузить PDF файл для заказа
   */
  async uploadPdf(orderId: number, file: File): Promise<PdfUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    console.log(`📁 Загрузка PDF для заказа ${orderId}:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      const response = await api.post<any>(`/orders/${orderId}/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ PDF успешно загружен:', response.data);

      return {
        success: true,
        pdfPath: response.data.pdfPath,
        pdfUrl: response.data.pdfUrl,
        message: 'PDF файл успешно загружен',
      };
    } catch (error: any) {
      console.error('❌ Ошибка загрузки PDF:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Ошибка при загрузке PDF файла';

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Получить URL для просмотра PDF файла
   */
  getPdfUrl(orderId: number): string {
    const baseUrl = process.env.REACT_APP_API_URL || '/api';
    return `${baseUrl}/orders/${orderId}/pdf`;
  }

  /**
   * Получить URL для скачивания PDF файла по пути
   */
  getPdfUrlByPath(pdfPath: string): string {
    const baseUrl = process.env.REACT_APP_API_URL || '/api';
    // Извлекаем только имя файла из полного пути
    const filename = pdfPath.split('/').pop() || pdfPath;
    console.log('📄 PDF URL generation:', { pdfPath, filename, baseUrl });
    return `${baseUrl}/orders/pdf/${filename}`;
  }

  /**
   * Удалить PDF файл заказа
   */
  async deletePdf(orderId: number): Promise<PdfUploadResponse> {
    console.log(`🗑️ Удаление PDF для заказа ${orderId}`);

    try {
      const response = await api.delete<any>(`/orders/${orderId}/pdf`);

      console.log('✅ PDF успешно удален:', response.data);

      return {
        success: true,
        message: 'PDF файл успешно удален',
      };
    } catch (error: any) {
      console.error('❌ Ошибка удаления PDF:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Ошибка при удалении PDF файла';

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Проверить доступность PDF файла
   */
  async checkPdfAvailability(orderId: number): Promise<boolean> {
    try {
      const response = await api.head(`/orders/${orderId}/pdf`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Скачать PDF файл
   */
  async downloadPdf(orderId: number, fileName?: string): Promise<void> {
    try {
      const response = await api.get(`/orders/${orderId}/pdf`, {
        responseType: 'blob',
      });

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Очищаем ресурсы
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`✅ PDF файл заказа ${orderId} скачан`);
    } catch (error) {
      console.error(`❌ Ошибка скачивания PDF для заказа ${orderId}:`, error);
      throw error;
    }
  }
}

export const pdfApi = new PdfApi();
