/**
 * @file: shifts.controller.ts
 * @description: Контроллер для управления сменами (ИСПРАВЛЕН - лучшая обработка ошибок)
 * @dependencies: shifts.service
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлена обработка ошибок и логирование
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftRecordDto } from './dto/create-shift-record.dto';
import { UpdateShiftRecordDto } from './dto/update-shift-record.dto';
import { ShiftsFilterDto } from './dto/shifts-filter.dto';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { ShiftStatisticsDto } from './dto/shift-statistics.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('shifts')
@Controller('shifts')
export class ShiftsController {
  private readonly logger = new Logger(ShiftsController.name);

  constructor(
    private readonly shiftsService: ShiftsService,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить записи смен с фильтрацией' })
  async findAll(@Query() filterDto: ShiftsFilterDto): Promise<ShiftRecord[]> {
    try {
      this.logger.log(`Получение записей смен с фильтром: ${JSON.stringify(filterDto)}`);
      return await this.shiftsService.findAll(filterDto);
    } catch (error) {
      this.logger.error(`Ошибка при получении записей смен: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по сменам' })
  async getStatistics(@Query() filterDto: ShiftsFilterDto): Promise<ShiftStatisticsDto> {
    try {
      this.logger.log(`Получение статистики смен с фильтром: ${JSON.stringify(filterDto)}`);
      return await this.shiftsService.getStatistics(filterDto);
    } catch (error) {
      this.logger.error(`Ошибка при получении статистики смен: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись смены по ID' })
  async findOne(@Param('id') id: string): Promise<ShiftRecord> {
    try {
      this.logger.log(`Получение записи смены с ID: ${id}`);
      return await this.shiftsService.findOne(+id);
    } catch (error) {
      this.logger.error(`Ошибка при получении записи смены с ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать запись смены' })
  async create(@Body() createShiftRecordDto: CreateShiftRecordDto): Promise<ShiftRecord> {
    try {
      this.logger.log(`=== Создание записи смены ===`);
      this.logger.log(`Полученные данные: ${JSON.stringify(createShiftRecordDto, null, 2)}`);
      
      // Детальная валидация
      if (!createShiftRecordDto.date) {
        throw new BadRequestException('Поле date обязательно');
      }
      
      if (!createShiftRecordDto.shiftType) {
        throw new BadRequestException('Поле shiftType обязательно');
      }

      // Проверяем типы данных
      this.logger.log('Типы полей:');
      Object.keys(createShiftRecordDto).forEach(key => {
        const value = createShiftRecordDto[key];
        this.logger.log(`  ${key}: ${typeof value} = ${value}`);
      });

      const result = await this.shiftsService.create(createShiftRecordDto);
      this.logger.log(`Успешно создана запись смены с ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`=== Ошибка при создании записи смены ===`);
      this.logger.error(`Тип ошибки: ${error.constructor.name}`);
      this.logger.error(`Сообщение: ${error.message}`);
      this.logger.error(`Полная ошибка:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Детальная информация об ошибках валидации
      if (error.message && error.message.includes('validation')) {
        throw new BadRequestException(`Ошибка валидации данных: ${error.message}`);
      }
      
      throw new BadRequestException(`Ошибка при создании записи смены: ${error.message}`);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить запись смены' })
  async update(
    @Param('id') id: string,
    @Body() updateShiftRecordDto: UpdateShiftRecordDto,
  ): Promise<ShiftRecord> {
    try {
      this.logger.log(`Обновление записи смены с ID: ${id}`);
      this.logger.log(`Данные для обновления: ${JSON.stringify(updateShiftRecordDto, null, 2)}`);
      
      const result = await this.shiftsService.update(+id, updateShiftRecordDto);
      this.logger.log(`Успешно обновлена запись смены с ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Ошибка при обновлении записи смены с ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись смены' })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log(`Удаление записи смены с ID: ${id}`);
      await this.shiftsService.remove(+id);
      this.logger.log(`Успешно удалена запись смены с ID: ${id}`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении записи смены с ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Получить смены по дате' })
  async getByDate(@Param('date') date: string): Promise<ShiftRecord[]> {
    try {
      this.logger.log(`Получение смен по дате: ${date}`);
      return await this.shiftsService.getShiftsByDate(new Date(date));
    } catch (error) {
      this.logger.error(`Ошибка при получении смен по дате ${date}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('by-operator/:operator')
  @ApiOperation({ summary: 'Получить смены по оператору' })
  async getByOperator(@Param('operator') operator: string): Promise<ShiftRecord[]> {
    try {
      this.logger.log(`Получение смен по оператору: ${operator}`);
      return await this.shiftsService.getShiftsByOperator(operator);
    } catch (error) {
      this.logger.error(`Ошибка при получении смен по оператору ${operator}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('reset-operation')
  @ApiOperation({ summary: 'Сбросить данные смен для операции' })
  async resetOperationShifts(@Body() body: { operationId: number }): Promise<any> {
    try {
      this.logger.log(`Сброс данных смен для операции ${body.operationId}`);
      
      // Обнуляем данные смен
      const result = await this.shiftRecordRepository.update(
        { operationId: body.operationId },
        { 
          dayShiftQuantity: 0,
          nightShiftQuantity: 0,
          dayShiftTimePerUnit: 0,
          nightShiftTimePerUnit: 0
        }
      );

      return {
        success: true,
        message: 'Данные смен успешно сброшены',
        operationId: body.operationId,
        affectedRows: result.affected
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при сбросе данных смен: ${error.message}`, error.stack);
      throw error;
    }
  }
}
