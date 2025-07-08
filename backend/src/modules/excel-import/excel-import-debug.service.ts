/**
 * @file: excel-import-debug.service.ts
 * @description: Упрощенная версия сервиса для отладки
 * @created: 2025-07-03
 */
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExcelImportDebugService {
  private readonly logger = new Logger(ExcelImportDebugService.name);

  /**
   * Простая проверка сервиса
   */
  async getStats() {
    this.logger.log('📊 DEBUG: getStats вызван');
    
    try {
      // Возвращаем мок данные для проверки
      const mockStats = {
        totalFiles: 0,
        totalSize: 0,
        statusCounts: {
          parsed: 0,
          error: 0,
          processing: 0,
          uploading: 0
        },
        totalRows: 0
      };

      this.logger.log('✅ DEBUG: Возвращаем мок статистику');
      return mockStats;
    } catch (error) {
      this.logger.error('❌ DEBUG: Ошибка в getStats:', error);
      throw error;
    }
  }

  /**
   * Простая проверка списка файлов
   */
  async getExcelFilesList(page = 1, limit = 20, status?: string) {
    this.logger.log(`📋 DEBUG: getExcelFilesList вызван (page=${page}, limit=${limit}, status=${status})`);
    
    try {
      // Возвращаем мок данные
      const mockResponse = {
        files: [],
        total: 0,
        page,
        totalPages: 0,
      };

      this.logger.log('✅ DEBUG: Возвращаем пустой список файлов');
      return mockResponse;
    } catch (error) {
      this.logger.error('❌ DEBUG: Ошибка в getExcelFilesList:', error);
      throw error;
    }
  }
}
