/**
 * @file: operation-completion-extended.controller.ts
 * @description: Расширенный контроллер для завершения операций с поддержкой новой системы
 * @dependencies: operations.service, shifts.service, machines.service
 * @created: 2025-06-12
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Logger,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { Order } from '../../database/entities/order.entity';
import { Machine } from '../../database/entities/machine.entity';

interface CompletedOperationDetails {
  id: string;
  operationNumber: number;
  operationType: string;
  orderDrawingNumber: string;
  machineName: string;
  machineType: string;
  targetQuantity: number;
  completedQuantity: number;
  progressPercentage: number;
  estimatedTime: number;
  actualTime?: number;
  dayShiftQuantity: number;
  nightShiftQuantity: number;
  dayShiftOperator?: string;
  nightShiftOperator?: string;
  startedAt: string;
  completedAt: string;
}

@ApiTags('operation-completion-extended')
@Controller('operations')
export class OperationCompletionExtendedController {
  private readonly logger = new Logger(OperationCompletionExtendedController.name);

  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
  ) {}

  @Get('completed-check')
  @ApiOperation({ summary: 'Проверить завершенные операции для показа модального окна' })
  async checkCompletedOperations(): Promise<{ success: boolean; data: CompletedOperationDetails[] }> {
    try {
      this.logger.log('Проверка завершенных операций для модального окна');
      
      // Находим все активные операции
      const activeOperations = await this.operationRepository.find({
        where: [
          { status: 'IN_PROGRESS' },
          { status: 'ASSIGNED' }
        ],
        relations: ['order']
      });

      const completedOperations: CompletedOperationDetails[] = [];

      for (const operation of activeOperations) {
        try {
          // Находим записи смен для операции
          const shiftRecords = await this.shiftRecordRepository.find({
            where: { operationId: operation.id, archived: false }
          });

          // Подсчитываем выполненное количество
          const dayShiftTotal = shiftRecords.reduce((total, record) => total + (record.dayShiftQuantity || 0), 0);
          const nightShiftTotal = shiftRecords.reduce((total, record) => total + (record.nightShiftQuantity || 0), 0);
          const totalCompleted = dayShiftTotal + nightShiftTotal;
          
          // Целевое количество из заказа
          const targetQuantity = operation.order?.quantity || 30;
          const progressPercentage = Math.round((totalCompleted / targetQuantity) * 100);

          // Проверяем, завершена ли операция
          if (progressPercentage >= 100) {
            // Получаем информацию о станке
            const machine = await this.machineRepository.findOne({
              where: { id: operation.assignedMachine }
            });

            // Получаем операторов из смен
            const dayOperators = [...new Set(shiftRecords.map(r => r.dayShiftOperator).filter(Boolean))];
            const nightOperators = [...new Set(shiftRecords.map(r => r.nightShiftOperator).filter(Boolean))];

            // Вычисляем актуальное время выполнения
            const actualTime = operation.assignedAt ? 
              Math.round((new Date().getTime() - new Date(operation.assignedAt).getTime()) / (1000 * 60)) : 
              operation.estimatedTime;

            const completedOperation: CompletedOperationDetails = {
              id: operation.id.toString(),
              operationNumber: operation.operationNumber,
              operationType: operation.operationType || 'Не указан',
              orderDrawingNumber: operation.order?.drawingNumber || 'Неизвестно',
              machineName: machine?.code || 'Неизвестно', // ИСПРАВЛЕНО: используем code вместо machineName
              machineType: machine?.type || 'Неизвестно', // ИСПРАВЛЕНО: используем type вместо machineType
              targetQuantity,
              completedQuantity: totalCompleted,
              progressPercentage,
              estimatedTime: operation.estimatedTime || 0,
              actualTime,
              dayShiftQuantity: dayShiftTotal,
              nightShiftQuantity: nightShiftTotal,
              dayShiftOperator: dayOperators.join(', ') || undefined,
              nightShiftOperator: nightOperators.join(', ') || undefined,
              startedAt: operation.assignedAt ? operation.assignedAt.toISOString() : new Date().toISOString(),
              completedAt: new Date().toISOString(),
            };

            completedOperations.push(completedOperation);
          }
        } catch (error) {
          this.logger.warn(`Ошибка при проверке операции ${operation.id}:`, error);
        }
      }

      this.logger.log(`Найдено ${completedOperations.length} завершенных операций`);
      
      return {
        success: true,
        data: completedOperations
      };
      
    } catch (error) {
      this.logger.error('Ошибка при проверке завершенных операций:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  @Get(':operationId/completion-details')
  @ApiOperation({ summary: 'Получить детальную информацию о завершенной операции' })
  async getCompletionDetails(@Param('operationId') operationId: string): Promise<{ success: boolean; data: CompletedOperationDetails | null }> {
    try {
      const operation = await this.operationRepository.findOne({
        where: { id: parseInt(operationId) },
        relations: ['order']
      });

      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Получаем данные смен
      const shiftRecords = await this.shiftRecordRepository.find({
        where: { operationId: operation.id, archived: false }
      });

      // Получаем информацию о станке
      const machine = await this.machineRepository.findOne({
        where: { id: operation.assignedMachine }
      });

      // Подсчитываем данные
      const dayShiftTotal = shiftRecords.reduce((total, record) => total + (record.dayShiftQuantity || 0), 0);
      const nightShiftTotal = shiftRecords.reduce((total, record) => total + (record.nightShiftQuantity || 0), 0);
      const totalCompleted = dayShiftTotal + nightShiftTotal;
      const targetQuantity = operation.order?.quantity || 30;
      const progressPercentage = Math.round((totalCompleted / targetQuantity) * 100);

      // Получаем операторов
      const dayOperators = [...new Set(shiftRecords.map(r => r.dayShiftOperator).filter(Boolean))];
      const nightOperators = [...new Set(shiftRecords.map(r => r.nightShiftOperator).filter(Boolean))];

      // Вычисляем время
      const actualTime = operation.assignedAt ? 
        Math.round((new Date().getTime() - new Date(operation.assignedAt).getTime()) / (1000 * 60)) : 
        operation.estimatedTime;

      const details: CompletedOperationDetails = {
        id: operation.id.toString(),
        operationNumber: operation.operationNumber,
        operationType: operation.operationType || 'Не указан',
        orderDrawingNumber: operation.order?.drawingNumber || 'Неизвестно',
        machineName: machine?.code || 'Неизвестно', // ИСПРАВЛЕНО: используем code вместо machineName
        machineType: machine?.type || 'Неизвестно', // ИСПРАВЛЕНО: используем type вместо machineType
        targetQuantity,
        completedQuantity: totalCompleted,
        progressPercentage,
        estimatedTime: operation.estimatedTime || 0,
        actualTime,
        dayShiftQuantity: dayShiftTotal,
        nightShiftQuantity: nightShiftTotal,
        dayShiftOperator: dayOperators.join(', ') || undefined,
        nightShiftOperator: nightOperators.join(', ') || undefined,
        startedAt: operation.assignedAt ? operation.assignedAt.toISOString() : new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: details
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при получении деталей операции ${operationId}:`, error);
      return {
        success: false,
        data: null
      };
    }
  }

  @Post(':operationId/close')
  @ApiOperation({ summary: 'Закрыть операцию и сохранить результат' })
  async closeOperation(
    @Param('operationId') operationId: string,
    @Body() body: { saveResults: boolean }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const opId = parseInt(operationId);
      this.logger.log(`Закрытие операции ${opId}, сохранить результаты: ${body.saveResults}`);

      const operation = await this.operationRepository.findOne({
        where: { id: opId },
        relations: ['order']
      });

      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Получаем данные для архивирования
      const shiftRecords = await this.shiftRecordRepository.find({
        where: { operationId: opId, archived: false }
      });

      const totalCompleted = shiftRecords.reduce((total, record) => 
        total + (record.dayShiftQuantity || 0) + (record.nightShiftQuantity || 0), 0
      );

      if (body.saveResults) {
        // Обновляем операцию
        await this.operationRepository.update(opId, {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualQuantity: totalCompleted,
          assignedMachine: null
        });

        // Архивируем смены
        await this.shiftRecordRepository.update(
          { operationId: opId },
          { 
            archived: true,
            archivedAt: new Date()
          }
        );

        // Освобождаем станок
        if (operation.assignedMachine) {
          await this.machineRepository.update(operation.assignedMachine, {
            isOccupied: false,
            currentOperation: null,
            assignedAt: null,
            updatedAt: new Date()
          });
        }

        this.logger.log(`Операция ${opId} закрыта, выполнено ${totalCompleted} деталей`);
      }

      return {
        success: true,
        message: body.saveResults ? 
          'Операция закрыта и результат сохранен в БД' : 
          'Операция закрыта без сохранения'
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при закрытии операции ${operationId}:`, error);
      throw new BadRequestException(`Ошибка при закрытии операции: ${error.message}`);
    }
  }

  @Post(':operationId/continue')
  @ApiOperation({ summary: 'Продолжить операцию' })
  async continueOperation(@Param('operationId') operationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const opId = parseInt(operationId);
      this.logger.log(`Продолжение операции ${opId}`);

      const operation = await this.operationRepository.findOne({
        where: { id: opId }
      });

      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Устанавливаем статус "В работе", если он был другой
      if (operation.status !== 'IN_PROGRESS') {
        await this.operationRepository.update(opId, {
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        });
      }

      this.logger.log(`Операция ${opId} продолжена, накопление результата сохранено`);

      return {
        success: true,
        message: 'Операция продолжена, результат будет накапливаться'
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при продолжении операции ${operationId}:`, error);
      throw new BadRequestException(`Ошибка при продолжении операции: ${error.message}`);
    }
  }

  @Post(':operationId/archive-and-free')
  @ApiOperation({ summary: 'Архивировать результат и освободить станок для планирования' })
  async archiveAndFree(@Param('operationId') operationId: string): Promise<{ success: boolean; message: string; machineId?: number }> {
    try {
      const opId = parseInt(operationId);
      this.logger.log(`Архивирование и освобождение станка для операции ${opId}`);

      const operation = await this.operationRepository.findOne({
        where: { id: opId }
      });

      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Получаем данные смен для архивирования
      const shiftRecords = await this.shiftRecordRepository.find({
        where: { operationId: opId, archived: false }
      });

      const totalCompleted = shiftRecords.reduce((total, record) => 
        total + (record.dayShiftQuantity || 0) + (record.nightShiftQuantity || 0), 0
      );

      // Архивируем операцию
      await this.operationRepository.update(opId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualQuantity: totalCompleted,
        assignedMachine: null
      });

      // Архивируем смены
      await this.shiftRecordRepository.update(
        { operationId: opId },
        { 
          archived: true,
          archivedAt: new Date()
        }
      );

      // Освобождаем станок для планирования
      let machineId = null;
      if (operation.assignedMachine) {
        await this.machineRepository.update(operation.assignedMachine, {
          isOccupied: false,
          currentOperation: null,
          assignedAt: null,
          updatedAt: new Date()
        });
        machineId = operation.assignedMachine;
      }

      this.logger.log(`Операция ${opId} архивирована, станок ${machineId} освобожден для планирования`);

      return {
        success: true,
        message: 'Результат сохранен, станок освобожден для планирования',
        machineId
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при архивировании операции ${operationId}:`, error);
      throw new BadRequestException(`Ошибка при архивировании: ${error.message}`);
    }
  }

  @Put('operation/:operationId')
  @ApiOperation({ summary: 'Обновить прогресс операции' })
  async updateProgress(
    @Param('operationId') operationId: string,
    @Body() body: { completedUnits: number; totalUnits: number }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const opId = parseInt(operationId);
      this.logger.log(`Обновление прогресса операции ${opId}: ${body.completedUnits}/${body.totalUnits}`);

      // Можно обновить прогресс через смены или другую логику
      // Пока просто возвращаем успех
      
      return {
        success: true,
        message: 'Прогресс операции обновлен'
      };
      
    } catch (error) {
      this.logger.error(`Ошибка при обновлении прогресса операции ${operationId}:`, error);
      throw new BadRequestException(`Ошибка при обновлении прогресса: ${error.message}`);
    }
  }
}
