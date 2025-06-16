/**
 * @file: machine-assignment.controller.ts
 * @description: Контроллер для назначения операций на станки
 * @dependencies: machines.service, operations.service
 * @created: 2025-06-12
 */
import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';

interface AssignOperationDto {
  operationId: number;
  machineName?: string;
  machineId?: number;
}

interface AssignmentResult {
  success: boolean;
  message: string;
  machine: {
    id: number;
    code: string;
    type: string;
    isOccupied: boolean;
    currentOperation: number;
  };
  operation: {
    id: number;
    operationNumber: number;
    operationType: string;
    orderDrawingNumber: string;
    status: string;
    assignedMachine: number;
  };
}

@ApiTags('machine-assignment')
@Controller('machines')
export class MachineAssignmentController {
  private readonly logger = new Logger(MachineAssignmentController.name);

  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Post(':machineIdentifier/assign-operation')
  @ApiOperation({ summary: 'Назначить операцию на станок' })
  async assignOperation(
    @Param('machineIdentifier') machineIdentifier: string,
    @Body() dto: AssignOperationDto
  ): Promise<AssignmentResult> {
    try {
      this.logger.log(`Назначение операции ${dto.operationId} на станок ${machineIdentifier}`);

      // Находим станок по ID или названию
      const machine = await this.findMachine(machineIdentifier);
      if (!machine) {
        throw new BadRequestException(`Станок не найден: ${machineIdentifier}`);
      }

      // Проверяем, что станок свободен
      if (machine.isOccupied || machine.currentOperation) {
        throw new BadRequestException(`Станок ${machine.code} уже занят операцией ${machine.currentOperation}`);
      }

      // Находим операцию
      const operation = await this.operationRepository.findOne({
        where: { id: dto.operationId },
        relations: ['order']
      });

      if (!operation) {
        throw new BadRequestException(`Операция не найдена: ${dto.operationId}`);
      }

      // Проверяем, что операция не назначена на другой станок
      if (operation.assignedMachine && operation.assignedMachine !== machine.id) {
        throw new BadRequestException(`Операция уже назначена на станок ${operation.assignedMachine}`);
      }

      // Проверяем совместимость операции и станка
      if (!this.isOperationCompatibleWithMachine(operation, machine)) {
        throw new BadRequestException(`Операция ${operation.operationType} несовместима со станком ${machine.type}`);
      }

      // Назначаем операцию на станок
      await this.performAssignment(machine, operation);

      // Получаем обновленные данные
      const updatedMachine = await this.machineRepository.findOne({ where: { id: machine.id } });
      const updatedOperation = await this.operationRepository.findOne({
        where: { id: operation.id },
        relations: ['order']
      });

      const result: AssignmentResult = {
        success: true,
        message: `Операция ${operation.operationNumber} успешно назначена на станок ${machine.code}`,
        machine: {
          id: updatedMachine.id,
          code: updatedMachine.code,
          type: updatedMachine.type,
          isOccupied: updatedMachine.isOccupied,
          currentOperation: updatedMachine.currentOperation,
        },
        operation: {
          id: updatedOperation.id,
          operationNumber: updatedOperation.operationNumber,
          operationType: updatedOperation.operationType,
          orderDrawingNumber: updatedOperation.order?.drawingNumber || 'Неизвестно',
          status: updatedOperation.status,
          assignedMachine: updatedOperation.assignedMachine,
        }
      };

      this.logger.log(`✅ Операция назначена: ${machine.code} -> Операция ${operation.operationNumber}`);
      return result;

    } catch (error) {
      this.logger.error(`Ошибка при назначении операции: ${error.message}`);
      throw error;
    }
  }

