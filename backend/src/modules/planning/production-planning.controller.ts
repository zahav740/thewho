/**
 * @file: production-planning.controller.ts
 * @description: API контроллер для планирования производства
 * @dependencies: production-planning.service
 * @created: 2025-05-28
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductionPlanningService, PlanningRequest, PlanningResult } from './production-planning.service';

@ApiTags('production-planning')
@Controller('planning')
export class ProductionPlanningController {
  private readonly logger = new Logger(ProductionPlanningController.name);

  constructor(
    private readonly planningService: ProductionPlanningService,
  ) {}

  @Post('plan')
  @ApiOperation({ 
    summary: 'Запустить планирование производства',
    description: 'Реализует алгоритм выбора операций для 3 заказов с разными приоритетами'
  })
  @ApiResponse({ status: 200, description: 'Планирование выполнено успешно' })
  @ApiResponse({ status: 400, description: 'Ошибка в данных запроса' })
  async planProduction(@Body() request: PlanningRequest): Promise<PlanningResult> {
    try {
      this.logger.log('Получен запрос на планирование производства');
      this.logger.log(`Выбранные станки: ${request.selectedMachines.join(', ')}`);
      
      const result = await this.planningService.planProduction(request);
      
      this.logger.log('Планирование завершено успешно');
      return result;
      
    } catch (error) {
      this.logger.error('Ошибка при планировании:', error);
      throw error;
    }
  }

  @Get('results/latest')
  @ApiOperation({ 
    summary: 'Получить последние результаты планирования',
    description: 'Возвращает последний расчет планирования производства'
  })
  async getLatestResults() {
    try {
      this.logger.log('Запрос последних результатов планирования');
      
      const results = await this.planningService.getLatestPlanningResults();
      
      if (!results) {
        return {
          message: 'Результаты планирования не найдены',
          hasResults: false
        };
      }
      
      return {
        hasResults: true,
        data: {
          id: results.id,
          calculationDate: results.calculation_date,
          selectedOrders: results.selected_orders,
          selectedMachines: results.selected_machines,
          queuePlan: results.queue_plan,
          totalTime: results.total_time,
          totalTimeFormatted: this.formatTime(results.total_time)
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при получении результатов:', error);
      throw error;
    }
  }

  @Get('progress')
  @ApiOperation({ 
    summary: 'Получить прогресс операций',
    description: 'Возвращает прогресс выполнения операций для заказов'
  })
  async getOperationProgress(@Query('orderIds') orderIds?: string) {
    try {
      this.logger.log('Запрос прогресса операций');
      
      let orderIdArray: number[] | undefined;
      if (orderIds) {
        orderIdArray = orderIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }
      
      const progress = await this.planningService.getOperationProgress(orderIdArray);
      
      return {
        count: progress.length,
        data: progress.map(p => ({
          id: p.id,
          orderId: p.order_id,
          calculationDate: p.calculation_date,
          deadline: p.deadline,
          quantity: p.quantity,
          totalProductionTime: p.total_production_time,
          totalProductionTimeFormatted: this.formatTime(p.total_production_time),
          operations: p.operations
        }))
      };
      
    } catch (error) {
      this.logger.error('Ошибка при получении прогресса:', error);
      throw error;
    }
  }

  @Post('demo')
  @ApiOperation({ 
    summary: 'Запуск планирования с доступными станками',
    description: 'Запускает планирование используя все доступные станки из БД'
  })
  async demoPlanning() {
    try {
      this.logger.log('Запуск планирования с доступными станками');
      
      // Получаем все доступные станки из БД
      const availableMachines = await this.planningService['getAvailableMachines']([]);
      const machineIds = availableMachines.map(m => m.id);
      
      if (machineIds.length === 0) {
        return {
          success: false,
          error: 'Нет доступных станков для планирования',
          suggestion: 'Убедитесь что в БД есть активные и свободные станки (isActive=true, isOccupied=false)'
        };
      }
      
      this.logger.log(`Используем ${machineIds.length} доступных станков: ${machineIds.join(', ')}`);
      
      const planningRequest: PlanningRequest = {
        selectedMachines: machineIds
      };
      
      const result = await this.planningService.planProduction(planningRequest);
      
      return {
        success: true,
        message: `Планирование выполнено с ${machineIds.length} станками`,
        result: {
          selectedOrdersCount: result.selectedOrders.length,
          operationsQueueLength: result.operationsQueue.length,
          totalTime: result.totalTime,
          totalTimeFormatted: this.formatTime(result.totalTime),
          calculationDate: result.calculationDate,
          details: result
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при планировании:', error);
      return {
        success: false,
        error: 'Ошибка при выполнении планирования',
        message: error.message,
        suggestion: 'Проверьте что в БД есть заказы с приоритетами 1, 2, 3 и соответствующие операции'
      };
    }
  }

  /**
   * Назначить операцию на станок
   */
  @Post('assign-operation')
  @ApiOperation({ 
    summary: 'Назначить операцию на станок',
    description: 'Назначает операцию на конкретный станок для выполнения'
  })
  async assignOperation(@Body() request: { operationId: number; machineId: number; }) {
    try {
      this.logger.log(`Назначение операции ${request.operationId} на станок ${request.machineId}`);
      
      // Проверяем что операция существует
      const operation = await this.planningService['dataSource'].query(
        'SELECT * FROM operations WHERE id = $1',
        [request.operationId]
      );
      
      if (!operation || operation.length === 0) {
        return {
          success: false,
          error: 'Операция не найдена'
        };
      }
      
      // Проверяем что станок доступен
      const machine = await this.planningService['dataSource'].query(
        'SELECT * FROM machines WHERE id = $1 AND "isActive" = true AND "isOccupied" = false',
        [request.machineId]
      );
      
      if (!machine || machine.length === 0) {
        return {
          success: false,
          error: 'Станок недоступен или занят'
        };
      }
      
      // Назначаем операцию
      await this.planningService['dataSource'].query(
        'UPDATE machines SET "isOccupied" = true, "currentOperation" = $1, "assignedAt" = NOW() WHERE id = $2',
        [request.operationId, request.machineId]
      );
      
      // Отмечаем операцию как назначенную
      await this.planningService['dataSource'].query(
        'UPDATE operations SET "assignedMachine" = $1, "assignedAt" = NOW(), status = \'assigned\' WHERE id = $2',
        [request.machineId, request.operationId]
      );
      
      return {
        success: true,
        message: `Операция ${operation[0].operationNumber || request.operationId} назначена на станок ${machine[0].code}`,
        data: {
          operationId: request.operationId,
          machineId: request.machineId,
          machineName: machine[0].code,
          assignedAt: new Date()
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при назначении операции:', error);
      return {
        success: false,
        error: 'Ошибка при назначении операции',
        message: error.message
      };
    }
  }
  private formatTime(minutes: number): string {
    if (!minutes || minutes <= 0) return '0 мин';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} мин`;
    } else if (remainingMinutes === 0) {
      return `${hours} ч`;
    } else {
      return `${hours} ч ${remainingMinutes} мин`;
    }
  }
}
