/**
 * @file: excel-import-simple.controller.ts
 * @description: ПРОСТОЙ контроллер для тестирования импорта Excel
 * @dependencies: enhanced-excel-import.service
 * @created: 2025-07-08
 */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { Express } from 'express';
import { OrdersService } from './orders.service';
import { OperationType } from '../../database/entities/operation.entity';

@ApiTags('excel-simple')
@Controller('excel-simple')
export class ExcelSimpleController {
  private readonly logger = new Logger(ExcelSimpleController.name);

  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post('test-upload')
  @ApiOperation({ summary: 'Тестовая загрузка Excel файла' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('excel', {
      fileFilter: (req, file, cb) => {
        const logger = new Logger('ExcelSimpleController');
        if (file) {
          logger.log(`📁 Получен файл: ${file.originalname}, тип: ${file.mimetype}, размер: ${file.size}`);
        }
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream'
        ];
        
        const isValidType = allowedTypes.includes(file.mimetype) || !!file.originalname.match(/\.(xlsx?|csv)$/);
        
        if (isValidType) {
          logger.log('✅ Файл прошел проверку типа');
          cb(null, true);
        } else {
          logger.error(`❌ Неподдерживаемый тип файла: ${file.mimetype}`);
          cb(new BadRequestException('Только Excel файлы (.xlsx, .xls) разрешены'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async testUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ): Promise<{
    success: boolean;
    message: string;
    fileInfo: any;
    mockResult: any;
  }> {
    try {
      this.logger.log(`🔍 ТЕСТ ИМПОРТА: Получен файл`, {
        originalname: file?.originalname,
        size: file?.size,
        mimetype: file?.mimetype,
        hasBuffer: !!file?.buffer,
        bufferSize: file?.buffer?.length,
        bodyKeys: Object.keys(body || {})
      });

      if (!file || !file.buffer) {
        throw new BadRequestException('Файл не получен или отсутствует buffer');
      }

      // Имитируем успешный импорт с фиксированными данными
      const mockResult = {
        created: 3,
        updated: 1,
        errors: [],
        totalRows: 4,
        processedRows: 4,
        summary: 'Тестовый импорт выполнен успешно'
      };

      this.logger.log('✅ ТЕСТ ИМПОРТА: Имитация успешного результата', mockResult);

      return {
        success: true,
        message: `Тестовая загрузка завершена успешно! Файл ${file.originalname} обработан.`,
        fileInfo: {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          bufferSize: file.buffer.length,
          testMode: true
        },
        mockResult
      };

    } catch (error) {
      this.logger.error(`❌ ТЕСТ ИМПОРТА: Ошибка`, error);
      return {
        success: false,
        message: `Ошибка тестовой загрузки: ${error.message}`,
        fileInfo: {
          originalname: file?.originalname || 'unknown',
          size: file?.size || 0,
          error: error.message
        },
        mockResult: null
      };
    }
  }

  @Post('create-test-orders')
  @ApiOperation({ summary: 'Создать тестовые заказы в базе данных' })
  async createTestOrders(): Promise<{
    success: boolean;
    message: string;
    created: any[];
  }> {
    try {
      this.logger.log('🔧 Создание тестовых заказов...');

      const testOrders = [
        {
          drawingNumber: `TEST-${Date.now()}-001`,
          quantity: 10,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
          priority: 2,
          workType: 'Тестовая фрезерная обработка',
          operations: [
            {
              operationNumber: 10,
              operationType: OperationType.MILLING,
              estimatedTime: 120,
              machineAxes: 3
            }
          ]
        },
        {
          drawingNumber: `TEST-${Date.now()}-002`,
          quantity: 5,
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // +15 дней
          priority: 1,
          workType: 'Тестовая токарная обработка',
          operations: [
            {
              operationNumber: 20,
              operationType: OperationType.TURNING,
              estimatedTime: 90,
              machineAxes: 2
            }
          ]
        }
      ];

      const created = [];
      for (const orderData of testOrders) {
        try {
          const createdOrder = await this.ordersService.create(orderData);
          created.push(createdOrder);
          this.logger.log(`✅ Создан тестовый заказ: ${orderData.drawingNumber}`);
        } catch (error) {
          this.logger.error(`❌ Ошибка создания заказа ${orderData.drawingNumber}:`, error.message);
        }
      }

      return {
        success: true,
        message: `Создано ${created.length} тестовых заказов`,
        created: created.map(order => ({
          id: order.id,
          drawingNumber: order.drawingNumber,
          quantity: order.quantity,
          operations: order.operations?.length || 0
        }))
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка создания тестовых заказов:`, error);
      return {
        success: false,
        message: `Ошибка создания тестовых заказов: ${error.message}`,
        created: []
      };
    }
  }

  @Post('clear-test-orders')
  @ApiOperation({ summary: 'Удалить все тестовые заказы' })
  async clearTestOrders(): Promise<{
    success: boolean;
    message: string;
    deleted: number;
  }> {
    try {
      this.logger.log('🗑️ Удаление тестовых заказов...');

      // Находим все заказы с номером чертежа, начинающимся на "TEST-"
      const allOrders = await this.ordersService.findAll({ limit: 1000 });
      const testOrders = allOrders.data.filter(order => 
        order.drawingNumber?.startsWith('TEST-')
      );

      let deleted = 0;
      for (const order of testOrders) {
        try {
          await this.ordersService.remove(order.id.toString());
          deleted++;
          this.logger.log(`🗑️ Удален тестовый заказ: ${order.drawingNumber}`);
        } catch (error) {
          this.logger.error(`❌ Ошибка удаления заказа ${order.drawingNumber}:`, error.message);
        }
      }

      return {
        success: true,
        message: `Удалено ${deleted} тестовых заказов`,
        deleted
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка удаления тестовых заказов:`, error);
      return {
        success: false,
        message: `Ошибка удаления тестовых заказов: ${error.message}`,
        deleted: 0
      };
    }
  }
}

