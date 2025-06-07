/**
 * @file: operationHistoryApi.ts
 * @description: API для работы с историей операций
 * @dependencies: api
 * @created: 2025-06-07
 */
import api from './api';

export interface OperationHistoryRecord {
  id?: number;
  drawingNumber: string;
  operationId: number;
  operationNumber: number;
  operationType: string;
  machineId: number;
  machineName: string;
  operatorName?: string;
  shiftType: 'DAY' | 'NIGHT';
  quantityProduced: number;
  timePerUnit?: number;
  setupTime?: number;
  totalTime?: number;
  efficiencyRating?: number;
  dateCompleted: Date;
}

export interface OperatorEfficiencyStats {
  operatorName: string;
  drawingNumber: string;
  operationType: string;
  calculationDate: Date;
  partsPerHour: number;
  planVsFactPercent: number;
  averageTimePerPart: number;
  timeDeviationPercent: number;
  consistencyRating: number;
  workingTimeMinutes: number;
  idleTimeMinutes: number;
  utilizationEfficiency: number;
  overallRating: number;
}

export interface ExportRequest {
  drawingNumber: string;
  dateFrom?: Date;
  dateTo?: Date;
  exportType: 'excel' | 'pdf' | 'csv';
  requestedBy?: string;
}

export interface DrawingInfo {
  drawingNumber: string;
  recordCount: number;
  lastDate: Date;
}

export const operationHistoryApi = {
  // Получить список доступных чертежей для экспорта
  getAvailableDrawings: async (): Promise<DrawingInfo[]> => {
    try {
      const response = await api.get('/operation-history/drawings');
      return response.data.data;
    } catch (error) {
      console.error('operationHistoryApi.getAvailableDrawings error:', error);
      throw error;
    }
  },

  // Получить историю операций по номеру чертежа
  getOperationHistory: async (
    drawingNumber: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<OperationHistoryRecord[]> => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const url = `/operation-history/${encodeURIComponent(drawingNumber)}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('operationHistoryApi.getOperationHistory error:', error);
      throw error;
    }
  },

  // Экспорт истории операций в Excel
  exportToExcel: async (exportRequest: ExportRequest): Promise<{ downloadUrl: string; period: any }> => {
    try {
      const response = await api.post('/operation-history/export/excel', exportRequest);
      return {
        downloadUrl: response.data.downloadUrl,
        period: response.data.period
      };
    } catch (error) {
      console.error('operationHistoryApi.exportToExcel error:', error);
      throw error;
    }
  },

  // Скачать экспортированный файл
  downloadFile: async (fileName: string): Promise<Blob> => {
    try {
      const response = await api.get(`/operation-history/download/${encodeURIComponent(fileName)}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('operationHistoryApi.downloadFile error:', error);
      throw error;
    }
  },

  // Вычислить и сохранить статистику эффективности оператора
  calculateOperatorStats: async (
    operatorName: string,
    drawingNumber: string,
    date?: string
  ): Promise<OperatorEfficiencyStats> => {
    try {
      const response = await api.post('/operation-history/operator-stats', {
        operatorName,
        drawingNumber,
        date
      });
      return response.data.data;
    } catch (error) {
      console.error('operationHistoryApi.calculateOperatorStats error:', error);
      throw error;
    }
  },

  // Сохранить запись смены в историю операций
  saveShiftToHistory: async (shiftId: number, forceRecalculate: boolean = false): Promise<void> => {
    try {
      await api.post('/operation-history/save-shift-to-history', {
        shiftId,
        forceRecalculate
      });
    } catch (error) {
      console.error('operationHistoryApi.saveShiftToHistory error:', error);
      throw error;
    }
  },

  // Утилитарные функции
  utils: {
    // Скачать файл напрямую (открыть в новой вкладке)
    downloadFileDirect: (fileName: string): void => {
      const url = `${api.defaults.baseURL}/operation-history/download/${encodeURIComponent(fileName)}`;
      window.open(url, '_blank');
    },

    // Форматировать дату для API
    formatDateForApi: (date: Date): string => {
      return date.toISOString().split('T')[0];
    },

    // Проверить, есть ли данные для экспорта
    hasDataForExport: (drawingInfo: DrawingInfo): boolean => {
      return drawingInfo.recordCount > 0;
    },

    // Получить цвет для рейтинга эффективности
    getEfficiencyColor: (rating: number): string => {
      if (rating >= 90) return '#52c41a'; // зеленый
      if (rating >= 70) return '#faad14'; // желтый
      return '#ff4d4f'; // красный
    },

    // Форматировать время в человекочитаемый формат
    formatTime: (minutes: number): string => {
      if (minutes < 60) return `${minutes}мин`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}ч ${mins}мин` : `${hours}ч`;
    },

    // Вычислить среднее значение массива
    calculateAverage: (values: number[]): number => {
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  }
};

export default operationHistoryApi;
