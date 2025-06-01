/**
 * @file: shifts-simple.controller.ts
 * @description: Упрощенный контроллер для смен
 * @dependencies: DataSource
 * @created: 2025-05-28
 */
import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('shifts-simple')
@Controller('shifts')
export class ShiftsSimpleController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все смены' })
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      console.log('ShiftsSimpleController.findAll: Получение смен');

      // Возвращаем пустой массив пока что, так как таблицы shifts может не быть
      return [];
    } catch (error) {
      console.error('ShiftsSimpleController.findAll: Ошибка:', error);
      return [];
    }
  }
}
