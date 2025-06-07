/**
 * @file: shifts.service.ts
 * @description: Сервис для работы со сменами (ИСПРАВЛЕН - преобразование типов)
 * @dependencies: typeorm, shift-record.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлено преобразование строковых чисел в числа
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { CreateShiftRecordDto } from './dto/create-shift-record.dto';
import { UpdateShiftRecordDto } from './dto/update-shift-record.dto';
import { ShiftsFilterDto } from './dto/shifts-filter.dto';
import { ShiftStatisticsDto } from './dto/shift-statistics.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  /**
   * Преобразует строковые числовые значения в числа
   */
  private normalizeShiftRecord(record: ShiftRecord): ShiftRecord {
    if (record) {
      // Преобразуем строки из БД в числа для корректной работы frontend
      record.dayShiftTimePerUnit = record.dayShiftTimePerUnit ? 
        parseFloat(record.dayShiftTimePerUnit.toString()) : null;
      
      record.nightShiftTimePerUnit = record.nightShiftTimePerUnit ? 
        parseFloat(record.nightShiftTimePerUnit.toString()) : null;
      
      record.setupTime = record.setupTime ? 
        parseInt(record.setupTime.toString()) : null;
      
      record.dayShiftQuantity = record.dayShiftQuantity ? 
        parseInt(record.dayShiftQuantity.toString()) : null;
      
      record.nightShiftQuantity = record.nightShiftQuantity ? 
        parseInt(record.nightShiftQuantity.toString()) : null;
    }
    return record;
  }

  /**
   * Преобразует массив записей
   */
  private normalizeShiftRecords(records: ShiftRecord[]): ShiftRecord[] {
    return records.map(record => this.normalizeShiftRecord(record));
  }

  async findAll(filterDto: ShiftsFilterDto): Promise<ShiftRecord[]> {
    const { startDate, endDate, machineId, operationId } = filterDto;
    const where: any = {};

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }

    if (machineId) {
      where.machine = { id: machineId };
    }

    if (operationId) {
      where.operation = { id: operationId };
    }

    const records = await this.shiftRecordRepository.find({
      where,
      relations: ['operation', 'operation.order', 'machine'],
      order: { date: 'DESC' },
    });

    return this.normalizeShiftRecords(records);
  }

  async findOne(id: number): Promise<ShiftRecord> {
    const shiftRecord = await this.shiftRecordRepository.findOne({
      where: { id },
      relations: ['operation', 'operation.order', 'machine'],
    });

    if (!shiftRecord) {
      throw new NotFoundException(`Запись смены с ID ${id} не найдена`);
    }

    return this.normalizeShiftRecord(shiftRecord);
  }

  async create(createShiftRecordDto: CreateShiftRecordDto): Promise<ShiftRecord> {
    const shiftRecord = this.shiftRecordRepository.create(createShiftRecordDto);
    const savedRecord = await this.shiftRecordRepository.save(shiftRecord);
    return this.normalizeShiftRecord(savedRecord);
  }

  async update(
    id: number,
    updateShiftRecordDto: UpdateShiftRecordDto,
  ): Promise<ShiftRecord> {
    const shiftRecord = await this.findOne(id);
    Object.assign(shiftRecord, updateShiftRecordDto);
    const savedRecord = await this.shiftRecordRepository.save(shiftRecord);
    return this.normalizeShiftRecord(savedRecord);
  }

  async remove(id: number): Promise<void> {
    const shiftRecord = await this.findOne(id);
    await this.shiftRecordRepository.remove(shiftRecord);
  }

  async getStatistics(filterDto: ShiftsFilterDto): Promise<ShiftStatisticsDto> {
    const records = await this.findAll(filterDto);

    const totalSetupTime = records.reduce(
      (sum, record) => sum + (record.setupTime || 0),
      0,
    );

    const totalDayQuantity = records.reduce(
      (sum, record) => sum + (record.dayShiftQuantity || 0),
      0,
    );

    const totalNightQuantity = records.reduce(
      (sum, record) => sum + (record.nightShiftQuantity || 0),
      0,
    );

    const totalQuantity = totalDayQuantity + totalNightQuantity;

    const dayShiftTime = records.reduce(
      (sum, record) =>
        sum + (record.dayShiftQuantity || 0) * (record.dayShiftTimePerUnit || 0),
      0,
    );

    const nightShiftTime = records.reduce(
      (sum, record) =>
        sum + (record.nightShiftQuantity || 0) * (record.nightShiftTimePerUnit || 0),
      0,
    );

    const totalProductionTime = dayShiftTime + nightShiftTime;

    // Группировка по операторам
    const operatorStats: Record<string, { quantity: number; time: number }> = {};

    records.forEach((record) => {
      if (record.dayShiftOperator) {
        if (!operatorStats[record.dayShiftOperator]) {
          operatorStats[record.dayShiftOperator] = { quantity: 0, time: 0 };
        }
        operatorStats[record.dayShiftOperator].quantity += record.dayShiftQuantity || 0;
        operatorStats[record.dayShiftOperator].time +=
          (record.dayShiftQuantity || 0) * (record.dayShiftTimePerUnit || 0);
      }

      if (record.nightShiftOperator) {
        if (!operatorStats[record.nightShiftOperator]) {
          operatorStats[record.nightShiftOperator] = { quantity: 0, time: 0 };
        }
        operatorStats[record.nightShiftOperator].quantity += record.nightShiftQuantity || 0;
        operatorStats[record.nightShiftOperator].time +=
          (record.nightShiftQuantity || 0) * (record.nightShiftTimePerUnit || 0);
      }
    });

    return {
      totalRecords: records.length,
      totalSetupTime,
      totalProductionTime,
      totalQuantity,
      dayShiftStats: {
        totalQuantity: totalDayQuantity,
        totalTime: dayShiftTime,
      },
      nightShiftStats: {
        totalQuantity: totalNightQuantity,
        totalTime: nightShiftTime,
      },
      operatorStats: Object.entries(operatorStats).map(([name, stats]) => ({
        operatorName: name,
        totalQuantity: stats.quantity,
        totalTime: stats.time,
      })),
    };
  }

  async getShiftsByDate(date: Date): Promise<ShiftRecord[]> {
    const records = await this.shiftRecordRepository.find({
      where: { date },
      relations: ['operation', 'operation.order', 'machine'],
    });
    return this.normalizeShiftRecords(records);
  }

  async getShiftsByOperator(operatorName: string): Promise<ShiftRecord[]> {
    const records = await this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .leftJoinAndSelect('shift.machine', 'machine')
      .where(
        '(shift.dayShiftOperator = :operatorName OR shift.nightShiftOperator = :operatorName OR shift.setupOperator = :operatorName)',
        { operatorName },
      )
      .orderBy('shift.date', 'DESC')
      .getMany();
    
    return this.normalizeShiftRecords(records);
  }
}
