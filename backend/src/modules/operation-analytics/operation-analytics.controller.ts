/**
 * @file: operation-analytics.controller.ts
 * @description: Контроллер для аналитики операций с реальными данными из БД
 * @dependencies: typeorm, entities
 * @created: 2025-06-11
 * @fixed: 2025-06-11 - Исправлены поля для поиска операций и смен
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

@ApiTags('operation-analytics')
@Controller('operation-analytics')
export class OperationAnalyticsController {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  @Get('machine/:machineId')
  @ApiOperation({ summary: 'Аналитика текущей операции станка' })
  async getMachineOperationAnalytics(
    @Param('machineId') machineId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      console.log(`Получение аналитики для станка ${machineId}`);

      // 1. Получаем информацию о станке
      const machine = await this.machineRepository.findOne({
        where: { id: machineId }
      });

      if (!machine) {
        return {
          status: 'error',
          message: 'Станок не найден'
        };
      }

      // 2. Находим текущую активную операцию на станке
      // ВАЖНО: В операциях используем поле assignedMachine
      const currentOperation = await this.operationRepository.findOne({
        where: {
          assignedMachine: machineId,
          status: 'IN_PROGRESS'
        },
        relations: ['order'],
        order: { createdAt: 'DESC' }
      });

      if (!currentOperation || !currentOperation.order) {
        return {
          status: 'no_operation',
          message: 'Нет текущей операции на станке'
        };
      }

      // 3. Получаем все записи смен для этой операции
      // ВАЖНО: В shift_records используем поле machineId
      const dateFilter = startDate && endDate ? {
        date: Between(new Date(startDate), new Date(endDate))
      } : {};

      const shiftRecords = await this.shiftRecordRepository.find({
        where: {
          machineId: machineId,
          operationId: currentOperation.id,
          ...dateFilter
        },
        order: { date: 'ASC' }
      });

      console.log(`Найдено ${shiftRecords.length} записей смен`);

      // 4. Рассчитываем аналитику
      const analytics = this.calculateOperationAnalytics(
        currentOperation, 
        currentOperation.order, 
        shiftRecords
      );

      return {
        status: 'success',
        machine: {
          id: machine.id,
          code: machine.code,
          type: machine.type
        },
        operation: {
          id: currentOperation.id,
          operationNumber: currentOperation.operationNumber,
          estimatedTime: currentOperation.estimatedTime,
          status: currentOperation.status,
          createdAt: currentOperation.createdAt
        },
        order: {
          id: currentOperation.order.id,
          drawingNumber: currentOperation.order.drawingNumber,
          quantity: currentOperation.order.quantity,
          priority: currentOperation.order.priority,
          deadline: currentOperation.order.deadline
        },
        analytics
      };
    } catch (error) {
      console.error('Ошибка получения аналитики операции:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('shifts/:machineId')
  @ApiOperation({ summary: 'Получить записи смен для станка' })
  async getMachineShifts(
    @Param('machineId') machineId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const dateFilter = startDate && endDate ? {
        date: Between(new Date(startDate), new Date(endDate))
      } : {};

      const shifts = await this.shiftRecordRepository.find({
        where: {
          machineId: machineId,
          ...dateFilter
        },
        relations: ['operation', 'operation.order'],
        order: { date: 'DESC' }
      });

      // Преобразуем в формат для фронтенда
      const formattedShifts = shifts.map(shift => ({
        id: shift.id,
        date: shift.date.toISOString().split('T')[0],
        dayShiftQuantity: shift.dayShiftQuantity || 0,
        nightShiftQuantity: shift.nightShiftQuantity || 0,
        dayShiftTimePerUnit: shift.dayShiftTimePerUnit?.toString() || '0',
        nightShiftTimePerUnit: shift.nightShiftTimePerUnit?.toString() || '0',
        dayShiftOperator: shift.dayShiftOperator || 'Не указан',
        nightShiftOperator: shift.nightShiftOperator || 'Не указан',
        setupTime: shift.setupTime || 0,
        setupOperator: shift.dayShiftOperator || 'Не указан', // Примерное значение
        operationId: shift.operationId,
        drawingNumber: shift.operation?.order?.drawingNumber || 'N/A'
      }));

      return {
        status: 'success',
        shifts: formattedShifts
      };
    } catch (error) {
      console.error('Ошибка получения смен:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private calculateOperationAnalytics(operation: Operation, order: Order, shifts: ShiftRecord[]) {
    // Рассчитываем общее количество произведенных деталей
    let totalProduced = 0;
    let totalWorkingTime = 0;
    let totalSetupTime = 0;
    let totalShifts = 0;

    const operatorStats = new Map();

    shifts.forEach(shift => {
      const dayQuantity = shift.dayShiftQuantity || 0;
      const nightQuantity = shift.nightShiftQuantity || 0;
      const dayTime = shift.dayShiftTimePerUnit || 0;
      const nightTime = shift.nightShiftTimePerUnit || 0;

      totalProduced += dayQuantity + nightQuantity;
      totalWorkingTime += (dayQuantity * dayTime) + (nightQuantity * nightTime);
      totalSetupTime += shift.setupTime || 0;

      // Учитываем смены
      if (dayQuantity > 0) {
        totalShifts++;
        this.updateOperatorStats(operatorStats, shift.dayShiftOperator, dayQuantity, dayTime);
      }
      if (nightQuantity > 0) {
        totalShifts++;
        this.updateOperatorStats(operatorStats, shift.nightShiftOperator, nightQuantity, nightTime);
      }
    });

    // Прогресс выполнения
    const progressPercent = order.quantity > 0 ? (totalProduced / order.quantity) * 100 : 0;
    const remaining = Math.max(0, order.quantity - totalProduced);

    // Среднее время на деталь
    const averageTimePerUnit = totalProduced > 0 ? totalWorkingTime / totalProduced : 0;

    // Прогноз завершения
    let estimatedCompletion = null;
    let workingDaysLeft = 0;

    if (remaining > 0 && averageTimePerUnit > 0) {
      const remainingTimeMinutes = remaining * averageTimePerUnit;
      const workingMinutesPerDay = 16 * 60; // 2 смены по 8 часов
      workingDaysLeft = Math.ceil(remainingTimeMinutes / workingMinutesPerDay);
      
      // Добавляем рабочие дни к текущей дате
      estimatedCompletion = this.addWorkingDays(new Date(), workingDaysLeft);
    }

    // Проверка соответствия графику
    const now = new Date();
    const deadline = new Date(order.deadline);
    const onSchedule = estimatedCompletion ? estimatedCompletion <= deadline : now <= deadline;

    // Статистика операторов
    const operatorAnalytics = Array.from(operatorStats.values());

    return {
      progress: {
        totalProduced,
        remaining,
        progressPercent: Math.round(progressPercent * 10) / 10,
        onSchedule,
        daysOverdue: !onSchedule && estimatedCompletion ? 
          Math.ceil((estimatedCompletion.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0
      },
      timeAnalytics: {
        totalWorkingTime: Math.round(totalWorkingTime),
        totalSetupTime: Math.round(totalSetupTime),
        averageTimePerUnit: Math.round(averageTimePerUnit * 10) / 10,
        estimatedCompletion: estimatedCompletion?.toISOString(),
        workingDaysLeft,
        totalDaysWorked: this.calculateWorkingDays(new Date(operation.createdAt), new Date())
      },
      shiftsData: {
        totalShifts,
        setupCount: shifts.filter(s => s.setupTime && s.setupTime > 0).length,
        averageSetupTime: totalSetupTime > 0 ? 
          Math.round(totalSetupTime / shifts.filter(s => s.setupTime && s.setupTime > 0).length) : 0
      },
      operatorAnalytics
    };
  }

  private updateOperatorStats(operatorMap: Map<string, any>, operatorName: string, quantity: number, timePerUnit: number) {
    if (!operatorName || operatorName === 'Не указан') return;

    if (!operatorMap.has(operatorName)) {
      operatorMap.set(operatorName, {
        operatorName,
        totalShifts: 0,
        totalQuantity: 0,
        totalTime: 0,
        averageTimePerUnit: 0,
        efficiency: 0
      });
    }

    const operator = operatorMap.get(operatorName);
    operator.totalShifts++;
    operator.totalQuantity += quantity;
    operator.totalTime += quantity * timePerUnit;
    operator.averageTimePerUnit = operator.totalTime / operator.totalQuantity;
    
    // Простой расчет эффективности (можно улучшить)
    const standardTime = 20; // 20 минут - условное нормативное время
    operator.efficiency = Math.round((standardTime / operator.averageTimePerUnit) * 100);
  }

  private addWorkingDays(startDate: Date, daysToAdd: number): Date {
    const result = new Date(startDate);
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      // Пропускаем пятницу (5) и субботу (6)
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Не пятница и не суббота
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
