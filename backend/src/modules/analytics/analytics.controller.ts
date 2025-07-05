/**
 * @file: analytics.controller.ts
 * @description: Контроллер для API аналитики KPI и OEE
 * @created: 2025-06-30
 */
import { Controller, Get, Query, Logger, BadRequestException } from '@nestjs/common';
import { AnalyticsService, OperatorPerformance, MachinePerformance, AggregatedMetrics } from './analytics.service';
import { IsOptional, IsDateString } from 'class-validator';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpi-oee')
  async getKPIOEEData(@Query() filter: AnalyticsFilterDto) {
    this.logger.log(`📊 API запрос KPI/OEE данных: ${JSON.stringify(filter)}`);

    try {
      // Улучшенная валидация дат
      let startDate: Date;
      let endDate: Date;
      
      if (filter.startDate) {
        startDate = new Date(filter.startDate);
        if (isNaN(startDate.getTime())) {
          throw new BadRequestException('Неверный формат startDate. Используйте YYYY-MM-DD');
        }
      } else {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }
      
      if (filter.endDate) {
        endDate = new Date(filter.endDate);
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException('Неверный формат endDate. Используйте YYYY-MM-DD');
        }
      } else {
        endDate = new Date();
      }
      
      if (startDate > endDate) {
        throw new BadRequestException('startDate не может быть больше endDate');
      }

      this.logger.log(`📅 Период: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);

      const result = await this.analyticsService.getKPIOEEData(startDate, endDate);
      
      this.logger.log(`✅ Возвращаем ${result.shifts.length} смен и агрегированные метрики`);
      
      return {
        success: true,
        data: result,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения KPI/OEE данных: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return {
        success: false,
        error: error.message,
        data: {
          shifts: [],
          aggregated: {
            overallOEE: 0,
            overallKPI: 0,
            totalProducedParts: 0,
            averageQuality: 0,
            totalActiveTime: 0,
            machineCount: 0,
            operatorCount: 0
          }
        }
      };
    }
  }

  @Get('operators')
  async getOperatorPerformance(@Query() filter: AnalyticsFilterDto): Promise<{
    success: boolean;
    data: OperatorPerformance[];
    error?: string;
  }> {
    this.logger.log(`👥 API запрос аналитики операторов: ${JSON.stringify(filter)}`);

    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    try {
      const operators = await this.analyticsService.getOperatorPerformance(startDate, endDate);
      
      this.logger.log(`✅ Возвращаем данные по ${operators.length} операторам`);
      
      return {
        success: true,
        data: operators
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения аналитики операторов: ${error.message}`, error.stack);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  @Get('machines')
  async getMachinePerformance(@Query() filter: AnalyticsFilterDto): Promise<{
    success: boolean;
    data: MachinePerformance[];
    error?: string;
  }> {
    this.logger.log(`🏭 API запрос аналитики станков: ${JSON.stringify(filter)}`);

    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    try {
      const machines = await this.analyticsService.getMachinePerformance(startDate, endDate);
      
      this.logger.log(`✅ Возвращаем данные по ${machines.length} станкам`);
      
      return {
        success: true,
        data: machines
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения аналитики станков: ${error.message}`, error.stack);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  @Get('summary')
  async getAnalyticsSummary(@Query() filter: AnalyticsFilterDto) {
    this.logger.log(`📋 API запрос сводки аналитики: ${JSON.stringify(filter)}`);

    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    try {
      const [kpiOeeData, operators, machines] = await Promise.all([
        this.analyticsService.getKPIOEEData(startDate, endDate),
        this.analyticsService.getOperatorPerformance(startDate, endDate),
        this.analyticsService.getMachinePerformance(startDate, endDate)
      ]);

      this.logger.log(`✅ Возвращаем полную сводку аналитики`);
      
      return {
        success: true,
        data: {
          kpiOee: kpiOeeData,
          operators: operators,
          machines: machines,
          summary: {
            totalShifts: kpiOeeData.shifts.length,
            activeOperators: operators.length,
            activeMachines: machines.length,
            period: {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            }
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения сводки аналитики: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}
