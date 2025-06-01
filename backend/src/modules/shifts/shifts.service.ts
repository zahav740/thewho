/**
 * @file: shifts.service.ts
 * @description: Сервис для работы со сменами
 * @dependencies: typeorm, shift-record.entity
 * @created: 2025-01-28
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

    return this.shiftRecordRepository.find({
      where,
      relations: ['operation', 'operation.order', 'machine'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ShiftRecord> {
    const shiftRecord = await this.shiftRecordRepository.findOne({
      where: { id },
      relations: ['operation', 'operation.order', 'machine'],
    });

    if (!shiftRecord) {
      throw new NotFoundException(`Запись смены с ID ${id} не найдена`);
    }

    return shiftRecord;
  }

  async create(createShiftRecordDto: CreateShiftRecordDto): Promise<ShiftRecord> {
    const shiftRecord = this.shiftRecordRepository.create(createShiftRecordDto);
    return this.shiftRecordRepository.save(shiftRecord);
  }

  async update(
    id: number,
    updateShiftRecordDto: UpdateShiftRecordDto,
  ): Promise<ShiftRecord> {
    const shiftRecord = await this.findOne(id);
    Object.assign(shiftRecord, updateShiftRecordDto);
    return this.shiftRecordRepository.save(shiftRecord);
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
    return this.shiftRecordRepository.find({
      where: { date },
      relations: ['operation', 'operation.order', 'machine'],
    });
  }

  async getShiftsByOperator(operatorName: string): Promise<ShiftRecord[]> {
    return this.shiftRecordRepository
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
  }
}
