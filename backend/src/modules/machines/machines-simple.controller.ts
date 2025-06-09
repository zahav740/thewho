/**
 * @file: machines-simple.controller.ts
 * @description: Упрощенный контроллер для управления станками (без TypeORM зависимостей)
 * @dependencies: простые сервисы
 * @created: 2025-05-28
 */
import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MachineAvailabilitySimpleService, MachineAvailabilityDto } from './machine-availability-simple.service';

@ApiTags('machines-simple')
@Controller('machines')
export class MachinesSimpleController {
  constructor(
    private readonly machineAvailabilityService: MachineAvailabilitySimpleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все станки с доступностью' })
  async findAll(): Promise<MachineAvailabilityDto[]> {
    try {
      console.log('MachinesSimpleController.findAll: Запрос всех станков');
      const result = await this.machineAvailabilityService.findAll();
      console.log('MachinesSimpleController.findAll: Успешно получено станков:', result.length);
      return result;
    } catch (error) {
      console.error('MachinesSimpleController.findAll: Ошибка:', error);
      throw error;
    }
  }

  @Get('available')
  @ApiOperation({ summary: 'Получить только доступные станки' })
  async findAvailable(): Promise<MachineAvailabilityDto[]> {
    try {
      return await this.machineAvailabilityService.getAvailableMachines();
    } catch (error) {
      console.error('MachinesSimpleController.findAvailable: Ошибка:', error);
      throw error;
    }
  }

  @Get(':machineName')
  @ApiOperation({ summary: 'Получить станок по имени' })
  async findByName(@Param('machineName') machineName: string): Promise<MachineAvailabilityDto> {
    try {
      return await this.machineAvailabilityService.findByName(machineName);
    } catch (error) {
      console.error('MachinesSimpleController.findByName: Ошибка:', error);
      throw error;
    }
  }

  @Put(':machineName/availability')
  @ApiOperation({ summary: 'Обновить доступность станка' })
  async updateAvailability(
    @Param('machineName') machineName: string,
    @Body() body: { isAvailable: boolean },
  ): Promise<MachineAvailabilityDto> {
    try {
      return await this.machineAvailabilityService.updateAvailability(
        machineName, 
        body.isAvailable
      );
    } catch (error) {
      console.error('MachinesSimpleController.updateAvailability: Ошибка:', error);
      throw error;
    }
  }

  @Get(':machineName/suggested-operations')
  @ApiOperation({ summary: 'Получить рекомендуемые операции для станка' })
  async getSuggestedOperations(
    @Param('machineName') machineName: string,
  ): Promise<any[]> {
    try {
      // Возвращаем пустой массив пока что
      return [];
    } catch (error) {
      console.error('MachinesSimpleController.getSuggestedOperations: Ошибка:', error);
      throw error;
    }
  }

  @Post(':machineName/assign-operation')
  @ApiOperation({ summary: 'Назначить операцию на станок' })
  async assignOperation(
    @Param('machineName') machineName: string,
    @Body() body: { operationId: string },
  ): Promise<MachineAvailabilityDto> {
    try {
      console.log('MachinesSimpleController.assignOperation: Назначение операции для станка:', machineName, 'операция:', body.operationId);
      return await this.machineAvailabilityService.assignOperation(machineName, body.operationId);
    } catch (error) {
      console.error('MachinesSimpleController.assignOperation: Ошибка:', error);
      throw error;
    }
  }

  @Delete(':machineName/assign-operation')
  @ApiOperation({ summary: 'Отменить назначение операции на станок' })
  async unassignOperation(
    @Param('machineName') machineName: string,
  ): Promise<MachineAvailabilityDto> {
    try {
      console.log('MachinesSimpleController.unassignOperation: Отмена операции для станка:', machineName);
      return await this.machineAvailabilityService.unassignOperation(machineName);
    } catch (error) {
      console.error('MachinesSimpleController.unassignOperation: Ошибка:', error);
      throw error;
    }
  }
}
