// types/excel-import.types.ts
export interface ColumnMapping {
  [columnLetter: string]: string;
}

export interface BaseImportSettings {
  columnMapping: ColumnMapping;
  sheetName?: string;
  startRow?: number;
  updateExisting?: boolean;
}

// Для совместимости с существующим кодом
export interface ExcelImportSettings extends BaseImportSettings {
  sheetIndex: number;
  hasHeaders: boolean;
  startRow: number; // Делаем обязательным
  colorFilters?: string[];
}

// Для нового гибкого импорта
export interface FlexibleImportSettings extends BaseImportSettings {
  // Дополнительные настройки при необходимости
}

export interface ExcelColumn {
  letter: string;
  index: number;
  header: string;
  sampleData: any[];
}

export interface ExcelAnalysisResult {
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
  }>;
  columns: ExcelColumn[];
  selectedSheet: {
    name: string;
    range: string;
  };
}

export interface FlexibleImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    field?: string;
    value?: any;
    error: string;
  }>;
  statistics: {
    totalProcessed: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
  };
  preview?: any[];
}