  @Delete(':machineIdentifier/assign-operation')
  @ApiOperation({ summary: 'Отменить назначение операции на станок' })
  async unassignOperation(@Param('machineIdentifier') machineIdentifier: string): Promise<any> {
    try {
      this.logger.log(`Отмена назначения операции на станок ${machineIdentifier}`);

      // Находим станок
      const machine = await this.findMachine(machineIdentifier);
      if (!machine) {
        throw new BadRequestException(`Станок не найден: ${machineIdentifier}`);
      }

      // Проверяем, что на станке есть назначенная операция
      if (!machine.currentOperation) {
        throw new BadRequestException(`На станке ${machine.code} нет назначенной операции`);
      }

      // Находим операцию
      const operation = await this.operationRepository.findOne({
        where: { id: machine.currentOperation }
      });

      if (!operation) {
        this.logger.warn(`Операция ${machine.currentOperation} не найдена, очищаем станок`);
      }

      // Освобождаем станок
      await this.machineRepository.update(machine.id, {
        isOccupied: false,
        currentOperation: null,
        assignedAt: null,
        updatedAt: new Date()
      });

      // Очищаем назначение операции
      if (operation) {
        await this.operationRepository.update(operation.id, {
          assignedMachine: null,
          assignedAt: null,
          status: 'PENDING',
          updatedAt: new Date()
        });
      }

      this.logger.log(`✅ Назначение отменено: станок ${machine.code} освобожден`);

      return {
        success: true,
        message: `Назначение операции отменено, станок ${machine.code} освобожден`,
        machine: {
          id: machine.id,
          code: machine.code,
          isOccupied: false,
          currentOperation: null,
        }
      };

    } catch (error) {
      this.logger.error(`Ошибка при отмене назначения: ${error.message}`);
      throw error;
    }
  }

  @Put(':machineIdentifier/availability')
  @ApiOperation({ summary: 'Изменить доступность станка' })
  async updateAvailability(
    @Param('machineIdentifier') machineIdentifier: string,
    @Body() body: { isAvailable: boolean }
  ): Promise<any> {
    try {
      this.logger.log(`Изменение доступности станка ${machineIdentifier} на ${body.isAvailable}`);

      const machine = await this.findMachine(machineIdentifier);
      if (!machine) {
        throw new BadRequestException(`Станок не найден: ${machineIdentifier}`);
      }

      // Если делаем станок недоступным
      if (!body.isAvailable) {
        await this.machineRepository.update(machine.id, {
          isOccupied: true,
          updatedAt: new Date()
        });
      } else {
        // Если освобождаем станок, убираем назначенную операцию
        if (machine.currentOperation) {
          const operation = await this.operationRepository.findOne({
            where: { id: machine.currentOperation }
          });

          if (operation) {
            await this.operationRepository.update(operation.id, {
              assignedMachine: null,
              assignedAt: null,
              status: 'PENDING',
              updatedAt: new Date()
            });
          }
        }

        await this.machineRepository.update(machine.id, {
          isOccupied: false,
          currentOperation: null,
          assignedAt: null,
          updatedAt: new Date()
        });
      }

      // Получаем обновленный станок
      const updatedMachine = await this.machineRepository.findOne({ where: { id: machine.id } });

      this.logger.log(`✅ Доступность станка ${machine.code} изменена на ${body.isAvailable ? 'доступен' : 'занят'}`);

      return {
        success: true,
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: !updatedMachine.isOccupied,
        isOccupied: updatedMachine.isOccupied,
        currentOperationId: updatedMachine.currentOperation?.toString(),
        lastFreedAt: updatedMachine.assignedAt,
        createdAt: updatedMachine.createdAt.toISOString(),
        updatedAt: updatedMachine.updatedAt.toISOString(),
      };

    } catch (error) {
      this.logger.error(`Ошибка при изменении доступности: ${error.message}`);
      throw error;
    }
  }

  // Вспомогательные методы
  private async findMachine(identifier: string): Promise<Machine | null> {
    // Сначала пытаемся найти по ID
    if (/^\d+$/.test(identifier)) {
      const machine = await this.machineRepository.findOne({
        where: { id: parseInt(identifier) }
      });
      if (machine) return machine;
    }

    // Затем по коду/названию
    return await this.machineRepository.findOne({
      where: { code: identifier }
    });
  }

  private async performAssignment(machine: Machine, operation: Operation): Promise<void> {
    const now = new Date();

    // Обновляем станок
    await this.machineRepository.update(machine.id, {
      isOccupied: true,
      currentOperation: operation.id,
      assignedAt: now,
      updatedAt: now
    });

    // Обновляем операцию
    await this.operationRepository.update(operation.id, {
      assignedMachine: machine.id,
      assignedAt: now,
      status: 'ASSIGNED',
      updatedAt: now
    });
  }

  private isOperationCompatibleWithMachine(operation: Operation, machine: Machine): boolean {
    const operationType = operation.operationType?.toUpperCase();
    const machineType = machine.type?.toUpperCase();

    switch (operationType) {
      case 'TURNING':
        return machineType === 'TURNING';
      case 'MILLING':
        if (operation.machineAxes === 4) {
          return machineType === 'MILLING' && machine.axes >= 4;
        } else {
          return machineType === 'MILLING';
        }
      default:
        return false;
    }
  }
}
