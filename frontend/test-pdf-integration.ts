/**
 * @file: test-pdf-integration.ts
 * @description: Тест импортов для PDF интеграции
 * @created: 2025-06-21
 */

// Тестируем импорты компонентов
import { PdfViewer, PdfUpload } from '../src/components/common';

// Тестируем импорт обновленной формы заказа
import { OrderForm } from '../src/pages/Database/components/OrderForm';

// Тестируем импорт обновленного API
import { ordersApi } from '../src/services/ordersApi';

// Проверяем наличие новых методов в API
console.log('PDF API methods available:', {
  uploadPdf: typeof ordersApi.uploadPdf,
  getPdfUrl: typeof ordersApi.getPdfUrl,
  deletePdf: typeof ordersApi.deletePdf,
});

// Проверяем компоненты
console.log('PDF Components available:', {
  PdfViewer: typeof PdfViewer,
  PdfUpload: typeof PdfUpload,
  OrderForm: typeof OrderForm,
});

export {};