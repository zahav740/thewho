/**
 * @file: shifts.service.ts
 * @description: Сервис для работы со сменами (ИСПРАВЛЕН - полные данные с relations)
 * @dependencies: typeorm, shift-record.entity
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлена правильная загрузка связанных данных
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
   * Преобразует строковые числовые значения в числа и обогащает данными
   */
  private normalizeShiftRecord(record: any): any {
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

      // Обогащаем данными для frontend
      if (record.machine) {
        record.machineCode = record.machine.code;
        record.machineType = record.machine.type;
      }

      if (record.operation) {
        record.operationNumber = record.operation.operationNumber;
        record.operationType = record.operation.operationType;
        
        if (record.operation.order) {
          record.orderDrawingNumber = record.operation.order.drawingNumber;
          record.orderId = record.operation.order.id;
        }
      }
    }
    return record;
  }

  /**
   * Преобразует массив записей
   */
  private normalizeShiftRecords(records: any[]): any[] {
    return records.map(record => this.normalizeShiftRecord(record));
  }

  async findAll(filterDto: ShiftsFilterDto): Promise<any[]> {
    const { startDate, endDate, machineId, operationId } = filterDto;
    const queryBuilder = this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.machine', 'machine')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .orderBy('shift.date', 'DESC');

    // Применяем фильтры
    if (startDate && endDate) {
      queryBuilder.andWhere('shift.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    if (machineId) {
      queryBuilder.andWhere('shift.machineId = :machineId', { machineId });
    }

    if (operationId) {
      queryBuilder.andWhere('shift.operationId = :operationId', { operationId });
    }

    const records = await queryBuilder.getMany();
    return this.normalizeShiftRecords(records);
  }

  async findOne(id: number): Promise<any> {
    const shiftRecord = await this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.machine', 'machine')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .where('shift.id = :id', { id })
      .getOne();

    if (!shiftRecord) {
      throw new NotFoundException(`Запись смены с ID ${id} не найдена`);
    }

    return this.normalizeShiftRecord(shiftRecord);
  }

  async create(createShiftRecordDto: CreateShiftRecordDto): Promise<any> {
    const shiftRecord = this.shiftRecordRepository.create(createShiftRecordDto);
    const savedRecord = await this.shiftRecordRepository.save(shiftRecord);
    
    // Загружаем с relations для возврата полных данных
    return this.findOne(savedRecord.id);
  }

  async update(
    id: number,
    updateShiftRecordDto: UpdateShiftRecordDto,
  ): Promise<any> {
    const existingRecord = await this.shiftRecordRepository.findOne({ where: { id } });
    if (!existingRecord) {
      throw new NotFoundException(`Запись смены с ID ${id} не найдена`);
    }

    Object.assign(existingRecord, updateShiftRecordDto);
    await this.shiftRecordRepository.save(existingRecord);
    
    // Загружаем с relations для возврата полных данных
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const shiftRecord = await this.shiftRecordRepository.findOne({ where: { id } });
    if (!shiftRecord) {
      throw new NotFoundException(`Запись смены с ID ${id} не найдена`);
    }
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

  async getShiftsByDate(date: Date): Promise<any[]> {
    const records = await this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.machine', 'machine')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .where('shift.date = :date', { date })
      .getMany();
    
    return this.normalizeShiftRecords(records);
  }

  async getShiftsByOperator(operatorName: string): Promise<any[]> {
    const records = await this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.machine', 'machine')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .where(
        '(shift.dayShiftOperator = :operatorName OR shift.nightShiftOperator = :operatorName)',
        { operatorName },
      )
      .orderBy('shift.date', 'DESC')
      .getMany();
    
    return this.normalizeShiftRecords(records);
  }

  async getShiftsByMachine(machineId: number): Promise<any[]> {
    const records = await this.shiftRecordRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.machine', 'machine')
      .leftJoinAndSelect('shift.operation', 'operation')
      .leftJoinAndSelect('operation.order', 'order')
      .where('shift.machineId = :machineId', { machineId })
      .orderBy('shift.date', 'DESC')
      .getMany();
    
    return this.normalizeShiftRecords(records);
  }
}
