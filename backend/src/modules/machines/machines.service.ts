/**
 * @file: machines.service.ts
 * @description: Сервис для работы со станками
 * @dependencies: typeorm, machine.entity
 * @created: 2025-01-28
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine, MachineType } from '../../database/entities/machine.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
  ) {}

  async findAll(): Promise<Machine[]> {
    try {
      console.log('MachinesService.findAll: Попытка получить все станки');
      const machines = await this.machineRepository.find({
        order: {
          code: 'ASC',
        },
      });
      console.log(`MachinesService.findAll: Найдено ${machines.length} станков`);
      return machines;
    } catch (error) {
      console.error('MachinesService.findAll Ошибка:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Machine> {
    const machine = await this.machineRepository.findOne({
      where: { id },
      // relations: ['operations'], // Убрано - связь отключена в entity
    });

    if (!machine) {
      throw new NotFoundException(`Станок с ID ${id} не найден`);
    }

    return machine;
  }

  async create(createMachineDto: CreateMachineDto): Promise<Machine> {
    const machine = this.machineRepository.create(createMachineDto);
    return this.machineRepository.save(machine);
  }

  async update(id: number, updateMachineDto: UpdateMachineDto): Promise<Machine> {
    try {
      console.log(`MachinesService.update: Обновление станка ID ${id}`);
      console.log('updateMachineDto:', updateMachineDto);
      
      const machine = await this.findOne(id);
      console.log(`Найден станок: ${machine.code}`);
      
      // Поддерживаем новые поля
      if (updateMachineDto.hasOwnProperty('isOccupied')) {
        machine.isOccupied = updateMachineDto.isOccupied;
        console.log(`Обновляем isOccupied: ${updateMachineDto.isOccupied}`);
      }
      
      if (updateMachineDto.hasOwnProperty('currentOperation')) {
        machine.currentOperation = updateMachineDto.currentOperation;
        console.log(`Обновляем currentOperation: ${updateMachineDto.currentOperation}`);
      }
      
      if (updateMachineDto.hasOwnProperty('assignedAt')) {
        machine.assignedAt = updateMachineDto.assignedAt;
        console.log(`Обновляем assignedAt: ${updateMachineDto.assignedAt}`);
      }
      
      // Остальные поля
      Object.assign(machine, updateMachineDto);
      
      console.log('Сохраняем станок в БД...');
      const result = await this.machineRepository.save(machine);
      console.log('Станок успешно сохранён');
      
      return result;
    } catch (error) {
      console.error(`MachinesService.update Ошибка при обновлении станка ${id}:`, error);
      throw error;
    }
  }

  async toggleOccupancy(id: number): Promise<Machine> {
    const machine = await this.findOne(id);
    machine.isOccupied = !machine.isOccupied;
    return this.machineRepository.save(machine);
  }

  async remove(id: number): Promise<void> {
    const machine = await this.findOne(id);
    await this.machineRepository.remove(machine);
  }

  async findByTypeAndAxes(type: MachineType, minAxes: number): Promise<Machine[]> {
    return this.machineRepository.find({
      where: {
        type,
        axes: minAxes,
        isActive: true,
      },
    });
  }
}
