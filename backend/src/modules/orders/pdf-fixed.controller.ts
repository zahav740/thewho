/**
 * @file: pdf-fixed.controller.ts
 * @description: ИСПРАВЛЕННЫЙ контроллер для работы с PDF файлами с организацией по папкам
 * @dependencies: pdf-enhanced.service, orders.service
 * @created: 2025-07-07
 * @updated: 2025-07-07 - Полностью исправленная версия с правильными endpoints
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  Body,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfEnhancedService, PdfUploadResult, PdfDuplicateCheck } from './pdf-enhanced.service';
import { OrdersService } from './orders.service';
import { join } from 'path';
import { promises as fs } from 'fs';

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
export class PdfFixedController {
  private readonly logger = new Logger(PdfFixedController.name);
  private readonly pdfPath = join(process.cwd(), 'uploads', 'pdf');

  constructor(
    private readonly pdfEnhancedService: PdfEnhancedService,
    private readonly ordersService: OrdersService,
  ) {}

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
      this.logger.log(`📁 Загрузка PDF для заказа ${orderId}`);
      
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
        const hashDuplicate = await this.pdfEnhancedService.checkDuplicateByHash(
          require('crypto').createHash('md5').update(file.buffer).digest('hex')
        );
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
      
      const filePath = join(this.pdfPath, drawingNumber, filename);
      this.logger.log(`📁 Полный путь: ${filePath}`);
      
      try {
        await fs.access(filePath);
      } catch {
        this.logger.error(`❌ PDF файл не найден: ${filePath}`);
        throw new NotFoundException(`PDF файл не найден: ${drawingNumber}/${filename}`);
      }

      const stats = await fs.stat(filePath);
      
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
        const filePath = join(this.pdfPath, order.pdfPath);
        
        try {
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          
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
