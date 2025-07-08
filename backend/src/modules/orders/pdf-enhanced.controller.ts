/**
 * @file: pdf-enhanced.controller.ts
 * @description: Контроллер для работы с улучшенным модулем PDF
 * @dependencies: pdf-enhanced.service
 * @created: 2025-07-07
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfEnhancedService, PdfUploadResult, PdfDuplicateCheck } from './pdf-enhanced.service';
import { join } from 'path';
import { promises as fs } from 'fs';
import { Logger } from '@nestjs/common';

@ApiTags('pdf-enhanced')
@Controller('pdf-enhanced')
export class PdfEnhancedController {
  private readonly logger = new Logger(PdfEnhancedController.name);
  private readonly pdfPath = join(process.cwd(), 'uploads', 'pdf');

  constructor(private readonly pdfEnhancedService: PdfEnhancedService) {}

  @Get('check-duplicate/:drawingNumber')
  @ApiOperation({ summary: 'Проверить дубликат PDF по номеру чертежа' })
  @ApiResponse({ status: 200, description: 'Результат проверки дубликата' })
  async checkDuplicateByDrawingNumber(
    @Param('drawingNumber') drawingNumber: string
  ): Promise<PdfDuplicateCheck> {
    try {
      return await this.pdfEnhancedService.checkDuplicateByDrawingNumber(drawingNumber);
    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата: ${error.message}`);
      throw new BadRequestException('Ошибка проверки дубликата');
    }
  }

  @Post('check-hash')
  @ApiOperation({ summary: 'Проверить дубликат PDF по хешу файла' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат проверки дубликата по хешу' })
  @UseInterceptors(FileInterceptor('file'))
  async checkDuplicateByHash(
    @UploadedFile() file: Express.Multer.File
  ): Promise<PdfDuplicateCheck> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл не предоставлен');
      }

      const crypto = require('crypto');
      const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
      
      return await this.pdfEnhancedService.checkDuplicateByHash(fileHash);
    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата по хешу: ${error.message}`);
      throw new BadRequestException('Ошибка проверки дубликата по хешу');
    }
  }

  @Post('orders/:orderId/upload')
  @ApiOperation({ summary: 'Загрузить PDF для заказа с улучшенной обработкой' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат загрузки PDF' })
  @UseInterceptors(
    FileInterceptor('pdf', {
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
    @Body('drawingNumber') drawingNumber: string,
    @Body('replaceDuplicate') replaceDuplicate?: string,
    @Body('useExisting') useExisting?: string,
    @Body('createRevision') createRevision?: string,
  ): Promise<PdfUploadResult> {
    try {
      if (!file) {
        throw new BadRequestException('PDF файл обязателен');
      }

      if (!drawingNumber) {
        throw new BadRequestException('Номер чертежа обязателен');
      }

      const options = {
        replaceDuplicate: replaceDuplicate === 'true',
        useExisting: useExisting === 'true',
        createRevision: createRevision === 'true',
      };

      this.logger.log(`Загрузка PDF: заказ ${orderId}, чертеж ${drawingNumber}, опции: ${JSON.stringify(options)}`);

      return await this.pdfEnhancedService.uploadPdf(
        parseInt(orderId),
        drawingNumber,
        file,
        options
      );
    } catch (error) {
      this.logger.error(`Ошибка загрузки PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('orders/:orderId/info')
  @ApiOperation({ summary: 'Получить информацию о PDF файле заказа' })
  @ApiResponse({ status: 200, description: 'Информация о PDF файле' })
  async getPdfInfo(@Param('orderId') orderId: string) {
    try {
      return await this.pdfEnhancedService.getPdfInfo(parseInt(orderId));
    } catch (error) {
      this.logger.error(`Ошибка получения информации о PDF: ${error.message}`);
      throw new BadRequestException('Ошибка получения информации о PDF');
    }
  }

  @Get('by-drawing/:drawingNumber')
  @ApiOperation({ summary: 'Получить список PDF файлов для чертежа' })
  @ApiResponse({ status: 200, description: 'Список PDF файлов для чертежа' })
  async getPdfsByDrawingNumber(@Param('drawingNumber') drawingNumber: string) {
    try {
      return await this.pdfEnhancedService.getPdfsByDrawingNumber(drawingNumber);
    } catch (error) {
      this.logger.error(`Ошибка получения PDF для чертежа: ${error.message}`);
      throw new BadRequestException('Ошибка получения PDF для чертежа');
    }
  }

  @Delete('orders/:orderId')
  @ApiOperation({ summary: 'Удалить PDF файл заказа' })
  @ApiResponse({ status: 200, description: 'PDF файл удален' })
  async deletePdf(
    @Param('orderId') orderId: string,
    @Query('archive') archive?: string
  ) {
    try {
      const options = { archive: archive === 'true' };
      await this.pdfEnhancedService.deletePdf(parseInt(orderId), options);
      return { message: 'PDF файл успешно удален' };
    } catch (error) {
      this.logger.error(`Ошибка удаления PDF: ${error.message}`);
      throw error;
    }
  }

  @Get('file/:drawingNumber/:fileName')
  @ApiOperation({ summary: 'Получить PDF файл по чертежу и имени файла' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getPdfFile(
    @Param('drawingNumber') drawingNumber: string,
    @Param('fileName') fileName: string,
    @Res() res: Response
  ) {
    try {
      const filePath = join(this.pdfPath, drawingNumber, fileName);
      
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException('PDF файл не найден');
      }

      const stats = await fs.stat(filePath);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Ошибка получения PDF файла: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Ошибка получения PDF файла');
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Получить статистику по PDF файлам' })
  @ApiResponse({ status: 200, description: 'Статистика PDF файлов' })
  async getPdfStatistics() {
    try {
      return await this.pdfEnhancedService.getPdfStatistics();
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw new BadRequestException('Ошибка получения статистики');
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Очистить устаревшие PDF файлы' })
  @ApiResponse({ status: 200, description: 'Результат очистки' })
  async cleanupOrphanedFiles() {
    try {
      const result = await this.pdfEnhancedService.cleanupOrphanedFiles();
      return {
        message: 'Очистка завершена успешно',
        ...result
      };
    } catch (error) {
      this.logger.error(`Ошибка очистки файлов: ${error.message}`);
      throw new BadRequestException('Ошибка очистки файлов');
    }
  }

  @Get('preview/:drawingNumber/:fileName')
  @ApiOperation({ summary: 'Получить превью PDF файла' })
  @ApiResponse({ status: 200, description: 'Превью PDF файла' })
  async getPdfPreview(
    @Param('drawingNumber') drawingNumber: string,
    @Param('fileName') fileName: string,
    @Query('page') page: string = '1'
  ) {
    try {
      const filePath = join(this.pdfPath, drawingNumber, fileName);
      
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundException('PDF файл не найден');
      }

      // Возвращаем информацию о файле для создания превью на клиенте
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        filePath: `${drawingNumber}/${fileName}`,
        fileName,
        fileSize: stats.size,
        pageNumber: parseInt(page),
        downloadUrl: `/api/pdf-enhanced/file/${drawingNumber}/${fileName}`,
        previewUrl: `/api/pdf-enhanced/file/${drawingNumber}/${fileName}#page=${page}`
      };
    } catch (error) {
      this.logger.error(`Ошибка получения превью PDF: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Ошибка получения превью PDF');
    }
  }
}
