/**
 * @file: operation-selection.controller.ts
 * @description: Контроллер для выбора операций пользователем
 * @created: 2025-06-07
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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductionPlanningExtensionsService } from './production-planning-extensions.service';

@ApiTags('operation-selection')
@Controller('planning')
export class OperationSelectionController {
  private readonly logger = new Logger(OperationSelectionController.name);

  constructor(
    private readonly planningExtensionsService: ProductionPlanningExtensionsService,
  ) {}

  @Get('available-operations')
  @ApiOperation({ 
    summary: 'Получить доступные операции для выбора',
    description: 'Возвращает список операций, которые пользователь может выбрать для планирования'
  })
  @ApiResponse({ status: 200, description: 'Список доступных операций получен' })
  async getAvailableOperations(@Query('machineIds') machineIds?: string) {
    try {
      this.logger.log('Запрос доступных операций для выбора');
      
      let selectedMachineIds: number[] | undefined;
      if (machineIds) {
        selectedMachineIds = machineIds.split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => !isNaN(id));
      }
      
      const result = await this.planningExtensionsService.getAvailableOperations(selectedMachineIds);
      
      return {
        success: true,
        data: {
          orders: result.orders,
          availableOperations: result.availableOperations.map(op => ({
            // Информация об операции
            operationId: op.id,
            operationNumber: op.operationNumber,
            operationType: op.operationType,
            estimatedTime: op.estimatedTime,
            estimatedTimeFormatted: this.formatTime(op.estimatedTime),
            machineAxes: op.machineAxes,
            status: op.status,
            canStart: op.canStart,
            blockingReason: op.blockingReason,
            
            // Информация о заказе
            order: {
              id: op.orderInfo.id,
              drawingNumber: op.orderInfo.drawingNumber,
              priority: op.orderInfo.priority,
              quantity: op.orderInfo.quantity,
              deadline: op.orderInfo.deadline,
              workType: op.orderInfo.workType
            },
            
            // Совместимые станки
            compatibleMachines: op.compatibleMachines.map(machine => ({
              id: machine.id,
              code: machine.code,
              type: machine.type,
              axes: machine.axes,
              isActive: machine.isActive,
              isOccupied: machine.isOccupied
            }))
          })),
          totalOperations: result.totalOperations,
          summary: {
            totalOrders: result.orders.length,
            totalOperations: result.totalOperations,
            readyToStart: result.availableOperations.filter(op => op.canStart).length,
            waiting: result.availableOperations.filter(op => !op.canStart).length
          }
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при получении доступных операций:', error);
      return {
        success: false,
        error: 'Ошибка при получении доступных операций',
        message: error.message
      };
    }
  }

  @Post('plan-selected')
  @ApiOperation({ 
    summary: 'Планирование с выбранными операциями',
    description: 'Выполняет планирование для операций, выбранных пользователем'
  })
  @ApiResponse({ status: 200, description: 'Планирование выполнено' })
  async planWithSelectedOperations(@Body() request: {
    selectedMachines: number[];
    selectedOperations: { operationId: number; machineId: number; }[];
  }) {
    try {
      this.logger.log('Запрос планирования с выбранными операциями');
      this.logger.log(`Выбрано операций: ${request.selectedOperations.length}`);
      
      if (!request.selectedOperations || request.selectedOperations.length === 0) {
        return {
          success: false,
          error: 'Не выбрано ни одной операции для планирования'
        };
      }
      
      const result = await this.planningExtensionsService.planWithSelectedOperations(request);
      
      return {
        success: true,
        message: `Планирование выполнено для ${request.selectedOperations.length} операций`,
        data: {
          selectedOrdersCount: result.selectedOrders.length,
          operationsQueueLength: result.operationsQueue.length,
          totalTime: result.totalTime,
          totalTimeFormatted: this.formatTime(result.totalTime),
          calculationDate: result.calculationDate,
          details: result
        }
      };
      
    } catch (error) {
      this.logger.error('Ошибка при планировании с выбранными операциями:', error);
      return {
        success: false,
        error: 'Ошибка при планировании',
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
