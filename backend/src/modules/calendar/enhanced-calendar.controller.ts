/**
 * @file: enhanced-calendar.controller.ts
 * @description: Улучшенный контроллер календаря с детализацией операций
 * @dependencies: enhanced-calendar.service
 * @created: 2025-06-11
 */
import { Controller, Get, Query, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EnhancedCalendarService, EnhancedCalendarData } from './enhanced-calendar.service';
import * as dayjs from 'dayjs';

@ApiTags('enhanced-calendar')
@Controller('enhanced-calendar')
export class EnhancedCalendarController {
  private readonly logger = new Logger(EnhancedCalendarController.name);

  constructor(
    private readonly enhancedCalendarService: EnhancedCalendarService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Получить улучшенное представление производственного календаря',
    description: 'Возвращает детализированный календарь с информацией о сменах, операциях и рабочих днях'
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Дата начала (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Дата окончания (YYYY-MM-DD)' })
  async getEnhancedCalendarView(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    success: boolean;
    data: EnhancedCalendarData;
    message: string;
  }> {
    try {
      this.logger.log(`Запрос улучшенного календаря: ${startDate} - ${endDate}`);

      // Валидация входных параметров
      if (!startDate || !endDate) {
        throw new BadRequestException('Параметры startDate и endDate обязательны');
      }

      if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
        throw new BadRequestException('Неверный формат startDate. Используйте YYYY-MM-DD');
      }

      if (!dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
        throw new BadRequestException('Неверный формат endDate. Используйте YYYY-MM-DD');
      }

      const start = dayjs(startDate);
      const end = dayjs(endDate);

      if (end.isBefore(start)) {
        throw new BadRequestException('endDate не может быть раньше startDate');
      }

      if (end.diff(start, 'day') > 90) {
        throw new BadRequestException('Максимальный период: 90 дней');
      }

      // Получаем данные календаря
      const calendarData = await this.enhancedCalendarService.getEnhancedCalendarView(
        startDate,
        endDate
      );

      this.logger.log(`Календарь загружен: ${calendarData.machineSchedules.length} станков, ${calendarData.totalWorkingDays} рабочих дней`);

      return {
        success: true,
        data: calendarData,
        message: `Календарь за период ${startDate} - ${endDate} успешно загружен`
      };
    } catch (error) {
      this.logger.error('Ошибка при получении улучшенного календаря:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Ошибка загрузки календаря: ${error.message}`);
    }
  }

  @Get('working-days')
  @ApiOperation({ 
    summary: 'Рассчитать количество рабочих дней',
    description: 'Возвращает количество рабочих дней между датами (исключая пятницу и субботу)'
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Дата начала (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Дата окончания (YYYY-MM-DD)' })
  async calculateWorkingDays(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      if (!startDate || !endDate) {
        throw new BadRequestException('Параметры startDate и endDate обязательны');
      }

      const start = dayjs(startDate);
      const end = dayjs(endDate);
      let workingDays = 0;
      let weekendDays = 0;
      let totalDays = 0;

      let current = start;
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        totalDays++;
        const dayOfWeek = current.day();
        
        if (![5, 6].includes(dayOfWeek)) { // Не пятница и не суббота
          workingDays++;
        } else {
          weekendDays++;
        }
        
        current = current.add(1, 'day');
      }

      return {
        success: true,
        data: {
          startDate,
          endDate,
          totalDays,
          workingDays,
          weekendDays,
          workingDaysPercent: Math.round((workingDays / totalDays) * 100)
        },
        message: `Расчет выполнен для периода ${startDate} - ${endDate}`
      };
    } catch (error) {
      this.logger.error('Ошибка расчета рабочих дней:', error);
      throw new BadRequestException(`Ошибка расчета: ${error.message}`);
    }
  }

  @Get('operation-duration')
  @ApiOperation({ 
    summary: 'Рассчитать продолжительность операции',
    description: 'Возвращает расчетную продолжительность операции в рабочих днях'
  })
  @ApiQuery({ name: 'timePerPart', required: true, description: 'Время на одну деталь (минуты)' })
  @ApiQuery({ name: 'quantity', required: true, description: 'Количество деталей' })
  @ApiQuery({ name: 'setupTime', required: false, description: 'Время наладки (минуты)', example: 120 })
  async calculateOperationDuration(
    @Query('timePerPart') timePerPart: number,
    @Query('quantity') quantity: number,
    @Query('setupTime') setupTime?: number,
  ) {
    try {
      if (!timePerPart || !quantity) {
        throw new BadRequestException('Параметры timePerPart и quantity обязательны');
      }

      if (timePerPart <= 0 || quantity <= 0) {
        throw new BadRequestException('timePerPart и quantity должны быть больше 0');
      }

      const productionTime = timePerPart * quantity;
      const totalTime = productionTime + (setupTime || 0);
      const minutesPerWorkDay = 16 * 60; // 2 смены по 8 часов
      
      const baseDays = Math.ceil(totalTime / minutesPerWorkDay);
      const setupDays = (setupTime || 0) > 0 ? 1 : 0;
      const totalDays = Math.max(1, baseDays);

      // Расчет эффективности
      const theoreticalDays = productionTime / minutesPerWorkDay;
      const efficiency = theoreticalDays > 0 ? (theoreticalDays / totalDays) * 100 : 0;

      return {
        success: true,
        data: {
          input: {
            timePerPart,
            quantity,
            setupTime: setupTime || 0
          },
          calculation: {
            productionTimeMinutes: productionTime,
            totalTimeMinutes: totalTime,
            estimatedDays: totalDays,
            setupDays,
            efficiency: Math.round(efficiency * 10) / 10
          },
          breakdown: {
            hoursPerDay: 16,
            minutesPerDay: minutesPerWorkDay,
            totalHours: Math.round(totalTime / 60 * 10) / 10,
            productionHours: Math.round(productionTime / 60 * 10) / 10,
            setupHours: setupTime ? Math.round(setupTime / 60 * 10) / 10 : 0
          }
        },
        message: `Операция займет ${totalDays} рабочих дня(ей)`
      };
    } catch (error) {
      this.logger.error('Ошибка расчета продолжительности операции:', error);
      throw new BadRequestException(`Ошибка расчета: ${error.message}`);
    }
  }

  @Get('machine-summary')
  @ApiOperation({ 
    summary: 'Сводка по станкам за период',
    description: 'Возвращает сводную информацию о загруженности станков'
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Дата начала (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Дата окончания (YYYY-MM-DD)' })
  async getMachineSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      this.logger.log(`Запрос сводки по станкам: ${startDate} - ${endDate}`);

      // Получаем детальные данные календаря
      const calendarData = await this.enhancedCalendarService.getEnhancedCalendarView(
        startDate,
        endDate
      );

      // Агрегируем данные по станкам
      const machineSummary = calendarData.machineSchedules.map(machine => {
        const workingDays = machine.days.filter(day => day.isWorkingDay).length;
        const daysWithShifts = machine.days.filter(day => 
          day.completedShifts && day.completedShifts.length > 0
        ).length;
        const daysWithOperations = machine.days.filter(day => 
          day.plannedOperation || (day.completedShifts && day.completedShifts.length > 0)
        ).length;

        const totalProduced = machine.days.reduce((sum, day) => {
          if (day.completedShifts) {
            return sum + day.completedShifts.reduce((daySum, shift) => 
              daySum + shift.quantityProduced, 0);
          }
          return sum;
        }, 0);

        const utilization = workingDays > 0 ? (daysWithOperations / workingDays) * 100 : 0;

        return {
          machineId: machine.machineId,
          machineName: machine.machineName,
          machineType: machine.machineType,
          workingDays,
          daysWithOperations,
          daysWithShifts,
          utilizationPercent: Math.round(utilization * 10) / 10,
          totalProduced,
          status: utilization > 80 ? 'busy' : utilization > 50 ? 'moderate' : 'available'
        };
      });

      // Общая статистика
      const totalMachines = machineSummary.length;
      const activeMachines = machineSummary.filter(m => m.daysWithOperations > 0).length;
      const averageUtilization = totalMachines > 0 
        ? machineSummary.reduce((sum, m) => sum + m.utilizationPercent, 0) / totalMachines 
        : 0;

      return {
        success: true,
        data: {
          period: calendarData.period,
          totalWorkingDays: calendarData.totalWorkingDays,
          summary: {
            totalMachines,
            activeMachines,
            averageUtilization: Math.round(averageUtilization * 10) / 10
          },
          machines: machineSummary
        },
        message: `Сводка по ${totalMachines} станкам за период ${startDate} - ${endDate}`
      };
    } catch (error) {
      this.logger.error('Ошибка получения сводки по станкам:', error);
      throw new BadRequestException(`Ошибка получения сводки: ${error.message}`);
    }
  }
}
