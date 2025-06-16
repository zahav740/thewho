/**
 * @file: machine-availability-simple.service.ts (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 * @description: Сервис для управления доступностью станков с информацией об операциях
 * @dependencies: typeorm
 * @created: 2025-05-28
 * @fixed: 2025-06-07 - Добавлена информация о текущих операциях
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface MachineAvailabilityDto {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  currentOperationDetails?: {
    id: string;
    operationNumber: number;
    operationType: string;
    estimatedTime: number;
    status: string;
    orderDrawingNumber?: string;
    orderId?: string;
  };
  lastFreedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MachineAvailabilitySimpleService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<MachineAvailabilityDto[]> {
    try {
      console.log('SimpleMachineService: Получение всех станков с информацией об операциях');
      
      const machines = await this.dataSource.query(`
        SELECT 
          m.id::text,
          m.code as "machineName",
          m.type as "machineType", 
          (NOT m."isOccupied") as "isAvailable",
          op.id::text as "currentOperationId",
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.status,
          ord.drawing_number as "orderDrawingNumber",
          ord.id::text as "orderId",
          COALESCE(op."assignedAt", m."updatedAt") as "lastFreedAt",
          m."createdAt" as "createdAt",
          m."updatedAt" as "updatedAt"
        FROM machines m
        LEFT JOIN operations op ON (
          op."assignedMachine" = m.id 
          AND op.status IN ('IN_PROGRESS', 'ASSIGNED')
        )
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE m."isActive" = true
        ORDER BY m.code ASC
      `);
      
      // Преобразуем результат в нужный формат
      const result = machines.map(machine => ({
        id: machine.id,
        machineName: machine.machineName,
        machineType: machine.machineType,
        isAvailable: machine.isAvailable,
        currentOperationId: machine.currentOperationId,
        currentOperationDetails: machine.currentOperationId ? {
          id: machine.currentOperationId,
          operationNumber: machine.operationNumber,
          operationType: machine.operationType,
          estimatedTime: machine.estimatedTime,
          status: machine.status,
          orderDrawingNumber: machine.orderDrawingNumber,
          orderId: machine.orderId,
        } : undefined,
        lastFreedAt: machine.lastFreedAt,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      }));
      
      console.log(`SimpleMachineService: Найдено ${result.length} станков`);
      console.log('Станки с операциями:', result.filter(m => m.currentOperationId).length);
      
      return result;
    } catch (error) {
      console.error('SimpleMachineService.findAll Ошибка:', error);
      throw error;
    }
  }

  async findByName(machineName: string): Promise<MachineAvailabilityDto> {
    try {
      const machines = await this.dataSource.query(`
        SELECT 
          m.id::text,
          m.code as "machineName",
          m.type as "machineType",
          (NOT m."isOccupied") as "isAvailable", 
          op.id::text as "currentOperationId",
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.status,
          ord.drawing_number as "orderDrawingNumber",
          ord.id::text as "orderId",
          COALESCE(op."assignedAt", m."updatedAt") as "lastFreedAt",
          m."createdAt" as "createdAt",
          m."updatedAt" as "updatedAt"
        FROM machines m
        LEFT JOIN operations op ON (
          op."assignedMachine" = m.id 
          AND op.status IN ('IN_PROGRESS', 'ASSIGNED')
        )
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE m.code = $1 AND m."isActive" = true
      `, [machineName]);

      if (machines.length === 0) {
        throw new NotFoundException(`Станок ${machineName} не найден`);
      }

      const machine = machines[0];
      return {
        id: machine.id,
        machineName: machine.machineName,
        machineType: machine.machineType,
        isAvailable: machine.isAvailable,
        currentOperationId: machine.currentOperationId,
        currentOperationDetails: machine.currentOperationId ? {
          id: machine.currentOperationId,
          operationNumber: machine.operationNumber,
          operationType: machine.operationType,
          estimatedTime: machine.estimatedTime,
          status: machine.status,
          orderDrawingNumber: machine.orderDrawingNumber,
          orderId: machine.orderId,
        } : undefined,
        lastFreedAt: machine.lastFreedAt,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      };
    } catch (error) {
      console.error('SimpleMachineService.findByName Ошибка:', error);
      throw error;
    }
  }

  async updateAvailability(machineName: string, isAvailable: boolean): Promise<MachineAvailabilityDto> {
    try {
      await this.dataSource.query(`
        UPDATE machines 
        SET 
          "isOccupied" = $1,
          "updatedAt" = NOW()
        WHERE code = $2
      `, [!isAvailable, machineName]);

      return this.findByName(machineName);
    } catch (error) {
      console.error('SimpleMachineService.updateAvailability Ошибка:', error);
      throw error;
    }
  }

  async getAvailableMachines(): Promise<MachineAvailabilityDto[]> {
    try {
      const machines = await this.dataSource.query(`
        SELECT 
          m.id::text,
          m.code as "machineName",
          m.type as "machineType",
          (NOT m."isOccupied") as "isAvailable",
          op.id::text as "currentOperationId",
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.status,
          ord.drawing_number as "orderDrawingNumber",
          ord.id::text as "orderId",
          COALESCE(op."assignedAt", m."updatedAt") as "lastFreedAt",
          m."createdAt" as "createdAt",
          m."updatedAt" as "updatedAt"
        FROM machines m
        LEFT JOIN operations op ON (
          op."assignedMachine" = m.id 
          AND op.status IN ('IN_PROGRESS', 'ASSIGNED')
        )
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE m."isActive" = true AND m."isOccupied" = false
        ORDER BY m.code ASC
      `);
      
      // Преобразуем результат
      return machines.map(machine => ({
        id: machine.id,
        machineName: machine.machineName,
        machineType: machine.machineType,
        isAvailable: machine.isAvailable,
        currentOperationId: machine.currentOperationId,
        currentOperationDetails: machine.currentOperationId ? {
          id: machine.currentOperationId,
          operationNumber: machine.operationNumber,
          operationType: machine.operationType,
          estimatedTime: machine.estimatedTime,
          status: machine.status,
          orderDrawingNumber: machine.orderDrawingNumber,
          orderId: machine.orderId,
        } : undefined,
        lastFreedAt: machine.lastFreedAt,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      }));
    } catch (error) {
      console.error('SimpleMachineService.getAvailableMachines Ошибка:', error);
      throw error;
    }
  }

  /**
   * Получить активные операции (для совместимости с фронтендом)
   */
  async getActiveOperations(): Promise<any[]> {
    try {
      console.log('SimpleMachineService: Получение активных операций');
      
      const operations = await this.dataSource.query(`
        SELECT 
          op.id::text,
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.status,
          op."assignedMachine"::text as "machineId",
          m.code as "machineName",
          ord.drawing_number as "orderDrawingNumber",
          ord.id::text as "orderId",
          op."assignedAt",
          op."createdAt",
          op."updatedAt"
        FROM operations op
        INNER JOIN machines m ON op."assignedMachine" = m.id
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.status IN ('IN_PROGRESS', 'ASSIGNED')
        ORDER BY op."assignedAt" DESC
      `);
      
      console.log(`SimpleMachineService: Найдено ${operations.length} активных операций`);
      return operations;
    } catch (error) {
      console.error('SimpleMachineService.getActiveOperations Ошибка:', error);
      throw error;
    }
  }

  /**
   * Назначить операцию на станок
   */
  async assignOperation(machineName: string, operationId: string): Promise<MachineAvailabilityDto> {
    try {
      console.log('SimpleMachineService: Назначение операции:', operationId, 'для станка:', machineName);
      
      // Получаем станок по имени
      const machines = await this.dataSource.query(`
        SELECT id FROM machines WHERE code = $1 AND "isActive" = true
      `, [machineName]);

      if (machines.length === 0) {
        throw new NotFoundException(`Станок ${machineName} не найден`);
      }

      const machineId = machines[0].id;
      const operationIdInt = parseInt(operationId);

      // Проверяем, что операция существует
      const operations = await this.dataSource.query(`
        SELECT id FROM operations WHERE id = $1 AND status = 'PENDING'
      `, [operationIdInt]);

      if (operations.length === 0) {
        throw new NotFoundException(`Операция ${operationId} не найдена или не в статусе PENDING`);
      }

      // Назначаем операцию на станок
      await this.dataSource.query(`
        UPDATE operations 
        SET 
          "assignedMachine" = $1,
          "assignedAt" = NOW(),
          status = 'ASSIGNED',
          "updatedAt" = NOW()
        WHERE id = $2
      `, [machineId, operationIdInt]);

      // Отмечаем станок как занятый
      await this.dataSource.query(`
        UPDATE machines 
        SET 
          "isOccupied" = true,
          "updatedAt" = NOW()
        WHERE id = $1
      `, [machineId]);

      console.log(`SimpleMachineService: Операция ${operationId} назначена на станок ${machineName}`);
      
      // Возвращаем обновленную информацию о станке
      return this.findByName(machineName);
    } catch (error) {
      console.error('SimpleMachineService.assignOperation Ошибка:', error);
      throw error;
    }
  }

  /**
   * Отменить назначение операции на станок
   */
  async unassignOperation(machineName: string): Promise<MachineAvailabilityDto> {
    try {
      console.log('SimpleMachineService: Отмена операции для станка:', machineName);
      
      // Получаем станок по имени
      const machines = await this.dataSource.query(`
        SELECT id FROM machines WHERE code = $1 AND "isActive" = true
      `, [machineName]);

      if (machines.length === 0) {
        throw new NotFoundException(`Станок ${machineName} не найден`);
      }

      const machineId = machines[0].id;

      // Сбрасываем назначение операции
      await this.dataSource.query(`
        UPDATE operations 
        SET 
          "assignedMachine" = NULL,
          "assignedAt" = NULL,
          status = 'PENDING',
          "updatedAt" = NOW()
        WHERE "assignedMachine" = $1
      `, [machineId]);

      // Освобождаем станок
      await this.dataSource.query(`
        UPDATE machines 
        SET 
          "isOccupied" = false,
          "updatedAt" = NOW()
        WHERE id = $1
      `, [machineId]);

      console.log(`SimpleMachineService: Операция отменена для станка ${machineName}`);
      
      // Возвращаем обновленную информацию о станке
      return this.findByName(machineName);
    } catch (error) {
      console.error('SimpleMachineService.unassignOperation Ошибка:', error);
      throw error;
    }
  }
}