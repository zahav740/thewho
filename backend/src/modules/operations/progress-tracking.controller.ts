/**
 * @file: progress-tracking.controller.ts
 * @description: Контроллер для управления прогрессом операций (НОВЫЙ)
 * @dependencies: ProgressTrackingService
 * @created: 2025-06-11
 */
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProgressTrackingService } from './progress-tracking.service';

export class UpdateProgressDto {
  completedUnits: number;
  totalUnits: number;
}

@ApiTags('progress-tracking')
@Controller('progress')
export class ProgressTrackingController {
  constructor(
    private readonly progressService: ProgressTrackingService,
  ) {}

  @Put('operation/:operationId')
  @ApiOperation({ summary: 'Обновить прогресс операции' })
  @ApiResponse({ status: 200, description: 'Прогресс обновлен успешно' })
  async updateProgress(
    @Param('operationId') operationId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    try {
      console.log('ProgressController: Обновление прогресса операции:', operationId, updateProgressDto);
      
      const result = await this.progressService.updateProgress(
        parseInt(operationId),
        updateProgressDto.completedUnits,
        updateProgressDto.totalUnits
      );

      return {
        success: true,
        message: 'Прогресс обновлен успешно',
        data: result
      };
    } catch (error) {
      console.error('ProgressController.updateProgress ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при обновлении прогресса',
        error: error.message
      };
    }
  }

  @Get('operation/:operationId')
  @ApiOperation({ summary: 'Получить прогресс операции' })
  async getOperationProgress(@Param('operationId') operationId: string) {
    try {
      const result = await this.progressService.getOperationProgress(parseInt(operationId));
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('ProgressController.getOperationProgress ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении прогресса',
        error: error.message
      };
    }
  }

  @Post('operation/:operationId/start')
  @ApiOperation({ summary: 'Начать операцию' })
  async startOperation(@Param('operationId') operationId: string) {
    try {
      await this.progressService.startOperation(parseInt(operationId));
      return {
        success: true,
        message: 'Операция начата успешно'
      };
    } catch (error) {
      console.error('ProgressController.startOperation ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при запуске операции',
        error: error.message
      };
    }
  }

  @Post('operation/:operationId/complete')
  @ApiOperation({ summary: 'Завершить операцию' })
  async completeOperation(@Param('operationId') operationId: string) {
    try {
      await this.progressService.completeOperation(parseInt(operationId));
      return {
        success: true,
        message: 'Операция завершена успешно'
      };
    } catch (error) {
      console.error('ProgressController.completeOperation ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при завершении операции',
        error: error.message
      };
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Получить производственные метрики' })
  async getProductionMetrics() {
    try {
      const metrics = await this.progressService.getProductionMetrics();
      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('ProgressController.getProductionMetrics ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении метрик',
        error: error.message
      };
    }
  }

  @Get('active-operations')
  @ApiOperation({ summary: 'Получить активные операции с прогрессом' })
  async getActiveOperationsWithProgress() {
    try {
      const operations = await this.progressService.getActiveOperationsWithProgress();
      return {
        success: true,
        data: operations,
        count: operations.length
      };
    } catch (error) {
      console.error('ProgressController.getActiveOperationsWithProgress ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении активных операций',
        error: error.message
      };
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Получить данные для дашборда мониторинга' })
  async getDashboardData() {
    try {
      const [metrics, activeOperations] = await Promise.all([
        this.progressService.getProductionMetrics(),
        this.progressService.getActiveOperationsWithProgress()
      ]);

      return {
        success: true,
        data: {
          metrics,
          activeOperations,
          summary: {
            totalOperations: metrics.totalOperations,
            averageProgress: metrics.averageProgress,
            machineUtilization: metrics.machineUtilization,
            dailyProduction: metrics.dailyProduction
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('ProgressController.getDashboardData ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении данных дашборда',
        error: error.message
      };
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint' })
  async test() {
    try {
      return {
        status: 'ok',
        message: 'Progress tracking service is working',
        timestamp: new Date().toISOString(),
        endpoints: [
          'PUT /progress/operation/:operationId - Обновить прогресс',
          'GET /progress/operation/:operationId - Получить прогресс',
          'POST /progress/operation/:operationId/start - Начать операцию',
          'POST /progress/operation/:operationId/complete - Завершить операцию',
          'GET /progress/metrics - Производственные метрики',
          'GET /progress/active-operations - Активные операции',
          'GET /progress/dashboard - Данные дашборда'
        ]
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
