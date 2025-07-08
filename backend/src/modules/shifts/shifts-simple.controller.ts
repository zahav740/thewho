/**
 * @file: shifts-simple.controller.ts
 * @description: Простой контроллер для таблицы shifts
 * @created: 2025-07-01
 */
import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('shifts')
@Controller('shifts')
export class ShiftsSimpleController {
  private readonly logger = new Logger(ShiftsSimpleController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить смены (простой API)' })
  async getShifts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`Получение смен: startDate=${startDate}, endDate=${endDate}`);
      
      let query = `
        SELECT 
          s.id,
          s.machineid,
          s.operatorid,
          s.operationid,
          s.starttime,
          s.endtime,
          s.status,
          s.notes,
          s.producedquantity,
          s.targetquantity,
          s.createdat,
          s.updatedat
        FROM shifts s
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (startDate) {
        query += ` AND DATE(s.starttime) >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        query += ` AND DATE(s.starttime) <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      query += ' ORDER BY s.starttime DESC LIMIT 100';
      
      const shifts = await this.dataSource.query(query, params);
      
      this.logger.log(`Найдено ${shifts.length} смен`);
      return shifts;
      
    } catch (error) {
      this.logger.error('Ошибка при получении смен:', error);
      throw error;
    }
  }
}
