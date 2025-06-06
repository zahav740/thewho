/**
 * @file: machines.controller.ts
 * @description: Контроллер для управления станками и доступностью
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { MachineAvailabilityService } from './machine-availability.service';
// import { PlanningAlgorithmService } from './planning-algorithm.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from '../../database/entities/machine.entity';
import { MachineAvailability } from '../../database/entities/machine-availability.entity';
import { RecommendedOrderDto } from './dto/recommended-order.dto';

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  constructor(
    private readonly machinesService: MachinesService,
    private readonly machineAvailabilityService: MachineAvailabilityService,
    // private readonly planningAlgorithmService: PlanningAlgorithmService,
  ) {}

  // Управление станками (старые методы)
  @Get('legacy')
  @ApiOperation({ summary: 'Получить все станки (legacy)' })
  async findAllLegacy(): Promise<Machine[]> {
    try {
      return await this.machinesService.findAll();
    } catch (error) {
      console.error('Error in findAllLegacy:', error);
      throw error;
    }
  }

  // Новые методы для управления доступностью станков

  @Get()
  @ApiOperation({ summary: 'Получить все станки с доступностью' })
  async findAll(): Promise<MachineAvailability[]> {
    try {
      return await this.machineAvailabilityService.findAll();
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  @Get('available')
  @ApiOperation({ summary: 'Получить только доступные станки' })
  async findAvailable(): Promise<MachineAvailability[]> {
    return this.machineAvailabilityService.getAvailableMachines();
  }

  @Get(':machineName')
  @ApiOperation({ summary: 'Получить станок по имени' })
  async findByName(@Param('machineName') machineName: string): Promise<MachineAvailability> {
    return this.machineAvailabilityService.findByName(machineName);
  }

  @Put(':machineName/availability')
  @ApiOperation({ summary: 'Обновить доступность станка' })
  async updateAvailability(
    @Param('machineName') machineName: string,
    @Body() body: { isAvailable: boolean },
  ): Promise<MachineAvailability> {
    return this.machineAvailabilityService.updateAvailability(
      machineName, 
      body.isAvailable
    );
  }

  /*
  @Get(':machineName/suggested-operations')
  @ApiOperation({ summary: 'Получить рекомендуемые операции для станка' })
  async getSuggestedOperations(
    @Param('machineName') machineName: string,
  ): Promise<RecommendedOrderDto[]> {
    return this.planningAlgorithmService.planOperationsForMachine(machineName);
  }
  */

  @Post(':machineName/assign-operation')
  @ApiOperation({ summary: 'Назначить операцию на станок' })
  async assignOperation(
    @Param('machineName') machineName: string,
    @Body() body: { operationId: string },
  ): Promise<MachineAvailability> {
    return this.machineAvailabilityService.assignOperation(
      machineName, 
      body.operationId
    );
  }

  // Legacy методы
  @Get('legacy/:id')
  @ApiOperation({ summary: 'Получить станок по ID (legacy)' })
  async findOne(@Param('id') id: string): Promise<Machine> {
    return this.machinesService.findOne(+id);
  }

  @Post('legacy')
  @ApiOperation({ summary: 'Создать новый станок (legacy)' })
  async create(@Body() createMachineDto: CreateMachineDto): Promise<Machine> {
    return this.machinesService.create(createMachineDto);
  }

  @Put('legacy/:id')
  @ApiOperation({ summary: 'Обновить станок (legacy)' })
  async update(
    @Param('id') id: string,
    @Body() updateMachineDto: UpdateMachineDto,
  ): Promise<Machine> {
    return this.machinesService.update(+id, updateMachineDto);
  }

  @Put('legacy/:id/toggle')
  @ApiOperation({ summary: 'Переключить статус занятости станка (legacy)' })
  async toggleOccupancy(@Param('id') id: string): Promise<Machine> {
    return this.machinesService.toggleOccupancy(+id);
  }

  @Delete('legacy/:id')
  @ApiOperation({ summary: 'Удалить станок (legacy)' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.machinesService.remove(+id);
  }
}