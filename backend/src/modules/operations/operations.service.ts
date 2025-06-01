/**
 * @file: operations.service.ts
 * @description: Упрощенный сервис для работы с операциями (исправленный)
 * @dependencies: typeorm, entities
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation, OperationStatus } from '../../database/entities/operation.entity';
import { Machine } from '../../database/entities/machine.entity';
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { AssignMachineDto } from './dto/assign-machine.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
  ) {}

  async findAll(): Promise<Operation[]> {
    try {
      console.log('OperationsService.findAll: Попытка получить все операции');
      const operations = await this.operationRepository.find({
        relations: ['order'],
        order: {
          sequenceNumber: 'ASC',
        },
      });
      console.log(`OperationsService.findAll: Найдено ${operations.length} операций`);
      return operations;
    } catch (error) {
      console.error('OperationsService.findAll Ошибка:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Operation> {
    const operation = await this.operationRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!operation) {
      throw new NotFoundException(`Операция с ID ${id} не найдена`);
    }

    return operation;
  }

  async create(createOperationDto: CreateOperationDto): Promise<Operation> {
    const operation = this.operationRepository.create(createOperationDto);
    return this.operationRepository.save(operation);
  }

  async update(id: string, updateOperationDto: UpdateOperationDto): Promise<Operation> {
    const operation = await this.findOne(id);
    Object.assign(operation, updateOperationDto);
    return this.operationRepository.save(operation);
  }

  async remove(id: string): Promise<void> {
    const operation = await this.findOne(id);
    await this.operationRepository.remove(operation);
  }

  async findByStatus(status: string): Promise<Operation[]> {
    return this.operationRepository.find({
      where: { status },
      relations: ['order'],
      order: {
        sequenceNumber: 'ASC',
      },
    });
  }

  async assignMachine(id: string, assignMachineDto: AssignMachineDto): Promise<Operation> {
    const operation = await this.findOne(id);
    
    // Простое назначение машины как строки
    operation.machine = assignMachineDto.machineId.toString();
    
    return this.operationRepository.save(operation);
  }

  async startOperation(id: string): Promise<Operation> {
    const operation = await this.findOne(id);
    operation.status = 'in_progress';
    return this.operationRepository.save(operation);
  }

  async completeOperation(id: string): Promise<Operation> {
    const operation = await this.findOne(id);
    operation.status = 'completed';
    return this.operationRepository.save(operation);
  }

  async getOperationsByOrder(orderId: string): Promise<Operation[]> {
    // Преобразуем string в number для поиска в БД
    const numericId = parseInt(orderId);
    if (isNaN(numericId)) {
      return [];
    }
    
    return this.operationRepository.find({
      where: { order: { id: numericId } } as any,
      relations: ['order'],
      order: { sequenceNumber: 'ASC' },
    });
  }

  async getOperationsByMachine(machineId: string): Promise<Operation[]> {
    return this.operationRepository.find({
      where: { machine: machineId },
      relations: ['order'],
      order: { sequenceNumber: 'ASC' },
    });
  }
}