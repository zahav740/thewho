/**
 * @file: operations-simple.controller.ts
 * @description: Упрощенный контроллер для операций (ИСПРАВЛЕНО для реальной структуры БД)
 * @dependencies: DataSource
 * @created: 2025-05-28
 * @fixed: 2025-05-28
 */
import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('operations-simple')
@Controller('operations')
export class OperationsSimpleController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint для операций' })
  async test() {
    try {
      const count = await this.dataSource.query('SELECT COUNT(*) as count FROM operations');
      const sample = await this.dataSource.query('SELECT * FROM operations LIMIT 3');
      
      return {
        status: 'ok',
        message: 'Operations controller is working',
        count: count[0]?.count || 0,
        sample,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('assigned-to-machine/:machineId')
  @ApiOperation({ summary: 'Получить назначенную операцию для станка с данными заказа' })
  async getAssignedOperationByMachine(@Param('machineId') machineId: string) {
    try {
      console.log('OperationsSimpleController.getAssignedOperationByMachine: Поиск операции для станка:', machineId);

      const query = `
        SELECT 
          op.id,
          op."operationNumber",
          op."machineId",
          op.operationtype as "operationType", 
          op."estimatedTime",
          COALESCE(op.status, 'PENDING') as status,
          op."orderId",
          op.machineaxes as "machineAxes",
          op."createdAt",
          op."updatedAt",
          ord.drawing_number as "orderDrawingNumber",
          ord.quantity as "orderQuantity",
          ord.priority as "orderPriority",
          ord.deadline as "orderDeadline",
          ord."workType" as "orderWorkType"
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op."assignedMachine" = $1 
           OR op."machineId" = $1
        ORDER BY op."createdAt" DESC 
        LIMIT 1
      `;

      const operations = await this.dataSource.query(query, [parseInt(machineId)]);

      if (operations.length === 0) {
        return {
          success: false,
          message: 'На данный станок не назначено операций',
          operation: null
        };
      }

      console.log(`OperationsSimpleController.getAssignedOperationByMachine: Найдена операция:`, operations[0]);
      return {
        success: true,
        message: 'Операция найдена',
        operation: operations[0]
      };
    } catch (error) {
      console.error('OperationsSimpleController.getAssignedOperationByMachine: Ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при поиске операции',
        operation: null,
        error: error.message
      };
    }
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные операции' })
  async getActiveOperations() {
    try {
      console.log('OperationsSimpleController.getActiveOperations: Получение активных операций');

      const query = `
        SELECT 
          op.id,
          op."operationNumber",
          op.operationtype as "operationType", 
          op."estimatedTime",
          op.status,
          op."assignedMachine" as "machineId",
          m.code as "machineName",
          ord.drawing_number as "orderDrawingNumber",
          ord.id as "orderId",
          op."assignedAt",
          op."createdAt",
          op."updatedAt"
        FROM operations op
        INNER JOIN machines m ON op."assignedMachine" = m.id
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.status IN ('in_progress', 'assigned')
        ORDER BY op."assignedAt" DESC
      `;

      const operations = await this.dataSource.query(query);

      console.log(`OperationsSimpleController.getActiveOperations: Найдено ${operations.length} активных операций`);
      return operations;
    } catch (error) {
      console.error('OperationsSimpleController.getActiveOperations: Ошибка:', error);
      throw error;
    }
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Получить детальную информацию об операции' })
  async getOperationDetails(@Param('id') operationId: string) {
    try {
      console.log('OperationsSimpleController.getOperationDetails: Получение деталей операции:', operationId);

      const query = `
        SELECT 
          op.id,
          op."operationNumber",
          op."machineId",
          op.operationtype, 
          op."estimatedTime",
          op.status,
          op."orderId",
          op.machineaxes,
          op."createdAt",
          op."updatedAt",
          ord.drawing_number,
          ord.quantity,
          ord.priority,
          ord.deadline,
          ord."workType"
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.id = $1
      `;

      const operation = await this.dataSource.query(query, [parseInt(operationId)]);

      if (operation.length === 0) {
        return {
          success: false,
          message: 'Операция не найдена',
          operation: null
        };
      }

      console.log(`OperationsSimpleController.getOperationDetails: Найдена операция:`, operation[0]);
      return operation[0];
    } catch (error) {
      console.error('OperationsSimpleController.getOperationDetails: Ошибка:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все операции' })
  async findAll(
    @Query('status') status?: string,
  ) {
    try {
      console.log('OperationsSimpleController.findAll: Получение операций со статусом:', status);

      let query = `
        SELECT 
          op.id,
          op."operationNumber",
          op."machineId",
          op.operationtype as "operationType", 
          op."estimatedTime",
          0 as "completedUnits",
          null as "actualTime",
          COALESCE(op.status, 'PENDING') as status,
          '[]' as operators,
          op."orderId",
          op.machineaxes as "machineAxes",
          op."createdAt",
          op."updatedAt",
          ord.drawing_number as "orderDrawingNumber"
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
      `;

      const params = [];
      if (status) {
        query += ' WHERE UPPER(op.status) = UPPER($1)';
        params.push(status);
      }

      query += ' ORDER BY op."createdAt" DESC LIMIT 50';

      const operations = await this.dataSource.query(query, params);

      console.log(`OperationsSimpleController.findAll: Найдено ${operations.length} операций`);
      return operations;
    } catch (error) {
      console.error('OperationsSimpleController.findAll: Ошибка:', error);
      throw error;
    }
  }
}
