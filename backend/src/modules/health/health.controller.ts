/**
 * @file: health.controller.ts
 * @description: Контроллер для проверки состояния приложения
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Проверка состояния сервиса' })
  async check() {
    try {
      // Проверяем подключение к базе данных
      await this.dataSource.query('SELECT 1');
      
      // Проверяем основные таблицы
      const machinesCount = await this.dataSource.query('SELECT COUNT(*) FROM machines');
      const ordersCount = await this.dataSource.query('SELECT COUNT(*) FROM orders');
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          machinesCount: parseInt(machinesCount[0].count),
          ordersCount: parseInt(ordersCount[0].count),
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error.message,
        },
      };
    }
  }

  @Get('db')
  @ApiOperation({ summary: 'Детальная проверка базы данных' })
  async checkDatabase() {
    try {
      const tables = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const tableDetails = {};
      for (const table of tables) {
        const tableName = table.table_name;
        try {
          const count = await this.dataSource.query(`SELECT COUNT(*) FROM "${tableName}"`);
          tableDetails[tableName] = parseInt(count[0].count);
        } catch (err) {
          tableDetails[tableName] = `Error: ${err.message}`;
        }
      }

      return {
        status: 'ok',
        tables: tableDetails,
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

  @Get('sample-data')
  @ApiOperation({ summary: 'Получить образцы данных' })
  async getSampleData() {
    try {
      const machines = await this.dataSource.query('SELECT * FROM machines LIMIT 5');
      const orders = await this.dataSource.query('SELECT * FROM orders LIMIT 5');
      const operations = await this.dataSource.query('SELECT * FROM operations LIMIT 5');
      
      return {
        status: 'ok',
        sampleData: {
          machines,
          orders,
          operations,
        },
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
