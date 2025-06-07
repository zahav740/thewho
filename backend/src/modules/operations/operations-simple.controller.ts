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

  @Get()
  @ApiOperation({ summary: 'Получить все операции' })
  async findAll(
    @Query('status') status?: string,
  ) {
    try {
      console.log('OperationsSimpleController.findAll: Получение операций со статусом:', status);

      let query = `
        SELECT 
          id,
          "operationNumber",
          "machineId",
          operationtype as "operationType", 
          "estimatedTime",
          0 as "completedUnits",
          null as "actualTime",
          COALESCE(status, 'PENDING') as status,
          '[]' as operators,
          "orderId",
          machineaxes as "machineAxes",
          "createdAt",
          "updatedAt"
        FROM operations
      `;

      const params = [];
      if (status) {
        query += ' WHERE UPPER(status) = UPPER($1)';
        params.push(status);
      }

      query += ' ORDER BY "createdAt" DESC LIMIT 50';

      const operations = await this.dataSource.query(query, params);

      console.log(`OperationsSimpleController.findAll: Найдено ${operations.length} операций`);
      return operations;
    } catch (error) {
      console.error('OperationsSimpleController.findAll: Ошибка:', error);
      throw error;
    }
  }
}
