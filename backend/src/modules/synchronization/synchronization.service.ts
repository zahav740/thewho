/**
 * @file: synchronization.service.ts
 * @description: Сервис синхронизации данных между модулями Production и Shifts (упрощенная версия)
 * @dependencies: TypeORM, Operations, ShiftRecords, Machines
 * @created: 2025-06-15
 * @updated: 2025-06-16 - Убран EventEmitter для совместимости
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'; // Пакет не установлен

export interface OperationAssignedEvent {
  operationId: number;
  machineId: number;
  operationNumber: number;
  orderDrawingNumber: string;
  estimatedTime: number;
  operationType: string;
  assignedAt: Date;
}

export interface ShiftRecordCreatedEvent {
  shiftRecordId: number;
  operationId: number;
  machineId: number;
  date: Date;
  dayShiftQuantity?: number;
  nightShiftQuantity?: number;
  totalQuantity: number;
}

export interface SynchronizationStatus {
  operationId: number;
  machineId: number;
  operationStatus: string;
  hasShiftRecords: boolean;
  totalProduced: number;
  targetQuantity: number;
  progress: number;
  lastSyncAt: Date;
}

@Injectable()
export class SynchronizationService {
  private readonly logger = new Logger(SynchronizationService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    // private readonly eventEmitter: EventEmitter2, // Пакет не установлен
  ) {}

  /**
   * 🎯 ОСНОВНОЙ МЕТОД: Назначение операции с автоматической синхронизацией
   */
  async assignOperationWithSync(operationId: number, machineId: number): Promise<SynchronizationStatus> {
    this.logger.log(`🚀 Начинаем синхронизированное назначение операции ${operationId} на станок ${machineId}`);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Получаем данные операции
      const [operation] = await queryRunner.query(`
        SELECT op.*, ord.drawing_number as "orderDrawingNumber", ord.quantity as "orderQuantity"
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.id = $1
      `, [operationId]);

      if (!operation) {
        throw new Error(`Операция ${operationId} не найдена`);
      }

      // 2. Получаем данные станка
      const [machine] = await queryRunner.query(`
        SELECT * FROM machines WHERE id = $1 AND "isActive" = true
      `, [machineId]);

      if (!machine) {
        throw new Error(`Станок ${machineId} не найден или неактивен`);
      }

      // 3. Назначаем операцию на станок
      await queryRunner.query(`
        UPDATE operations 
        SET "assignedMachine" = $1, "assignedAt" = NOW(), status = 'ASSIGNED'
        WHERE id = $2
      `, [machineId, operationId]);

      // 4. Обновляем статус станка
      await queryRunner.query(`
        UPDATE machines 
        SET "isOccupied" = true, "currentOperation" = $1, "assignedAt" = NOW()
        WHERE id = $2
      `, [operationId, machineId]);

      // 5. 🆕 АВТОМАТИЧЕСКИ создаем заготовку записи смены
      const today = new Date().toISOString().split('T')[0];
      
      // Проверяем, есть ли уже запись смены для этой операции
      const [existingShift] = await queryRunner.query(`
        SELECT id FROM shift_records 
        WHERE "operationId" = $1 AND "machineId" = $2 AND date = $3
      `, [operationId, machineId, today]);

      let shiftRecordId: number;
      
      if (!existingShift) {
        // Создаем новую запись смены
        const [newShift] = await queryRunner.query(`
          INSERT INTO shift_records (
            date, "shiftType", "operationId", "machineId", "drawingnumber",
            "dayShiftQuantity", "nightShiftQuantity", 
            "dayShiftTimePerUnit", "nightShiftTimePerUnit",
            "dayShiftOperator", "nightShiftOperator",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, 'DAY', $2, $3, $4,
            0, 0,
            0, 0,
            null, null,
            NOW(), NOW()
          ) RETURNING id
        `, [today, operationId, machineId, operation.orderDrawingNumber]);
        
        shiftRecordId = newShift.id;
        this.logger.log(`✅ Создана новая запись смены ${shiftRecordId} для операции ${operationId}`);
      } else {
        shiftRecordId = existingShift.id;
        this.logger.log(`ℹ️ Используется существующая запись смены ${shiftRecordId}`);
      }

      await queryRunner.commitTransaction();

      // 6. Отправляем событие о назначении операции (ОТКЛЮЧЕНО)
      /*
      const assignedEvent: OperationAssignedEvent = {
        operationId,
        machineId,
        operationNumber: operation.operationNumber,
        orderDrawingNumber: operation.orderDrawingNumber,
        estimatedTime: operation.estimatedTime,
        operationType: operation.operationtype,
        assignedAt: new Date(),
      };

      this.eventEmitter.emit('operation.assigned', assignedEvent);
      */

      // 7. Возвращаем статус синхронизации
      const syncStatus = await this.getSynchronizationStatus(operationId);
      
      this.logger.log(`🎉 Операция ${operationId} успешно назначена и синхронизирована`);
      return syncStatus;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Ошибка синхронизации операции ${operationId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 📊 Обновление прогресса операции при изменении данных смены
   */
  async updateOperationProgress(operationId: number): Promise<SynchronizationStatus> {
    this.logger.log(`📊 Обновляем прогресс операции ${operationId}`);

    try {
      // Получаем все записи смен для операции
      const shiftRecords = await this.dataSource.query(`
        SELECT * FROM shift_records 
        WHERE "operationId" = $1 AND archived = false
        ORDER BY date DESC
      `, [operationId]);

      // Вычисляем общий объем произведенной продукции
      const totalProduced = shiftRecords.reduce((sum, record) => {
        return sum + (record.dayShiftQuantity || 0) + (record.nightShiftQuantity || 0);
      }, 0);

      // Получаем целевое количество (пока фиксированное)
      const targetQuantity = 30; // TODO: Брать из заказа

      // Вычисляем прогресс
      const progress = Math.min((totalProduced / targetQuantity) * 100, 100);

      // Определяем новый статус операции
      let newStatus = 'ASSIGNED';
      if (progress >= 100) {
        newStatus = 'COMPLETED';
      } else if (totalProduced > 0) {
        newStatus = 'IN_PROGRESS';
      }

      // Обновляем операцию
      await this.dataSource.query(`
        UPDATE operations 
        SET 
          status = $1,
          "actualQuantity" = $2,
          "completedAt" = CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE "completedAt" END,
          "updatedAt" = NOW()
        WHERE id = $3
      `, [newStatus, totalProduced, operationId]);

      // Если операция завершена, освобождаем станок
      if (newStatus === 'COMPLETED') {
        await this.dataSource.query(`
          UPDATE machines 
          SET "isOccupied" = false, "currentOperation" = null
          WHERE "currentOperation" = $1
        `, [operationId]);
        
        this.logger.log(`🏁 Операция ${operationId} завершена, станок освобожден`);
      }

      // Отправляем событие об обновлении прогресса (ОТКЛЮЧЕНО)
      /*
      this.eventEmitter.emit('operation.progress.updated', {
        operationId,
        totalProduced,
        targetQuantity,
        progress,
        status: newStatus,
      });
      */

      return await this.getSynchronizationStatus(operationId);

    } catch (error) {
      this.logger.error(`❌ Ошибка обновления прогресса операции ${operationId}:`, error);
      throw error;
    }
  }

  /**
   * 📋 Получение статуса синхронизации операции
   */
  async getSynchronizationStatus(operationId: number): Promise<SynchronizationStatus> {
    try {
      const [result] = await this.dataSource.query(`
        SELECT 
          op.id as "operationId",
          op."assignedMachine" as "machineId",
          op.status as "operationStatus",
          op."actualQuantity",
          COUNT(sr.id) as "shiftRecordsCount",
          COALESCE(SUM((sr."dayShiftQuantity" + sr."nightShiftQuantity")), 0) as "totalProduced"
        FROM operations op
        LEFT JOIN shift_records sr ON op.id = sr."operationId"
        WHERE op.id = $1
        GROUP BY op.id, op."assignedMachine", op.status, op."actualQuantity"
      `, [operationId]);

      if (!result) {
        throw new Error(`Операция ${operationId} не найдена`);
      }

      const targetQuantity = 30; // TODO: Получать из заказа
      const totalProduced = Number(result.totalProduced) || 0;
      const progress = Math.min((totalProduced / targetQuantity) * 100, 100);

      return {
        operationId: result.operationId,
        machineId: result.machineId,
        operationStatus: result.operationStatus,
        hasShiftRecords: Number(result.shiftRecordsCount) > 0,
        totalProduced,
        targetQuantity,
        progress,
        lastSyncAt: new Date(),
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка получения статуса синхронизации:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Принудительная синхронизация всех активных операций
   */
  async syncAllActiveOperations(): Promise<SynchronizationStatus[]> {
    this.logger.log(`🔄 Начинаем принудительную синхронизацию всех активных операций`);

    try {
      const activeOperations = await this.dataSource.query(`
        SELECT id FROM operations 
        WHERE status IN ('ASSIGNED', 'IN_PROGRESS') 
        AND "assignedMachine" IS NOT NULL
      `);

      const results: SynchronizationStatus[] = [];

      for (const { id } of activeOperations) {
        try {
          const status = await this.updateOperationProgress(id);
          results.push(status);
        } catch (error) {
          this.logger.error(`Ошибка синхронизации операции ${id}:`, error);
        }
      }

      this.logger.log(`✅ Синхронизация завершена. Обработано ${results.length} операций`);
      return results;

    } catch (error) {
      this.logger.error(`❌ Ошибка принудительной синхронизации:`, error);
      throw error;
    }
  }

  /**
   * 📡 Обработчик события создания записи смены (ОТКЛЮЧЕНО - пакет не установлен)
   */
  /*
  @OnEvent('shift.record.created')
  async handleShiftRecordCreated(event: ShiftRecordCreatedEvent) {
    this.logger.log(`📡 Получено событие создания записи смены: ${event.shiftRecordId}`);
    
    if (event.operationId) {
      await this.updateOperationProgress(event.operationId);
    }
  }
  */

  /**
   * 📡 Обработчик события обновления записи смены (ОТКЛЮЧЕНО - пакет не установлен)
   */
  /*
  @OnEvent('shift.record.updated')
  async handleShiftRecordUpdated(event: ShiftRecordCreatedEvent) {
    this.logger.log(`📡 Получено событие обновления записи смены: ${event.shiftRecordId}`);
    
    if (event.operationId) {
      await this.updateOperationProgress(event.operationId);
    }
  }
  */
}
