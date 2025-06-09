/**
 * @file: excel-preview.service.ts
 * @description: Сервис для детального превью Excel файлов с выбором заказов
 * @dependencies: exceljs, enhanced-excel-import.service
 * @created: 2025-06-09
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Express } from 'express';

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
  selected: boolean; // Для интерфейса выбора
  exists: boolean;   // Уже существует в БД
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

export interface ImportSelection {
  selectedOrders: string[]; // Массив номеров чертежей для импорта
  clearExisting: boolean;
  skipDuplicates: boolean;
  colorFilters: string[];   // Выбранные цвета для импорта
}

@Injectable()
export class ExcelPreviewService {
  
  /**
   * ОСНОВНОЙ МЕТОД: Детальный анализ Excel файла с превью всех заказов
   */
  async analyzeExcelFile(file: Express.Multer.File): Promise<ExcelPreviewResult> {
    console.log('🔍 АНАЛИЗ EXCEL: Начало детального анализа файла:', {
      originalname: file.originalname,
      size: file.size,
      hasBuffer: !!file.buffer
    });

    if (!file || !file.buffer) {
      throw new BadRequestException('Файл не предоставлен или поврежден');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден в Excel файле');
    }

    console.log('📊 Структура Excel файла:', {
      worksheetName: worksheet.name,
      totalRows: worksheet.rowCount,
      totalColumns: worksheet.columnCount
    });

    // Анализируем структуру колонок
    const columnMapping = this.analyzeColumnStructure(worksheet);
    
    // Парсим все заказы
    const orders = await this.parseAllOrders(worksheet);
    
    // Подсчитываем статистику по цветам
    const colorStatistics = this.calculateColorStatistics(orders);
    
    // Генерируем рекомендуемые фильтры
    const recommendedFilters = this.generateRecommendedFilters(colorStatistics);

    const result: ExcelPreviewResult = {
      fileName: file.originalname,
      totalRows: worksheet.rowCount - 1, // Исключаем заголовок
      orders,
      colorStatistics,
      recommendedFilters,
      columnMapping
    };

    console.log('✅ АНАЛИЗ ЗАВЕРШЕН:', {
      ordersFound: orders.length,
      colorsDetected: Object.keys(colorStatistics).length,
      recommendedFilters: recommendedFilters.length
    });

    return result;
  }

  /**
   * Анализ структуры колонок Excel файла
   */
  private analyzeColumnStructure(worksheet: ExcelJS.Worksheet): Array<{
    column: string;
    field: string;
    sample: string;
    detected: boolean;
  }> {
    const headerRow = worksheet.getRow(1);
    const dataRow = worksheet.getRow(2); // Берем первую строку данных для примера
    
    const mapping = [];
    
    for (let col = 1; col <= Math.min(10, worksheet.columnCount); col++) {
      const headerValue = headerRow.getCell(col).value?.toString()?.trim() || '';
      const sampleValue = dataRow.getCell(col).value?.toString()?.trim() || '';
      const columnLetter = String.fromCharCode(64 + col); // A, B, C...
      
      let fieldName = 'Неизвестно';
      let detected = false;
      
      // Определяем тип колонки по заголовку и содержимому
      if (col === 1 || this.isDrawingNumberField(headerValue, sampleValue)) {
        fieldName = 'Номер чертежа';
        detected = true;
      } else if (col === 2 || this.isQuantityField(headerValue, sampleValue)) {
        fieldName = 'Количество';
        detected = true;
      } else if (col === 3 || this.isDateField(headerValue, sampleValue)) {
        fieldName = 'Дедлайн';
        detected = true;
      } else if (col === 4 || this.isPriorityField(headerValue, sampleValue)) {
        fieldName = 'Приоритет';
        detected = true;
      } else if (col === 5 || this.isWorkTypeField(headerValue, sampleValue)) {
        fieldName = 'Тип работы';
        detected = true;
      } else if (col >= 6) {
        fieldName = 'Операции';
        detected = this.isOperationField(headerValue, sampleValue);
      }
      
      mapping.push({
        column: columnLetter,
        field: fieldName,
        sample: sampleValue.length > 20 ? sampleValue.substring(0, 20) + '...' : sampleValue,
        detected
      });
    }
    
    return mapping;
  }

  /**
   * Парсинг всех заказов из Excel файла
   */
  private async parseAllOrders(worksheet: ExcelJS.Worksheet): Promise<ExcelOrderPreview[]> {
    const orders: ExcelOrderPreview[] = [];
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      try {
        const row = worksheet.getRow(rowNumber);
        const order = this.parseRowToPreview(row, rowNumber);
        
        if (order) {
          orders.push(order);
          console.log(`📝 Строка ${rowNumber}: ${order.drawingNumber} (${order.color})`);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка в строке ${rowNumber}:`, error.message);
        // Продолжаем обработку, не останавливаемся на ошибках
      }
    }
    
    console.log(`📋 Обработано ${orders.length} заказов`);
    return orders;
  }

  /**
   * Парсинг строки в объект превью заказа
   * ОБНОВЛЕНО: Используем правильный маппинг колонок C, E, H, K
   */
  private parseRowToPreview(row: ExcelJS.Row, rowNumber: number): ExcelOrderPreview | null {
    // ПРАВИЛЬНЫЙ МАППИНГ: C=номер чертежа, E=количество, H=срок, K=приоритет
    const drawingNumber = row.getCell('C').value?.toString()?.trim(); // Колонка C
    if (!drawingNumber) return null;
    
    const quantity = parseInt(row.getCell('E').value?.toString() || '1', 10); // Колонка E
    const deadline = this.formatDeadline(row.getCell('H').value); // Колонка H
    const priority = row.getCell('K').value?.toString()?.trim() || 'Средний'; // Колонка K
    const workType = row.getCell('F').value?.toString()?.trim() || 'Не указан'; // Колонка F
    
    // Определяем цвет строки
    const color = this.determineRowColor(row);
    const colorLabel = this.getColorLabel(color);
    
    // Парсим операции (после колонки K)
    const operations = this.parseOperationsForPreview(row);
    
    console.log(`📋 Превью строки ${rowNumber}: Чертеж=${drawingNumber}, Кол-во=${quantity}, Срок=${deadline}, Приоритет=${priority}`);
    
    return {
      rowNumber,
      drawingNumber,
      quantity,
      deadline,
      priority,
      workType,
      color,
      colorLabel,
      operations,
      selected: true, // По умолчанию выбраны все
      exists: false   // TODO: Проверить в БД позже
    };
  }

  /**
   * Определение цвета строки
   */
  private determineRowColor(row: ExcelJS.Row): string {
    // Проверяем фактический цвет ячейки
    const firstCell = row.getCell(1);
    const cellColor = this.getCellColor(firstCell);
    if (cellColor) return cellColor;
    
    // Определяем по содержимому
    const values = [];
    for (let i = 1; i <= Math.min(10, row.cellCount); i++) {
      const cellValue = row.getCell(i).value;
      if (cellValue) {
        values.push(String(cellValue).toLowerCase());
      }
    }
    
    const allText = values.join(' ');
    
    if (allText.includes('готов') || allText.includes('готово') || allText.includes('завершен')) {
      return 'green';
    } else if (allText.includes('критич') || allText.includes('срочн') || allText.includes('важн')) {
      return 'red';
    } else if (allText.includes('план') || allText.includes('будущ') || allText.includes('отложен')) {
      return 'blue';
    } else {
      return 'yellow';
    }
  }

  /**
   * Получение цвета ячейки Excel
   */
  private getCellColor(cell: ExcelJS.Cell): string | null {
    try {
      const fill = cell.style?.fill;
      if (fill && fill.type === 'pattern') {
        const patternFill = fill as ExcelJS.FillPattern;
        const argb = patternFill.fgColor?.argb;
        
        if (argb) {
          const colorMap: Record<string, string> = {
            'FF00FF00': 'green',   'FF92D050': 'green',   'FF00B050': 'green',
            'FFFFFF00': 'yellow',  'FFFFCC00': 'yellow',  'FFFFC000': 'yellow',
            'FFFF0000': 'red',     'FFFF6666': 'red',     'FFFF9999': 'red',
            'FF0000FF': 'blue',    'FF6699CC': 'blue',    'FF9BC2E6': 'blue',
          };
          
          return colorMap[argb] || null;
        }
      }
    } catch (error) {
      // Игнорируем ошибки
    }
    
    return null;
  }

  /**
   * Получение человекочитаемого названия цвета
   */
  private getColorLabel(color: string): string {
    const labels: Record<string, string> = {
      green: '🟢 Готовые заказы',
      yellow: '🟡 Обычные заказы', 
      red: '🔴 Критичные заказы',
      blue: '🔵 Плановые заказы',
      other: '⚪ Другие'
    };
    return labels[color] || labels.other;
  }

  /**
   * Форматирование даты для отображения
   */
  private formatDeadline(value: any): string {
    if (value instanceof Date) {
      return value.toLocaleDateString('ru-RU');
    }
    
    if (typeof value === 'number') {
      // Excel serial date
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toLocaleDateString('ru-RU');
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
    }
    
    return 'Не указан';
  }

  /**
   * Парсинг операций для превью
   * ОБНОВЛЕНО: Операции начинаются после колонки K (11)
   */
  private parseOperationsForPreview(row: ExcelJS.Row): Array<{
    number: number;
    type: string;
    time: number;
    axes: number;
  }> {
    const operations = [];
    
    // Операции начинаются с колонки L (12) - после K
    for (let i = 12; i <= Math.min(30, row.cellCount); i += 4) {
      const opNumber = parseInt(row.getCell(i).value?.toString() || '0', 10);
      if (!opNumber) break;
      
      const opType = row.getCell(i + 1).value?.toString()?.trim() || 'Фрезерная';
      const opAxes = parseInt(row.getCell(i + 2).value?.toString() || '3', 10);
      const opTime = parseInt(row.getCell(i + 3).value?.toString() || '60', 10);
      
      operations.push({
        number: opNumber,
        type: opType,
        time: opTime,
        axes: opAxes
      });
    }
    
    if (operations.length === 0) {
      operations.push({
        number: 1,
        type: 'Фрезерная',
        time: 60,
        axes: 3
      });
    }
    
    return operations;
  }

  /**
   * Подсчет статистики по цветам
   */
  private calculateColorStatistics(orders: ExcelOrderPreview[]) {
    const stats = {
      green: { count: 0, label: '🟢 Готовые заказы', description: 'Заказы готовые к производству' },
      yellow: { count: 0, label: '🟡 Обычные заказы', description: 'Стандартные заказы' },
      red: { count: 0, label: '🔴 Критичные заказы', description: 'Срочные заказы высокого приоритета' },
      blue: { count: 0, label: '🔵 Плановые заказы', description: 'Плановые заказы на будущее' },
      other: { count: 0, label: '⚪ Другие', description: 'Заказы неопределенного типа' }
    };
    
    orders.forEach(order => {
      if (stats[order.color]) {
        stats[order.color].count++;
      } else {
        stats.other.count++;
      }
    });
    
    return stats;
  }

  /**
   * Генерация рекомендуемых фильтров
   */
  private generateRecommendedFilters(statistics: any) {
    const filters = [];
    
    Object.entries(statistics).forEach(([color, data]: [string, any]) => {
      if (data.count > 0) {
        filters.push({
          color,
          label: data.label,
          count: data.count,
          description: `${data.description} (${data.count} шт.)`,
          priority: this.getColorPriority(color),
          recommended: data.count > 0
        });
      }
    });
    
    return filters.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Получение приоритета цвета для сортировки
   */
  private getColorPriority(color: string): number {
    const priorities: Record<string, number> = {
      red: 1,    // Критичные - первые
      yellow: 2, // Обычные - вторые  
      green: 3,  // Готовые - третьи
      blue: 4,   // Плановые - четвертые
      other: 5   // Другие - последние
    };
    return priorities[color] || 5;
  }

  // Вспомогательные методы для определения типов колонок
  private isDrawingNumberField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    return headerLower.includes('номер') || headerLower.includes('чертеж') || headerLower.includes('number') || 
           headerLower.includes('drawing') || !!sample.match(/^[A-Z0-9\-_]+$/);
  }

  private isQuantityField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    return headerLower.includes('количество') || headerLower.includes('qty') || headerLower.includes('quantity') ||
           (!isNaN(parseInt(sample)) && parseInt(sample) > 0 && parseInt(sample) < 10000);
  }

  private isDateField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    return headerLower.includes('дата') || headerLower.includes('срок') || headerLower.includes('date') ||
           headerLower.includes('deadline') || !isNaN(Date.parse(sample));
  }

  private isPriorityField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    const sampleLower = sample.toLowerCase();
    return headerLower.includes('приоритет') || headerLower.includes('priority') ||
           sampleLower.includes('высок') || sampleLower.includes('критич') || sampleLower.includes('низк');
  }

  private isWorkTypeField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    return headerLower.includes('тип') || headerLower.includes('работа') || headerLower.includes('type') ||
           headerLower.includes('work') || headerLower.includes('описание');
  }

  private isOperationField(header: string, sample: string): boolean {
    const headerLower = header.toLowerCase();
    const sampleLower = sample.toLowerCase();
    return headerLower.includes('операция') || headerLower.includes('operation') ||
           sampleLower.includes('фрез') || sampleLower.includes('ток') || sampleLower.includes('сверл');
  }
}
