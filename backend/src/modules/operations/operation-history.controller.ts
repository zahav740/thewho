/**
 * @file: operation-history.controller.ts
 * @description: API контроллер для работы с историей операций
 * @dependencies: operation-history.service
 * @created: 2025-06-07
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OperationHistoryService, ExportRequest } from './operation-history.service';
import { createReadStream, existsSync } from 'fs';

@ApiTags('operation-history')
@Controller('operation-history')
export class OperationHistoryController {
  private readonly logger = new Logger(OperationHistoryController.name);

  constructor(
    private readonly operationHistoryService: OperationHistoryService,
  ) {}

  @Get('drawings')
  @ApiOperation({ summary: 'Получить список доступных чертежей для экспорта' })
  async getAvailableDrawings() {
    try {
      const drawings = await this.operationHistoryService.getAvailableDrawings();
      
      return {
        success: true,
        count: drawings.length,
        data: drawings
      };
    } catch (error) {
      this.logger.error('Ошибка при получении списка чертежей:', error);
      throw error;
    }
  }

  @Get(':drawingNumber')
  @ApiOperation({ summary: 'Получить историю операций по номеру чертежа' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Дата начала периода (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Дата окончания периода (YYYY-MM-DD)' })
  async getOperationHistory(
    @Param('drawingNumber') drawingNumber: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    try {
      this.logger.log(`Запрос истории операций для чертежа: ${drawingNumber}`);
      
      const dateFromObj = dateFrom ? new Date(dateFrom) : undefined;
      const dateToObj = dateTo ? new Date(dateTo) : undefined;
      
      const history = await this.operationHistoryService.getOperationHistory(
        drawingNumber,
        dateFromObj,
        dateToObj
      );

      return {
        success: true,
        drawingNumber,
        period: {
          from: dateFrom || 'Не ограничено',
          to: dateTo || 'Не ограничено'
        },
        count: history.length,
        data: history
      };
    } catch (error) {
      this.logger.error(`Ошибка при получении истории для ${drawingNumber}:`, error);
      throw error;
    }
  }

  @Post('export/excel')
  @ApiOperation({ summary: 'Экспорт истории операций в Excel' })
  async exportToExcel(@Body() exportRequest: ExportRequest) {
    try {
      this.logger.log(`Запрос экспорта в Excel для чертежа: ${exportRequest.drawingNumber}`);
      
      if (!exportRequest.drawingNumber) {
        throw new BadRequestException('Номер чертежа обязателен');
      }

      // Устанавливаем значения по умолчанию для дат если не указаны
      if (!exportRequest.dateFrom) {
        exportRequest.dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 дней назад
      }
      if (!exportRequest.dateTo) {
        exportRequest.dateTo = new Date(); // сегодня
      }

      exportRequest.exportType = 'excel';
      
      const filePath = await this.operationHistoryService.exportToExcel(exportRequest);
      
      return {
        success: true,
        message: 'Файл Excel успешно создан',
        drawingNumber: exportRequest.drawingNumber,
        period: {
          from: exportRequest.dateFrom.toISOString().split('T')[0],
          to: exportRequest.dateTo.toISOString().split('T')[0]
        },
        downloadUrl: `/operation-history/download/${encodeURIComponent(filePath.split('/').pop() || '')}`
      };
    } catch (error) {
      this.logger.error('Ошибка при экспорте в Excel:', error);
      throw error;
    }
  }

  @Get('download/:fileName')
  @ApiOperation({ summary: 'Скачать экспортированный файл' })
  async downloadFile(
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`Запрос скачивания файла: ${fileName}`);
      
      // Безопасность: проверяем, что имя файла не содержит опасных символов
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        throw new BadRequestException('Недопустимое имя файла');
      }

      const filePath = `${process.cwd()}/uploads/exports/${fileName}`;
      
      if (!existsSync(filePath)) {
        throw new BadRequestException('Файл не найден');
      }

      // Устанавливаем заголовки для скачивания
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Создаем поток для чтения файла
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
      
      this.logger.log(`Файл ${fileName} отправлен пользователю`);
    } catch (error) {
      this.logger.error(`Ошибка при скачивании файла ${fileName}:`, error);
      throw error;
    }
  }

  @Post('operator-stats')
  @ApiOperation({ summary: 'Вычислить и сохранить статистику эффективности оператора' })
  async calculateOperatorStats(@Body() request: {
    operatorName: string;
    drawingNumber: string;
    date?: string;
  }) {
    try {
      this.logger.log(`Запрос статистики для оператора: ${request.operatorName}, чертеж: ${request.drawingNumber}`);
      
      if (!request.operatorName || !request.drawingNumber) {
        throw new BadRequestException('Имя оператора и номер чертежа обязательны');
      }

      const date = request.date ? new Date(request.date) : new Date();
      
      const stats = await this.operationHistoryService.calculateAndSaveOperatorStats(
        request.operatorName,
        request.drawingNumber,
        date
      );

      return {
        success: true,
        message: 'Статистика оператора обновлена',
        data: stats
      };
    } catch (error) {
      this.logger.error('Ошибка при вычислении статистики оператора:', error);
      throw error;
    }
  }

  @Post('save-shift-to-history')
  @ApiOperation({ summary: 'Сохранить запись смены в историю операций' })
  async saveShiftToHistory(@Body() request: {
    shiftId: number;
    forceRecalculate?: boolean;
  }) {
    try {
      this.logger.log(`Сохранение смены ${request.shiftId} в историю операций`);
      
      // Получаем данные смены
      const shiftData = await this.getShiftData(request.shiftId);
      
      if (!shiftData) {
        throw new BadRequestException('Смена не найдена');
      }

      // Сохраняем дневную смену если есть данные
      if (shiftData.dayShiftQuantity > 0) {
        await this.operationHistoryService.saveOperationToHistory({
          drawingNumber: shiftData.drawingNumber,
          operationId: shiftData.operationId,
          operationNumber: shiftData.operationNumber,
          operationType: shiftData.operationType,
          machineId: shiftData.machineId,
          machineName: shiftData.machineName,
          operatorName: shiftData.dayShiftOperator,
          shiftType: 'DAY',
          quantityProduced: shiftData.dayShiftQuantity,
          timePerUnit: shiftData.dayShiftTimePerUnit,
          setupTime: shiftData.setupTime,
          totalTime: shiftData.dayShiftQuantity * shiftData.dayShiftTimePerUnit,
          efficiencyRating: this.calculateEfficiencyRating(shiftData, 'DAY'),
          dateCompleted: shiftData.date
        });
      }

      // Сохраняем ночную смену если есть данные
      if (shiftData.nightShiftQuantity > 0) {
        await this.operationHistoryService.saveOperationToHistory({
          drawingNumber: shiftData.drawingNumber,
          operationId: shiftData.operationId,
          operationNumber: shiftData.operationNumber,
          operationType: shiftData.operationType,
          machineId: shiftData.machineId,
          machineName: shiftData.machineName,
          operatorName: shiftData.nightShiftOperator,
          shiftType: 'NIGHT',
          quantityProduced: shiftData.nightShiftQuantity,
          timePerUnit: shiftData.nightShiftTimePerUnit,
          setupTime: 0, // Наладка только в дневной смене
          totalTime: shiftData.nightShiftQuantity * shiftData.nightShiftTimePerUnit,
          efficiencyRating: this.calculateEfficiencyRating(shiftData, 'NIGHT'),
          dateCompleted: shiftData.date
        });
      }

      // Пересчитываем статистику операторов если требуется
      if (request.forceRecalculate) {
        if (shiftData.dayShiftOperator) {
          await this.operationHistoryService.calculateAndSaveOperatorStats(
            shiftData.dayShiftOperator,
            shiftData.drawingNumber,
            shiftData.date
          );
        }
        if (shiftData.nightShiftOperator) {
          await this.operationHistoryService.calculateAndSaveOperatorStats(
            shiftData.nightShiftOperator,
            shiftData.drawingNumber,
            shiftData.date
          );
        }
      }

      return {
        success: true,
        message: 'Смена сохранена в историю операций',
        shiftId: request.shiftId
      };
    } catch (error) {
      this.logger.error('Ошибка при сохранении смены в историю:', error);
      throw error;
    }
  }

  /**
   * Получить данные смены по ID
   */
  private async getShiftData(shiftId: number) {
    const result = await this.operationHistoryService['dataSource'].query(`
      SELECT 
        sr.*,
        o."operationNumber",
        o.operationtype as "operationType",
        ord.drawing_number as "drawingNumber",
        m.code as "machineName"
      FROM shift_records sr
      LEFT JOIN operations o ON sr."operationId" = o.id
      LEFT JOIN orders ord ON o."orderId" = ord.id
      LEFT JOIN machines m ON sr."machineId" = m.id
      WHERE sr.id = $1
    `, [shiftId]);

    return result[0] || null;
  }

  /**
   * Вычислить рейтинг эффективности смены
   */
  private calculateEfficiencyRating(shiftData: any, shiftType: 'DAY' | 'NIGHT'): number {
    const planTimePerPart = 15; // минут (можно получать из базы)
    const actualTimePerPart = shiftType === 'DAY' 
      ? shiftData.dayShiftTimePerUnit 
      : shiftData.nightShiftTimePerUnit;
    
    if (!actualTimePerPart || actualTimePerPart <= 0) return 0;
    
    const efficiency = (planTimePerPart / actualTimePerPart) * 100;
    return Math.min(100, Math.max(0, efficiency));
  }
}
