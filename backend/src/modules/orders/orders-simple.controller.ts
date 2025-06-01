/**
 * @file: orders-simple.controller.ts
 * @description: Упрощенный контроллер для заказов (ИСПРАВЛЕНО для реальной структуры БД)
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

@ApiTags('orders-simple')
@Controller('orders')
export class OrdersSimpleController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все заказы' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      console.log('OrdersSimpleController.findAll: Получение заказов');

      const orders = await this.dataSource.query(`
        SELECT 
          id,
          drawing_number as "drawingNumber",
          'v1.0' as revision,
          quantity,
          priority,
          deadline,
          COALESCE("workType", 'PRODUCTION') as status,
          "createdAt",
          "updatedAt"
        FROM orders 
        ORDER BY "createdAt" DESC
        LIMIT $1 OFFSET $2
      `, [limitNum, offset]);

      const totalResult = await this.dataSource.query('SELECT COUNT(*) FROM orders');
      const total = parseInt(totalResult[0].count, 10);

      return {
        data: orders,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error('OrdersSimpleController.findAll: Ошибка:', error);
      throw error;
    }
  }
}
