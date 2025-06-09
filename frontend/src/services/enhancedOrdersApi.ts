/**
 * @file: enhancedOrdersApi.ts
 * @description: API для работы с улучшенным импортом Excel заказов
 * @dependencies: api
 * @created: 2025-06-09
 */
import api from './api';

export interface ExcelOrderPreview {
  rowNumber: number;
  drawingNumber: string;
  quantity: number;
  deadline: string;
  priority: string;
  workType: string;
  color: string;
  colorLabel: string;
  operations: Array<{
    number: number;
    type: string;
    time: number;
    axes: number;
  }>;
  selected: boolean;
  exists: boolean;
}

export interface ExcelPreviewResult {
  fileName: string;
  totalRows: number;
  orders: ExcelOrderPreview[];
  colorStatistics: {
    green: { count: number; label: string; description: string };
    yellow: { count: number; label: string; description: string };
    red: { count: number; label: string; description: string };
    blue: { count: number; label: string; description: string };
    other: { count: number; label: string; description: string };
  };
  recommendedFilters: Array<{
    color: string;
    label: string;
    count: number;
    description: string;
    priority: number;
    recommended: boolean;
  }>;
  columnMapping: Array<{
    column: string;
    field: string;
    sample: string;
    detected: boolean;
  }>;
}

export interface ImportResult {
  totalRows: number;
  processedRows: number;
  skippedRows: number;
  created: number;
  updated: number;
  duplicatesSkipped: number;
  errors: Array<{ row: number; order: string; error: string; color?: string }>;
  colorStatistics: Record<string, number>;
  summary: {
    greenOrders: number;
    yellowOrders: number;
    redOrders: number;
    blueOrders: number;
  };
  filters: {
    applied: any[];
    total: number;
    selected: number;
  };
}

export interface ImportSelection {
  selectedOrders: string[];
  clearExisting: boolean;
  skipDuplicates: boolean;
  colorFilters: string[];
}

export const enhancedOrdersApi = {
  /**
   * Детальный анализ Excel файла
   */
  analyzeExcel: async (file: File): Promise<{ success: boolean; data: ExcelPreviewResult; message: string }> => {
    console.log('🔍 АНАЛИЗ EXCEL: Отправка файла на анализ:', file.name);

    const formData = new FormData();
    formData.append('excel', file);

    const response = await api.post('/enhanced-orders/analyze-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('✅ АНАЛИЗ ЗАВЕРШЕН:', response.data);
    return response.data;
  },

  /**
   * Полный импорт Excel файла с фильтрами
   */
  importFullExcel: async (
    file: File,
    settings?: {
      clearExisting?: boolean;
      skipDuplicates?: boolean;
      colorFilters?: string[];
    }
  ): Promise<{ success: boolean; message: string; data: ImportResult }> => {
    console.log('🚀 ПОЛНЫЙ ИМПОРТ: Начало импорта файла:', file.name);

    const formData = new FormData();
    formData.append('excel', file);

    // Добавляем настройки импорта
    const importSettings = {
      colorFilters: (settings?.colorFilters || ['green', 'yellow', 'red', 'blue']).map(color => ({
        color,
        label: getColorLabel(color),
        description: `Заказы цвета ${color}`,
        priority: 1,
        selected: true
      })),
      columnMapping: [
        { fieldName: 'Номер чертежа', excelColumn: 'C', description: 'Уникальный номер чертежа', required: true },
        { fieldName: 'Количество', excelColumn: 'E', description: 'Количество изделий', required: true },
        { fieldName: 'Срок', excelColumn: 'H', description: 'Дедлайн выполнения заказа' },
        { fieldName: 'Приоритет', excelColumn: 'K', description: 'Приоритет выполнения заказа' },
        { fieldName: 'Тип работы', excelColumn: 'F', description: 'Описание типа работ' },
      ],
      importOnlySelected: false,
      clearExistingData: settings?.clearExisting || false,
      skipDuplicates: settings?.skipDuplicates !== false // По умолчанию true
    };

    formData.append('importSettings', JSON.stringify(importSettings));

    const response = await api.post('/enhanced-orders/upload-excel-full', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('✅ ИМПОРТ ЗАВЕРШЕН:', response.data);
    return response.data;
  },

  /**
   * Выборочный импорт заказов
   */
  importSelectedOrders: async (
    file: File,
    selection: ImportSelection
  ): Promise<{ success: boolean; message: string; data: ImportResult }> => {
    console.log('🎯 ВЫБОРОЧНЫЙ ИМПОРТ: Начало импорта выбранных заказов');

    const formData = new FormData();
    formData.append('excel', file);
    formData.append('selectedOrders', JSON.stringify(selection.selectedOrders));
    formData.append('clearExisting', String(selection.clearExisting));
    formData.append('skipDuplicates', String(selection.skipDuplicates));
    formData.append('colorFilters', JSON.stringify(selection.colorFilters));

    const response = await api.post('/enhanced-orders/import-selected-orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('✅ ВЫБОРОЧНЫЙ ИМПОРТ ЗАВЕРШЕН:', response.data);
    return response.data;
  },
};

// Вспомогательная функция для получения человекочитаемых названий цветов
function getColorLabel(color: string): string {
  const labels: Record<string, string> = {
    green: 'Зеленый (Готовые)',
    yellow: 'Желтый (Обычные)',
    red: 'Красный (Критичные)',
    blue: 'Синий (Плановые)',
    other: 'Другие цвета'
  };
  return labels[color] || `Цвет: ${color}`;
}

export default enhancedOrdersApi;
