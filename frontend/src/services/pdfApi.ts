/**
 * @file: pdfApi.ts (ИСПРАВЛЕННЫЙ)
 * @description: API для работы с PDF файлами - чистая версия без конфликтов
 * @dependencies: api
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Исправлены конфликты экспортов
 */

// Импортируем аварийное исправление напрямую
import pdfApiEmergencyFix from './pdfApi.EMERGENCY_FIX';

// Экспортируем все типы
export type { 
  PdfUploadResult, 
  PdfUploadOptions, 
  PdfDuplicateCheck,
  PdfInfo 
} from './pdfApi.EMERGENCY_FIX';

// Экспортируем API с правильными именами
export const pdfApi = pdfApiEmergencyFix;
export const pdfApiFixed = pdfApiEmergencyFix;

// Default экспорт
export default pdfApiEmergencyFix;
