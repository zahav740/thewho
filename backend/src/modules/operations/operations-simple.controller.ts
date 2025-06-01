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
          "machineId" as machine,
          operationtype as "operationType", 
          "estimatedTime",
          0 as "completedUnits",
          null as "actualTime",
          status,
          'system' as operators,
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
