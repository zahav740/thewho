/**
 * @file: operation-history.service.ts
 * @description: Сервис для работы с историей операций
 * @dependencies: typeorm
 * @created: 2025-06-07
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

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
  dateFrom: Date;
  dateTo: Date;
  exportType: 'excel' | 'pdf' | 'csv';
  requestedBy?: string;
}

@Injectable()
export class OperationHistoryService {
  private readonly logger = new Logger(OperationHistoryService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'exports');

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    // Создаем директорию для экспорта если не существует
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Сохранить запись об операции в историю
   */
  async saveOperationToHistory(record: OperationHistoryRecord): Promise<void> {
    try {
      await this.dataSource.query(`
        INSERT INTO operation_history (
          drawing_number, operation_id, operation_number, operation_type,
          machine_id, machine_name, operator_name, shift_type,
          quantity_produced, time_per_unit, setup_time, total_time,
          efficiency_rating, date_completed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        record.drawingNumber,
        record.operationId,
        record.operationNumber,
        record.operationType,
        record.machineId,
        record.machineName,
        record.operatorName,
        record.shiftType,
        record.quantityProduced,
        record.timePerUnit,
        record.setupTime,
        record.totalTime,
        record.efficiencyRating,
        record.dateCompleted
      ]);

      this.logger.log(`История операции сохранена: ${record.drawingNumber} - ${record.operationNumber}`);
    } catch (error) {
      this.logger.error('Ошибка при сохранении истории операции:', error);
      throw error;
    }
  }

  /**
   * Получить историю операций по номеру чертежа
   */
  async getOperationHistory(
    drawingNumber: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<OperationHistoryRecord[]> {
    try {
      let query = `
        SELECT * FROM operation_history 
        WHERE drawing_number = $1
      `;
      const params = [drawingNumber];

      if (dateFrom && dateTo) {
        query += ` AND date_completed BETWEEN $2 AND $3`;
        params.push(dateFrom.toISOString().split('T')[0], dateTo.toISOString().split('T')[0]);
      }

      query += ` ORDER BY date_completed DESC, operation_number ASC`;

      const results = await this.dataSource.query(query, params);
      
      this.logger.log(`Получена история операций для ${drawingNumber}: ${results.length} записей`);
      return results.map(this.mapDatabaseRecordToInterface);
    } catch (error) {
      this.logger.error(`Ошибка при получении истории операций для ${drawingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Вычислить и сохранить статистику эффективности оператора
   */
  async calculateAndSaveOperatorStats(
    operatorName: string,
    drawingNumber: string,
    date: Date
  ): Promise<OperatorEfficiencyStats> {
    try {
      // Получаем данные оператора за период
      const operatorRecords = await this.dataSource.query(`
        SELECT * FROM operation_history 
        WHERE operator_name = $1 AND drawing_number = $2 
        AND DATE(date_completed) = $3
        ORDER BY date_completed ASC
      `, [operatorName, drawingNumber, date.toISOString().split('T')[0]]);

      if (operatorRecords.length === 0) {
        throw new Error(`Нет данных для оператора ${operatorName} по чертежу ${drawingNumber}`);
      }

      // Вычисляем метрики
      const stats = this.calculateOperatorMetrics(operatorRecords);
      
      // Сохраняем статистику
      await this.dataSource.query(`
        INSERT INTO operator_efficiency_stats (
          operator_name, drawing_number, operation_type, calculation_date,
          parts_per_hour, plan_vs_fact_percent, average_time_per_part,
          time_deviation_percent, consistency_rating, working_time_minutes,
          idle_time_minutes, utilization_efficiency, overall_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (operator_name, drawing_number, calculation_date)
        DO UPDATE SET
          parts_per_hour = EXCLUDED.parts_per_hour,
          plan_vs_fact_percent = EXCLUDED.plan_vs_fact_percent,
          average_time_per_part = EXCLUDED.average_time_per_part,
          time_deviation_percent = EXCLUDED.time_deviation_percent,
          consistency_rating = EXCLUDED.consistency_rating,
          working_time_minutes = EXCLUDED.working_time_minutes,
          idle_time_minutes = EXCLUDED.idle_time_minutes,
          utilization_efficiency = EXCLUDED.utilization_efficiency,
          overall_rating = EXCLUDED.overall_rating,
          updated_at = NOW()
      `, [
        operatorName,
        drawingNumber,
        operatorRecords[0].operation_type,
        date.toISOString().split('T')[0],
        stats.partsPerHour,
        stats.planVsFactPercent,
        stats.averageTimePerPart,
        stats.timeDeviationPercent,
        stats.consistencyRating,
        stats.workingTimeMinutes,
        stats.idleTimeMinutes,
        stats.utilizationEfficiency,
        stats.overallRating
      ]);

      this.logger.log(`Статистика оператора ${operatorName} обновлена`);
      return stats;
    } catch (error) {
      this.logger.error('Ошибка при вычислении статистики оператора:', error);
      throw error;
    }
  }

  /**
   * Экспорт истории операций в Excel
   */
  async exportToExcel(request: ExportRequest): Promise<string> {
    try {
      const history = await this.getOperationHistory(
        request.drawingNumber,
        request.dateFrom,
        request.dateTo
      );

      if (history.length === 0) {
        throw new Error('Нет данных для экспорта');
      }

      // Подготавливаем данные для Excel
      const exportData = history.map(record => ({
        'Дата': record.dateCompleted.toLocaleDateString('ru-RU'),
        'Номер чертежа': record.drawingNumber,
        'Операция №': record.operationNumber,
        'Тип операции': record.operationType,
        'Станок': record.machineName,
        'Оператор': record.operatorName || '-',
        'Смена': record.shiftType === 'DAY' ? 'Дневная' : 'Ночная',
        'Количество деталей': record.quantityProduced,
        'Время на деталь (мин)': record.timePerUnit || 0,
        'Время наладки (мин)': record.setupTime || 0,
        'Общее время (мин)': record.totalTime || 0,
        'Эффективность (%)': record.efficiencyRating || 0
      }));

      // Создаем Excel файл с помощью ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('История операций');
      
      // Устанавливаем заголовки столбцов
      worksheet.columns = [
        { header: 'Дата', key: 'date', width: 12 },
        { header: 'Номер чертежа', key: 'drawingNumber', width: 15 },
        { header: 'Операция №', key: 'operationNumber', width: 10 },
        { header: 'Тип операции', key: 'operationType', width: 12 },
        { header: 'Станок', key: 'machine', width: 12 },
        { header: 'Оператор', key: 'operator', width: 12 },
        { header: 'Смена', key: 'shift', width: 10 },
        { header: 'Количество деталей', key: 'quantity', width: 15 },
        { header: 'Время на деталь (мин)', key: 'timePerPart', width: 18 },
        { header: 'Время наладки (мин)', key: 'setupTime', width: 18 },
        { header: 'Общее время (мин)', key: 'totalTime', width: 15 },
        { header: 'Эффективность (%)', key: 'efficiency', width: 15 }
      ];

      // Добавляем данные
      exportData.forEach(record => {
        worksheet.addRow({
          date: record['Дата'],
          drawingNumber: record['Номер чертежа'],
          operationNumber: record['Операция №'],
          operationType: record['Тип операции'],
          machine: record['Станок'],
          operator: record['Оператор'],
          shift: record['Смена'],
          quantity: record['Количество деталей'],
          timePerPart: record['Время на деталь (мин)'],
          setupTime: record['Время наладки (мин)'],
          totalTime: record['Общее время (мин)'],
          efficiency: record['Эффективность (%)']
        });
      });

      // Сохраняем файл
      const fileName = `operation_history_${request.drawingNumber}_${Date.now()}.xlsx`;
      const filePath = join(this.uploadsDir, fileName);
      await workbook.xlsx.writeFile(filePath);

      // Сохраняем запись о запросе
      await this.dataSource.query(`
        INSERT INTO operation_export_requests (
          drawing_number, date_from, date_to, export_type, 
          file_path, status, requested_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        request.drawingNumber,
        request.dateFrom.toISOString().split('T')[0],
        request.dateTo.toISOString().split('T')[0],
        request.exportType,
        filePath,
        'completed',
        request.requestedBy
      ]);

      this.logger.log(`Экспорт в Excel завершен: ${fileName}`);
      return filePath;
    } catch (error) {
      this.logger.error('Ошибка при экспорте в Excel:', error);
      throw error;
    }
  }

  /**
   * Получить список доступных чертежей для экспорта
   */
  async getAvailableDrawings(): Promise<{ drawingNumber: string; recordCount: number; lastDate: Date }[]> {
    try {
      const results = await this.dataSource.query(`
        SELECT 
          drawing_number,
          COUNT(*) as record_count,
          MAX(date_completed) as last_date
        FROM operation_history 
        GROUP BY drawing_number
        ORDER BY last_date DESC
      `);

      return results.map(row => ({
        drawingNumber: row.drawing_number,
        recordCount: parseInt(row.record_count),
        lastDate: row.last_date
      }));
    } catch (error) {
      this.logger.error('Ошибка при получении списка чертежей:', error);
      throw error;
    }
  }

  /**
   * Вычисление метрик эффективности оператора
   */
  private calculateOperatorMetrics(records: any[]): OperatorEfficiencyStats {
    const totalParts = records.reduce((sum, r) => sum + r.quantity_produced, 0);
    const totalTime = records.reduce((sum, r) => sum + (r.total_time || 0), 0);
    const avgTimePerPart = totalParts > 0 ? totalTime / totalParts : 0;
    
    // Предполагаемое плановое время (можно получать из базы)
    const planTimePerPart = 15; // минут
    const planVsFact = planTimePerPart > 0 ? (planTimePerPart / avgTimePerPart * 100) : 0;
    const partsPerHour = totalTime > 0 ? (totalParts / (totalTime / 60)) : 0;
    
    // Стабильность (разброс времени на деталь)
    const timesPerPart = records.map(r => r.time_per_unit || 0).filter(t => t > 0);
    const avgTimeFromSamples = timesPerPart.reduce((a, b) => a + b, 0) / timesPerPart.length;
    const variance = timesPerPart.reduce((acc, time) => acc + Math.pow(time - avgTimeFromSamples, 2), 0) / timesPerPart.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgTimeFromSamples * 100));
    
    // Общий рейтинг
    const efficiency = Math.min(100, Math.max(0, planVsFact));
    const rating = (Math.min(10, partsPerHour) + Math.min(10, efficiency / 10) + Math.min(10, consistency / 10)) / 3;

    return {
      operatorName: records[0].operator_name,
      drawingNumber: records[0].drawing_number,
      operationType: records[0].operation_type,
      calculationDate: new Date(),
      partsPerHour: Math.round(partsPerHour * 100) / 100,
      planVsFactPercent: Math.round(planVsFact * 10) / 10,
      averageTimePerPart: Math.round(avgTimePerPart * 10) / 10,
      timeDeviationPercent: Math.round(((avgTimePerPart - planTimePerPart) / planTimePerPart * 100) * 10) / 10,
      consistencyRating: Math.round(consistency * 10) / 10,
      workingTimeMinutes: Math.round(totalTime),
      idleTimeMinutes: 0, // Пока не реализовано
      utilizationEfficiency: Math.round(efficiency * 10) / 10,
      overallRating: Math.round(rating * 10) / 10
    };
  }

  /**
   * Маппинг записи из базы данных в интерфейс
   */
  private mapDatabaseRecordToInterface(dbRecord: any): OperationHistoryRecord {
    return {
      id: dbRecord.id,
      drawingNumber: dbRecord.drawing_number,
      operationId: dbRecord.operation_id,
      operationNumber: dbRecord.operation_number,
      operationType: dbRecord.operation_type,
      machineId: dbRecord.machine_id,
      machineName: dbRecord.machine_name,
      operatorName: dbRecord.operator_name,
      shiftType: dbRecord.shift_type,
      quantityProduced: dbRecord.quantity_produced,
      timePerUnit: dbRecord.time_per_unit,
      setupTime: dbRecord.setup_time,
      totalTime: dbRecord.total_time,
      efficiencyRating: dbRecord.efficiency_rating,
      dateCompleted: dbRecord.date_completed
    };
  }
}
