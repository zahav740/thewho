/**
 * @file: pdf-enhanced.controller.ts (ИСПРАВЛЕННЫЙ)
 * @description: Контроллер для работы с улучшенным модулем PDF с исправлениями
 * @dependencies: pdf-enhanced.service
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Полное исправление PDF модуля
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
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfEnhancedService, PdfUploadResult, PdfDuplicateCheck } from './pdf-enhanced.service.FIXED';
import { join } from 'path';
import { promises as fs, existsSync } from 'fs';
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
  @ApiOperation({ summary: 'ИСПРАВЛЕНО: Получить PDF файл по чертежу и имени файла' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getPdfFile(
    @Param('drawingNumber') drawingNumber: string,
    @Param('fileName') fileName: string,
    @Query('download') download?: string,
    @Res({ passthrough: true }) res?: Response
  ): Promise<StreamableFile> {
    try {
      this.logger.log(`📄 Запрос PDF файла: ${drawingNumber}/${fileName}`);
      
      // Проверяем папку чертежа
      const drawingPath = join(this.pdfPath, drawingNumber, fileName);
      this.logger.log(`🔍 Проверка папки чертежа: ${drawingPath}`);
      
      let filePath = drawingPath;
      let exists = existsSync(drawingPath);
      
      if (!exists) {
        // Проверяем основную папку PDF
        const mainPath = join(this.pdfPath, fileName);
        this.logger.log(`🔍 Проверка основной папки: ${mainPath}`);
        
        exists = existsSync(mainPath);
        if (exists) {
          filePath = mainPath;
        }
      }
      
      if (!exists) {
        this.logger.error(`❌ PDF файл не найден: ${fileName} в чертеже ${drawingNumber}`);
        throw new NotFoundException('PDF файл не найден');
      }

      this.logger.log(`✅ PDF файл найден: ${filePath}`);

      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      
      const contentDisposition = download === 'true' 
        ? `attachment; filename="${fileName}"`
        : `inline; filename="${fileName}"`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Кеш на 1 год
        'Last-Modified': stats.mtime.toUTCString(),
        'ETag': `"${stats.size}-${stats.mtime.getTime()}"`,
      });

      return new StreamableFile(buffer);
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
      // Проверяем папку чертежа
      const drawingPath = join(this.pdfPath, drawingNumber, fileName);
      let filePath = drawingPath;
      let exists = existsSync(drawingPath);
      
      if (!exists) {
        // Проверяем основную папку PDF
        const mainPath = join(this.pdfPath, fileName);
        exists = existsSync(mainPath);
        if (exists) {
          filePath = mainPath;
        }
      }
      
      if (!exists) {
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
        downloadUrl: `/api/pdf-enhanced/file/${drawingNumber}/${fileName}?download=true`,
        previewUrl: `/api/pdf-enhanced/file/${drawingNumber}/${fileName}#page=${page}`,
        directUrl: `/api/pdf-enhanced/file/${drawingNumber}/${fileName}`
      };
    } catch (error) {
      this.logger.error(`Ошибка получения превью PDF: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Ошибка получения превью PDF');
    }
  }

  @Get('debug/structure')
  @ApiOperation({ summary: 'ДИАГНОСТИКА: Проверить структуру папок PDF' })
  @ApiResponse({ status: 200, description: 'Информация о структуре папок' })
  async debugPdfStructure() {
    try {
      const result = {
        pdfPath: this.pdfPath,
        exists: existsSync(this.pdfPath),
        directories: [],
        files: [],
        totalSize: 0
      };

      if (result.exists) {
        const items = await fs.readdir(this.pdfPath, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(this.pdfPath, item.name);
          
          if (item.isDirectory()) {
            const subFiles = await fs.readdir(fullPath);
            result.directories.push({
              name: item.name,
              path: fullPath,
              files: subFiles.length,
              pdfFiles: subFiles.filter(f => f.endsWith('.pdf')).length
            });
          } else if (item.isFile() && item.name.endsWith('.pdf')) {
            const stats = await fs.stat(fullPath);
            result.files.push({
              name: item.name,
              path: fullPath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime
            });
            result.totalSize += stats.size;
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Ошибка диагностики структуры: ${error.message}`);
      throw new BadRequestException('Ошибка диагностики структуры');
    }
  }

  @Get('debug/file/:drawingNumber/:fileName')
  @ApiOperation({ summary: 'ДИАГНОСТИКА: Получить информацию о конкретном файле' })
  @ApiResponse({ status: 200, description: 'Диагностическая информация о файле' })
  async debugFileInfo(
    @Param('drawingNumber') drawingNumber: string,
    @Param('fileName') fileName: string
  ) {
    try {
      const possiblePaths = [
        join(this.pdfPath, drawingNumber, fileName),
        join(this.pdfPath, fileName),
        join(process.cwd(), 'uploads', 'orders', fileName),
        join(process.cwd(), 'uploads', fileName)
      ];

      const results = [];

      for (const path of possiblePaths) {
        const exists = existsSync(path);
        let fileInfo = null;
        
        if (exists) {
          const stats = await fs.stat(path);
          fileInfo = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
          };
        }

        results.push({
          path,
          exists,
          fileInfo
        });
      }

      return {
        drawingNumber,
        fileName,
        searchResults: results,
        foundFiles: results.filter(r => r.exists),
        recommendations: this.generateFileRecoveryRecommendations(results)
      };
    } catch (error) {
      this.logger.error(`Ошибка диагностики файла: ${error.message}`);
      throw new BadRequestException('Ошибка диагностики файла');
    }
  }

  private generateFileRecoveryRecommendations(results: any[]): string[] {
    const recommendations = [];
    const foundFiles = results.filter(r => r.exists);
    
    if (foundFiles.length === 0) {
      recommendations.push('Файл не найден ни в одном из возможных местоположений');
      recommendations.push('Проверьте, что файл был действительно загружен');
      recommendations.push('Проверьте права доступа к папкам uploads');
    } else if (foundFiles.length === 1) {
      const found = foundFiles[0];
      recommendations.push(`Файл найден в: ${found.path}`);
      if (!found.path.includes('uploads/pdf/')) {
        recommendations.push('Файл находится не в ожидаемом месте, рекомендуется переместить');
      }
    } else {
      recommendations.push(`Найдено ${foundFiles.length} копий файла`);
      recommendations.push('Рекомендуется удалить дублирующие файлы');
    }
    
    return recommendations;
  }
}
