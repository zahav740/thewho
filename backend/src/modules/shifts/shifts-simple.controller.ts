/**
 * @file: shifts-simple.controller.ts
 * @description: Упрощенный контроллер для смен (ИСПРАВЛЕН - преобразование типов)
 * @dependencies: DataSource
 * @created: 2025-05-28
 * @fixed: 2025-06-07 - Добавлено преобразование строковых чисел в числа
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
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

  /**
   * Преобразует строковые числовые значения в числа
   */
  private normalizeRecord(record: any): any {
    if (record) {
      // Преобразуем строки из БД в числа для корректной работы frontend
      if (record.dayShiftTimePerUnit !== null && record.dayShiftTimePerUnit !== undefined) {
        record.dayShiftTimePerUnit = parseFloat(record.dayShiftTimePerUnit.toString());
      }
      
      if (record.nightShiftTimePerUnit !== null && record.nightShiftTimePerUnit !== undefined) {
        record.nightShiftTimePerUnit = parseFloat(record.nightShiftTimePerUnit.toString());
      }
      
      if (record.setupTime !== null && record.setupTime !== undefined) {
        record.setupTime = parseInt(record.setupTime.toString());
      }
      
      if (record.dayShiftQuantity !== null && record.dayShiftQuantity !== undefined) {
        record.dayShiftQuantity = parseInt(record.dayShiftQuantity.toString());
      }
      
      if (record.nightShiftQuantity !== null && record.nightShiftQuantity !== undefined) {
        record.nightShiftQuantity = parseInt(record.nightShiftQuantity.toString());
      }
    }
    return record;
  }

  @Get()
  @ApiOperation({ summary: 'Получить все смены' })
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      console.log('ShiftsSimpleController.findAll: Получение смен');

      let query = `
        SELECT sr.*, m.code as machine_code, m.type as machine_type 
        FROM shift_records sr
        LEFT JOIN machines m ON sr."machineId" = m.id
        ORDER BY sr.date DESC
      `;

      const params: any[] = [];

      // Добавляем фильтры если нужно
      if (startDate && endDate) {
        query = `
          SELECT sr.*, m.code as machine_code, m.type as machine_type 
          FROM shift_records sr
          LEFT JOIN machines m ON sr."machineId" = m.id
          WHERE sr.date BETWEEN $1 AND $2
          ORDER BY sr.date DESC
        `;
        params.push(startDate, endDate);
      }

      const records = await this.dataSource.query(query, params);
      
      // Преобразуем типы для каждой записи
      const normalizedRecords = records.map(record => this.normalizeRecord(record));
      
      console.log('ShiftsSimpleController.findAll: Найдено записей:', normalizedRecords.length);
      return normalizedRecords;
    } catch (error) {
      console.error('ShiftsSimpleController.findAll: Ошибка:', error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать запись смены' })
  async create(@Body() createShiftDto: any) {
    try {
      console.log('=== ShiftsSimpleController.create ===');
      console.log('Полученные данные:', JSON.stringify(createShiftDto, null, 2));

      // Подготавливаем данные для вставки
      const insertData = {
        date: createShiftDto.date,
        shiftType: createShiftDto.shiftType,
        setupTime: createShiftDto.setupTime || null,
        dayShiftQuantity: createShiftDto.dayShiftQuantity || null,
        dayShiftOperator: createShiftDto.dayShiftOperator || null,
        dayShiftTimePerUnit: createShiftDto.dayShiftTimePerUnit || null,
        nightShiftQuantity: createShiftDto.nightShiftQuantity || null,
        nightShiftOperator: createShiftDto.nightShiftOperator || null,
        nightShiftTimePerUnit: createShiftDto.nightShiftTimePerUnit || null,
        operationId: createShiftDto.operationId || null,
        machineId: createShiftDto.machineId,
        drawingNumber: createShiftDto.drawingNumber || null
      };

      // Инсерт в базу данных
      const insertQuery = `
        INSERT INTO shift_records (
          date, "shiftType", "setupTime", "dayShiftQuantity", 
          "dayShiftOperator", "dayShiftTimePerUnit", "nightShiftQuantity", 
          "nightShiftOperator", "nightShiftTimePerUnit", "operationId", 
          "machineId", "drawingnumber", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `;

      const values = [
        insertData.date,
        insertData.shiftType,
        insertData.setupTime,
        insertData.dayShiftQuantity,
        insertData.dayShiftOperator,
        insertData.dayShiftTimePerUnit,
        insertData.nightShiftQuantity,
        insertData.nightShiftOperator,
        insertData.nightShiftTimePerUnit,
        insertData.operationId,
        insertData.machineId,
        insertData.drawingNumber
      ];

      const result = await this.dataSource.query(insertQuery, values);
      
      console.log('Успешно создана запись смены:', result[0]);
      
      // Преобразуем типы в результате
      return this.normalizeRecord(result[0]);
    } catch (error) {
      console.error('=== Ошибка в ShiftsSimpleController.create ===');
      console.error('Тип ошибки:', error.constructor.name);
      console.error('Сообщение:', error.message);
      throw error;
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Тестовый endpoint - просто возвращает полученные данные' })
  async testCreate(@Body() createShiftDto: any) {
    console.log('=== ShiftsSimpleController.testCreate ===');
    console.log('Полученные данные:', JSON.stringify(createShiftDto, null, 2));
    
    return {
      success: true,
      message: 'Данные получены успешно',
      receivedData: createShiftDto,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись смены по ID' })
  async findOne(@Param('id') id: string) {
    try {
      console.log('ShiftsSimpleController.findOne: Получение записи смены ID:', id);

      const query = `
        SELECT sr.*, m.code as machine_code, m.type as machine_type 
        FROM shift_records sr
        LEFT JOIN machines m ON sr."machineId" = m.id
        WHERE sr.id = $1
      `;

      const result = await this.dataSource.query(query, [parseInt(id)]);
      
      if (result.length === 0) {
        throw new Error(`Запись смены с ID ${id} не найдена`);
      }

      const normalizedRecord = this.normalizeRecord(result[0]);
      console.log('ShiftsSimpleController.findOne: Запись найдена:', normalizedRecord);
      return normalizedRecord;
    } catch (error) {
      console.error('ShiftsSimpleController.findOne: Ошибка:', error);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить запись смены' })
  async update(@Param('id') id: string, @Body() updateShiftDto: any) {
    try {
      console.log('ShiftsSimpleController.update: Обновление записи смены ID:', id, updateShiftDto);

      const updateQuery = `
        UPDATE shift_records 
        SET 
          date = $2, "shiftType" = $3, "setupTime" = $4, 
          "dayShiftQuantity" = $5, "dayShiftOperator" = $6, "dayShiftTimePerUnit" = $7,
          "nightShiftQuantity" = $8, "nightShiftOperator" = $9, "nightShiftTimePerUnit" = $10,
          "operationId" = $11, "machineId" = $12, "drawingnumber" = $13, "updatedAt" = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        parseInt(id),
        updateShiftDto.date,
        updateShiftDto.shiftType,
        updateShiftDto.setupTime,
        updateShiftDto.dayShiftQuantity,
        updateShiftDto.dayShiftOperator,
        updateShiftDto.dayShiftTimePerUnit,
        updateShiftDto.nightShiftQuantity,
        updateShiftDto.nightShiftOperator,
        updateShiftDto.nightShiftTimePerUnit,
        updateShiftDto.operationId,
        updateShiftDto.machineId,
        updateShiftDto.drawingNumber
      ];

      const result = await this.dataSource.query(updateQuery, values);
      
      if (result.length === 0) {
        throw new Error(`Запись смены с ID ${id} не найдена`);
      }

      const normalizedRecord = this.normalizeRecord(result[0]);
      console.log('ShiftsSimpleController.update: Запись обновлена:', normalizedRecord);
      return normalizedRecord;
    } catch (error) {
      console.error('ShiftsSimpleController.update: Ошибка:', error);
      throw error;
    }
  }
}
