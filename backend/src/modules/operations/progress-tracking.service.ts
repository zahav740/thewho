/**
 * @file: progress-tracking.service.ts
 * @description: Сервис для отслеживания прогресса операций (НОВЫЙ)
 * @dependencies: typeorm
 * @created: 2025-06-11
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface OperationProgress {
  id: number;
  operationId: number;
  completedUnits: number;
  totalUnits: number;
  progressPercentage: number;
  startedAt?: Date;
  lastUpdated: Date;
}

export interface ProductionMetrics {
  totalOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  pendingOperations: number;
  averageProgress: number;
  dailyProduction: number;
  machineUtilization: number;
}

@Injectable()
export class ProgressTrackingService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Обновить прогресс операции
   */
  async updateProgress(
    operationId: number, 
    completedUnits: number, 
    totalUnits: number
  ): Promise<OperationProgress> {
    try {
      console.log(`ProgressTracking: Обновление прогресса операции ${operationId}: ${completedUnits}/${totalUnits}`);

      // Обновляем или создаем запись прогресса
      await this.dataSource.query(`
        INSERT INTO operation_progress (operation_id, completed_units, total_units, started_at, last_updated)
        VALUES ($1, $2, $3, COALESCE(
          (SELECT started_at FROM operation_progress WHERE operation_id = $1), 
          NOW()
        ), NOW())
        ON CONFLICT (operation_id) 
        DO UPDATE SET 
          completed_units = $2,
          total_units = $3,
          last_updated = NOW()
      `, [operationId, completedUnits, totalUnits]);

      // Если операция завершена на 100%, автоматически завершаем её
      if (completedUnits >= totalUnits) {
        await this.completeOperation(operationId);
      }

      // Возвращаем обновленный прогресс
      return await this.getOperationProgress(operationId);
    } catch (error) {
      console.error('ProgressTracking.updateProgress ошибка:', error);
      throw error;
    }
  }

  /**
   * Получить прогресс операции
   */
  async getOperationProgress(operationId: number): Promise<OperationProgress> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          p.id,
          p.operation_id as "operationId",
          p.completed_units as "completedUnits",
          p.total_units as "totalUnits",
          p.progress_percentage as "progressPercentage",
          p.started_at as "startedAt",
          p.last_updated as "lastUpdated"
        FROM operation_progress p
        WHERE p.operation_id = $1
      `, [operationId]);

      if (result.length === 0) {
        throw new NotFoundException(`Прогресс для операции ${operationId} не найден`);
      }

      return result[0];
    } catch (error) {
      console.error('ProgressTracking.getOperationProgress ошибка:', error);
      throw error;
    }
  }

  /**
   * Начать операцию
   */
  async startOperation(operationId: number): Promise<void> {
    try {
      console.log(`ProgressTracking: Начало операции ${operationId}`);

      await this.dataSource.transaction(async manager => {
        // 1. Обновляем статус операции
        await manager.query(`
          UPDATE operations 
          SET 
            status = 'IN_PROGRESS',
            "updatedAt" = NOW()
          WHERE id = $1
        `, [operationId]);

        // 2. Устанавливаем время начала в прогрессе
        await manager.query(`
          UPDATE operation_progress 
          SET 
            started_at = COALESCE(started_at, NOW()),
            last_updated = NOW()
          WHERE operation_id = $1
        `, [operationId]);
      });
    } catch (error) {
      console.error('ProgressTracking.startOperation ошибка:', error);
      throw error;
    }
  }

  /**
   * Завершить операцию
   */
  async completeOperation(operationId: number): Promise<void> {
    try {
      console.log(`ProgressTracking: Завершение операции ${operationId}`);

      await this.dataSource.transaction(async manager => {
        // 1. Завершить операцию
        await manager.query(`
          UPDATE operations SET 
            status = 'COMPLETED',
            "completedAt" = NOW(),
            "updatedAt" = NOW()
          WHERE id = $1
        `, [operationId]);

        // 2. Обновить прогресс до 100%
        await manager.query(`
          UPDATE operation_progress 
          SET 
            completed_units = total_units,
            last_updated = NOW()
          WHERE operation_id = $1
        `, [operationId]);

        // 3. Освободить станок
        await manager.query(`
          UPDATE machines SET 
            "isOccupied" = false,
            "currentOperation" = NULL,
            "updatedAt" = NOW()
          WHERE "currentOperation" = $1
        `, [operationId]);

        // 4. Активировать следующую операцию в последовательности
        const nextOp = await manager.query(`
          SELECT id FROM operations 
          WHERE "orderId" = (SELECT "orderId" FROM operations WHERE id = $1)
            AND "operationNumber" = (SELECT "operationNumber" + 1 FROM operations WHERE id = $1)
            AND status = 'PENDING'
        `, [operationId]);

        if (nextOp.length > 0) {
          await manager.query(`
            UPDATE operations SET status = 'PENDING' WHERE id = $1
          `, [nextOp[0].id]);
          console.log(`ProgressTracking: Активирована следующая операция ${nextOp[0].id}`);
        }
      });

      console.log(`ProgressTracking: Операция ${operationId} успешно завершена`);
    } catch (error) {
      console.error('ProgressTracking.completeOperation ошибка:', error);
      throw error;
    }
  }

  /**
   * Получить производственные метрики
   */
  async getProductionMetrics(): Promise<ProductionMetrics> {
    try {
      const [operationStats, dailyProduction, machineStats] = await Promise.all([
        this.getOperationStatistics(),
        this.getDailyProduction(),
        this.getMachineUtilization()
      ]);

      return {
        totalOperations: operationStats.total,
        completedOperations: operationStats.completed,
        inProgressOperations: operationStats.inProgress,
        pendingOperations: operationStats.pending,
        averageProgress: operationStats.averageProgress,
        dailyProduction: dailyProduction.totalParts,
        machineUtilization: machineStats.utilizationPercentage
      };
    } catch (error) {
      console.error('ProgressTracking.getProductionMetrics ошибка:', error);
      throw error;
    }
  }

  private async getOperationStatistics() {
    const result = await this.dataSource.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN o.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN o.status = 'PENDING' THEN 1 END) as pending,
        ROUND(AVG(COALESCE(p.progress_percentage, 0)), 2) as average_progress
      FROM operations o
      LEFT JOIN operation_progress p ON o.id = p.operation_id
    `);

    return {
      total: parseInt(result[0].total),
      completed: parseInt(result[0].completed),
      inProgress: parseInt(result[0].in_progress),
      pending: parseInt(result[0].pending),
      averageProgress: parseFloat(result[0].average_progress) || 0
    };
  }

  private async getDailyProduction() {
    const result = await this.dataSource.query(`
      SELECT 
        COALESCE(SUM(p.completed_units), 0) as total_parts,
        COUNT(*) as operations_updated
      FROM operation_progress p
      WHERE DATE(p.last_updated) = CURRENT_DATE
    `);

    return {
      totalParts: parseInt(result[0].total_parts),
      operationsUpdated: parseInt(result[0].operations_updated)
    };
  }

  private async getMachineUtilization() {
    const result = await this.dataSource.query(`
      SELECT 
        COUNT(*) as total_machines,
        COUNT(CASE WHEN "isOccupied" = true THEN 1 END) as busy_machines,
        ROUND(
          (COUNT(CASE WHEN "isOccupied" = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
          2
        ) as utilization_percentage
      FROM machines
      WHERE "isActive" = true
    `);

    return {
      totalMachines: parseInt(result[0].total_machines),
      busyMachines: parseInt(result[0].busy_machines),
      utilizationPercentage: parseFloat(result[0].utilization_percentage) || 0
    };
  }

  /**
   * Получить активные операции с прогрессом
   */
  async getActiveOperationsWithProgress() {
    try {
      return await this.dataSource.query(`
        SELECT 
          o.id,
          o."operationNumber",
          o.operationtype as "operationType",
          o."estimatedTime",
          o.status,
          m.code as "machineName",
          ord.drawing_number as "orderDrawingNumber",
          p.completed_units as "completedUnits",
          p.total_units as "totalUnits",
          p.progress_percentage as "progressPercentage",
          p.started_at as "startedAt",
          p.last_updated as "lastUpdated"
        FROM operations o
        LEFT JOIN machines m ON o."assignedMachine" = m.id
        LEFT JOIN orders ord ON o."orderId" = ord.id
        LEFT JOIN operation_progress p ON o.id = p.operation_id
        WHERE o.status IN ('IN_PROGRESS', 'ASSIGNED')
        ORDER BY o."updatedAt" DESC
      `);
    } catch (error) {
      console.error('ProgressTracking.getActiveOperationsWithProgress ошибка:', error);
      throw error;
    }
  }
}
