/**
 * @file: test.controller.ts
 * @description: Тестовый контроллер для диагностики API
 * @dependencies: none
 * @created: 2025-05-28
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('test')
@Controller('test')
export class TestController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Простой тест API' })
  async simpleTest() {
    return {
      status: 'ok',
      message: 'API работает',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Тест подключения к БД' })
  async testDb() {
    try {
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM machine_availability');
      return {
        status: 'ok',
        dbConnection: true,
        machineCount: parseInt(result[0].count),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        dbConnection: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('machines-simple')
  @ApiOperation({ summary: 'Тест простого запроса станков' })
  async testMachines() {
    try {
      const machines = await this.dataSource.query(`
        SELECT machine_name, machine_type, is_available 
        FROM machine_availability 
        LIMIT 3
      `);
      
      return {
        status: 'ok',
        machines,
        count: machines.length,
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
}
