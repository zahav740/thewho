/**
 * @file: operation-analytics.service.ts
 * @description: Сервис аналитики операций с правильной логикой версионирования по ID
 * @dependencies: typeorm
 * @created: 2025-06-11
 * @updated: 2025-06-11 - Исправлена логика: один чертеж = много заказов по ID
 */
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface OperationTimeAnalytics {
  operationType: string;
  machineType: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  completedOperations: number;
  efficiency: number;
  recommendedTime: number;
}

export interface OperationSuggestion {
  operationType: string;
  estimatedTime: number;
  confidence: number;
  basedOnOperations: number;
  basedOnOrders: number;
  lastOrderId: number;
  lastOrderDate: string;
  historicalData: {
    orderId: number;
    quantity: number;
    estimatedTime: number;
    completedAt?: string;
  }[];
}

@Injectable()
export class OperationAnalyticsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить рекомендации для нового заказа того же чертежа
   * ИСПРАВЛЕНО: Поиск по точному номеру чертежа, разные заказы по ID
   */
  async getOperationSuggestions(
    orderDrawingNumber: string,
    orderQuantity: number,
    workType?: string
  ): Promise<OperationSuggestion[]> {
    try {
      console.log(`🔍 Поиск рекомендаций для чертежа: ${orderDrawingNumber}`);

      // ИСПРАВЛЕНО: Ищем все завершенные заказы с ТОЧНО таким же чертежом
      const historicalOrders = await this.dataSource.query(`
        SELECT DISTINCT
          ord.id as order_id,
          ord.drawing_number,
          ord.quantity,
          ord.priority,
          ord.deadline,
          -- Проверяем завершенность заказа
          CASE 
            WHEN COUNT(op.id) > 0 AND COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END) = COUNT(op.id)
            THEN true 
            ELSE false 
          END as is_completed
        FROM orders ord
        LEFT JOIN operations op ON ord.id = op."orderId"
        WHERE ord.drawing_number = $1  -- ТОЧНОЕ совпадение чертежа
        GROUP BY ord.id, ord.drawing_number, ord.quantity, ord.priority, ord.deadline
        HAVING COUNT(op.id) > 0  -- Только заказы с операциями
        ORDER BY ord.id DESC  -- Последние заказы первыми
      `, [orderDrawingNumber]);

      if (historicalOrders.length === 0) {
        console.log(`📋 Нет исторических данных для чертежа ${orderDrawingNumber}`);
        return await this.getFallbackSuggestions(workType);
      }

      console.log(`📊 Найдено ${historicalOrders.length} заказов с чертежом ${orderDrawingNumber}`);

      // Получаем операции из всех заказов этого чертежа
      const historicalOperations = await this.dataSource.query(`
        SELECT 
          op.id,
          op."operationNumber",
          op.operationtype,
          op."estimatedTime",
          op.status,
          ord.id as order_id,
          ord.quantity as order_quantity,
          prog.progress_percentage,
          prog.completed_units,
          op."updatedAt" as completed_at
        FROM operations op
        INNER JOIN orders ord ON op."orderId" = ord.id
        LEFT JOIN operation_execution_progress prog ON op.id = prog.operation_id
        WHERE ord.drawing_number = $1
          AND op.status IN ('COMPLETED', 'IN_PROGRESS', 'ASSIGNED')
        ORDER BY ord.id DESC, op."operationNumber"
      `, [orderDrawingNumber]);

      // Группируем операции по типу и анализируем
      const operationGroups = this.groupOperationsByType(historicalOperations);
      const suggestions = [];

      for (const [operationType, operations] of Object.entries(operationGroups)) {
        const suggestion = this.analyzeSimilarOperations(
          operationType,
          operations,
          orderQuantity,
          orderDrawingNumber
        );
        
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('OperationAnalytics.getOperationSuggestions ошибка:', error);
      throw error;
    }
  }

  /**
   * Группировка операций по типу
   */
  private groupOperationsByType(operations: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    operations.forEach(op => {
      if (!groups[op.operationtype]) {
        groups[op.operationtype] = [];
      }
      groups[op.operationtype].push(op);
    });

    return groups;
  }

  /**
   * Анализ похожих операций для создания рекомендации
   */
  private analyzeSimilarOperations(
    operationType: string,
    operations: any[],
    targetQuantity: number,
    drawingNumber: string
  ): OperationSuggestion | null {
    
    if (operations.length === 0) return null;

    // Анализируем время с учетом количества деталей
    const timeAnalysis = operations.map(op => {
      // Нормализуем время на единицу продукции
      const timePerUnit = op.estimatedTime / (op.order_quantity || 1);
      const estimatedTimeForTarget = timePerUnit * targetQuantity;
      
      return {
        ...op,
        timePerUnit,
        estimatedTimeForTarget,
        weight: this.calculateWeight(op, targetQuantity)
      };
    });

    // Взвешенное среднее время
    const totalWeight = timeAnalysis.reduce((sum, item) => sum + item.weight, 0);
    const weightedAverageTime = timeAnalysis.reduce(
      (sum, item) => sum + (item.estimatedTimeForTarget * item.weight), 0
    ) / totalWeight;

    // Расчет уверенности
    const confidence = this.calculateConfidence(operations, drawingNumber);

    // Последний заказ для справки
    const lastOperation = operations[0]; // Уже отсортированы по убыванию ID

    return {
      operationType,
      estimatedTime: Math.round(weightedAverageTime),
      confidence,
      basedOnOperations: operations.length,
      basedOnOrders: new Set(operations.map(op => op.order_id)).size,
      lastOrderId: lastOperation.order_id,
      lastOrderDate: lastOperation.completed_at || 'В процессе',
      historicalData: operations.slice(0, 5).map(op => ({
        orderId: op.order_id,
        quantity: op.order_quantity,
        estimatedTime: op.estimatedTime,
        completedAt: op.status === 'COMPLETED' ? op.completed_at : undefined
      }))
    };
  }

  /**
   * Расчет веса операции для анализа
   */
  private calculateWeight(operation: any, targetQuantity: number): number {
    let weight = 1;

    // Бонус за завершенные операции
    if (operation.status === 'COMPLETED') {
      weight += 0.5;
    }

    // Бонус за похожее количество
    const quantityRatio = Math.min(
      operation.order_quantity / targetQuantity,
      targetQuantity / operation.order_quantity
    );
    weight += quantityRatio * 0.3;

    // Штраф за очень старые данные (если есть дата)
    // TODO: Добавить анализ даты когда будет поле created_at

    return weight;
  }

  /**
   * Расчет уверенности рекомендации
   */
  private calculateConfidence(operations: any[], drawingNumber: string): number {
    let confidence = 0;

    // Базовая уверенность от количества операций
    const operationCount = operations.length;
    confidence += Math.min(operationCount * 15, 60); // Максимум 60% от количества

    // Бонус за точное совпадение чертежа (всегда есть в нашем случае)
    confidence += 30;

    // Бонус за завершенные операции
    const completedOperations = operations.filter(op => op.status === 'COMPLETED').length;
    confidence += Math.min(completedOperations * 5, 15);

    // Бонус за несколько разных заказов
    const uniqueOrders = new Set(operations.map(op => op.order_id)).size;
    if (uniqueOrders > 1) {
      confidence += Math.min(uniqueOrders * 5, 20);
    }

    return Math.min(confidence, 100);
  }

  /**
   * Резервные рекомендации когда нет исторических данных
   */
  private async getFallbackSuggestions(workType?: string): Promise<OperationSuggestion[]> {
    try {
      // Ищем средние значения по типу работы или общие
      const fallbackQuery = workType 
        ? `WHERE ord."workType" = $1`
        : '';
      
      const params = workType ? [workType] : [];

      const avgOperations = await this.dataSource.query(`
        SELECT 
          op.operationtype,
          ROUND(AVG(op."estimatedTime"), 0) as avg_time,
          COUNT(*) as operation_count
        FROM operations op
        INNER JOIN orders ord ON op."orderId" = ord.id
        ${fallbackQuery}
        GROUP BY op.operationtype
        HAVING COUNT(*) >= 2
        ORDER BY operation_count DESC
      `, params);

      return avgOperations.map(avg => ({
        operationType: avg.operationtype,
        estimatedTime: avg.avg_time,
        confidence: Math.min(avg.operation_count * 10, 40), // Низкая уверенность
        basedOnOperations: avg.operation_count,
        basedOnOrders: 0,
        lastOrderId: 0,
        lastOrderDate: 'Общая статистика',
        historicalData: []
      }));

    } catch (error) {
      console.error('Ошибка в getFallbackSuggestions:', error);
      return [];
    }
  }

  /**
   * Получить полную историю операций для чертежа
   */
  async getDrawingHistory(drawingNumber: string): Promise<any[]> {
    try {
      return await this.dataSource.query(`
        SELECT 
          ord.id as order_id,
          ord.quantity,
          ord.priority,
          ord.deadline,
          op.id as operation_id,
          op."operationNumber",
          op.operationtype,
          op."estimatedTime",
          op.status,
          prog.progress_percentage,
          prog.completed_units,
          prog.total_units,
          CASE 
            WHEN op.status = 'COMPLETED' THEN op."updatedAt"
            ELSE NULL 
          END as completed_at
        FROM orders ord
        LEFT JOIN operations op ON ord.id = op."orderId"
        LEFT JOIN operation_execution_progress prog ON op.id = prog.operation_id
        WHERE ord.drawing_number = $1
        ORDER BY ord.id DESC, op."operationNumber"
      `, [drawingNumber]);
    } catch (error) {
      console.error('OperationAnalytics.getDrawingHistory ошибка:', error);
      throw error;
    }
  }

  /**
   * Найти последний завершенный заказ для чертежа
   */
  async getLastCompletedOrder(drawingNumber: string): Promise<any | null> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          ord.id,
          ord.quantity,
          ord.priority,
          COUNT(op.id) as total_operations,
          COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END) as completed_operations,
          MAX(op."updatedAt") as last_operation_date
        FROM orders ord
        INNER JOIN operations op ON ord.id = op."orderId"
        WHERE ord.drawing_number = $1
        GROUP BY ord.id, ord.quantity, ord.priority
        HAVING COUNT(op.id) = COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END)
        ORDER BY ord.id DESC
        LIMIT 1
      `, [drawingNumber]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('OperationAnalytics.getLastCompletedOrder ошибка:', error);
      return null;
    }
  }

  /**
   * Получить статистику по чертежу
   */
  async getDrawingStatistics(drawingNumber: string): Promise<any> {
    try {
      const stats = await this.dataSource.query(`
        WITH order_stats AS (
          SELECT 
            COUNT(DISTINCT ord.id) as total_orders,
            MIN(ord.quantity) as min_quantity,
            MAX(ord.quantity) as max_quantity,
            ROUND(AVG(ord.quantity), 0) as avg_quantity
          FROM orders ord
          WHERE ord.drawing_number = $1
        ),
        operation_stats AS (
          SELECT 
            COUNT(*) as total_operations,
            COUNT(CASE WHEN op.status = 'COMPLETED' THEN 1 END) as completed_operations,
            ROUND(AVG(op."estimatedTime"), 0) as avg_estimated_time
          FROM operations op
          INNER JOIN orders ord ON op."orderId" = ord.id
          WHERE ord.drawing_number = $1
        )
        SELECT 
          os.*,
          ops.*
        FROM order_stats os
        CROSS JOIN operation_stats ops
      `, [drawingNumber]);

      return stats[0] || {
        total_orders: 0,
        total_operations: 0,
        completed_operations: 0,
        min_quantity: 0,
        max_quantity: 0,
        avg_quantity: 0,
        avg_estimated_time: 0
      };
    } catch (error) {
      console.error('OperationAnalytics.getDrawingStatistics ошибка:', error);
      throw error;
    }
  }

  // ... остальные методы без изменений ...
  async getOperationTimeAnalytics(
    operationType?: string,
    machineType?: string
  ): Promise<OperationTimeAnalytics[]> {
    // Код остается тем же
    try {
      let whereClause = 'WHERE op.status = \'COMPLETED\'';
      const params = [];
      
      if (operationType) {
        whereClause += ' AND op.operationtype = $1';
        params.push(operationType);
      }
      
      if (machineType) {
        whereClause += ` AND m.type = $${params.length + 1}`;
        params.push(machineType);
      }

      const analytics = await this.dataSource.query(`
        SELECT 
          op.operationtype as "operationType",
          m.type as "machineType",
          ROUND(AVG(op."estimatedTime")::DECIMAL, 2) as "averageTime",
          MIN(op."estimatedTime") as "minTime",
          MAX(op."estimatedTime") as "maxTime",
          COUNT(*) as "completedOperations",
          ROUND(
            (COUNT(CASE WHEN prog.progress_percentage = 100 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
            2
          ) as "efficiency",
          ROUND(
            AVG(op."estimatedTime") * 
            (COUNT(CASE WHEN prog.progress_percentage = 100 THEN 1 END)::DECIMAL / COUNT(*)), 
            2
          ) as "recommendedTime"
        FROM operations op
        LEFT JOIN machines m ON op."assignedMachine" = m.id
        LEFT JOIN operation_execution_progress prog ON op.id = prog.operation_id
        ${whereClause}
        GROUP BY op.operationtype, m.type
        ORDER BY "completedOperations" DESC
      `, params);

      return analytics;
    } catch (error) {
      console.error('OperationAnalytics.getOperationTimeAnalytics ошибка:', error);
      throw error;
    }
  }
}
