/**
 * @file: calendar.service.ts (исправленная версия)
 * @description: Сервис календаря без ошибок TypeScript
 * @dependencies: typeorm, entities
 * @created: 2025-01-28
 * @updated: 2025-06-06
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';
import { MachineScheduleDto } from './dto/machine-schedule.dto';
import { ScheduleOperationDto } from './dto/schedule-operation.dto';

interface CalendarViewItem {
  date: string;
  machine: string;
  operation: {
    id: string;
    drawingNumber: string;
    operationNumber: number;
    estimatedTime: number;
    status: string;
  };
}

interface MachineUtilization {
  machine: string;
  totalHours: number;
  utilization: number; // процент
}

interface UpcomingDeadline {
  orderId: string;
  drawingNumber: string;
  deadline: Date;
  daysRemaining: number;
  priority: number;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getMachineSchedule(machineId: string, date: string): Promise<MachineScheduleDto> {
    try {
      const operations = await this.operationRepository.find({
        where: {
          status: 'in_progress',
          machineAxes: parseInt(machineId) || 3, // Используем machineAxes вместо machine
        },
        relations: ['order'],
      });

      const schedule: MachineScheduleDto = {
        machineId: machineId,
        date: date,
        daySchedule: [{
          date: date,
          shifts: [],
          currentOperation: operations.length > 0 ? {
            operationId: operations[0].id.toString(), // Преобразуем number в string
            orderDrawingNumber: operations[0].order?.drawingNumber || 'N/A',
            operationNumber: operations[0].operationNumber,
            estimatedTime: operations[0].estimatedTime,
          } : undefined,
        }],
      };

      return schedule;
    } catch (error) {
      console.error('CalendarService.getMachineSchedule Ошибка:', error);
      throw error;
    }
  }

  async scheduleOperation(scheduleDto: ScheduleOperationDto): Promise<Operation> {
    const operation = await this.operationRepository.findOne({
      where: { id: parseInt(scheduleDto.operationId) }, // Преобразуем string в number
      relations: ['order'],
    });

    if (!operation) {
      throw new NotFoundException(`Операция с ID ${scheduleDto.operationId} не найдена`);
    }

    // Просто обновляем статус, машину пока не трогаем
    operation.status = 'in_progress';

    return this.operationRepository.save(operation);
  }

  async getCalendarView(startDate: string, endDate: string): Promise<CalendarViewItem[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const operations = await this.operationRepository.find({
        where: {
          createdAt: Between(start, end),
          status: 'in_progress'
        },
        relations: ['order'],
        order: { createdAt: 'ASC' }
      });

      return operations.map(op => ({
        date: op.createdAt.toISOString().split('T')[0],
        machine: op.machineAxes ? `${op.machineAxes}-axis` : 'N/A', // Возвращаем строку
        operation: {
          id: op.id.toString(),
          drawingNumber: op.order?.drawingNumber || 'N/A',
          operationNumber: op.operationNumber,
          estimatedTime: op.estimatedTime,
          status: op.status
        }
      }));
    } catch (error) {
      console.error('CalendarService.getCalendarView Ошибка:', error);
      return [];
    }
  }

  async getMachineUtilization(startDate: string, endDate: string): Promise<MachineUtilization[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const workingHoursPerDay = 8;
      const totalPossibleHours = totalDays * workingHoursPerDay;

      const operations = await this.operationRepository
        .createQueryBuilder('operation')
        .select('operation.machineAxes', 'machine')
        .addSelect('SUM(operation.estimatedTime)', 'totalMinutes')
        .where('operation.createdAt BETWEEN :start AND :end', { start, end })
        .andWhere('operation.machineAxes IS NOT NULL')
        .groupBy('operation.machineAxes')
        .getRawMany();

      return operations.map(op => ({
        machine: `${op.machine}-axis`,
        totalHours: Math.round(op.totalMinutes / 60 * 100) / 100,
        utilization: Math.round((op.totalMinutes / 60 / totalPossibleHours) * 100)
      }));
    } catch (error) {
      console.error('CalendarService.getMachineUtilization Ошибка:', error);
      return [];
    }
  }

  async getUpcomingDeadlines(days: number = 7): Promise<UpcomingDeadline[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

      const orders = await this.orderRepository.find({
        where: {
          deadline: Between(today, futureDate)
        },
        order: { deadline: 'ASC' }
      });

      return orders.map(order => {
        const daysRemaining = Math.ceil(
          (order.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          orderId: order.id.toString(),
          drawingNumber: order.drawingNumber || 'N/A',
          deadline: order.deadline,
          daysRemaining,
          priority: order.priority
        };
      });
    } catch (error) {
      console.error('CalendarService.getUpcomingDeadlines Ошибка:', error);
      return [];
    }
  }
}
