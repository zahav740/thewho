/**
 * @file: orders-pdf-fixed.controller.ts
 * @description: ИСПРАВЛЕННЫЙ контроллер заказов с интегрированной улучшенной системой PDF
 * @dependencies: services, ConfigService, pdf-enhanced.service
 * @created: 2025-01-28
 * @updated: 2025-07-07 - Интегрирована улучшенная система PDF с организацией по папкам
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService, EnrichedOrder } from './orders.service';
import { PdfEnhancedService } from './pdf-enhanced.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { Order } from '../../database/entities/order.entity';
import { join } from 'path';
import * as crypto from 'crypto';

interface DuplicateConflictResponse {
  error: 'DUPLICATE_DETECTED';
  message: string;
  duplicateInfo: {
    byHash?: any;
    byDrawingNumber?: any;
  };
  actions: Array<{
    key: string;
    label: string;
    description: string;
  }>;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersPdfFixedController {
  private readonly logger = new Logger(OrdersPdfFixedController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfEnhancedService: PdfEnhancedService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все заказы с фильтрацией и пагинацией' })
  @ApiResponse({ status: 200, description: 'Список заказов', type: [Order] })
  @UsePipes(new ValidationPipe())
  async findAll(@Query() filterDto: OrdersFilterDto): Promise<{
    data: EnrichedOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Received request with filters: ${JSON.stringify(filterDto)}`);
    try {
      const result = await this.ordersService.findAll(filterDto);
      this.logger.log(`Returned ${result.data?.length || 0} orders`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching orders: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка получения заказов');
    }
  }

  @Get('check-duplicate/:drawingNumber')
  @ApiOperation({ summary: 'Проверить дубликат заказа по номеру чертежа' })
  @ApiResponse({ status: 200, description: 'Результат проверки дубликата' })
  async checkOrderDuplicate(@Param('drawingNumber') drawingNumber: string) {
    try {
      const existingOrder = await this.ordersService.findByDrawingNumber(drawingNumber);
      this.logger.log(`Checked duplicate for drawingNumber: ${drawingNumber}, exists: ${!!existingOrder}`);
      return {
        isDuplicate: !!existingOrder,
        existingOrder: existingOrder
          ? {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              quantity: existingOrder.quantity,
              deadline: existingOrder.deadline,
              createdAt: existingOrder.createdAt,
              operations: existingOrder.operations?.length || 0,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`Error checking duplicate for drawingNumber ${drawingNumber}: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка проверки дубликата заказа');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  @ApiResponse({ status: 200, description: 'Заказ', type: Order })
  async findOne(@Param('id') id: string): Promise<Order> {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      return order;
    } catch (error) {
      this.logger.error(`Error fetching order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ с проверкой дубликатов' })
  @ApiResponse({ status: 201, description: 'Созданный заказ', type: Order })
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Query('action') action?: 'update' | 'create_copy' | 'force',
    @Query('force') force?: string,
  ): Promise<Order> {
    this.logger.log(`Creating order: ${JSON.stringify(createOrderDto)}`);
    try {
      const forceCreate = force === 'true' || force === '1';

      if (!forceCreate && !action) {
        const existingOrder = await this.ordersService.findByDrawingNumber(createOrderDto.drawingNumber);
        if (existingOrder) {
          this.logger.warn(`Duplicate order found for drawingNumber: ${createOrderDto.drawingNumber}`);
          throw new ConflictException({
            error: 'DUPLICATE_ORDER_DETECTED',
            message: `Заказ с номером чертежа "${createOrderDto.drawingNumber}" уже существует`,
            existingOrder: {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              quantity: existingOrder.quantity,
              deadline: existingOrder.deadline,
              createdAt: existingOrder.createdAt,
            },
            actions: [
              { key: 'update', label: 'Обновить существующий заказ', description: 'Заменить данные существующего заказа новыми' },
              { key: 'create_copy', label: 'Создать копию с другим номером', description: 'Создать новый заказ с измененным номером чертежа' },
              { key: 'force', label: 'Создать дубликат принудительно', description: 'Создать заказ несмотря на дубликат' },
            ],
          });
        }
      }

      if (action && action !== 'force') {
        const existingOrder = await this.ordersService.findByDrawingNumber(createOrderDto.drawingNumber);
        switch (action) {
          case 'update':
            if (!existingOrder) {
              throw new NotFoundException('Заказ для обновления не найден');
            }
            this.logger.log(`Updating existing order ${existingOrder.id}`);
            return await this.ordersService.update(existingOrder.id.toString(), createOrderDto);
          case 'create_copy':
            this.logger.log('Creating copy with modified drawing number');
            const modifiedDto = {
              ...createOrderDto,
              drawingNumber: await this.generateUniqueDrawingNumber(createOrderDto.drawingNumber),
            };
            return await this.ordersService.create(modifiedDto);
          default:
            throw new BadRequestException(`Неизвестное действие: ${action}`);
        }
      }

      this.logger.log('Creating new order');
      return await this.ordersService.create(createOrderDto);
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заказ' })
  @ApiResponse({ status: 200, description: 'Обновленный заказ', type: Order })
  @UsePipes(new ValidationPipe())
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      if (updateOrderDto.drawingNumber) {
        const existingOrder = await this.ordersService.findByDrawingNumber(updateOrderDto.drawingNumber);
        if (existingOrder && existingOrder.id.toString() !== id) {
          throw new ConflictException({
            error: 'DUPLICATE_DRAWING_NUMBER',
            message: `Номер чертежа "${updateOrderDto.drawingNumber}" уже используется в заказе ${existingOrder.id}`,
            existingOrder: {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              createdAt: existingOrder.createdAt,
            },
          });
        }
      }
      return await this.ordersService.update(id, updateOrderDto);
    } catch (error) {
      this.logger.error(`Error updating order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ' })
  @ApiResponse({ status: 204, description: 'Заказ удален' })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log(`Received request to delete order ${id}`);
      await this.ordersService.remove(id);
      this.logger.log(`Order ${id} successfully deleted`);
    } catch (error) {
      this.logger.error(`Error deleting order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('batch/selected')
  @ApiOperation({ summary: 'Удалить выбранные заказы' })
  @ApiResponse({ status: 200, description: 'Количество удаленных заказов' })
  async removeBatch(@Body('ids') ids: string[]): Promise<{ deleted: number }> {
    try {
      const deleted = await this.ordersService.removeBatch(ids);
      this.logger.log(`Deleted ${deleted} orders`);
      return { deleted };
    } catch (error) {
      this.logger.error(`Error deleting batch orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('all/confirm')
  @ApiOperation({ summary: 'Удалить все заказы (с подтверждением)' })
  @ApiResponse({ status: 200, description: 'Количество удаленных заказов' })
  async removeAll(@Body() body?: { confirm?: boolean }): Promise<{ deleted: number }> {
    try {
      this.logger.log('Received request to delete all orders');
      const deleted = await this.ordersService.removeAll();
      this.logger.log(`Deleted all orders: ${deleted}`);
      return { deleted };
    } catch (error) {
      this.logger.error(`Error deleting all orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateUniqueDrawingNumber(originalNumber: string): Promise<string> {
    let counter = 1;
    let newNumber = `${originalNumber}_copy`;
    while (await this.ordersService.findByDrawingNumber(newNumber)) {
      counter++;
      newNumber = `${originalNumber}_copy${counter}`;
    }
    this.logger.log(`Generated unique drawing number: ${newNumber}`);
    return newNumber;
  }

  // ========================================
  // УЛУЧШЕННАЯ СИСТЕМА PDF С ОРГАНИЗАЦИЕЙ ПО ПАПКАМ
  // ========================================

  @Post(':orderId/upload-pdf')
  @ApiOperation({ summary: 'Загрузить PDF файл для заказа с улучшенной обработкой дубликатов' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'PDF успешно загружен' })
  @ApiResponse({ status: 409, description: 'Найден дубликат, требуется выбор действия' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Только PDF файлы разрешены'), false);
        }
      },
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async uploadPdf(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('action') action?: 'replace' | 'use_existing' | 'create_revision' | 'force',
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`📁 Загрузка PDF для заказа ${orderId}: ${file.originalname}`);
      
      if (!file || !file.buffer) {
        throw new BadRequestException('PDF файл обязателен');
      }

      // Получаем информацию о заказе
      const order = await this.ordersService.findOne(orderId);
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${orderId} не найден`);
      }

      const drawingNumber = order.drawingNumber;
      this.logger.log(`📋 Номер чертежа: ${drawingNumber}`);

      // Если нет действия, проверяем дубликаты
      if (!action || action === 'check') {
        const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
        const hashDuplicate = await this.pdfEnhancedService.checkDuplicateByHash(fileHash);
        const drawingDuplicate = await this.pdfEnhancedService.checkDuplicateByDrawingNumber(drawingNumber);

        if (hashDuplicate.isDuplicate || drawingDuplicate.isDuplicate) {
          const duplicateResponse: DuplicateConflictResponse = {
            error: 'DUPLICATE_DETECTED',
            message: 'Обнаружен дубликат PDF файла',
            duplicateInfo: {
              byHash: hashDuplicate.existingFile,
              byDrawingNumber: drawingDuplicate.existingFile,
            },
            actions: [
              {
                key: 'replace',
                label: 'Перезаписать файл',
                description: 'Заменить существующий PDF файл новым'
              },
              {
                key: 'use_existing',
                label: 'Использовать существующий',
                description: 'Связать заказ с уже загруженным файлом'
              },
              {
                key: 'create_revision',
                label: 'Создать ревизию',
                description: 'Сохранить как новую версию файла'
              },
              {
                key: 'force',
                label: 'Принудительно загрузить',
                description: 'Загрузить файл несмотря на дубликат'
              }
            ]
          };

          return res.status(409).json(duplicateResponse);
        }
      }

      // Определяем опции загрузки
      const uploadOptions = {
        replaceDuplicate: action === 'replace',
        useExisting: action === 'use_existing', 
        createRevision: action === 'create_revision',
      };

      // Загружаем файл
      const result = await this.pdfEnhancedService.uploadPdf(
        parseInt(orderId),
        drawingNumber,
        file,
        uploadOptions
      );

      if (!result.success) {
        throw new BadRequestException('Ошибка загрузки PDF файла');
      }

      // Возвращаем успешный результат
      const response = {
        action: action || 'uploaded',
        filename: result.fileName,
        orderId: orderId,
        fileHash: result.fileHash,
        message: result.isDuplicate && uploadOptions.useExisting 
          ? `Заказ ${orderId} связан с существующим PDF файлом`
          : `PDF файл успешно загружен для заказа ${orderId}`,
        pdfPath: result.filePath,
        drawingNumber: drawingNumber,
      };

      this.logger.log(`✅ PDF загружен успешно: ${JSON.stringify(response)}`);
      return res.status(201).json(response);

    } catch (error) {
      this.logger.error(`❌ Ошибка загрузки PDF: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Ошибка загрузки PDF: ${error.message}`);
    }
  }

  @Get('pdf/:drawingNumber/:filename')
  @ApiOperation({ summary: 'Получить PDF файл по номеру чертежа и имени файла' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getPdfFile(
    @Param('drawingNumber') drawingNumber: string,
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log(`📄 Запрос PDF: чертеж=${drawingNumber}, файл=${filename}`);
      
      const pdfPath = join(process.cwd(), 'uploads', 'pdf');
      const filePath = join(pdfPath, drawingNumber, filename);
      this.logger.log(`📁 Полный путь: ${filePath}`);
      
      try {
        await require('fs').promises.access(filePath);
      } catch {
        this.logger.error(`❌ PDF файл не найден: ${filePath}`);
        throw new NotFoundException(`PDF файл не найден: ${drawingNumber}/${filename}`);
      }

      const stats = await require('fs').promises.stat(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      this.logger.log(`✅ Отправка PDF файла: ${filename} (${stats.size} bytes)`);
      res.sendFile(filePath);
      
    } catch (error) {
      this.logger.error(`❌ Ошибка получения PDF: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        res.status(404).json({ 
          message: `PDF файл не найден: ${drawingNumber}/${filename}`,
          drawingNumber,
          filename 
        });
      } else {
        res.status(500).json({ 
          message: 'Ошибка сервера при получении PDF файла',
          error: error.message 
        });
      }
    }
  }

  @Get(':orderId/pdf')
  @ApiOperation({ summary: 'Получить PDF файл заказа (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getLegacyPdf(@Param('orderId') orderId: string, @Res() res: Response) {
    try {
      this.logger.log(`📄 Legacy запрос PDF для заказа ${orderId}`);
      
      const order = await this.ordersService.findOne(orderId);
      if (!order || !order.pdfPath) {
        throw new NotFoundException('PDF файл не найден');
      }

      // Извлекаем номер чертежа и имя файла из пути
      const pathParts = order.pdfPath.split('/');
      if (pathParts.length === 2) {
        const [drawingNumber, filename] = pathParts;
        // Перенаправляем на новый endpoint
        return this.getPdfFile(drawingNumber, filename, res);
      } else {
        // Старый формат пути - пробуем найти файл напрямую
        const pdfPath = join(process.cwd(), 'uploads', 'pdf');
        const filePath = join(pdfPath, order.pdfPath);
        
        try {
          await require('fs').promises.access(filePath);
          const stats = await require('fs').promises.stat(filePath);
          
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${order.pdfPath}"`,
            'Content-Length': stats.size.toString(),
          });
          
          res.sendFile(filePath);
        } catch {
          throw new NotFoundException('PDF файл не найден на сервере');
        }
      }
      
    } catch (error) {
      this.logger.error(`❌ Ошибка legacy PDF: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Ошибка сервера при получении PDF файла' });
      }
    }
  }

  @Delete(':orderId/pdf')
  @ApiOperation({ summary: 'Удалить PDF файл заказа' })
  @ApiResponse({ status: 200, description: 'PDF файл удален' })
  async deletePdf(@Param('orderId') orderId: string) {
    try {
      this.logger.log(`🗑️ Удаление PDF для заказа ${orderId}`);
      
      await this.pdfEnhancedService.deletePdf(parseInt(orderId));
      
      // Обновляем кэш заказа
      const updatedOrder = await this.ordersService.findOne(orderId);
      
      return {
        message: 'PDF файл успешно удален',
        orderId: orderId,
        order: updatedOrder
      };
      
    } catch (error) {
      this.logger.error(`❌ Ошибка удаления PDF: ${error.message}`);
      throw new BadRequestException(`Ошибка удаления PDF: ${error.message}`);
    }
  }

  @Get(':orderId/pdf/info')
  @ApiOperation({ summary: 'Получить информацию о PDF файле заказа' })
  @ApiResponse({ status: 200, description: 'Информация о PDF файле' })
  async getPdfInfo(@Param('orderId') orderId: string) {
    try {
      const info = await this.pdfEnhancedService.getPdfInfo(parseInt(orderId));
      return {
        orderId: orderId,
        ...info
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения информации о PDF: ${error.message}`);
      throw new BadRequestException('Ошибка получения информации о PDF');
    }
  }

  @Get('drawing/:drawingNumber/pdfs')
  @ApiOperation({ summary: 'Получить все PDF файлы для номера чертежа' })
  @ApiResponse({ status: 200, description: 'Список PDF файлов для чертежа' })
  async getPdfsByDrawingNumber(@Param('drawingNumber') drawingNumber: string) {
    try {
      const files = await this.pdfEnhancedService.getPdfsByDrawingNumber(drawingNumber);
      return {
        drawingNumber,
        files,
        total: files.length
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка получения PDF для чертежа: ${error.message}`);
      throw new BadRequestException('Ошибка получения PDF для чертежа');
    }
  }

  @Get('pdf/statistics')
  @ApiOperation({ summary: 'Получить статистику PDF файлов' })
  @ApiResponse({ status: 200, description: 'Статистика PDF файлов' })
  async getPdfStatistics() {
    try {
      return await this.pdfEnhancedService.getPdfStatistics();
    } catch (error) {
      this.logger.error(`❌ Ошибка получения статистики: ${error.message}`);
      throw new BadRequestException('Ошибка получения статистики');
    }
  }

  @Post('pdf/cleanup')
  @ApiOperation({ summary: 'Очистить устаревшие PDF файлы' })
  @ApiResponse({ status: 200, description: 'Результат очистки' })
  async cleanupPdfs() {
    try {
      const result = await this.pdfEnhancedService.cleanupOrphanedFiles();
      return {
        message: 'Очистка завершена успешно',
        ...result
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка очистки PDF: ${error.message}`);
      throw new BadRequestException('Ошибка очистки PDF файлов');
    }
  }
}
