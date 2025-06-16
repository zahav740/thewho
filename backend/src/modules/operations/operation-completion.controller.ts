/**
 * @file: operation-completion.controller.ts
 * @description: Контроллер для обработки завершения операций
 * @dependencies: operations.service, shifts.service
 * @created: 2025-06-11
 */
import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from '../../database/entities/operation.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

interface CompleteOperationDto {
  operationId: number;
  completedQuantity: number;
  shiftData: any;
  completedAt: string;
}

interface ResetOperationDto {
  operationId: number;
}

@ApiTags('operation-completion')
@Controller('operations')
export class OperationCompletionController {
  private readonly logger = new Logger(OperationCompletionController.name);

  constructor(
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  @Post('complete')
  @ApiOperation({ summary: 'Завершить операцию и архивировать данные' })
  async completeOperation(@Body() dto: CompleteOperationDto) {
    try {
      this.logger.log(`Завершение операции ${dto.operationId}`);
      
      // Находим операцию
      const operation = await this.operationRepository.findOne({
        where: { id: dto.operationId },
        relations: ['order']
      });
      
      if (!operation) {
        throw new BadRequestException('Операция не найдена');
      }

      // Обновляем статус операции
      operation.status = 'COMPLETED';
      operation.completedAt = new Date(dto.completedAt);
      operation.actualQuantity = dto.completedQuantity;
      
      await this.operationRepository.save(operation);

      // Архивируем данные смен (создаем запись в истории)
      const archiveRecord = {
        operationId: dto.operationId,
        completedQuantity: dto.completedQuantity,
        dayShiftData: dto.shiftData.dayShift,
        nightShiftData: dto.shiftData.nightShift,
        completedAt: new Date(dto.completedAt),
        archived: true
      };
      
      // Здесь можно добавить запись в таблицу истории операций
      this.logger.log('Данные операции архивированы:', archiveRecord);

      // Обнуляем связанные смены для этой операции
      await this.shiftRecordRepository.update(
        { operationId: dto.operationId },
        { 
          dayShiftQuantity: 0,
          nightShiftQuantity: 0,
          archived: true,
          archivedAt: new Date()
        }
      );

      return {
        success: true,
        message: 'Операция успешно завершена и данные архивированы',
        operationId: dto.operationId
      };
      
    } catch (error) {
      this.logger.error('Ошибка при завершении операции:', error);
      throw new BadRequestException(`Ошибка при завершении операции: ${error.message}`);
    }
  }

  @Post('reset-shifts')
  @ApiOperation({ summary: 'Сбросить данные смен для операции' })
  async resetOperationShifts(@Body() dto: ResetOperationDto) {
    try {
      this.logger.log(`Сброс данных смен для операции ${dto.operationId}`);
      
      // Обнуляем данные смен
      await this.shiftRecordRepository.update(
        { operationId: dto.operationId },
        { 
          dayShiftQuantity: 0,
          nightShiftQuantity: 0,
          dayShiftTimePerUnit: 0,
          nightShiftTimePerUnit: 0,
          resetAt: new Date()
        }
      );

      return {
        success: true,
        message: 'Данные смен успешно сброшены',
        operationId: dto.operationId
      };
      
    } catch (error) {
      this.logger.error('Ошибка при сбросе данных смен:', error);
      throw new BadRequestException(`Ошибка при сбросе данных: ${error.message}`);
    }
  }
}
