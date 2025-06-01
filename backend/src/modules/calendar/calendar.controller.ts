/**
 * @file: calendar.controller.ts (Временная диагностическая версия)
 * @description: Упрощенный контроллер для диагностики проблем
 * @created: 2025-05-28
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  @ApiOperation({ summary: 'Упрощенный календарь' })
  async getCalendarView(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    try {
      console.log('Calendar request:', { startDate, endDate });

      // Проверим машины
      const machines = await this.machineRepository.find({
        where: { isActive: true },
        take: 5, // Ограничим для тестирования
      });

      console.log(`Found ${machines.length} machines`);

      // Упрощенный ответ
      return {
        status: 'ok',
        startDate,
        endDate,
        totalWorkingDays: 10,
        machineSchedules: machines.map(machine => ({
          machineId: machine.id,
          machineCode: machine.code,
          machineType: machine.type,
          days: [],
        })),
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
