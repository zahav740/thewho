/**
 * @file: shifts.controller.ts
 * @description: Контроллер для управления сменами
 * @dependencies: shifts.service
 * @created: 2025-01-28
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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftRecordDto } from './dto/create-shift-record.dto';
import { UpdateShiftRecordDto } from './dto/update-shift-record.dto';
import { ShiftsFilterDto } from './dto/shifts-filter.dto';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { ShiftStatisticsDto } from './dto/shift-statistics.dto';

@ApiTags('shifts')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить записи смен с фильтрацией' })
  async findAll(@Query() filterDto: ShiftsFilterDto): Promise<ShiftRecord[]> {
    return this.shiftsService.findAll(filterDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по сменам' })
  async getStatistics(@Query() filterDto: ShiftsFilterDto): Promise<ShiftStatisticsDto> {
    return this.shiftsService.getStatistics(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись смены по ID' })
  async findOne(@Param('id') id: string): Promise<ShiftRecord> {
    return this.shiftsService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать запись смены' })
  async create(@Body() createShiftRecordDto: CreateShiftRecordDto): Promise<ShiftRecord> {
    return this.shiftsService.create(createShiftRecordDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить запись смены' })
  async update(
    @Param('id') id: string,
    @Body() updateShiftRecordDto: UpdateShiftRecordDto,
  ): Promise<ShiftRecord> {
    return this.shiftsService.update(+id, updateShiftRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись смены' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.shiftsService.remove(+id);
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Получить смены по дате' })
  async getByDate(@Param('date') date: string): Promise<ShiftRecord[]> {
    return this.shiftsService.getShiftsByDate(new Date(date));
  }

  @Get('by-operator/:operator')
  @ApiOperation({ summary: 'Получить смены по оператору' })
  async getByOperator(@Param('operator') operator: string): Promise<ShiftRecord[]> {
    return this.shiftsService.getShiftsByOperator(operator);
  }
}
