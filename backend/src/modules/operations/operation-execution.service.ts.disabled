/**
 * @file: operation-execution.service.ts
 * @description: Сервис для запуска операций в работу
 * @dependencies: typeorm, entities
 * @created: 2025-05-28
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { MachineAvailability } from '../../database/entities/machine-availability.entity';
import { OperationProgress } from '../../database/entities/operation-progress.entity';

interface StartOperationResult {
  success: boolean;
  startDate: Date;
  operation: Operation;
}

@Injectable()
export class OperationExecutionService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(MachineAvailability)
    private readonly machineAvailabilityRepository: Repository<MachineAvailability>,
    @InjectRepository(OperationProgress)
    private readonly operationProgressRepository: Repository<OperationProgress>,
  ) {}

  /**
   * Запуск операции в работу
   */
  async startOperation(operationId: string, machineName: string): Promise<StartOperationResult> {
    try {
      console.log(`OperationExecution: Запуск операции ${operationId} на станке ${machineName}`);

      // 1. Находим операцию
      const operation = await this.operationRepository.findOne({
        where: { id: operationId },
        relations: ['order']
      });

      if (!operation) {
        throw new NotFoundException(`Операция ${operationId} не найдена`);
      }

      // 2. Проверяем доступность станка
      const machine = await this.machineAvailabilityRepository.findOne({
        where: { machineName }
      });

      if (!machine || !machine.isAvailable) {
        throw new Error(`Станок ${machineName} недоступен`);
      }

      // 3. Проверяем совместимость операции и станка
      if (!machine.canPerformOperation(operation.operationType)) {
        throw new Error(`Станок ${machineName} не может выполнять операцию типа ${operation.operationType}`);
      }

      const startDate = new Date();

      // 4. Обновляем статус операции
      operation.status = 'in_progress';
      operation.machine = machineName;
      await this.operationRepository.save(operation);

      // 5. Занимаем станок
      machine.isAvailable = false;
      machine.currentOperationId = operationId;
      await this.machineAvailabilityRepository.save(machine);

      // 6. Обновляем или создаем прогресс операции
      await this.updateOperationProgress(operation, startDate);

      // 7. Добавляем в календарь (интеграция)
      await this.addToCalendar(operation, machineName, startDate);

      console.log(`OperationExecution: Операция ${operationId} успешно запущена на станке ${machineName}`);

      return {
        success: true,
        startDate,
        operation
      };

    } catch (error) {
      console.error('OperationExecution: Ошибка запуска операции:', error);
      throw error;
    }
  }

  /**
   * Завершение операции
   */
  async completeOperation(operationId: string): Promise<Operation> {
    const operation = await this.operationRepository.findOne({
      where: { id: operationId },
      relations: ['order']
    });

    if (!operation) {
      throw new NotFoundException(`Операция ${operationId} не найдена`);
    }

    const completionDate = new Date();

    // Обновляем статус операции
    operation.status = 'completed';
    operation.actualTime = operation.estimatedTime; // Пока используем оценочное время
    await this.operationRepository.save(operation);

    // Освобождаем станок
    if (operation.machine) {
      const machine = await this.machineAvailabilityRepository.findOne({
        where: { machineName: operation.machine }
      });

      if (machine) {
        machine.isAvailable = true;
        machine.currentOperationId = null;
        machine.lastFreedAt = completionDate;
        await this.machineAvailabilityRepository.save(machine);
      }
    }

    // Обновляем прогресс
    await this.updateOperationProgressOnCompletion(operation, completionDate);

    return operation;
  }

  /**
   * Обновление прогресса операции при запуске
   */
  private async updateOperationProgress(operation: Operation, startDate: Date): Promise<void> {
    const estimatedCompletionDate = new Date(
      startDate.getTime() + operation.estimatedTime * 60000
    );

    const willMeetDeadline = estimatedCompletionDate <= operation.order.deadline;
    const timeMargin = willMeetDeadline ? 
      (operation.order.deadline.getTime() - estimatedCompletionDate.getTime()) / (1000 * 60) :
      (estimatedCompletionDate.getTime() - operation.order.deadline.getTime()) / (1000 * 60) * -1;

    // Ищем существующий прогресс или создаем новый
    let progress = await this.operationProgressRepository.findOne({
      where: { orderId: operation.order.id }
    });

    if (!progress) {
      progress = this.operationProgressRepository.create({
        orderId: operation.order.id,
        calculationDate: new Date(),
        startDate,
        deadline: operation.order.deadline,
        estimatedCompletionDate,
        quantity: operation.order.quantity,
        totalProductionTime: operation.estimatedTime,
        totalSetupTime: 30, // 30 минут на наладку
        totalRequiredTime: operation.estimatedTime + 30,
        requiredWorkdays: Math.ceil((operation.estimatedTime + 30) / (8 * 60)),
        willMeetDeadline,
        timeMargin: Math.round(timeMargin),
        operations: [{
          operationId: operation.id,
          sequenceNumber: operation.sequenceNumber,
          machine: operation.machine,
          operationType: operation.operationType,
          estimatedTime: operation.estimatedTime,
          status: 'in_progress',
          startDate: startDate.toISOString()
        }]
      });
    } else {
      // Обновляем существующий прогресс
      progress.startDate = startDate;
      progress.estimatedCompletionDate = estimatedCompletionDate;
      progress.willMeetDeadline = willMeetDeadline;
      progress.timeMargin = Math.round(timeMargin);
      
      // Обновляем операции в JSON
      const operations = progress.operations || [];
      const operationIndex = operations.findIndex(op => op.operationId === operation.id);
      
      if (operationIndex >= 0) {
        operations[operationIndex] = {
          ...operations[operationIndex],
          status: 'in_progress',
          startDate: startDate.toISOString(),
          machine: operation.machine
        };
      } else {
        operations.push({
          operationId: operation.id,
          sequenceNumber: operation.sequenceNumber,
          machine: operation.machine,
          operationType: operation.operationType,
          estimatedTime: operation.estimatedTime,
          status: 'in_progress',
          startDate: startDate.toISOString()
        });
      }
      
      progress.operations = operations;
    }

    await this.operationProgressRepository.save(progress);
  }

  /**
   * Обновление прогресса операции при завершении
   */
  private async updateOperationProgressOnCompletion(operation: Operation, completionDate: Date): Promise<void> {
    const progress = await this.operationProgressRepository.findOne({
      where: { orderId: operation.order.id }
    });

    if (progress) {
      const operations = progress.operations || [];
      const operationIndex = operations.findIndex(op => op.operationId === operation.id);
      
      if (operationIndex >= 0) {
        operations[operationIndex] = {
          ...operations[operationIndex],
          status: 'completed',
          completedDate: completionDate.toISOString(),
          actualTime: operation.actualTime
        };
        
        progress.operations = operations;
        await this.operationProgressRepository.save(progress);
      }
    }
  }

  /**
   * Добавление в календарь (заглушка для интеграции)
   */
  private async addToCalendar(operation: Operation, machineName: string, startDate: Date): Promise<void> {
    // Здесь будет интеграция с календарем
    // Google Calendar API, Outlook API или внутренний календарь
    const endDate = new Date(startDate.getTime() + operation.estimatedTime * 60000);
    
    const calendarEvent = {
      title: `${operation.order.drawingNumber} - Операция ${operation.sequenceNumber}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      machine: machineName,
      priority: operation.order.priority,
      description: `Тип операции: ${operation.operationType}\nВремя: ${operation.estimatedTime} мин\nКоличество: ${operation.order.quantity} шт.`
    };

    console.log('Calendar Event:', calendarEvent);
    
    // TODO: Реализовать интеграцию с календарем
    // await this.calendarService.addEvent(calendarEvent);
  }

  /**
   * Получение активных операций
   */
  async getActiveOperations(): Promise<Operation[]> {
    return this.operationRepository.find({
      where: { status: 'in_progress' },
      relations: ['order'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Получение операций по станку
   */
  async getOperationsByMachine(machineName: string): Promise<Operation[]> {
    return this.operationRepository.find({
      where: { machine: machineName },
      relations: ['order'],
      order: { createdAt: 'DESC' }
    });
  }
}