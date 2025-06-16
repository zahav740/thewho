/**
 * @file: operation-completion-check.controller.ts
 * @description: Контроллер для автоматической проверки завершения операций
 * @dependencies: operations.service, shifts.service
 * @created: 2025-06-12
 */
import {
  Controller,
  Get,
  Post,
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

interface CompletionCheckResult {
  operationId: number;
  isCompleted: boolean;
  completedQuantity: number;
  plannedQuantity: number;
  progress: number;
  orderInfo: {
    drawingNumber: string;
    quantity: number;
  };
  operationInfo: {
    operationNumber: number;
    operationType: string;
  };
}

interface HandleCompletionDto {
  operationId: number;
  action: 'close' | 'continue' | 'plan';
  completedQuantity: number;
}

@ApiTags('operation-completion-check')
@Controller('operations/completion')
export class OperationCompletionCheckController {
  private readonly logger = new Logger(OperationCompletionCheckController.name);

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

  @Get('check/:operationId')
  @ApiOperation({ summary: 'Проверить завершение операции по накопленному количеству' })
  async checkOperationCompletion(@Param('operationId') operationId: number): Promise<CompletionCheckResult> {
    try {
      this.logger.log(`Проверка завершения операции ${operationId}`);
      
      // Находим операцию с заказом
      const operation = await this.operationRepository.findOne({
        where: { id: operationId },
        relations: ['order']
      });
      
      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Находим записи смен для этой операции
      const shiftRecords = await this.shiftRecordRepository.find({
        where: { operationId: operationId, archived: false }
      });

      // Подсчитываем общее количество выполненных деталей
      const totalCompleted = shiftRecords.reduce((total, record) => {
        const dayShift = record.dayShiftQuantity || 0;
        const nightShift = record.nightShiftQuantity || 0;
        return total + dayShift + nightShift;
      }, 0);

      // Плановое количество = количество в заказе
      const plannedQuantity = operation.order?.quantity || 0;
      
      // Вычисляем прогресс
      const progress = plannedQuantity > 0 ? Math.round((totalCompleted / plannedQuantity) * 100) : 0;
      
      // Операция завершена только если:
      // 1. Есть плановое количество
      // 2. Выполнено не меньше планового количества
      const isCompleted = plannedQuantity > 0 && totalCompleted >= plannedQuantity;
      
      this.logger.debug(`Проверка операции ${operationId}: выполнено ${totalCompleted}, план ${plannedQuantity}, прогресс ${progress}%, завершено: ${isCompleted}`);

      const result: CompletionCheckResult = {
        operationId: operationId,
        isCompleted,
        completedQuantity: totalCompleted,
        plannedQuantity,
        progress,
        orderInfo: {
          drawingNumber: operation.order?.drawingNumber || 'Неизвестно',
          quantity: plannedQuantity
        },
        operationInfo: {
          operationNumber: operation.operationNumber,
          operationType: operation.operationType || 'Неизвестно'
        }
      };

      this.logger.log(`Результат проверки операции ${operationId}: выполнено ${totalCompleted}/${plannedQuantity}, прогресс ${progress}%, завершено: ${isCompleted}`);
      return result;
      
    } catch (error) {
      this.logger.error('Ошибка при проверке завершения операции:', error);
      throw new BadRequestException(`Ошибка при проверке завершения: ${error.message}`);
    }
  }

  @Get('check-all-active')
  @ApiOperation({ summary: 'Проверить все активные операции на завершение' })
  async checkAllActiveOperations(): Promise<CompletionCheckResult[]> {
    try {
      this.logger.log('Проверка всех активных операций на завершение');
      
      // Находим все операции в статусе IN_PROGRESS или ASSIGNED
      const activeOperations = await this.operationRepository.find({
        where: [
          { status: 'IN_PROGRESS' },
          { status: 'ASSIGNED' }
        ],
        relations: ['order']
      });

      const results: CompletionCheckResult[] = [];

      for (const operation of activeOperations) {
        try {
          const checkResult = await this.checkOperationCompletion(operation.id);
          
          // ВАЖНО: операция считается завершённой только если:
          // 1. есть плановое количество (> 0)
          // 2. выполненное количество >= планового количества
          // 3. прогресс >= 100%
          const isReallyCompleted = checkResult.isCompleted && 
                                   checkResult.plannedQuantity > 0 && 
                                   checkResult.completedQuantity >= checkResult.plannedQuantity &&
                                   checkResult.progress >= 100;
          
          if (isReallyCompleted) {
            this.logger.log(`🎯 Операция ${operation.id} действительно завершена: ${checkResult.completedQuantity}/${checkResult.plannedQuantity}`);
            results.push(checkResult);
          } else {
            this.logger.debug(`⏳ Операция ${operation.id} ещё не завершена: ${checkResult.completedQuantity}/${checkResult.plannedQuantity} (${checkResult.progress}%)`);
          }
        } catch (error) {
          this.logger.warn(`Ошибка при проверке операции ${operation.id}:`, error);
        }
      }

      this.logger.log(`Найдено ${results.length} ДЕЙСТВИТЕЛЬНО завершенных операций из ${activeOperations.length} активных`);
      return results;
      
    } catch (error) {
      this.logger.error('Ошибка при проверке всех операций:', error);
      throw new BadRequestException(`Ошибка при проверке операций: ${error.message}`);
    }
  }

  @Post('handle')
  @ApiOperation({ summary: 'Обработать завершенную операцию (закрыть/продолжить/планировать)' })
  async handleCompletion(@Body() dto: HandleCompletionDto) {
    try {
      this.logger.log(`Обработка завершения операции ${dto.operationId}, действие: ${dto.action}`);
      
      const operation = await this.operationRepository.findOne({
        where: { id: dto.operationId },
        relations: ['order']
      });
      
      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      switch (dto.action) {
        case 'close':
          // Закрыть операцию - установить статус COMPLETED и архивировать смены
          await this.closeOperation(dto.operationId, dto.completedQuantity);
          return {
            success: true,
            message: 'Операция успешно закрыта и данные архивированы',
            action: 'closed'
          };

        case 'continue':
          // Продолжить - ничего не делаем, просто логируем
          this.logger.log(`Операция ${dto.operationId} продолжается`);
          return {
            success: true,
            message: 'Операция продолжается, накопление результата не сброшено',
            action: 'continued'
          };

        case 'plan':
          // Спланировать - закрыть текущую операцию и вернуть признак для открытия планирования
          await this.closeOperation(dto.operationId, dto.completedQuantity);
          return {
            success: true,
            message: 'Операция закрыта, готово к планированию новой операции',
            action: 'planned',
            shouldOpenPlanning: true,
            machineId: operation.assignedMachine
          };

        default:
          throw new BadRequestException('Неизвестное действие');
      }
      
    } catch (error) {
      this.logger.error('Ошибка при обработке завершения операции:', error);
      throw new BadRequestException(`Ошибка при обработке: ${error.message}`);
    }
  }

  private async closeOperation(operationId: number, completedQuantity: number) {
    // Получаем операцию с информацией о станке
    const operation = await this.operationRepository.findOne({
      where: { id: operationId }
    });

    if (!operation) {
      throw new Error(`Операция ${operationId} не найдена`);
    }

    // Обновляем статус операции
    await this.operationRepository.update(operationId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      actualQuantity: completedQuantity,
      assignedMachine: null // Снимаем назначение станка
    });

    // Освобождаем станок
    if (operation.assignedMachine) {
      await this.machineRepository.update(operation.assignedMachine, {
        isOccupied: false,
        currentOperation: null,
        assignedAt: null,
        updatedAt: new Date()
      });
      
      this.logger.log(`Станок ${operation.assignedMachine} освобожден`);
    }

    // Используем только assignedMachine, machineId не существует в entity

    // Архивируем записи смен
    await this.shiftRecordRepository.update(
      { operationId: operationId },
      { 
        archived: true,
        archivedAt: new Date()
      }
    );

    this.logger.log(`Операция ${operationId} закрыта, выполнено ${completedQuantity} деталей, станок освобожден`);
  }
}
