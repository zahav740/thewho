/**
 * @file: operationHistoryService.ts
 * @description: Сервис для работы с API истории операций
 * @created: 2025-06-07
 */

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

class OperationHistoryService {
  private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

  /**
   * Получить список доступных чертежей
   */
  async getAvailableDrawings(): Promise<DrawingInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/operation-history/drawings`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка при получении списка чертежей');
      }
      
      return result.data.map((item: any) => ({
        ...item,
        lastDate: new Date(item.lastDate)
      }));
    } catch (error) {
      console.error('Ошибка при получении списка чертежей:', error);
      throw error;
    }
  }

  /**
   * Получить историю операций по чертежу
   */
  async getOperationHistory(
    drawingNumber: string, 
    dateFrom?: Date, 
    dateTo?: Date
  ): Promise<OperationHistoryRecord[]> {
    try {
      let url = `${this.baseUrl}/operation-history/${encodeURIComponent(drawingNumber)}`;
      const params = new URLSearchParams();
      
      if (dateFrom) {
        params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        params.append('dateTo', dateTo.toISOString().split('T')[0]);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка при получении истории операций');
      }
      
      return result.data.map((item: any) => ({
        ...item,
        dateCompleted: new Date(item.dateCompleted)
      }));
    } catch (error) {
      console.error('Ошибка при получении истории операций:', error);
      throw error;
    }
  }

  /**
   * Экспорт истории операций в Excel
   */
  async exportToExcel(request: ExportRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/operation-history/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          dateFrom: request.dateFrom?.toISOString(),
          dateTo: request.dateTo?.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка при экспорте данных');
      }
      
      return result.downloadUrl;
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      throw error;
    }
  }

  /**
   * Скачать экспортированный файл
   */
  async downloadFile(fileName: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/operation-history/download/${encodeURIComponent(fileName)}`;
      
      // Открываем ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      throw error;
    }
  }

  /**
   * Вычислить статистику оператора
   */
  async calculateOperatorStats(
    operatorName: string,
    drawingNumber: string,
    date?: Date
  ): Promise<OperatorEfficiencyStats> {
    try {
      const response = await fetch(`${this.baseUrl}/operation-history/operator-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorName,
          drawingNumber,
          date: date?.toISOString().split('T')[0],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка при вычислении статистики');
      }
      
      return {
        ...result.data,
        calculationDate: new Date(result.data.calculationDate)
      };
    } catch (error) {
      console.error('Ошибка при вычислении статистики оператора:', error);
      throw error;
    }
  }

  /**
   * Сохранить смену в историю операций
   */
  async saveShiftToHistory(shiftId: number, forceRecalculate: boolean = false): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/operation-history/save-shift-to-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shiftId,
          forceRecalculate,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Ошибка при сохранении смены в историю');
      }
    } catch (error) {
      console.error('Ошибка при сохранении смены в историю:', error);
      throw error;
    }
  }
}

export const operationHistoryService = new OperationHistoryService();
