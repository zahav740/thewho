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
  @ApiOperation({ summary: 'Получить назначенную операцию для станка' })
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
          ord.drawing_number as "orderDrawingNumber"
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
