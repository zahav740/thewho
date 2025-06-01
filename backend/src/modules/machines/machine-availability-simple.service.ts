/**
 * @file: machine-availability-simple.service.ts
 * @description: Упрощенный сервис для управления доступностью станков (ИСПРАВЛЕНО для таблицы machines)
 * @dependencies: typeorm
 * @created: 2025-05-28
 * @fixed: 2025-05-28
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface MachineAvailabilityDto {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  lastFreedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MachineAvailabilitySimpleService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<MachineAvailabilityDto[]> {
    try {
      console.log('SimpleMachineService: Получение всех станков через SQL (ИСПРАВЛЕННАЯ ВЕРСИЯ)');
      
      const machines = await this.dataSource.query(`
        SELECT 
          id::text,
          code as "machineName",
          type as "machineType", 
          (NOT "isOccupied") as "isAvailable",
          null as "currentOperationId",
          "updatedAt" as "lastFreedAt",
          "createdAt" as "createdAt",
          "updatedAt" as "updatedAt"
        FROM machines 
        WHERE "isActive" = true
        ORDER BY code ASC
      `);
      
      console.log(`SimpleMachineService: Найдено ${machines.length} станков`);
      return machines;
    } catch (error) {
      console.error('SimpleMachineService.findAll Ошибка:', error);
      throw error;
    }
  }

  async findByName(machineName: string): Promise<MachineAvailabilityDto> {
    try {
      const machines = await this.dataSource.query(`
        SELECT 
          id::text,
          code as "machineName",
          type as "machineType",
          (NOT "isOccupied") as "isAvailable", 
          null as "currentOperationId",
          "updatedAt" as "lastFreedAt",
          "createdAt" as "createdAt",
          "updatedAt" as "updatedAt"
        FROM machines 
        WHERE code = $1 AND "isActive" = true
      `, [machineName]);

      if (machines.length === 0) {
        throw new NotFoundException(`Станок ${machineName} не найден`);
      }

      return machines[0];
    } catch (error) {
      console.error('SimpleMachineService.findByName Ошибка:', error);
      throw error;
    }
  }

  async updateAvailability(machineName: string, isAvailable: boolean): Promise<MachineAvailabilityDto> {
    try {
      await this.dataSource.query(`
        UPDATE machines 
        SET 
          "isOccupied" = $1,
          "updatedAt" = NOW()
        WHERE code = $2
      `, [!isAvailable, machineName]);

      return this.findByName(machineName);
    } catch (error) {
      console.error('SimpleMachineService.updateAvailability Ошибка:', error);
      throw error;
    }
  }

  async getAvailableMachines(): Promise<MachineAvailabilityDto[]> {
    try {
      const machines = await this.dataSource.query(`
        SELECT 
          id::text,
          code as "machineName",
          type as "machineType",
          (NOT "isOccupied") as "isAvailable",
          null as "currentOperationId", 
          "updatedAt" as "lastFreedAt",
          "createdAt" as "createdAt",
          "updatedAt" as "updatedAt"
        FROM machines 
        WHERE "isActive" = true AND "isOccupied" = false
        ORDER BY code ASC
      `);
      
      return machines;
    } catch (error) {
      console.error('SimpleMachineService.getAvailableMachines Ошибка:', error);
      throw error;
    }
  }
}
