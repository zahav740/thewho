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
  Param,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductionPlanningService, PlanningRequest, PlanningResult } from './production-planning.service';
import { SynchronizationService } from '../synchronization/synchronization.service';

@ApiTags('production-planning')
@Controller('planning')
export class ProductionPlanningController {
  private readonly logger = new Logger(ProductionPlanningController.name);

  constructor(
    private readonly planningService: ProductionPlanningService,
    private readonly syncService: SynchronizationService, // 🆕 Сервис синхронизации
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
   * 🆕 УЛУЧШЕННОЕ назначение операции с полной синхронизацией
   */
  @Post('assign-operation')
  @ApiOperation({ 
    summary: 'Назначить операцию на станок с синхронизацией',
    description: 'Назначает операцию на станок и автоматически создает связанную запись смены'
  })
  async assignOperation(@Body() request: { operationId: number; machineId: number; }) {
    try {
      this.logger.log(`🔗 НОВОЕ назначение операции ${request.operationId} на станок ${request.machineId} с синхронизацией`);
      
      if (!request.operationId || !request.machineId) {
        return {
          success: false,
          error: 'operationId и machineId обязательны'
        };
      }

      // 🆕 Используем новый сервис синхронизации
      const syncResult = await this.syncService.assignOperationWithSync(
        request.operationId,
        request.machineId
      );

      this.logger.log(`✅ Операция успешно назначена и синхронизирована:`);
      this.logger.log(`   - Операция ID: ${request.operationId}`);
      this.logger.log(`   - Станок ID: ${request.machineId}`);
      this.logger.log(`   - Статус синхронизации:`, syncResult);
      
      return {
        success: true,
        message: `Операция ${request.operationId} назначена и синхронизирована`,
        data: {
          operationId: request.operationId,
          machineId: request.machineId,
          assignedAt: new Date(),
          syncedWithShifts: true, // 🆕 Новый флаг
          synchronizationStatus: syncResult
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Ошибка при назначении операции с синхронизацией:', error);
      return {
        success: false,
        error: 'Ошибка при назначении операции',
        message: error.message
      };
    }
  }

  /**
   * 🆕 НОВЫЙ метод: Получение статуса синхронизации
   */
  @Get('sync-status/:operationId')
  @ApiOperation({ 
    summary: 'Получить статус синхронизации операции',
    description: 'Возвращает статус синхронизации между операцией и сменами'
  })
  async getSyncStatus(@Param('operationId') operationId: string) {
    try {
      const status = await this.syncService.getSynchronizationStatus(Number(operationId));
      
      return {
        success: true,
        operationId: Number(operationId),
        status,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error(`Ошибка получения статуса синхронизации операции ${operationId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * УСТАРЕВШИЙ метод - оставлен для совместимости
   */
  @Post('assign-operation-legacy')
  @ApiOperation({ 
    summary: 'Назначить операцию на станок (устаревший метод)',
    description: 'УСТАРЕЛ: Используйте assign-operation для полной синхронизации'
  })
  async assignOperationLegacy(@Body() request: { operationId: number; machineId: number; }) {
    try {
      this.logger.log(`⚠️ УСТАРЕВШИЙ метод: назначение операции ${request.operationId} на станок ${request.machineId}`);
      
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
      
      const machineName = machine[0].code; // Название станка из поля code
      
      // 1. Назначаем операцию в основной таблице машин
      await this.planningService['dataSource'].query(
        'UPDATE machines SET "isOccupied" = true, "currentOperation" = $1, "assignedAt" = NOW() WHERE id = $2',
        [request.operationId, request.machineId]
      );
      
      // 2. Отмечаем операцию как назначенную
      await this.planningService['dataSource'].query(
        'UPDATE operations SET "assignedMachine" = $1, "assignedAt" = NOW(), status = \'ASSIGNED\' WHERE id = $2',
        [request.machineId, request.operationId]
      );
      
      return {
        success: true,
        message: `Операция ${operation[0].operationNumber || request.operationId} назначена на станок ${machineName} (БЕЗ синхронизации)`,
        warning: 'Используется устаревший метод без синхронизации со сменами',
        data: {
          operationId: request.operationId,
          machineId: request.machineId,
          machineName: machineName,
          assignedAt: new Date(),
          syncedWithShifts: false
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при назначении операции (устаревший метод):', error);
      return {
        success: false,
        error: 'Ошибка при назначении операции',
        message: error.message
      };
    }
  }

  /**
   * Вспомогательная функция для определения типа станка по коду
   */
  private getMachineTypeFromCode(machineCode: string): string {
    if (machineCode.startsWith('F')) {
      return 'milling-4axis'; // Фрезерные станки
    } else if (machineCode.startsWith('T')) {
      return 'turning'; // Токарные станки
    } else {
      return 'milling-3axis'; // По умолчанию
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
