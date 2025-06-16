/**
 * @file: synchronization.controller.ts
 * @description: API контроллер для управления синхронизацией между Production и Shifts
 * @dependencies: synchronization.service
 * @created: 2025-06-15
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SynchronizationService } from './synchronization.service';

@ApiTags('synchronization')
@Controller('sync')
export class SynchronizationController {
  private readonly logger = new Logger(SynchronizationController.name);

  constructor(
    private readonly syncService: SynchronizationService,
  ) {}

  @Post('assign-operation')
  @ApiOperation({ 
    summary: 'Назначить операцию с автоматической синхронизацией',
    description: 'Назначает операцию на станок и автоматически создает связанную запись смены'
  })
  @ApiResponse({ status: 200, description: 'Операция успешно назначена и синхронизирована' })
  async assignOperationWithSync(@Body() request: { operationId: number; machineId: number; }) {
    try {
      this.logger.log(`🔗 Назначение операции ${request.operationId} на станок ${request.machineId} с синхронизацией`);
      
      if (!request.operationId || !request.machineId) {
        throw new BadRequestException('operationId и machineId обязательны');
      }

      const result = await this.syncService.assignOperationWithSync(
        request.operationId,
        request.machineId
      );

      return {
        success: true,
        message: `Операция ${request.operationId} назначена на станок ${request.machineId} и синхронизирована`,
        synchronizationStatus: result,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('Ошибка назначения операции с синхронизацией:', error);
      throw error;
    }
  }

  @Post('update-progress/:operationId')
  @ApiOperation({ 
    summary: 'Обновить прогресс операции',
    description: 'Пересчитывает прогресс операции на основе данных смен'
  })
  async updateOperationProgress(@Param('operationId') operationId: string) {
    try {
      this.logger.log(`📊 Обновление прогресса операции ${operationId}`);

      const result = await this.syncService.updateOperationProgress(Number(operationId));

      return {
        success: true,
        message: `Прогресс операции ${operationId} обновлен`,
        synchronizationStatus: result,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error(`Ошибка обновления прогресса операции ${operationId}:`, error);
      throw error;
    }
  }

  @Get('status/:operationId')
  @ApiOperation({ 
    summary: 'Получить статус синхронизации операции',
    description: 'Возвращает текущий статус синхронизации между операцией и сменами'
  })
  async getSynchronizationStatus(@Param('operationId') operationId: string) {
    try {
      this.logger.log(`📋 Получение статуса синхронизации операции ${operationId}`);

      const status = await this.syncService.getSynchronizationStatus(Number(operationId));

      return {
        success: true,
        operationId: Number(operationId),
        status,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error(`Ошибка получения статуса синхронизации операции ${operationId}:`, error);
      throw error;
    }
  }

  @Post('sync-all')
  @ApiOperation({ 
    summary: 'Принудительная синхронизация всех активных операций',
    description: 'Пересчитывает прогресс всех активных операций на основе данных смен'
  })
  async syncAllActiveOperations() {
    try {
      this.logger.log(`🔄 Запуск принудительной синхронизации всех операций`);

      const results = await this.syncService.syncAllActiveOperations();

      return {
        success: true,
        message: `Синхронизация завершена. Обработано ${results.length} операций`,
        results,
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('Ошибка принудительной синхронизации:', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Проверка работоспособности системы синхронизации'
  })
  async healthCheck() {
    try {
      // Проверяем базовые операции
      const activeOpsCount = await this.syncService['dataSource'].query(`
        SELECT COUNT(*) as count FROM operations 
        WHERE status IN ('ASSIGNED', 'IN_PROGRESS')
      `);

      const shiftsCount = await this.syncService['dataSource'].query(`
        SELECT COUNT(*) as count FROM shift_records 
        WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      `);

      return {
        success: true,
        message: 'Система синхронизации работает корректно',
        statistics: {
          activeOperations: Number(activeOpsCount[0].count),
          recentShifts: Number(shiftsCount[0].count),
        },
        timestamp: new Date(),
      };

    } catch (error) {
      this.logger.error('Ошибка проверки работоспособности:', error);
      return {
        success: false,
        message: 'Ошибка в системе синхронизации',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
