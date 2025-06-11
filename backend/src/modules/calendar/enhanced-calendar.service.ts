/**
 * @file: enhanced-calendar.service.ts
 * @description: Улучшенный сервис календаря с детализацией смен и рабочих дней
 * @dependencies: typeorm, dayjs
 * @created: 2025-06-11
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

export interface EnhancedCalendarData {
  period: {
    startDate: string;
    endDate: string;
  };
  totalWorkingDays: number;
  machineSchedules: MachineSchedule[];
}

export interface MachineSchedule {
  machineId: number;
  machineName: string;
  machineType: string;
  days: CalendarDay[];
}

export interface CalendarDay {
  date: string;
  isWorkingDay: boolean;
  dayType: 'WORKING' | 'WEEKEND' | 'HOLIDAY';
  
  // Для активных операций (будущие/текущие дни)
  plannedOperation?: PlannedOperation;
  
  // Для завершенных смен (прошедшие дни)
  completedShifts?: CompletedShift[];
}

export interface PlannedOperation {
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

export interface CompletedShift {
  shiftType: 'DAY' | 'NIGHT';
  operatorName: string;
  drawingNumber: string;
  operationNumber: number;
  quantityProduced: number;
  timePerPart: number;
  setupTime?: number; // только для дневной смены
  totalTime: number;
  efficiency: number;
}

@Injectable()
export class EnhancedCalendarService {
  private readonly logger = new Logger(EnhancedCalendarService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить улучшенное представление календаря
   */
  async getEnhancedCalendarView(startDate: string, endDate: string): Promise<EnhancedCalendarData> {
    try {
      this.logger.log(`Загрузка календаря: ${startDate} - ${endDate}`);

      // Получаем список активных станков
      const machines = await this.dataSource.query(`
        SELECT id, code as name, type 
        FROM machines 
        WHERE is_active = true 
        ORDER BY code
      `);

      const totalWorkingDays = this.calculateWorkingDaysBetween(startDate, endDate);
      const machineSchedules: MachineSchedule[] = [];

      // Для каждого станка формируем расписание
      for (const machine of machines) {
        const days = await this.generateMachineDays(machine.id, startDate, endDate);
        
        machineSchedules.push({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          days
        });
      }

      return {
        period: { startDate, endDate },
        totalWorkingDays,
        machineSchedules
      };
    } catch (error) {
      this.logger.error('Ошибка получения календаря:', error);
      throw error;
    }
  }

  /**
   * Генерация дней для конкретного станка
   */
  private async generateMachineDays(machineId: number, startDate: string, endDate: string): Promise<CalendarDay[]> {
    const days: CalendarDay[] = [];
    const current = dayjs(startDate);
    const end = dayjs(endDate);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const isWorkingDay = this.isWorkingDay(current.toDate());
      const isPast = current.isBefore(dayjs(), 'day');
      const isToday = current.isSame(dayjs(), 'day');

      let day: CalendarDay = {
        date: dateStr,
        isWorkingDay,
        dayType: this.getDayType(current.toDate())
      };

      if (isWorkingDay) {
        if (isPast) {
          // Для прошедших дней загружаем выполненные смены
          day.completedShifts = await this.getCompletedShifts(machineId, dateStr);
        } else if (isToday) {
          // Для сегодняшнего дня показываем активную операцию + выполненные смены
          day.plannedOperation = await this.getCurrentOperation(machineId);
          day.completedShifts = await this.getCompletedShifts(machineId, dateStr);
        } else {
          // Для будущих дней показываем запланированные операции
          day.plannedOperation = await this.getPlannedOperation(machineId, dateStr);
        }
      }

      days.push(day);
      current.add(1, 'day');
    }

    return days;
  }

  /**
   * Получить выполненные смены за день
   */
  private async getCompletedShifts(machineId: number, date: string): Promise<CompletedShift[]> {
    try {
      const shifts = await this.dataSource.query(`
        SELECT 
          sr.shift_type,
          sr.day_shift_operator as day_operator,
          sr.night_shift_operator as night_operator,
          sr.day_shift_quantity,
          sr.night_shift_quantity,
          sr.day_shift_time_per_unit,
          sr.night_shift_time_per_unit,
          sr.setup_time,
          ord.drawing_number,
          o.operation_number
        FROM shift_records sr
        JOIN operations o ON sr.operation_id = o.id
        JOIN orders ord ON o.order_id = ord.id
        WHERE sr.machine_id = $1 AND sr.date = $2
      `, [machineId, date]);

      const completedShifts: CompletedShift[] = [];

      for (const shift of shifts) {
        // Дневная смена
        if (shift.day_shift_quantity > 0) {
          const totalTime = shift.day_shift_quantity * shift.day_shift_time_per_unit;
          const planTime = 15; // Плановое время на деталь (минут)
          const efficiency = shift.day_shift_time_per_unit > 0 
            ? (planTime / shift.day_shift_time_per_unit) * 100 
            : 0;

          completedShifts.push({
            shiftType: 'DAY',
            operatorName: shift.day_operator || 'Не указан',
            drawingNumber: shift.drawing_number,
            operationNumber: shift.operation_number,
            quantityProduced: shift.day_shift_quantity,
            timePerPart: shift.day_shift_time_per_unit,
            setupTime: shift.setup_time || 0,
            totalTime: totalTime + (shift.setup_time || 0),
            efficiency: Math.min(100, Math.max(0, efficiency))
          });
        }

        // Ночная смена
        if (shift.night_shift_quantity > 0) {
          const totalTime = shift.night_shift_quantity * shift.night_shift_time_per_unit;
          const planTime = 15;
          const efficiency = shift.night_shift_time_per_unit > 0 
            ? (planTime / shift.night_shift_time_per_unit) * 100 
            : 0;

          completedShifts.push({
            shiftType: 'NIGHT',
            operatorName: shift.night_operator || 'Не указан',
            drawingNumber: shift.drawing_number,
            operationNumber: shift.operation_number,
            quantityProduced: shift.night_shift_quantity,
            timePerPart: shift.night_shift_time_per_unit,
            totalTime: totalTime,
            efficiency: Math.min(100, Math.max(0, efficiency))
          });
        }
      }

      return completedShifts;
    } catch (error) {
      this.logger.error(`Ошибка получения смен для станка ${machineId} на ${date}:`, error);
      return [];
    }
  }

  /**
   * Получить текущую операцию станка
   */
  private async getCurrentOperation(machineId: number): Promise<PlannedOperation | undefined> {
    try {
      const current = await this.dataSource.query(`
        SELECT 
          o.id as operation_id,
          ord.drawing_number,
          o.operation_number,
          o.estimated_time as time_per_part,
          ord.quantity as total_quantity,
          o.status,
          o.created_at
        FROM operations o
        JOIN orders ord ON o.order_id = ord.id
        WHERE o.machine_id = $1 AND o.status = 'in_progress'
        LIMIT 1
      `, [machineId]);

      if (current.length === 0) return undefined;

      const op = current[0];
      const estimatedDurationDays = this.calculateOperationDuration(op.time_per_part, op.total_quantity);
      
      // Получаем прогресс выполнения
      const progress = await this.getOperationProgress(op.operation_id);

      return {
        operationId: op.operation_id,
        drawingNumber: op.drawing_number,
        operationNumber: op.operation_number,
        estimatedTimePerPart: op.time_per_part,
        totalQuantity: op.total_quantity,
        estimatedDurationDays,
        startDate: dayjs(op.created_at).format('YYYY-MM-DD'),
        endDate: dayjs(op.created_at).add(estimatedDurationDays, 'day').format('YYYY-MM-DD'),
        currentProgress: progress
      };
    } catch (error) {
      this.logger.error(`Ошибка получения текущей операции для станка ${machineId}:`, error);
      return undefined;
    }
  }

  /**
   * Получить запланированную операцию (заглушка - в будущем можно расширить)
   */
  private async getPlannedOperation(machineId: number, date: string): Promise<PlannedOperation | undefined> {
    // Пока возвращаем undefined, в будущем здесь будет логика планирования
    return undefined;
  }

  /**
   * Получить прогресс выполнения операции
   */
  private async getOperationProgress(operationId: number) {
    try {
      const progress = await this.dataSource.query(`
        SELECT 
          SUM(day_shift_quantity + night_shift_quantity) as completed_quantity
        FROM shift_records 
        WHERE operation_id = $1
      `, [operationId]);

      const completedQuantity = parseInt(progress[0]?.completed_quantity || '0');

      // Получаем общее количество из заказа
      const operation = await this.dataSource.query(`
        SELECT ord.quantity as total_quantity
        FROM operations o
        JOIN orders ord ON o.order_id = ord.id
        WHERE o.id = $1
      `, [operationId]);

      const totalQuantity = operation[0]?.total_quantity || 0;
      const remainingQuantity = Math.max(0, totalQuantity - completedQuantity);
      const progressPercent = totalQuantity > 0 ? (completedQuantity / totalQuantity) * 100 : 0;

      return {
        completedQuantity,
        remainingQuantity,
        progressPercent: Math.min(100, progressPercent)
      };
    } catch (error) {
      this.logger.error(`Ошибка получения прогресса операции ${operationId}:`, error);
      return {
        completedQuantity: 0,
        remainingQuantity: 0,
        progressPercent: 0
      };
    }
  }

  /**
   * Расчет продолжительности операции в рабочих днях
   */
  private calculateOperationDuration(timePerPart: number, quantity: number): number {
    const totalMinutes = timePerPart * quantity;
    const minutesPerWorkDay = 16 * 60; // 2 смены по 8 часов
    const baseDays = Math.ceil(totalMinutes / minutesPerWorkDay);
    
    // Добавляем 1 день на наладку если операция большая
    const setupDays = totalMinutes > 480 ? 1 : 0; // Больше 8 часов = нужна наладка
    
    return Math.max(1, baseDays + setupDays);
  }

  /**
   * Расчет количества рабочих дней между датами
   */
  private calculateWorkingDaysBetween(startDate: string, endDate: string): number {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    let workingDays = 0;
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      if (this.isWorkingDay(current.toDate())) {
        workingDays++;
      }
      current = current.add(1, 'day');
    }

    return workingDays;
  }

  /**
   * Проверка, является ли день рабочим
   * Рабочие дни: Воскресенье-Четверг (0,1,2,3,4)
   * Выходные: Пятница-Суббота (5,6)
   */
  private isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=воскресенье, 6=суббота
    return ![5, 6].includes(dayOfWeek); // Пятница=5, Суббота=6 выходные
  }

  /**
   * Определение типа дня
   */
  private getDayType(date: Date): 'WORKING' | 'WEEKEND' | 'HOLIDAY' {
    const dayOfWeek = date.getDay();
    
    // Проверяем праздники (можно расширить)
    const holidays = [
      '2025-01-01', // Новый год
      '2025-05-01', // День труда
      // Добавить другие праздники
    ];
    
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (holidays.includes(dateStr)) {
      return 'HOLIDAY';
    }
    
    return this.isWorkingDay(date) ? 'WORKING' : 'WEEKEND';
  }
}
