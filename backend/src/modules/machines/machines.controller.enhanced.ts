/**
 * @file: machines.controller.ts
 * @description: Расширенный контроллер для управления станками с функциями завершения операций
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-06-12 - Добавлены функции завершения операций и работа с данными смен
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
  private async getOperationDetails(operationId: number) {
    try {
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

  /**
   * Проверить завершение операции
   */
  @Get(':machineName/operation-completion')
  @ApiOperation({ summary: 'Проверить завершение операции на станке' })
  async checkOperationCompletion(
    @Param('machineName') machineName: string,
  ): Promise<OperationCompletionResult> {
    try {
      this.logger.log(`🔍 Проверка завершения операции на станке: ${machineName}`);
      
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine || !machine.currentOperation) {
        return {
          isCompleted: false,
          totalProduced: 0,
          targetQuantity: 0,
          remainingQuantity: 0,
          completionPercentage: 0,
          canComplete: false
        };
      }

      // Получаем данные операции
      const operationDetails = await this.getOperationDetails(machine.currentOperation);
      if (!operationDetails) {
        throw new BadRequestException('Операция не найдена');
      }

      // Получаем прогресс из смен
      const shiftProgress = await this.getShiftProgress(machine.currentOperation, machine.id);
      
      const totalProduced = shiftProgress.totalProduced || operationDetails.actualQuantity || 0;
      const targetQuantity = operationDetails.orderQuantity || 0;
      const remainingQuantity = Math.max(0, targetQuantity - totalProduced);
      const completionPercentage = targetQuantity > 0 ? Math.round((totalProduced / targetQuantity) * 100) : 0;
      const isCompleted = totalProduced >= targetQuantity && targetQuantity > 0;
      const canComplete = totalProduced > 0; // Можно завершить если есть хоть какой-то прогресс

      this.logger.log(`📊 Прогресс операции ${machine.currentOperation}: ${totalProduced}/${targetQuantity} (${completionPercentage}%)`);

      return {
        isCompleted,
        totalProduced,
        targetQuantity,
        remainingQuantity,
        completionPercentage,
        canComplete
      };
    } catch (error) {
      this.logger.error(`Ошибка при проверке завершения операции на станке ${machineName}:`, error);
      throw error;
    }
  }

  /**
   * Завершить операцию полностью (с сохранением в историю)
   */
  @Post(':machineName/complete-operation')
  @ApiOperation({ summary: 'Завершить операцию на станке полностью' })
  async completeOperation(
    @Param('machineName') machineName: string,
    @Body() body: { action: 'complete' | 'continue' | 'plan_new'; forceComplete?: boolean },
  ): Promise<MachineAvailability> {
    try {
      this.logger.log(`🏁 Завершение операции на станке ${machineName}, действие: ${body.action}`);
      
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine || !machine.currentOperation) {
        throw new BadRequestException('У станка нет активной операции');
      }

      const operationId = machine.currentOperation;
      
      // Получаем данные операции и прогресс
      const operationDetails = await this.getOperationDetails(operationId);
      const shiftProgress = await this.getShiftProgress(operationId, machine.id);
      
      if (!operationDetails) {
        throw new BadRequestException('Операция не найдена');
      }

      const totalProduced = shiftProgress.totalProduced || operationDetails.actualQuantity || 0;

      if (body.action === 'complete') {
        this.logger.log(`✅ Завершаем операцию ${operationId} полностью`);
        
        // 1. Обновляем операцию как завершенную
        await this.dataSource.query(`
          UPDATE operations 
          SET 
            status = 'COMPLETED',
            "completedAt" = NOW(),
            "actualQuantity" = $1,
            "assignedMachine" = NULL,
            "assignedAt" = NULL
          WHERE id = $2
        `, [totalProduced, operationId]);

        // 2. Архивируем все записи смен для этой операции
        await this.dataSource.query(`
          UPDATE shift_records 
          SET 
            archived = true,
            "archivedAt" = NOW()
          WHERE "operationId" = $1 AND "machineId" = $2 AND archived = false
        `, [operationId, machine.id]);

        // 3. Добавляем запись в историю операций (если таблица существует)
        try {
          await this.dataSource.query(`
            INSERT INTO operation_history 
            (operation_id, machine_id, drawing_number, quantity_completed, completed_at, operation_type, estimated_time, actual_time)
            VALUES ($1, $2, $3, $4, NOW(), $5, $6, 
              EXTRACT(EPOCH FROM (NOW() - $7)) / 60
            )
          `, [
            operationId,
            machine.id,
            operationDetails.orderDrawingNumber,
            totalProduced,
            operationDetails.operationType,
            operationDetails.estimatedTime,
            machine.assignedAt
          ]);
          
          this.logger.log(`📚 Операция сохранена в историю`);
        } catch (historyError) {
          this.logger.warn('Не удалось сохранить в историю операций:', historyError);
        }

        // 4. Освобождаем станок
        const updatedMachine = await this.machinesService.update(machine.id, {
          isOccupied: false,
          currentOperation: null,
          assignedAt: new Date(), // Время освобождения
        });

        this.logger.log(`🎉 Операция ${operationId} завершена, станок ${machineName} освобожден`);

        return {
          id: updatedMachine.id.toString(),
          machineName: updatedMachine.code,
          machineType: updatedMachine.type,
          isAvailable: true,
          currentOperationId: undefined,
          lastFreedAt: updatedMachine.assignedAt,
          currentOperationDetails: null,
          createdAt: updatedMachine.createdAt.toISOString(),
          updatedAt: updatedMachine.updatedAt.toISOString(),
        };

      } else if (body.action === 'continue') {
        this.logger.log(`🔄 Продолжаем работу над операцией ${operationId}`);
        // Ничего не делаем, просто возвращаем текущее состояние
        
      } else if (body.action === 'plan_new') {
        this.logger.log(`📋 Планируем новую операцию, сбрасываем текущий прогресс`);
        
        // Сбрасываем накопленный прогресс но не завершаем операцию
        await this.dataSource.query(`
          UPDATE shift_records 
          SET 
            "resetAt" = NOW(),
            archived = true,
            "archivedAt" = NOW()
          WHERE "operationId" = $1 AND "machineId" = $2 AND archived = false
        `, [operationId, machine.id]);

        // Возвращаем операцию в статус PENDING для переназначения
        await this.dataSource.query(`
          UPDATE operations 
          SET 
            status = 'PENDING',
            "assignedMachine" = NULL,
            "assignedAt" = NULL
          WHERE id = $1
        `, [operationId]);

        // Освобождаем станок для нового планирования
        const updatedMachine = await this.machinesService.update(machine.id, {
          isOccupied: false,
          currentOperation: null,
          assignedAt: new Date(),
        });

        return {
          id: updatedMachine.id.toString(),
          machineName: updatedMachine.code,
          machineType: updatedMachine.type,
          isAvailable: true,
          currentOperationId: undefined,
          lastFreedAt: updatedMachine.assignedAt,
          currentOperationDetails: null,
          createdAt: updatedMachine.createdAt.toISOString(),
          updatedAt: updatedMachine.updatedAt.toISOString(),
        };
      }

      // Возвращаем текущее состояние для действия 'continue'
      const currentOperationDetails = await this.getOperationDetails(operationId);
      const currentShiftProgress = await this.getShiftProgress(operationId, machine.id);
      
      return {
        id: machine.id.toString(),
        machineName: machine.code,
        machineType: machine.type,
        isAvailable: false,
        currentOperationId: operationId.toString(),
        lastFreedAt: machine.assignedAt,
        currentOperationDetails: currentOperationDetails ? {
          ...currentOperationDetails,
          producedQuantity: currentShiftProgress.totalProduced || 0
        } : null,
        shiftProgress: {
          totalProduced: currentShiftProgress.totalProduced || 0,
          remainingQuantity: Math.max(0, (currentOperationDetails?.orderQuantity || 0) - (currentShiftProgress.totalProduced || 0)),
          completionPercentage: Math.round(((currentShiftProgress.totalProduced || 0) / (currentOperationDetails?.orderQuantity || 1)) * 100),
          lastUpdateDate: currentShiftProgress.lastUpdateDate
        },
        createdAt: machine.createdAt.toISOString(),
        updatedAt: machine.updatedAt.toISOString(),
      };

    } catch (error) {
      this.logger.error(`🚫 Ошибка при завершении операции на станке ${machineName}:`, error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все станки с доступностью и прогрессом' })
  async findAll(): Promise<MachineAvailability[]> {
    try {
      this.logger.log('Получение всех станков с реальными данными операций и прогрессом');
      const machines = await this.machinesService.findAll();
      
      // Преобразуем данные из таблицы machines в формат MachineAvailability
      const result = await Promise.all(machines.map(async (machine) => {
        let currentOperationDetails = null;
        let shiftProgress = null;
        
        // Если у станка есть текущая операция, получаем реальные данные
        if (machine.currentOperation) {
          this.logger.log(`Получение деталей операции ${machine.currentOperation} для станка ${machine.code}`);
          
          currentOperationDetails = await this.getOperationDetails(machine.currentOperation);
          const shiftData = await this.getShiftProgress(machine.currentOperation, machine.id);
          
          if (currentOperationDetails) {
            const totalProduced = shiftData.totalProduced || currentOperationDetails.actualQuantity || 0;
            const targetQuantity = currentOperationDetails.orderQuantity || 0;
            
            currentOperationDetails.producedQuantity = totalProduced;
            currentOperationDetails.isCompleted = totalProduced >= targetQuantity && targetQuantity > 0;
            
            shiftProgress = {
              totalProduced,
              remainingQuantity: Math.max(0, targetQuantity - totalProduced),
              completionPercentage: targetQuantity > 0 ? Math.round((totalProduced / targetQuantity) * 100) : 0,
              lastUpdateDate: shiftData.lastUpdateDate
            };
            
            this.logger.log(`✅ Операция ${currentOperationDetails.operationNumber}: ${totalProduced}/${targetQuantity} (${shiftProgress.completionPercentage}%)`);
          } else {
            this.logger.warn(`❌ Операция ${machine.currentOperation} не найдена в БД`);
          }
        }
        
        return {
          id: machine.id.toString(),
          machineName: machine.code,
          machineType: machine.type,
          isAvailable: !machine.isOccupied,
          currentOperationId: machine.currentOperation?.toString(),
          lastFreedAt: machine.assignedAt,
          currentOperationDetails,
          shiftProgress,
          createdAt: machine.createdAt.toISOString(),
          updatedAt: machine.updatedAt.toISOString(),
        };
      }));
      
      this.logger.log(`Возвращено ${result.length} станков с реальными данными операций и прогрессом`);
      return result;
    } catch (error) {
      this.logger.error('Ошибка при получении станков:', error);
      throw error;
    }
  }

  // Остальные методы остаются как в оригинальном файле...
  @Get('available')
  @ApiOperation({ summary: 'Получить только доступные станки' })
  async findAvailable(): Promise<MachineAvailability[]> {
    try {
      this.logger.log('Получение доступных станков');
      const machines = await this.machinesService.findAll();
      
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
        currentOperationDetails: null,
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
  @ApiOperation({ summary: 'Получить станок по имени с прогрессом' })
  async findByName(@Param('machineName') machineName: string): Promise<MachineAvailability> {
    try {
      this.logger.log(`Поиск станка по имени: ${machineName}`);
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine) {
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      let currentOperationDetails = null;
      let shiftProgress = null;
      
      if (machine.currentOperation) {
        currentOperationDetails = await this.getOperationDetails(machine.currentOperation);
        const shiftData = await this.getShiftProgress(machine.currentOperation, machine.id);
        
        if (currentOperationDetails) {
          const totalProduced = shiftData.totalProduced || currentOperationDetails.actualQuantity || 0;
          const targetQuantity = currentOperationDetails.orderQuantity || 0;
          
          currentOperationDetails.producedQuantity = totalProduced;
          currentOperationDetails.isCompleted = totalProduced >= targetQuantity && targetQuantity > 0;
          
          shiftProgress = {
            totalProduced,
            remainingQuantity: Math.max(0, targetQuantity - totalProduced),
            completionPercentage: targetQuantity > 0 ? Math.round((totalProduced / targetQuantity) * 100) : 0,
            lastUpdateDate: shiftData.lastUpdateDate
          };
        }
      }
      
      return {
        id: machine.id.toString(),
        machineName: machine.code,
        machineType: machine.type,
        isAvailable: !machine.isOccupied,
        currentOperationId: machine.currentOperation?.toString(),
        lastFreedAt: machine.assignedAt,
        currentOperationDetails,
        shiftProgress,
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
      
      const updateData: any = {
        isOccupied: !body.isAvailable
      };
      
      if (body.isAvailable) {
        // При освобождении станка сохраняем текущую операцию в историю если она была завершена
        if (machine.currentOperation) {
          const completionCheck = await this.checkOperationCompletion(machineName);
          
          if (completionCheck.isCompleted) {
            this.logger.log('🎯 Операция завершена, автоматически сохраняем в историю');
            // Автоматически завершаем операцию
            return await this.completeOperation(machineName, { action: 'complete' });
          }
        }
        
        updateData.currentOperation = null;
        updateData.assignedAt = null;
        this.logger.log('Очищаем текущую операцию (станок освобождается)');
      } else {
        updateData.assignedAt = new Date();
        this.logger.log('Отмечаем станок как занятый');
      }
      
      this.logger.log('Данные для обновления:', updateData);
      
      const updatedMachine = await this.machinesService.update(machine.id, updateData);
      this.logger.log('Станок успешно обновлён');
      
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
  @ApiOperation({ summary: 'Отменить операцию со станка (с корректной очисткой)' })
  async unassignOperation(
    @Param('machineName') machineName: string,
  ): Promise<MachineAvailability> {
    try {
      this.logger.log(`🗑️ Начало корректной отмены операции со станка: ${machineName}`);
      
      const machines = await this.machinesService.findAll();
      const machine = machines.find(m => m.code === machineName);
      
      if (!machine) {
        this.logger.error(`❌ Станок с именем "${machineName}" не найден`);
        throw new BadRequestException(`Станок с именем ${machineName} не найден`);
      }
      
      const currentOperationId = machine.currentOperation;
      this.logger.log(`🔧 Текущая операция: ${currentOperationId || 'нет'}`);
      
      // Освобождаем станок
      const updateData = {
        isOccupied: false,
        currentOperation: null,
        assignedAt: new Date(),
      };
      
      const updatedMachine = await this.machinesService.update(machine.id, updateData);
      this.logger.log('✅ Станок успешно освобожден');
      
      // Обновляем статус операции
      if (currentOperationId) {
        try {
          await this.dataSource.query(`
            UPDATE operations 
            SET status = 'PENDING', "assignedMachine" = NULL, "assignedAt" = NULL
            WHERE id = $1
          `, [currentOperationId]);
          
          this.logger.log(`✅ Операция ${currentOperationId} возвращена в статус PENDING`);
        } catch (dbError) {
          this.logger.error(`❌ Ошибка при обновлении статуса операции:`, dbError);
        }
      }
      
      const result = {
        id: updatedMachine.id.toString(),
        machineName: updatedMachine.code,
        machineType: updatedMachine.type,
        isAvailable: true,
        currentOperationId: undefined,
        lastFreedAt: updatedMachine.assignedAt,
        currentOperationDetails: null,
        createdAt: updatedMachine.createdAt.toISOString(),
        updatedAt: updatedMachine.updatedAt.toISOString(),
      };
      
      this.logger.log(`🎉 Отмена операции со станка ${machineName} завершена успешно`);
      return result;
      
    } catch (error) {
      this.logger.error(`🚫 Ошибка при отмене операции со станка ${machineName}:`, error);
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
      
      const operationDetails = await this.getOperationDetails(operationId);
      if (!operationDetails) {
        throw new BadRequestException(`Операция с ID ${operationId} не найдена`);
      }
      
      const updatedMachine = await this.machinesService.update(machine.id, {
        isOccupied: true,
        currentOperation: operationId,
        assignedAt: new Date(),
      });
      
      try {
        await this.dataSource.query(`
          UPDATE operations 
          SET status = 'IN_PROGRESS', "assignedMachine" = $1, "assignedAt" = NOW()
          WHERE id = $2
        `, [machine.id, operationId]);
        
        this.logger.log(`✅ Операция ${operationId} назначена на станок ${machineName}`);
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
        currentOperationDetails: {
          ...operationDetails,
          producedQuantity: 0
        },
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
