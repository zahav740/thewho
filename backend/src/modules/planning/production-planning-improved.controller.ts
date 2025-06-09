/**
 * @file: production-planning-improved.controller.ts
 * @description: УЛУЧШЕННЫЙ контроллер планирования с правильным учетом операций в работе
 * @dependencies: production-planning-improved.service
 * @created: 2025-06-08
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
import { 
  ProductionPlanningImprovedService, 
  PlanningRequest, 
  PlanningResult 
} from './production-planning-improved.service';

@ApiTags('planning-improved')
@Controller('planning-improved')
export class ProductionPlanningImprovedController {
  private readonly logger = new Logger(ProductionPlanningImprovedController.name);

  constructor(
    private readonly planningService: ProductionPlanningImprovedService,
  ) {}

  @Post('plan')
  @ApiOperation({ 
    summary: '🚀 УЛУЧШЕННОЕ планирование производства',
    description: 'Реализует улучшенный алгоритм с правильным учетом операций в работе'
  })
  @ApiResponse({ status: 200, description: 'Планирование выполнено успешно' })
  @ApiResponse({ status: 400, description: 'Ошибка в данных запроса' })
  async planProductionImproved(@Body() request: PlanningRequest): Promise<any> {
    try {
      this.logger.log('🚀 УЛУЧШЕННОЕ ПЛАНИРОВАНИЕ: Получен запрос');
      this.logger.log(`Выбранные станки: ${request.selectedMachines.join(', ')}`);
      
      const result = await this.planningService.planProduction(request);
      
      // Формируем детальный ответ
      const response = {
        success: true,
        message: 'Улучшенное планирование выполнено успешно',
        result: {
          selectedOrdersCount: result.selectedOrders.length,
          operationsQueueLength: result.operationsQueue.length,
          totalTime: result.totalTime,
          totalTimeFormatted: this.formatTime(result.totalTime),
          calculationDate: result.calculationDate,
          hasWarnings: result.warnings && result.warnings.length > 0,
          warnings: result.warnings || [],
          details: result
        },
        analysis: {
          availableOperations: result.operationsQueue.length,
          totalEstimatedTime: result.totalTime,
          operationsByType: this.groupOperationsByType(result.operationsQueue),
          operationsByPriority: this.groupOperationsByPriority(result.operationsQueue, result.selectedOrders)
        }
      };
      
      this.logger.log('✅ УЛУЧШЕННОЕ ПЛАНИРОВАНИЕ: Завершено успешно');
      return response;
      
    } catch (error) {
      this.logger.error('❌ Ошибка при улучшенном планировании:', error);
      
      return {
        success: false,
        error: 'Ошибка при выполнении улучшенного планирования',
        message: error.message,
        suggestion: 'Проверьте доступность станков и операций в БД'
      };
    }
  }

  @Post('demo')
  @ApiOperation({ 
    summary: '🎯 ДЕМО улучшенного планирования',
    description: 'Запускает улучшенное планирование со всеми доступными станками'
  })
  async demoImprovedPlanning() {
    try {
      this.logger.log('🎯 ДЕМО УЛУЧШЕННОГО ПЛАНИРОВАНИЯ: Запуск');
      
      // Получаем все доступные станки
      const availableMachines = await this.getAvailableMachinesFromDB();
      const machineIds = availableMachines.map(m => m.id);
      
      if (machineIds.length === 0) {
        return {
          success: false,
          error: 'Нет доступных станков для демо планирования',
          suggestion: 'Убедитесь что в БД есть активные и свободные станки (isActive=true, isOccupied=false)',
          analysis: {
            availableMachines: 0,
            activeMachines: await this.getActiveMachinesCount(),
            occupiedMachines: await this.getOccupiedMachinesCount()
          }
        };
      }
      
      this.logger.log(`Используем ${machineIds.length} доступных станков: ${machineIds.join(', ')}`);
      
      const planningRequest: PlanningRequest = {
        selectedMachines: machineIds
      };
      
      const result = await this.planningService.planProduction(planningRequest);
      
      return {
        success: true,
        message: `Демо улучшенного планирования выполнено с ${machineIds.length} станками`,
        result: {
          selectedOrdersCount: result.selectedOrders.length,
          operationsQueueLength: result.operationsQueue.length,
          totalTime: result.totalTime,
          totalTimeFormatted: this.formatTime(result.totalTime),
          calculationDate: result.calculationDate,
          hasWarnings: result.warnings && result.warnings.length > 0,
          warnings: result.warnings || [],
          details: result
        },
        machinesUsed: {
          total: machineIds.length,
          machineIds: machineIds,
          machineDetails: availableMachines.map(m => ({
            id: m.id,
            code: m.code,
            type: m.type,
            axes: m.axes
          }))
        }
      };
      
    } catch (error) {
      this.logger.error('❌ Ошибка при демо планировании:', error);
      return {
        success: false,
        error: 'Ошибка при выполнении демо планирования',
        message: error.message,
        suggestion: 'Проверьте что в БД есть заказы с приоритетами 1, 2, 3 и соответствующие операции'
      };
    }
  }

  @Get('analysis')
  @ApiOperation({ 
    summary: '📊 Анализ состояния системы',
    description: 'Предоставляет детальный анализ доступности операций и станков'
  })
  async getSystemAnalysis() {
    try {
      this.logger.log('📊 Выполнение анализа состояния системы');
      
      const analysis = {
        machines: await this.getMachinesAnalysis(),
        operations: await this.getOperationsAnalysis(),
        orders: await this.getOrdersAnalysis(),
        recommendations: await this.getRecommendations()
      };
      
      return {
        success: true,
        timestamp: new Date(),
        analysis
      };
      
    } catch (error) {
      this.logger.error('❌ Ошибка при анализе системы:', error);
      return {
        success: false,
        error: 'Ошибка при анализе системы',
        message: error.message
      };
    }
  }

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ==========================================

  private async getAvailableMachinesFromDB() {
    return await this.planningService['dataSource'].query(`
      SELECT id, code, type, axes, "isActive", "isOccupied"
      FROM machines 
      WHERE "isActive" = true AND "isOccupied" = false
      ORDER BY type, code
    `);
  }

  private async getActiveMachinesCount(): Promise<number> {
    const result = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM machines WHERE "isActive" = true
    `);
    return parseInt(result[0].count);
  }

  private async getOccupiedMachinesCount(): Promise<number> {
    const result = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM machines WHERE "isOccupied" = true
    `);
    return parseInt(result[0].count);
  }

  private async getMachinesAnalysis() {
    const total = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM machines
    `);
    
    const active = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM machines WHERE "isActive" = true
    `);
    
    const available = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM machines WHERE "isActive" = true AND "isOccupied" = false
    `);
    
    const byType = await this.planningService['dataSource'].query(`
      SELECT type, COUNT(*) as count 
      FROM machines 
      WHERE "isActive" = true 
      GROUP BY type
    `);

    return {
      total: parseInt(total[0].count),
      active: parseInt(active[0].count),
      available: parseInt(available[0].count),
      occupied: parseInt(active[0].count) - parseInt(available[0].count),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  private async getOperationsAnalysis() {
    const total = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM operations
    `);
    
    const byStatus = await this.planningService['dataSource'].query(`
      SELECT 
        COALESCE(status, 'PENDING') as status, 
        COUNT(*) as count 
      FROM operations 
      GROUP BY status
    `);
    
    const inProgress = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count 
      FROM operations 
      WHERE status = 'IN_PROGRESS' OR id IN (
        SELECT "currentOperation" FROM machines WHERE "currentOperation" IS NOT NULL
      )
    `);

    return {
      total: parseInt(total[0].count),
      inProgress: parseInt(inProgress[0].count),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status || 'PENDING'] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  private async getOrdersAnalysis() {
    const total = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM orders
    `);
    
    const withPriorities = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM orders WHERE priority IN (1, 2, 3)
    `);
    
    const byPriority = await this.planningService['dataSource'].query(`
      SELECT priority, COUNT(*) as count 
      FROM orders 
      WHERE priority IN (1, 2, 3)
      GROUP BY priority
      ORDER BY priority
    `);

    return {
      total: parseInt(total[0].count),
      withPriorities: parseInt(withPriorities[0].count),
      byPriority: byPriority.reduce((acc, item) => {
        acc[`priority_${item.priority}`] = parseInt(item.count);
        return acc;
      }, {})
    };
  }

  private async getRecommendations() {
    const recommendations = [];
    
    // Проверяем доступные станки
    const availableMachines = await this.getAvailableMachinesFromDB();
    if (availableMachines.length === 0) {
      recommendations.push({
        type: 'warning',
        message: 'Нет доступных станков для планирования',
        action: 'Освободите станки или проверьте их статус в системе'
      });
    }
    
    // Проверяем заказы с приоритетами
    const ordersWithPriorities = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM orders WHERE priority IN (1, 2, 3)
    `);
    
    if (parseInt(ordersWithPriorities[0].count) === 0) {
      recommendations.push({
        type: 'error',
        message: 'Нет заказов с приоритетами 1, 2, 3',
        action: 'Добавьте заказы с соответствующими приоритетами в систему'
      });
    }
    
    // Проверяем операции в прогрессе
    const operationsInProgress = await this.planningService['dataSource'].query(`
      SELECT COUNT(*) as count FROM operations WHERE status = 'IN_PROGRESS'
    `);
    
    if (parseInt(operationsInProgress[0].count) > 0) {
      recommendations.push({
        type: 'info',
        message: `${operationsInProgress[0].count} операций в процессе выполнения`,
        action: 'Система корректно учитывает эти операции при планировании'
      });
    }

    return recommendations;
  }

  private groupOperationsByType(operations: any[]) {
    return operations.reduce((acc, op) => {
      acc[op.operationType] = (acc[op.operationType] || 0) + 1;
      return acc;
    }, {});
  }

  private groupOperationsByPriority(operations: any[], orders: any[]) {
    return operations.reduce((acc, op) => {
      const order = orders.find(o => o.id === op.orderId);
      if (order) {
        const priority = `priority_${order.priority}`;
        acc[priority] = (acc[priority] || 0) + 1;
      }
      return acc;
    }, {});
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
