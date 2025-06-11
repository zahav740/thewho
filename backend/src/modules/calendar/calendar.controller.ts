/**
 * @file: calendar.controller.ts (Временная диагностическая версия)
 * @description: Упрощенный контроллер для диагностики проблем
 * @created: 2025-05-28
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';

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

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint' })
  async test() {
    return {
      status: 'ok',
      message: 'Calendar controller is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug')
  @ApiOperation({ summary: 'Отладочная информация' })
  async debug() {
    try {
      const machineCount = await this.machineRepository.count();
      const operationCount = await this.operationRepository.count();
      const orderCount = await this.orderRepository.count();

      // Получим несколько записей для проверки структуры
      const sampleMachine = await this.machineRepository.findOne({ where: {} });
      const sampleOperation = await this.operationRepository.findOne({ where: {} });
      const sampleOrder = await this.orderRepository.findOne({ where: {} });

      return {
        status: 'ok',
        counts: {
          machines: machineCount,
          operations: operationCount,
          orders: orderCount,
        },
        samples: {
          machine: sampleMachine,
          operation: sampleOperation,
          order: sampleOrder,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Производственный календарь с данными из БД' })
  async getCalendarView(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    try {
      console.log('Calendar request:', { startDate, endDate });

      // Получаем активные станки
      const machines = await this.machineRepository.find({
        where: { isActive: true },
        order: { code: 'ASC' },
      });

      console.log(`Found ${machines.length} machines`);

      // Рассчитываем рабочие дни
      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);

      // Для каждого станка получаем данные по дням
      const machineSchedules = [];
      
      for (const machine of machines) {
        const days = await this.generateDaysForMachine(machine.id, startDate, endDate);
        
        machineSchedules.push({
          machineId: machine.id,
          machineName: machine.code,
          machineType: machine.type,
          days: days
        });
      }

      return {
        period: { startDate, endDate },
        totalWorkingDays,
        machineSchedules,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Calendar error:', error);
      return {
        status: 'error',
        error: error.message,
        stack: error.stack,
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

  private async generateDaysForMachine(machineId: number, startDate: string, endDate: string) {
    const days = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      const isWorkingDay = ![5, 6].includes(dayOfWeek);
      const isPast = current < new Date();
      
      const day = {
        date: dateStr,
        isWorkingDay,
        dayType: isWorkingDay ? 'WORKING' : 'WEEKEND'
      };

      if (isWorkingDay) {
        if (isPast) {
          // Для прошедших дней загружаем выполненные смены
          day.completedShifts = await this.getCompletedShifts(machineId, dateStr);
        } else {
          // Для будущих дней загружаем запланированные операции
          day.plannedOperation = await this.getPlannedOperation(machineId, dateStr);
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
          COALESCE(o."operationNumber", 1) as operation_number
        FROM shift_records sr
        LEFT JOIN operations o ON sr."operationId" = o.id
        WHERE sr."machineId" = $1 AND sr.date = $2
      `, [machineId, date]);

      const completedShifts = [];

      for (const shift of shifts) {
        // Дневная смена
        if (shift.dayShiftQuantity > 0) {
          const totalTime = shift.dayShiftQuantity * shift.dayShiftTimePerUnit;
          const planTime = 15; // Плановое время на деталь (минут)
          const efficiency = shift.dayShiftTimePerUnit > 0 
            ? (planTime / shift.dayShiftTimePerUnit) * 100 
            : 0;

          completedShifts.push({
            shiftType: 'DAY',
            operatorName: shift.dayShiftOperator || 'Не указан',
            drawingNumber: shift.drawing_number || 'Не указан',
            operationNumber: shift.operation_number || 1,
            quantityProduced: shift.dayShiftQuantity,
            timePerPart: shift.dayShiftTimePerUnit,
            setupTime: shift.setupTime || 0,
            totalTime: totalTime + (shift.setupTime || 0),
            efficiency: Math.min(100, Math.max(0, efficiency))
          });
        }

        // Ночная смена
        if (shift.nightShiftQuantity > 0) {
          const totalTime = shift.nightShiftQuantity * shift.nightShiftTimePerUnit;
          const planTime = 15;
          const efficiency = shift.nightShiftTimePerUnit > 0 
            ? (planTime / shift.nightShiftTimePerUnit) * 100 
            : 0;

          completedShifts.push({
            shiftType: 'NIGHT',
            operatorName: shift.nightShiftOperator || 'Не указан',
            drawingNumber: shift.drawing_number || 'Не указан',
            operationNumber: shift.operation_number || 1,
            quantityProduced: shift.nightShiftQuantity,
            timePerPart: shift.nightShiftTimePerUnit,
            totalTime: totalTime,
            efficiency: Math.min(100, Math.max(0, efficiency))
          });
        }
      }

      return completedShifts;
    } catch (error) {
      console.error(`Ошибка получения смен для станка ${machineId} на ${date}:`, error);
      return [];
    }
  }

  private async getPlannedOperation(machineId: number, date: string) {
    try {
      // Получаем текущую операцию на станке
      const current = await this.machineRepository.query(`
        SELECT 
          o.id as operation_id,
          ord."drawingNumber" as drawing_number,
          o."operationNumber" as operation_number,
          o."estimatedTime" as time_per_part,
          ord.quantity as total_quantity,
          o.status,
          o."createdAt" as created_at,
          COALESCE(SUM(sr."dayShiftQuantity" + sr."nightShiftQuantity"), 0) as completed_quantity
        FROM operations o
        JOIN orders ord ON o."orderId" = ord.id
        LEFT JOIN shift_records sr ON sr."operationId" = o.id
        WHERE o."assignedMachine" = $1 AND o.status IN ('pending', 'in_progress')
        GROUP BY o.id, ord.id
        ORDER BY o."createdAt" ASC
        LIMIT 1
      `, [machineId]);

      if (current.length === 0) return undefined;

      const op = current[0];
      const estimatedDurationDays = this.calculateOperationDuration(op.time_per_part, op.total_quantity);
      
      // Проверяем, завершена ли операция
      const remainingQuantity = Math.max(0, op.total_quantity - op.completed_quantity);
      
      if (remainingQuantity === 0) {
        // Операция завершена - станок свободен
        console.log(`Операция ${op.operation_id} завершена на станке ${machineId}`);
        return undefined; // Станок свободен
      }
      
      return {
        operationId: op.operation_id,
        drawingNumber: op.drawing_number,
        operationNumber: op.operation_number,
        estimatedTimePerPart: op.time_per_part,
        totalQuantity: op.total_quantity,
        estimatedDurationDays,
        startDate: date,
        endDate: new Date(new Date(date).getTime() + estimatedDurationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentProgress: {
          completedQuantity: op.completed_quantity,
          remainingQuantity: remainingQuantity,
          progressPercent: (op.completed_quantity / op.total_quantity) * 100
        }
      };
    } catch (error) {
      console.error(`Ошибка получения операции для станка ${machineId}:`, error);
      return undefined;
    }
  }

  private calculateOperationDuration(timePerPart: number, quantity: number): number {
    const totalMinutes = timePerPart * quantity;
    const minutesPerWorkDay = 16 * 60; // 2 смены по 8 часов
    const baseDays = Math.ceil(totalMinutes / minutesPerWorkDay);
    
    return Math.max(1, baseDays);
  }

  @Get('upcoming-deadlines')
  @ApiOperation({ summary: 'Упрощенные дедлайны' })
  async getUpcomingDeadlines(@Query('days') days: number = 7) {
    try {
      console.log('Upcoming deadlines request:', { days });

      // Получим несколько заказов
      const orders = await this.orderRepository.find({
        take: 5,
        relations: ['operations'],
      });

      console.log(`Found ${orders.length} orders`);

      // Возвращаем массив, как ожидает фронтенд
      const deadlines = orders.map(order => ({
        orderId: String(order.id),
        drawingNumber: order.drawingNumber,
        deadline: order.deadline,
        daysUntilDeadline: 5,
        completedOperations: 0,
        totalOperations: order.operations?.length || 0,
        isAtRisk: false,
      }));

      return deadlines; // Возвращаем массив напрямую
    } catch (error) {
      console.error('Upcoming deadlines error:', error);
      return []; // В случае ошибки возвращаем пустой массив
    }
  }

  @Get('machine-utilization')
  @ApiOperation({ summary: 'Упрощенная загруженность станков' })
  async getMachineUtilization(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    try {
      console.log('Machine utilization request:', { startDate, endDate });

      // Получим машины
      const machines = await this.machineRepository.find({
        where: { isActive: true },
        take: 10,
      });

      console.log(`Found ${machines.length} machines`);

      // Создаем моковые данные для загруженности
      const utilization = machines.map(machine => ({
        machineId: String(machine.id),
        machineCode: machine.code,
        totalCapacityMinutes: 9600, // 2 смены по 8 часов * 10 дней
        usedMinutes: Math.floor(Math.random() * 8000), // Случайное использование
        utilizationPercent: Math.floor(Math.random() * 100),
      }));

      return utilization;
    } catch (error) {
      console.error('Machine utilization error:', error);
      return [];
    }
  }
}
