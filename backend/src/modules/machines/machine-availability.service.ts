/**
 * @file: machine-availability.service.ts
 * @description: Сервис для управления доступностью станков
 * @dependencies: typeorm, entities
 * @created: 2025-05-28
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MachineAvailability } from '../../database/entities/machine-availability.entity';

@Injectable()
export class MachineAvailabilityService {
  constructor(
    @InjectRepository(MachineAvailability)
    private readonly machineAvailabilityRepository: Repository<MachineAvailability>,
  ) {}

  async findAll(): Promise<MachineAvailability[]> {
    try {
      console.log('MachineAvailabilityService.findAll: Получение всех станков');
      const machines = await this.machineAvailabilityRepository.find({
        order: {
          machineName: 'ASC',
        },
      });
      console.log(`MachineAvailabilityService.findAll: Найдено ${machines.length} станков`);
      return machines;
    } catch (error) {
      console.error('MachineAvailabilityService.findAll Ошибка:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<MachineAvailability> {
    const machine = await this.machineAvailabilityRepository.findOne({
      where: { id },
      relations: ['currentOperation'],
    });

    if (!machine) {
      throw new NotFoundException(`Станок с ID ${id} не найден`);
    }

    return machine;
  }

  async findByName(machineName: string): Promise<MachineAvailability> {
    const machine = await this.machineAvailabilityRepository.findOne({
      where: { machineName },
      relations: ['currentOperation'],
    });

    if (!machine) {
      throw new NotFoundException(`Станок ${machineName} не найден`);
    }

    return machine;
  }

  async updateAvailability(machineName: string, isAvailable: boolean): Promise<MachineAvailability> {
    const machine = await this.findByName(machineName);
    
    machine.isAvailable = isAvailable;
    if (isAvailable) {
      machine.lastFreedAt = new Date();
      machine.currentOperationId = null;
    }

    return this.machineAvailabilityRepository.save(machine);
  }

  async assignOperation(machineName: string, operationId: string): Promise<MachineAvailability> {
    const machine = await this.findByName(machineName);
    
    machine.isAvailable = false;
    machine.currentOperationId = operationId;

    return this.machineAvailabilityRepository.save(machine);
  }

  async getAvailableMachines(): Promise<MachineAvailability[]> {
    return this.machineAvailabilityRepository.find({
      where: { isAvailable: true },
      order: { machineName: 'ASC' },
    });
  }

  async getCompatibleMachines(operationType: string): Promise<MachineAvailability[]> {
    const allMachines = await this.findAll();
    
    return allMachines.filter(machine => 
      machine.isAvailable && machine.canPerformOperation(operationType)
    );
  }
}