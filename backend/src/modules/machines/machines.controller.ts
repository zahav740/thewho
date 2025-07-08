/**
 * @file: machines.controller.ts
 * @description: Контроллер для управления станками (ИСПРАВЛЕН - реальные данные операций)
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Исправлено получение реальных данных операций
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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Machine } from '../../database/entities/machine.entity';

// Интерфейсы для расширенной функциональности
interface MachineAvailability {
  id: string;
  machineName: string;
  machineType: string;
  isAvailable: boolean;
  currentOperationId?: string;
  lastFreedAt?: Date;
  currentOperationDetails?: {
    id: number;
    operationNumber: number;
    operationType: string;
    estimatedTime: number;
    orderId: number;
    orderDrawingNumber: string;
    orderQuantity: number;
    producedQuantity: number;
    isCompleted?: boolean;
  };
  shiftProgress?: {
    totalProduced: number;
    remainingQuantity: number;
    completionPercentage: number;
    lastUpdateDate: Date;
  };
  createdAt: string;
  updatedAt: string;
}

interface OperationCompletionResult {
  isCompleted: boolean;
  totalProduced: number;
  targetQuantity: number;
  remainingQuantity: number;
  completionPercentage: number;
  canComplete: boolean;
}

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  private readonly logger = new Logger(MachinesController.name);

  constructor(
    private readonly machinesService: MachinesService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить реальные данные операции по ID с данными заказа
   */
  private async getOperationDetails(operationId: number | string) {
    try {
      // Если operationId - строка типа "Операция 10 - C6HP0021A", извлекаем информацию
      if (typeof operationId === 'string' && operationId.includes('Операция')) {
        this.logger.warn(`Получена строка вместо ID операции: ${operationId}`);
        
        // Извлекаем номер операции и номер чертежа
        const match = operationId.match(/Операция (\d+) - (.+)/);
        if (match) {
          const operationNumber = parseInt(match[1]);
          const drawingNumber = match[2];
          
          // Ищем операцию по номеру и чертежу
          const result = await this.dataSource.query(`
            SELECT 
              op.id,
              op."operationNumber",
              op.operationtype as "operationType",
              op."estimatedTime",
              op."orderId",
              op."actualQuantity",
              ord.drawing_number as "orderDrawingNumber",
              ord.quantity as "orderQuantity"
            FROM operations op
            LEFT JOIN orders ord ON op."orderId" = ord.id
            WHERE op."operationNumber" = $1 AND ord.drawing_number = $2
          `, [operationNumber, drawingNumber]);
          
          return result[0] || null;
        }
        
        return null;
      }
      
      // Обычный поиск по числовому ID
      const result = await this.dataSource.query(`
        SELECT 
          op.id,
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op."orderId",
          op."actualQuantity",
          ord.drawing_number as "orderDrawingNumber",
          ord.quantity as "orderQuantity"
        FROM operations op
        LEFT JOIN orders ord ON op."orderId" = ord.id
        WHERE op.id = $1
      `, [operationId]);
      
      return result[0] || null;
    } catch (error) {
      this.logger.error(`Ошибка при получении данных операции ${operationId}:`, error);
      return null;
    }
  }

  /**
   * Получить прогресс операции из данных смен
   */
  private async getShiftProgress(operationId: number, machineId: number) {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          COALESCE(SUM(COALESCE("dayShiftQuantity", 0) + COALESCE("nightShiftQuantity", 0)), 0) as "totalProduced",
          MAX(date) as "lastUpdateDate",
          COUNT(*) as "shiftRecordsCount"
        FROM shift_records 
        WHERE "operationId" = $1 AND "machineId" = $2 AND archived = false
      `, [operationId, machineId]);
      
      return result[0] || { totalProduced: 0, lastUpdateDate: null, shiftRecordsCount: 0 };
    } catch (error) {
      this.logger.error(`Ошибка при получении прогресса смен для операции ${operationId}:`, error);
      return { totalProduced: 0, lastUpdateDate: null, shiftRecordsCount: 0 };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все станки с доступностью' })
  async findAll(): Promise<MachineAvailability[]> {
    try {
      this.logger.log('Получение всех станков с реальными данными операций');
      const machines = await this.machinesService.findAll();
      
      // Преобразуем данные из таблицы machines в формат MachineAvailability
      const result = await Promise.all(machines.map(async (machine) => {
        let currentOperationDetails = null;
        
        // Если у станка есть текущая операция, получаем реальные данные
        if (machine.currentOperation) {
          this.logger.log(`Получение деталей операции ${machine.currentOperation} для станка ${machine.code}`);
          currentOperationDetails = await this.getOperationDetails(machine.currentOperation);
          
          if (currentOperationDetails) {
            this.logger.log(`✅ Найдена операция ${currentOperationDetails.operationNumber} (${currentOperationDetails.operationType}, ${currentOperationDetails.estimatedTime}мин)`);
          } else {
            this.logger.warn(`❌ Операция ${machine.currentOperation} не найдена в БД`);
          }
        }
        
        return {
          id: machine.id.toString(),
          machineName: machine.code, // используем code как имя станка
          machineType: machine.type,
          isAvailable: !machine.isOccupied, // инвертируем логику
          currentOperationId: machine.currentOperation?.toString(),
          lastFreedAt: machine.assignedAt,
          currentOperationDetails,
          createdAt: machine.createdAt.toISOString(),
          updatedAt: machine.updatedAt.toISOString(),
        };
      }));
      
      this.logger.log(`Возвращено ${result.length} станков с реальными данными операций`);
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
        currentOperationDetails: null, // Доступные станки не имеют текущих операций
        createdAt: machine.createdAt.toISOString(),
        updatedAt: machine.updatedAt.toISOString(),
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
      
      // Получаем реальные данные операции если есть
      let currentOperationDetails = null;
      if (machine.currentOperation) {
        currentOperationDetails = await this.getOperationDetails(machine.currentOperation);
      }
      
      return {
        id: machine.id.toString(),
        machineName: machine.code,
        machineType: machine.type,
        isAvailable: !machine.isOccupied,
        currentOperationId: machine.currentOperation?.toString(),
        lastFreedAt: machine.assignedAt,
        currentOperationDetails,
        createdAt: machine.createdAt.toISOString(),
        updatedAt: machine.updatedAt.toISOString(),
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
      this.logger.log(`Начало обновления доступности станка:`);
      this.logger.log(`  - machineName: ${machineName}`);
      this.logger.log(`  - isAvailable: ${body.isAvailable}`);
      
      const machines = await this.machinesService.findAll();
      this.logger.log(`Получено ${machines.length} станков из БД`);
      
      const machine = machines.find(m => m.code === machineName);
      if (!machine) {
        this.logger.error(`Станок с именем "${machineName}" не найден`);
        this.logger.log('Доступные станки:', machines.map(m => m.code));
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      this.logger.log(`Найден станок: ${machine.code} (ID: ${machine.id})`);
      
      // Если станок становится доступным, очищаем текущую операцию
      const updateData: any = {
        isOccupied: !body.isAvailable
      };
      
      if (body.isAvailable) {
        updateData.currentOperation = null;
        updateData.assignedAt = null;
        this.logger.log('Очищаем текущую операцию (станок освобождается)');
      } else {
        updateData.assignedAt = new Date();
        this.logger.log('Отмечаем станок как занятый');
      }
      
      this.logger.log('Данные для обновления:', updateData);
      
      // Обновляем статус занятости
      const updatedMachine = await this.machinesService.update(machine.id, updateData);
      this.logger.log('Станок успешно обновлён');
      
      // Получаем реальные данные операции если есть
      let currentOperationDetails = null;
      if (updatedMachine.currentOperation) {
        currentOperationDetails = await this.getOperationDetails(updatedMachine.currentOperation);
      }
      
      const result = {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: !updatedMachine.isOccupied,
        currentOperationId: updatedMachine.currentOperation?.toString(),
        lastFreedAt: updatedMachine.assignedAt,
        currentOperationDetails,
        createdAt: updatedMachine.createdAt.toISOString(),
        updatedAt: updatedMachine.updatedAt.toISOString(),
      };
      
      this.logger.log(`Успешно обновлена доступность станка ${machineName}`);
      return result;
    } catch (error) {
      this.logger.error(`Ошибка при обновлении доступности станка ${machineName}:`, error);
      throw error;
    }
  }

  @Delete(':machineName/assign-operation')
  @ApiOperation({ summary: 'Отменить операцию со станка' })
  async unassignOperation(
    @Param('machineName') machineName: string,
  ): Promise<MachineAvailability> {
    try {
      this.logger.log(`🗑️ Начало отмены операции со станка: ${machineName}`);
      
      // 1. Получаем список всех станков
      const machines = await this.machinesService.findAll();
      this.logger.log(`📊 Получено ${machines.length} станков из базы`);
      
      // 2. Находим нужный станок
      const machine = machines.find(m => m.code === machineName);
      if (!machine) {
        this.logger.error(`❌ Станок с именем "${machineName}" не найден`);
        this.logger.log('📝 Доступные станки:', machines.map(m => m.code));
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      this.logger.log(`✅ Найден станок: ID=${machine.id}, код=${machine.code}, занят=${machine.isOccupied}`);
      
      // 3. Сохраняем ID текущей операции
      const currentOperationId = machine.currentOperation;
      this.logger.log(`🔧 Текущая операция: ${currentOperationId || 'нет'}`);
      
      // 4. Освобождаем станок
      this.logger.log('🔄 Обновляем статус станка...');
      
      const updateData = {
        isOccupied: false,
        currentOperation: null,
        assignedAt: new Date(), // Время освобождения
      };
      
      this.logger.log('📋 Данные для обновления:', updateData);
      
      const updatedMachine = await this.machinesService.update(machine.id, updateData);
      this.logger.log('✅ Станок успешно обновлён');
      
      // 5. Обновляем статус операции (если была)
      if (currentOperationId) {
        try {
          this.logger.log(`🔄 Обновляем статус операции ${currentOperationId}...`);
          
          const operationUpdateResult = await this.dataSource.query(`
            UPDATE operations 
            SET status = 'PENDING', "assignedMachine" = NULL, "assignedAt" = NULL
            WHERE id = $1
            RETURNING id, status
          `, [currentOperationId]);
          
          this.logger.log(`✅ Операция ${currentOperationId} возвращена в статус PENDING:`, operationUpdateResult);
        } catch (dbError) {
          this.logger.error(`❌ Ошибка при обновлении статуса операции ${currentOperationId}:`, dbError);
          // Не прерываем выполнение - станок уже освобождён
        }
      } else {
        this.logger.log('📝 У станка не было назначенной операции');
      }
      
      // 6. Формируем результат
      const result = {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: true, // Станок теперь свободен
        currentOperationId: undefined,
        lastFreedAt: updatedMachine.assignedAt,
        currentOperationDetails: null,
        createdAt: updatedMachine.createdAt.toISOString(),
        updatedAt: updatedMachine.updatedAt.toISOString(),
      };
      
      this.logger.log(`🎉 Отмена операции со станка ${machineName} завершена успешно`);
      return result;
      
    } catch (error) {
      this.logger.error(`🚫 Ошибка при отмене операции со станка ${machineName}:`);
      this.logger.error(`Ошибка: ${error.message}`);
      this.logger.error(`Стек: ${error.stack}`);
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
      
      const operationId = parseInt(body.operationId);
      
      // Проверяем, что операция существует
      const operationDetails = await this.getOperationDetails(operationId);
      if (!operationDetails) {
        throw new BadRequestException(`Операция с ID ${operationId} не найдена`);
      }
      
      // Назначаем операцию и помечаем станок как занятый
      const updatedMachine = await this.machinesService.update(machine.id, {
        isOccupied: true,
        currentOperation: operationId,
        assignedAt: new Date(),
      });
      
      // Также обновляем статус операции в таблице operations
      try {
        await this.dataSource.query(`
          UPDATE operations 
          SET status = 'IN_PROGRESS', "assignedMachine" = $1, "assignedAt" = NOW()
          WHERE id = $2
        `, [machine.id, operationId]);
        
        this.logger.log(`✅ Операция ${operationId} назначена на станок ${machineName} и отмечена как IN_PROGRESS`);
      } catch (dbError) {
        this.logger.error('Ошибка при обновлении статуса операции:', dbError);
      }
      
      return {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: false,
        currentOperationId: updatedMachine.currentOperation?.toString(),
        lastFreedAt: updatedMachine.assignedAt,
        currentOperationDetails: operationDetails,
        createdAt: updatedMachine.createdAt.toISOString(),
        updatedAt: updatedMachine.updatedAt.toISOString(),
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
