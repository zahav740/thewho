/**
 * @file: calendar.service.fixed.ts
 * @description: Исправленный сервис календаря с правильной логикой статуса станков
 * @dependencies: typeorm, entities
 * @created: 2025-06-11
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';
import { Machine } from '../../database/entities/machine.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

interface CalendarDay {
  date: string;
  isWorkingDay: boolean;
  dayType: 'WORKING' | 'WEEKEND' | 'HOLIDAY';
  plannedOperation?: PlannedOperation;
  completedShifts?: CompletedShift[];
  machineStatus: 'FREE' | 'BUSY' | 'SETUP';
}

interface PlannedOperation {
  operationId: number;
  drawingNumber: string;
  operationNumber: number;
  estimatedTimePerPart: number;
  totalQuantity: number;
  estimatedDurationDays: number;
  startDate: string;
  endDate: string;
  currentProgress?: {
    completedQuantity: number;
    remainingQuantity: number;
    progressPercent: number;
  };
}

interface CompletedShift {
  shiftType: 'DAY' | 'NIGHT';
  operatorName: string;
  drawingNumber: string;
  operationNumber: number;
  quantityProduced: number;
  timePerPart: number;
  setupTime?: number;
  totalTime: number;
  efficiency: number;
}

interface MachineSchedule {
  machineId: number;
  machineName: string;
  machineType: string;
  days: CalendarDay[];
}

interface EnhancedCalendarData {
  period: {
    startDate: string;
    endDate: string;
  };
  totalWorkingDays: number;
  machineSchedules: MachineSchedule[];
}

@Injectable()
export class CalendarServiceFixed {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  /**
   * Получить улучшенное представление календаря
   */
  async getEnhancedCalendarView(startDate: string, endDate: string): Promise<EnhancedCalendarData> {
    try {
      console.log(`Получение календаря за период: ${startDate} - ${endDate}`);

      // Получаем все активные станки
      const machines = await this.machineRepository.find({
        where: { isActive: true }
      });

      if (!machines || machines.length === 0) {
        console.warn('Не найдено активных станков');
        return {
          period: { startDate, endDate },
          totalWorkingDays: this.calculateWorkingDays(startDate, endDate),
          machineSchedules: []
        };
      }

      // Получаем данные по каждому станку
      const machineSchedules: MachineSchedule[] = await Promise.all(
        machines.map(async (machine) => {
          const days = await this.getMachineDays(machine, startDate, endDate);
          return {
            machineId: machine.id,
            machineName: machine.code,
            machineType: machine.type,
            days
          };
        })
      );

      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);

      return {
        period: { startDate, endDate },
        totalWorkingDays,
        machineSchedules
      };
    } catch (error) {
      console.error('Ошибка получения календаря:', error);
      throw error;
    }
  }

  /**
   * Получить дни для конкретного станка
   */
  private async getMachineDays(machine: Machine, startDate: string, endDate: string): Promise<CalendarDay[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: CalendarDay[] = [];

    // Получаем все операции для этого станка в периоде
    const operations = await this.operationRepository.find({
      where: {
        machineId: machine.id,
        // Можно добавить фильтр по датам если есть поле даты в операции
      },
      relations: ['order']
    });

    // Получаем все записи смен для этого станка в периоде
    const shiftRecords = await this.shiftRecordRepository.find({
      where: {
        machineId: machine.id,
        date: Between(start, end)
      },
      relations: ['operation', 'operation.order']
    });

    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayDate = new Date(current);
      
      const calendarDay: CalendarDay = {
        date: dateStr,
        isWorkingDay: this.isWorkingDay(dayDate),
        dayType: this.isWorkingDay(dayDate) ? 'WORKING' : 'WEEKEND',
        machineStatus: 'FREE'
      };

      // Ищем записи смен за этот день
      const dayShifts = shiftRecords.filter(shift => 
        shift.date.toISOString().split('T')[0] === dateStr
      );

      if (dayShifts.length > 0) {
        // Есть выполненные смены - формируем данные
        calendarDay.completedShifts = this.formatCompletedShifts(dayShifts);
        calendarDay.machineStatus = this.calculateMachineStatus(dayShifts, operations);
      } else {
        // Нет смен - проверяем запланированные операции
        const plannedOp = this.findPlannedOperation(operations, dateStr);
        if (plannedOp) {
          calendarDay.plannedOperation = plannedOp;
          calendarDay.machineStatus = 'BUSY';
        }
      }

      days.push(calendarDay);
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Формировать данные о выполненных сменах
   */
  private formatCompletedShifts(dayShifts: ShiftRecord[]): CompletedShift[] {
    return dayShifts.map(shift => {
      const dayQuantity = shift.dayShiftQuantity || 0;
      const nightQuantity = shift.nightShiftQuantity || 0;
      const dayTime = shift.dayShiftTimePerUnit || 0;
      const nightTime = shift.nightShiftTimePerUnit || 0;

      const shifts: CompletedShift[] = [];

      // Дневная смена
      if (dayQuantity > 0) {
        shifts.push({
          shiftType: 'DAY',
          operatorName: shift.dayShiftOperator || 'Не указан',
          drawingNumber: shift.operation?.order?.drawingNumber || 'N/A',
          operationNumber: shift.operation?.operationNumber || 0,
          quantityProduced: dayQuantity,
          timePerPart: dayTime,
          setupTime: shift.setupTime || undefined,
          totalTime: dayQuantity * dayTime + (shift.setupTime || 0),
          efficiency: this.calculateEfficiency(dayTime, shift.operation?.estimatedTime || dayTime)
        });
      }

      // Ночная смена
      if (nightQuantity > 0) {
        shifts.push({
          shiftType: 'NIGHT',
          operatorName: shift.nightShiftOperator || 'Не указан',
          drawingNumber: shift.operation?.order?.drawingNumber || 'N/A',
          operationNumber: shift.operation?.operationNumber || 0,
          quantityProduced: nightQuantity,
          timePerPart: nightTime,
          totalTime: nightQuantity * nightTime,
          efficiency: this.calculateEfficiency(nightTime, shift.operation?.estimatedTime || nightTime)
        });
      }

      return shifts;
    }).flat();
  }

  /**
   * Вычислить статус станка на основе данных смен и операций
   */
  private calculateMachineStatus(dayShifts: ShiftRecord[], operations: Operation[]): 'FREE' | 'BUSY' | 'SETUP' {
    // Проверяем, есть ли активные операции
    const activeOperations = operations.filter(op => 
      op.status === 'IN_PROGRESS' || op.status === 'PENDING'
    );

    if (activeOperations.length === 0) {
      return 'FREE';
    }

    // Проверяем выполнение заказов по данным смен
    for (const operation of activeOperations) {
      if (!operation.order) continue;

      const totalProduced = this.calculateTotalProduced(operation, dayShifts);
      const requiredQuantity = operation.order.quantity;

      if (totalProduced >= requiredQuantity) {
        // Операция завершена
        continue;
      } else {
        // Операция еще выполняется
        return 'BUSY';
      }
    }

    return 'FREE';
  }

  /**
   * Подсчитать общее количество произведенных деталей по операции
   */
  private calculateTotalProduced(operation: Operation, allShifts: ShiftRecord[]): number {
    const operationShifts = allShifts.filter(shift => 
      shift.operationId === operation.id
    );

    return operationShifts.reduce((total, shift) => {
      return total + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0);
    }, 0);
  }

  /**
   * Найти запланированную операцию для даты
   */
  private findPlannedOperation(operations: Operation[], dateStr: string): PlannedOperation | undefined {
    const activeOp = operations.find(op => 
      op.status === 'PENDING' || op.status === 'IN_PROGRESS'
    );

    if (!activeOp?.order) return undefined;

    return {
      operationId: activeOp.id,
      drawingNumber: activeOp.order.drawingNumber,
      operationNumber: activeOp.operationNumber,
      estimatedTimePerPart: activeOp.estimatedTime,
      totalQuantity: activeOp.order.quantity,
      estimatedDurationDays: Math.ceil(activeOp.estimatedTime * activeOp.order.quantity / (8 * 60)), // Примерный расчет
      startDate: dateStr,
      endDate: this.addDays(dateStr, 3), // Примерное окончание
    };
  }

  /**
   * Вычислить эффективность
   */
  private calculateEfficiency(actualTime: number, estimatedTime: number): number {
    if (actualTime === 0 || estimatedTime === 0) return 100;
    return Math.round((estimatedTime / actualTime) * 100);
  }

  /**
   * Проверить, является ли день рабочим
   */
  private isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=воскресенье, 6=суббота
    return ![5, 6].includes(dayOfWeek); // Пятница=5, Суббота=6 выходные
  }

  /**
   * Подсчитать рабочие дни в периоде
   */
  private calculateWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    const current = new Date(start);
    while (current <= end) {
      if (this.isWorkingDay(current)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Добавить дни к дате
   */
  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
