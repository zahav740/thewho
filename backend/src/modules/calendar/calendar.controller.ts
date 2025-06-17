/**
 * @file: calendar.controller.fixed.ts
 * @description: Исправленный контроллер календаря с правильными SQL запросами
 * @created: 2025-06-16
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';

interface CalendarDay {
  date: string;
  isWorkingDay: boolean;
  dayType: string;
  completedShifts?: any[];
  plannedOperation?: any;
}

interface MachineSchedule {
  machineId: number;
  machineName: string;
  machineType: string;
  currentOperation?: any;
  days: CalendarDay[];
}

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Производственный календарь с реальными данными из БД' })
  @ApiQuery({ name: 'startDate', description: 'Дата начала (YYYY-MM-DD)', example: '2025-06-16' })
  @ApiQuery({ name: 'endDate', description: 'Дата окончания (YYYY-MM-DD)', example: '2025-06-30' })
  async getCalendarView(
    @Query('startDate') startDate: string, 
    @Query('endDate') endDate: string
  ) {
    try {
      console.log('📅 Calendar request:', { startDate, endDate });

      // Проверяем валидность дат
      if (!startDate || !endDate) {
        throw new Error('startDate и endDate обязательны');
      }

      // Получаем активные станки
      const machines = await this.machineRepository.find({
        where: { isActive: true },
        order: { code: 'ASC' },
      });

      console.log(`🔧 Найдено ${machines.length} активных станков`);

      // Рассчитываем рабочие дни
      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);

      // Для каждого станка получаем данные
      const machineSchedules: MachineSchedule[] = [];
      
      for (const machine of machines) {
        // Получаем текущую активную операцию
        const currentOperation = await this.getCurrentOperation(machine.id);
        
        // Генерируем дни для станка
        const days = await this.generateDaysForMachine(machine.id, startDate, endDate);
        
        machineSchedules.push({
          machineId: machine.id,
          machineName: machine.code,
          machineType: machine.type,
          currentOperation,
          days: days
        });
      }

      console.log(`📊 Сгенерировано календарей для ${machineSchedules.length} станков`);

      return {
        success: true,
        period: { startDate, endDate },
        totalWorkingDays,
        machineSchedules,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Calendar error:', error);
      return {
        success: false,
        error: error.message,
        period: { startDate, endDate },
        totalWorkingDays: 0,
        machineSchedules: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private calculateWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0=воскресенье, 6=суббота
      if (![5, 6].includes(dayOfWeek)) { // Пятница=5, Суббота=6 выходные
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  private async getCurrentOperation(machineId: number) {
    try {
      // Получаем текущую операцию на станке с правильными названиями полей
      const operation = await this.operationRepository
        .createQueryBuilder('operation')
        .leftJoinAndSelect('operation.order', 'order')
        .where('operation.assignedMachine = :machineId', { machineId })
        .andWhere('operation.status IN (:...statuses)', { statuses: ['ASSIGNED', 'IN_PROGRESS'] })
        .orderBy('operation.assignedAt', 'ASC')
        .getOne();

      if (!operation) return null;

      // Получаем прогресс выполнения операции
      const progress = await this.getOperationProgress(operation.id);

      return {
        operationId: operation.id,
        drawingNumber: operation.order?.drawingNumber || 'Не указан',
        operationNumber: operation.operationNumber,
        estimatedTime: operation.estimatedTime,
        totalQuantity: operation.order?.quantity || 0,
        status: operation.status,
        assignedAt: operation.assignedAt,
        ...progress
      };
    } catch (error) {
      console.error(`Ошибка получения операции для станка ${machineId}:`, error);
      return null;
    }
  }

  private async getOperationProgress(operationId: number) {
    try {
      // Суммируем выполненные объемы из shift_records
      const result = await this.machineRepository.query(`
        SELECT 
          COALESCE(SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0)), 0) as completed_quantity,
          COUNT(*) as shift_count
        FROM shift_records 
        WHERE "operationId" = $1 AND archived = false
      `, [operationId]);

      const completedQuantity = parseInt(result[0]?.completed_quantity || '0');
      const shiftCount = parseInt(result[0]?.shift_count || '0');

      return {
        completedQuantity,
        shiftCount,
        progressPercent: 0 // Будет рассчитан в frontend
      };
    } catch (error) {
      console.error(`Ошибка получения прогресса операции ${operationId}:`, error);
      return {
        completedQuantity: 0,
        shiftCount: 0,
        progressPercent: 0
      };
    }
  }

  private async generateDaysForMachine(machineId: number, startDate: string, endDate: string) {
    const days: CalendarDay[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      const isWorkingDay = ![5, 6].includes(dayOfWeek);
      const isPast = current < new Date();
      
      const day: CalendarDay = {
        date: dateStr,
        isWorkingDay,
        dayType: isWorkingDay ? 'WORKING' : 'WEEKEND'
      };

      if (isWorkingDay) {
        // Получаем выполненные смены для этого дня
        const completedShifts = await this.getCompletedShifts(machineId, dateStr);
        
        if (completedShifts.length > 0) {
          day.completedShifts = completedShifts;
        }

        // Если нет выполненных смен, получаем запланированную операцию
        if (!isPast || completedShifts.length === 0) {
          const plannedOperation = await this.getPlannedOperationForDay(machineId, dateStr);
          if (plannedOperation) {
            day.plannedOperation = plannedOperation;
          }
        }
      }

      days.push(day);
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  private async getCompletedShifts(machineId: number, date: string) {
    try {
      const shifts = await this.machineRepository.query(`
        SELECT 
          sr."shiftType",
          sr."dayShiftOperator",
          sr."nightShiftOperator", 
          sr."dayShiftQuantity",
          sr."nightShiftQuantity",
          sr."dayShiftTimePerUnit",
          sr."nightShiftTimePerUnit",
          sr."setupTime",
          sr."drawingnumber" as drawing_number,
          o."operationNumber" as operation_number
        FROM shift_records sr
        LEFT JOIN operations o ON sr."operationId" = o.id
        WHERE sr."machineId" = $1 AND sr.date = $2 AND sr.archived = false
      `, [machineId, date]);

      const completedShifts = [];

      for (const shift of shifts) {
        // Дневная смена
        if (shift.dayShiftQuantity > 0) {
          const totalTime = shift.dayShiftQuantity * (shift.dayShiftTimePerUnit || 0);
          const planTime = 15; // Плановое время на деталь (минут)
          const efficiency = shift.dayShiftTimePerUnit > 0 
            ? Math.min(100, Math.max(0, (planTime / shift.dayShiftTimePerUnit) * 100))
            : 0;

          completedShifts.push({
            shiftType: 'DAY',
            operatorName: shift.dayShiftOperator || 'Не указан',
            drawingNumber: shift.drawing_number || 'Не указан',
            operationNumber: shift.operation_number || 1,
            quantityProduced: shift.dayShiftQuantity,
            timePerPart: shift.dayShiftTimePerUnit || 0,
            setupTime: shift.setupTime || 0,
            totalTime: totalTime + (shift.setupTime || 0),
            efficiency: Math.round(efficiency * 10) / 10
          });
        }

        // Ночная смена
        if (shift.nightShiftQuantity > 0) {
          const totalTime = shift.nightShiftQuantity * (shift.nightShiftTimePerUnit || 0);
          const planTime = 15;
          const efficiency = shift.nightShiftTimePerUnit > 0 
            ? Math.min(100, Math.max(0, (planTime / shift.nightShiftTimePerUnit) * 100))
            : 0;

          completedShifts.push({
            shiftType: 'NIGHT',
            operatorName: shift.nightShiftOperator || 'Не указан',
            drawingNumber: shift.drawing_number || 'Не указан',
            operationNumber: shift.operation_number || 1,
            quantityProduced: shift.nightShiftQuantity,
            timePerPart: shift.nightShiftTimePerUnit || 0,
            totalTime: totalTime,
            efficiency: Math.round(efficiency * 10) / 10
          });
        }
      }

      return completedShifts;
    } catch (error) {
      console.error(`Ошибка получения смен для станка ${machineId} на ${date}:`, error);
      return [];
    }
  }

  private async getPlannedOperationForDay(machineId: number, date: string) {
    try {
      // Получаем активную операцию на станке
      const operation = await this.operationRepository
        .createQueryBuilder('operation')
        .leftJoinAndSelect('operation.order', 'order')
        .where('operation.assignedMachine = :machineId', { machineId })
        .andWhere('operation.status IN (:...statuses)', { statuses: ['ASSIGNED', 'IN_PROGRESS'] })
        .orderBy('operation.assignedAt', 'ASC')
        .getOne();

      if (!operation || !operation.order) return null;

      // Получаем прогресс операции
      const progress = await this.getOperationProgress(operation.id);
      const totalQuantity = operation.order.quantity;
      const remainingQuantity = Math.max(0, totalQuantity - progress.completedQuantity);
      
      if (remainingQuantity === 0) {
        return null; // Операция завершена
      }

      const estimatedDurationDays = this.calculateOperationDuration(
        operation.estimatedTime, 
        remainingQuantity
      );
      
      return {
        operationId: operation.id,
        drawingNumber: operation.order.drawingNumber,
        operationNumber: operation.operationNumber,
        estimatedTimePerPart: operation.estimatedTime,
        totalQuantity: totalQuantity,
        estimatedDurationDays,
        startDate: date,
        endDate: new Date(new Date(date).getTime() + estimatedDurationDays * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        currentProgress: {
          completedQuantity: progress.completedQuantity,
          remainingQuantity: remainingQuantity,
          progressPercent: totalQuantity > 0 ? Math.round((progress.completedQuantity / totalQuantity) * 100) : 0
        }
      };
    } catch (error) {
      console.error(`Ошибка получения операции для станка ${machineId}:`, error);
      return null;
    }
  }

  private calculateOperationDuration(timePerPart: number, quantity: number): number {
    const totalMinutes = timePerPart * quantity;
    const minutesPerWorkDay = 16 * 60; // 2 смены по 8 часов
    const baseDays = Math.ceil(totalMinutes / minutesPerWorkDay);
    
    return Math.max(1, baseDays);
  }

  // Дополнительные endpoints для календаря
  @Get('machine-summary')
  @ApiOperation({ summary: 'Сводка по станкам' })
  async getMachineSummary(
    @Query('startDate') startDate: string, 
    @Query('endDate') endDate: string
  ) {
    try {
      const machines = await this.machineRepository.find({
        where: { isActive: true },
        order: { code: 'ASC' },
      });

      const summary = [];
      
      for (const machine of machines) {
        const currentOperation = await this.getCurrentOperation(machine.id);
        const workingDays = this.calculateWorkingDays(startDate, endDate);
        
        // Подсчитываем дни с операциями
        const shiftsCount = await this.machineRepository.query(`
          SELECT COUNT(DISTINCT date) as days_with_shifts
          FROM shift_records 
          WHERE "machineId" = $1 
            AND date BETWEEN $2 AND $3 
            AND archived = false
        `, [machine.id, startDate, endDate]);

        const daysWithOperations = parseInt(shiftsCount[0]?.days_with_shifts || '0');
        const utilizationPercent = workingDays > 0 ? Math.round((daysWithOperations / workingDays) * 100) : 0;

        summary.push({
          machineId: machine.id,
          machineName: machine.code,
          machineType: machine.type,
          isOccupied: machine.isOccupied,
          currentOperation: currentOperation,
          workingDays,
          daysWithOperations,
          utilizationPercent,
          status: currentOperation ? 'busy' : utilizationPercent > 50 ? 'moderate' : 'available'
        });
      }

      return {
        success: true,
        period: { startDate, endDate },
        totalWorkingDays: this.calculateWorkingDays(startDate, endDate),
        summary: {
          totalMachines: machines.length,
          activeMachines: summary.filter(m => m.status === 'busy').length,
          averageUtilization: Math.round(summary.reduce((acc, m) => acc + m.utilizationPercent, 0) / machines.length)
        },
        machines: summary
      };
    } catch (error) {
      console.error('Ошибка получения сводки по станкам:', error);
      return {
        success: false,
        error: error.message,
        machines: []
      };
    }
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Предстоящие дедлайны' })
  async getUpcomingDeadlines(@Query('days') days: number = 14) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.operations', 'operation')
        .where('order.deadline <= :futureDate', { futureDate })
        .andWhere('order.deadline >= :today', { today: new Date() })
        .orderBy('order.deadline', 'ASC')
        .take(20)
        .getMany();

      const deadlines = [];

      for (const order of orders) {
        const totalOperations = order.operations?.length || 0;
        const completedOperations = order.operations?.filter(op => op.status === 'COMPLETED').length || 0;
        
        const daysUntil = Math.ceil((new Date(order.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const isAtRisk = daysUntil <= 3 && completedOperations < totalOperations;

        deadlines.push({
          orderId: order.id.toString(),
          drawingNumber: order.drawingNumber,
          deadline: order.deadline,
          daysUntilDeadline: daysUntil,
          completedOperations,
          totalOperations,
          isAtRisk,
          priority: order.priority
        });
      }

      return deadlines;
    } catch (error) {
      console.error('Ошибка получения дедлайнов:', error);
      return [];
    }
  }
}
