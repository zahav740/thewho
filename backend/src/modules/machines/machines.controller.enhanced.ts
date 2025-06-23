/**
 * @file: machines.controller.enhanced.ts  
 * @description: Улучшенный контроллер машин с правильной логикой активных операций
 * @created: 2025-06-23
 */
import {
  Controller,
  Get,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('machines-enhanced')
@Controller('machines-enhanced')
export class MachinesEnhancedController {
  private readonly logger = new Logger(MachinesEnhancedController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('status/all')
  @ApiOperation({ summary: 'Получить все станки с реальным статусом активных операций' })
  async getAllWithRealStatus() {
    try {
      this.logger.log('🔍 Получение станков с реальным статусом операций');

      const query = `
        SELECT 
          m.id,
          m.code as "machineName",
          m.type as "machineType", 
          m."isOccupied",
          m."currentOperation",
          m."assignedAt" as "lastFreedAt",
          m."createdAt",
          m."updatedAt",
          
          -- Данные активной операции
          op.id as "activeOperationId",
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime", 
          op.status as "operationStatus",
          op."assignedAt" as "operationAssignedAt",
          
          -- Данные заказа
          ord.id as "orderId",
          ord.drawing_number as "orderDrawingNumber",
          ord.quantity as "orderQuantity",
          ord.priority as "orderPriority", 
          ord.deadline as "orderDeadline",
          
          -- Прогресс выполнения
          COALESCE(
            (SELECT SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0))
             FROM shift_records sr 
             WHERE sr."operationId" = op.id AND sr."machineId" = m.id AND sr.archived = false),
            0
          ) as "producedQuantity"
          
        FROM machines m
        LEFT JOIN operations op ON (
          op."assignedMachine" = m.id 
          AND op.status IN ('IN_PROGRESS', 'ASSIGNED', 'in_progress', 'assigned')
        )
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE m."isActive" = true
        ORDER BY m.code ASC
      `;

      const rawResults = await this.dataSource.query(query);
      
      this.logger.log(`📊 Получено ${rawResults.length} записей из БД`);

      // Преобразуем в нужный формат
      const results = rawResults.map(row => {
        const hasActiveOperation = !!row.activeOperationId;
        
        const result = {
          id: row.id.toString(),
          machineName: row.machineName,
          machineType: row.machineType,
          isAvailable: !row.isOccupied && !hasActiveOperation, // Станок доступен только если не занят и нет активной операции
          currentOperationId: hasActiveOperation ? row.activeOperationId.toString() : undefined,
          lastFreedAt: row.lastFreedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          currentOperationDetails: hasActiveOperation ? {
            id: row.activeOperationId,
            operationNumber: row.operationNumber,
            operationType: row.operationType,
            estimatedTime: row.estimatedTime,
            orderId: row.orderId,
            orderDrawingNumber: row.orderDrawingNumber,
            orderQuantity: row.orderQuantity,
            orderPriority: row.orderPriority,
            orderDeadline: row.orderDeadline,
            producedQuantity: parseInt(row.producedQuantity) || 0,
            operationStatus: row.operationStatus,
            assignedAt: row.operationAssignedAt
          } : null
        };
        
        if (hasActiveOperation) {
          this.logger.log(`✅ Станок ${row.machineName}: операция #${row.operationNumber} (${row.operationType})`);
        } else {
          this.logger.log(`⚪ Станок ${row.machineName}: свободен`);
        }
        
        return result;
      });

      const activeCount = results.filter(r => r.currentOperationDetails).length;
      const occupiedCount = results.filter(r => !r.isAvailable).length;
      
      this.logger.log(`📈 Статистика: активных операций ${activeCount}, занятых станков ${occupiedCount}, всего станков ${results.length}`);
      
      return results;
      
    } catch (error) {
      this.logger.error('❌ Ошибка при получении статуса станков:', error);
      throw error;
    }
  }

  @Get('active-operations')
  @ApiOperation({ summary: 'Получить только станки с активными операциями' })
  async getOnlyWithActiveOperations() {
    try {
      this.logger.log('🔍 Получение только станков с активными операциями');

      const query = `
        SELECT 
          m.id,
          m.code as "machineName",
          m.type as "machineType",
          m."isOccupied",
          m."assignedAt" as "lastFreedAt",
          
          op.id as "operationId",
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.status as "operationStatus",
          
          ord.drawing_number as "orderDrawingNumber",
          ord.quantity as "orderQuantity", 
          ord.priority as "orderPriority",
          ord.deadline as "orderDeadline",
          
          COALESCE(
            (SELECT SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0))
             FROM shift_records sr 
             WHERE sr."operationId" = op.id AND sr."machineId" = m.id AND sr.archived = false),
            0
          ) as "producedQuantity"
          
        FROM machines m
        INNER JOIN operations op ON (
          op."assignedMachine" = m.id 
          AND op.status IN ('IN_PROGRESS', 'ASSIGNED', 'in_progress', 'assigned')
        )
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE m."isActive" = true
        ORDER BY ord.priority ASC, op."operationNumber" ASC
      `;

      const results = await this.dataSource.query(query);
      
      this.logger.log(`📊 Найдено ${results.length} станков с активными операциями`);
      
      return results.map(row => ({
        id: row.id.toString(),
        machineName: row.machineName,
        machineType: row.machineType,
        isAvailable: false, // Станки с активными операциями не доступны
        currentOperationId: row.operationId.toString(),
        lastFreedAt: row.lastFreedAt,
        currentOperationDetails: {
          id: row.operationId,
          operationNumber: row.operationNumber,
          operationType: row.operationType,
          estimatedTime: row.estimatedTime,
          orderDrawingNumber: row.orderDrawingNumber,
          orderQuantity: row.orderQuantity,
          orderPriority: row.orderPriority,
          orderDeadline: row.orderDeadline,
          producedQuantity: parseInt(row.producedQuantity) || 0,
          operationStatus: row.operationStatus
        }
      }));
      
    } catch (error) {
      this.logger.error('❌ Ошибка при получении активных операций:', error);
      throw error;
    }
  }

  @Get('diagnostic/status')
  @ApiOperation({ summary: 'Диагностика состояния станков и операций' })
  async getDiagnosticStatus() {
    try {
      this.logger.log('🔧 Запуск диагностики состояния станков и операций');

      // 1. Общая статистика станков
      const machinesStats = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total_machines,
          COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_machines,
          COUNT(CASE WHEN "isOccupied" = true THEN 1 END) as occupied_machines,
          COUNT(CASE WHEN "currentOperation" IS NOT NULL THEN 1 END) as machines_with_operation
        FROM machines
      `);

      // 2. Статистика операций
      const operationsStats = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total_operations,
          COUNT(CASE WHEN status IN ('IN_PROGRESS', 'in_progress') THEN 1 END) as in_progress_operations,
          COUNT(CASE WHEN status IN ('ASSIGNED', 'assigned') THEN 1 END) as assigned_operations,
          COUNT(CASE WHEN "assignedMachine" IS NOT NULL THEN 1 END) as operations_with_machine
        FROM operations
      `);

      // 3. Несоответствия
      const inconsistencies = await this.dataSource.query(`
        SELECT 
          'Станки с операцией но не занятые' as issue_type,
          COUNT(*) as count
        FROM machines 
        WHERE "currentOperation" IS NOT NULL AND "isOccupied" = false
        
        UNION ALL
        
        SELECT 
          'Занятые станки без операции' as issue_type,
          COUNT(*) as count
        FROM machines 
        WHERE "currentOperation" IS NULL AND "isOccupied" = true
        
        UNION ALL
        
        SELECT 
          'Операции IN_PROGRESS без станка' as issue_type,
          COUNT(*) as count
        FROM operations 
        WHERE status IN ('IN_PROGRESS', 'in_progress') AND "assignedMachine" IS NULL
      `);

      // 4. Детали активных операций
      const activeOperationsDetails = await this.dataSource.query(`
        SELECT 
          m.code as machine_name,
          m."isOccupied",
          m."currentOperation",
          op.id as operation_id,
          op."operationNumber",
          op.status as operation_status,
          op."assignedMachine"
        FROM machines m
        LEFT JOIN operations op ON op."assignedMachine" = m.id 
        WHERE (m."isOccupied" = true OR op.status IN ('IN_PROGRESS', 'ASSIGNED', 'in_progress', 'assigned'))
        ORDER BY m.code
      `);

      return {
        timestamp: new Date().toISOString(),
        machines_stats: machinesStats[0],
        operations_stats: operationsStats[0],
        inconsistencies,
        active_operations_details: activeOperationsDetails,
        summary: {
          total_machines: parseInt(machinesStats[0].total_machines),
          active_operations: activeOperationsDetails.length,
          data_consistency: inconsistencies.every(i => i.count === 0) ? 'OK' : 'ISSUES_FOUND'
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Ошибка при диагностике:', error);
      throw error;
    }
  }
}