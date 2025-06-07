/**
 * @file: machines.controller.ts
 * @description: Контроллер для управления станками (ИСПРАВЛЕННЫЙ)
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Исправлено для работы с существующей БД
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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from '../../database/entities/machine.entity';

// Интерфейс для совместимости с frontend
interface MachineAvailability {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  lastFreedAt?: Date;
}

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  private readonly logger = new Logger(MachinesController.name);

  constructor(
    private readonly machinesService: MachinesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все станки с доступностью' })
  async findAll(): Promise<MachineAvailability[]> {
    try {
      this.logger.log('Получение всех станков');
      const machines = await this.machinesService.findAll();
      
      // Преобразуем данные из таблицы machines в формат MachineAvailability
      const result = machines.map(machine => ({
        id: machine.id.toString(),
        machineName: machine.code, // используем code как имя станка
        machineType: machine.type,
        isAvailable: !machine.isOccupied, // инвертируем логику
        currentOperationId: machine.currentOperation?.toString(),
        lastFreedAt: machine.assignedAt,
      }));
      
      this.logger.log(`Возвращено ${result.length} станков`);
      return result;
    } catch (error) {
      this.logger.error('Ошибка при получении станков:', error);
      throw error;
    }
  }

  @Get('available')
  @ApiOperation({ summary: 'Получить только доступные станки' })
  async findAvailable(): Promise<MachineAvailability[]> {
    try {
      this.logger.log('Получение доступных станков');
      const machines = await this.machinesService.findAll();
      
      // Фильтруем только доступные станки
      const availableMachines = machines.filter(machine => 
        machine.isActive && !machine.isOccupied
      );
      
      const result = availableMachines.map(machine => ({
        id: machine.id.toString(),
        machineName: machine.code,
        machineType: machine.type,
        isAvailable: true,
        currentOperationId: machine.currentOperation?.toString(),
        lastFreedAt: machine.assignedAt,
      }));
      
      this.logger.log(`Возвращено ${result.length} доступных станков`);
      return result;
    } catch (error) {
      this.logger.error('Ошибка при получении доступных станков:', error);
      throw error;
    }
  }

  @Get(':machineName')
  @ApiOperation({ summary: 'Получить станок по имени' })
  async findByName(@Param('machineName') machineName: string): Promise<MachineAvailability> {
    try {
      this.logger.log(`Поиск станка по имени: ${machineName}`);
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine) {
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      return {
        id: machine.id.toString(),
        machineName: machine.code,
        machineType: machine.type,
        isAvailable: !machine.isOccupied,
        currentOperationId: machine.currentOperation?.toString(),
        lastFreedAt: machine.assignedAt,
      };
    } catch (error) {
      this.logger.error(`Ошибка при поиске станка ${machineName}:`, error);
      throw error;
    }
  }

  @Put(':machineName/availability')
  @ApiOperation({ summary: 'Обновить доступность станка' })
  async updateAvailability(
    @Param('machineName') machineName: string,
    @Body() body: { isAvailable: boolean },
  ): Promise<MachineAvailability> {
    try {
      this.logger.log(`Обновление доступности станка ${machineName}: ${body.isAvailable}`);
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine) {
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      // Обновляем статус занятости (инвертируем логику)
      const updatedMachine = await this.machinesService.update(machine.id, {
        isOccupied: !body.isAvailable
      });
      
      return {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: !updatedMachine.isOccupied,
        currentOperationId: updatedMachine.currentOperation?.toString(),
        lastFreedAt: updatedMachine.assignedAt,
      };
    } catch (error) {
      this.logger.error(`Ошибка при обновлении доступности станка ${machineName}:`, error);
      throw error;
    }
  }

  @Post(':machineName/assign-operation')
  @ApiOperation({ summary: 'Назначить операцию на станок' })
  async assignOperation(
    @Param('machineName') machineName: string,
    @Body() body: { operationId: string },
  ): Promise<MachineAvailability> {
    try {
      this.logger.log(`Назначение операции ${body.operationId} на станок ${machineName}`);
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine) {
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      // Назначаем операцию и помечаем станок как занятый
      const updatedMachine = await this.machinesService.update(machine.id, {
        isOccupied: true,
        currentOperation: parseInt(body.operationId),
        assignedAt: new Date(),
      });
      
      return {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: false,
        currentOperationId: updatedMachine.currentOperation?.toString(),
        lastFreedAt: updatedMachine.assignedAt,
      };
    } catch (error) {
      this.logger.error(`Ошибка при назначении операции на станок ${machineName}:`, error);
      throw error;
    }
  }

  // Legacy методы для обратной совместимости
  @Get('legacy')
  @ApiOperation({ summary: 'Получить все станки (legacy)' })
  async findAllLegacy(): Promise<Machine[]> {
    try {
      return await this.machinesService.findAll();
    } catch (error) {
      this.logger.error('Ошибка в findAllLegacy:', error);
      throw error;
    }
  }

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
