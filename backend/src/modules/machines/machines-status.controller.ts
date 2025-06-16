/**
 * @file: machines-status.controller.ts
 * @description: Контроллер для получения актуального статуса станков
 * @dependencies: machines.service, operations.service
 * @created: 2025-06-12
 */
import {
  Controller,
  Get,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';

interface MachineWithStatus {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  isOccupied: boolean;
  currentOperation?: any;
  currentOperationDetails?: any;
  lastFreedAt?: Date;
  status: 'working' | 'setup' | 'idle' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

@ApiTags('machines-status')
@Controller('machines/status')
export class MachinesStatusController {
  private readonly logger = new Logger(MachinesStatusController.name);

  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  @Get('all')
  @ApiOperation({ summary: 'Получить актуальный статус всех станков с операциями' })
  async getAllMachinesWithStatus(@Query('includeInactive') includeInactive: boolean = false): Promise<MachineWithStatus[]> {
    try {
      this.logger.log('Получение актуального статуса всех станков');
      
      // Получаем все станки
      const machines = await this.machineRepository.find({
        where: includeInactive ? {} : { isActive: true }
      });

      // Получаем активные операции с деталями заказов
      const activeOperations = await this.operationRepository.find({
        where: [
          { status: 'IN_PROGRESS' },
          { status: 'ASSIGNED' }
        ],
        relations: ['order']
      });

      // Создаем карту операций по станкам
      const operationsByMachine = new Map();
      activeOperations.forEach(operation => {
        if (operation.assignedMachine) {
          operationsByMachine.set(operation.assignedMachine, operation);
        }
        // Используем assignedMachine из entity Operation
      });

      // Собираем результат
      const result: MachineWithStatus[] = machines.map(machine => {
        const assignedOperation = operationsByMachine.get(machine.id);
        
        let status: 'working' | 'setup' | 'idle' | 'maintenance' = 'idle';
        let isAvailable = true;
        
        if (assignedOperation) {
          isAvailable = false;
          status = assignedOperation.status === 'IN_PROGRESS' ? 'working' : 'setup';
        } else {
          isAvailable = true;
          status = 'idle';
        }

        // Обновляем статус в БД если он изменился
        if (machine.isOccupied !== !isAvailable) {
          this.machineRepository.update(machine.id, {
            isOccupied: !isAvailable,
            currentOperation: assignedOperation?.id || null,
            updatedAt: new Date()
          });
        }

        const machineWithStatus: MachineWithStatus = {
          id: machine.id.toString(),
          machineName: machine.code, // Используем code как имя станка
          machineType: machine.type,
          isAvailable,
          isOccupied: !isAvailable,
          currentOperation: assignedOperation?.id?.toString(),
          currentOperationDetails: assignedOperation ? {
            id: assignedOperation.id,
            operationNumber: assignedOperation.operationNumber,
            operationType: assignedOperation.operationType,
            estimatedTime: assignedOperation.estimatedTime,
            orderId: assignedOperation.orderId,
            orderDrawingNumber: assignedOperation.order?.drawingNumber || 'Неизвестно',
            status: assignedOperation.status
          } : null,
          lastFreedAt: machine.assignedAt ? new Date(machine.assignedAt) : undefined,
          status,
          createdAt: machine.createdAt.toISOString(),
          updatedAt: machine.updatedAt.toISOString(),
        };

        return machineWithStatus;
      });

      this.logger.log(`Получено ${result.length} станков, ${result.filter(m => !m.isAvailable).length} заняты`);
      return result;
      
    } catch (error) {
      this.logger.error('Ошибка при получении статуса станков:', error);
      throw error;
    }
  }

  @Get('free')
  @ApiOperation({ summary: 'Получить только свободные станки' })
  async getFreeMachines(): Promise<MachineWithStatus[]> {
    const allMachines = await this.getAllMachinesWithStatus();
    return allMachines.filter(machine => machine.isAvailable);
  }

  @Get('busy')
  @ApiOperation({ summary: 'Получить только занятые станки' })
  async getBusyMachines(): Promise<MachineWithStatus[]> {
    const allMachines = await this.getAllMachinesWithStatus();
    return allMachines.filter(machine => !machine.isAvailable);
  }
}
