/**
 * @file: pdf-debug.controller.ts
 * @description: Контроллер для диагностики и исправления PDF проблем
 * @created: 2025-07-07
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { join } from 'path';
import { promises as fs } from 'fs';

@ApiTags('pdf-debug')
@Controller('pdf-debug')
export class PdfDebugController {
  private readonly logger = new Logger(PdfDebugController.name);
  private readonly pdfPath = join(process.cwd(), 'uploads', 'pdf');

  constructor(private readonly ordersService: OrdersService) {}

  @Get('order/:id/info')
  @ApiOperation({ summary: 'Получить детальную информацию о PDF заказа' })
  async getOrderPdfInfo(@Param('id') id: string) {
    try {
      this.logger.log(`🔍 Диагностика PDF для заказа ${id}`);
      
      const order = await this.ordersService.findOne(id);
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      const result = {
        orderId: id,
        drawingNumber: order.drawingNumber,
        pdfPath: order.pdfPath,
        pdfPathExists: false,
        physicalFileExists: false,
        uploadDirectory: this.pdfPath,
        searchResults: []
      };

      // Проверяем путь к PDF в БД
      if (order.pdfPath) {
        const fullPath = join(this.pdfPath, order.pdfPath);
        this.logger.log(`📄 Проверяем файл: ${fullPath}`);
        
        try {
          await fs.access(fullPath);
          result.physicalFileExists = true;
          result.pdfPathExists = true;
          
          const stats = await fs.stat(fullPath);
          result.searchResults.push({
            path: fullPath,
            exists: true,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          this.logger.warn(`❌ Файл не найден: ${fullPath}`);
          result.searchResults.push({
            path: fullPath,
            exists: false,
            error: error.message
          });
        }
      }

      // Ищем все PDF файлы в папке uploads/pdf
      try {
        const allFiles = await this.findAllPdfFiles();
        const matchingFiles = allFiles.filter(file => 
          file.name.includes(order.drawingNumber) || 
          file.name.includes(id)
        );
        
        result.searchResults.push(...matchingFiles.map(file => ({
          path: file.path,
          name: file.name,
          size: file.size,
          modified: file.modified,
          possibleMatch: true
        })));
      } catch (error) {
        this.logger.error(`Ошибка поиска файлов: ${error.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Ошибка диагностики PDF: ${error.message}`);
      throw error;
    }
  }

  @Get('order/:id/fix')
  @ApiOperation({ summary: 'Попытка автоматического исправления пути к PDF' })
  async fixOrderPdf(@Param('id') id: string) {
    try {
      this.logger.log(`🔧 Попытка исправления PDF для заказа ${id}`);
      
      const order = await this.ordersService.findOne(id);
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      // Ищем файлы, которые могут принадлежать этому заказу
      const allFiles = await this.findAllPdfFiles();
      const matchingFiles = allFiles.filter(file => 
        file.name.includes(order.drawingNumber) || 
        file.name.includes(id)
      );

      if (matchingFiles.length === 0) {
        return {
          success: false,
          message: 'Не найдено подходящих PDF файлов для заказа',
          orderId: id,
          drawingNumber: order.drawingNumber
        };
      }

      // Берем первый найденный файл
      const bestMatch = matchingFiles[0];
      const relativePath = bestMatch.path.replace(this.pdfPath + '\\', '').replace(/\\/g, '/');
      
      this.logger.log(`✅ Найден подходящий файл: ${relativePath}`);
      
      // Обновляем путь в заказе
      await this.ordersService.uploadPdf(id, relativePath);
      
      return {
        success: true,
        message: 'PDF путь успешно исправлен',
        orderId: id,
        drawingNumber: order.drawingNumber,
        oldPath: order.pdfPath,
        newPath: relativePath,
        fileName: bestMatch.name
      };
    } catch (error) {
      this.logger.error(`Ошибка исправления PDF: ${error.message}`);
      throw new BadRequestException(`Ошибка исправления PDF: ${error.message}`);
    }
  }

  @Get('order/:id/file')
  @ApiOperation({ summary: 'Получить PDF файл заказа с автоисправлением' })
  async getOrderPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      this.logger.log(`📁 Получение PDF для заказа ${id}`);
      
      const order = await this.ordersService.findOne(id);
      if (!order) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }

      let filePath: string;

      // Если есть путь в БД, проверяем его
      if (order.pdfPath) {
        filePath = join(this.pdfPath, order.pdfPath);
        try {
          await fs.access(filePath);
          // Файл найден, отправляем его
          return this.sendPdfFile(res, filePath, `${order.drawingNumber}.pdf`);
        } catch {
          this.logger.warn(`❌ Файл не найден по сохраненному пути: ${filePath}`);
        }
      }

      // Пытаемся найти файл автоматически
      const allFiles = await this.findAllPdfFiles();
      const matchingFiles = allFiles.filter(file => 
        file.name.includes(order.drawingNumber) || 
        file.name.includes(id)
      );

      if (matchingFiles.length > 0) {
        const bestMatch = matchingFiles[0];
        this.logger.log(`✅ Найден файл автоматически: ${bestMatch.name}`);
        
        // Автоматически исправляем путь в БД
        const relativePath = bestMatch.path.replace(this.pdfPath + '\\', '').replace(/\\/g, '/');
        await this.ordersService.uploadPdf(id, relativePath);
        
        return this.sendPdfFile(res, bestMatch.path, bestMatch.name);
      }

      // Файл не найден
      return res.status(404).json({
        message: 'PDF файл не найден',
        orderId: id,
        drawingNumber: order.drawingNumber,
        suggestion: 'Попробуйте загрузить PDF файл заново'
      });
    } catch (error) {
      this.logger.error(`Ошибка получения PDF: ${error.message}`);
      return res.status(500).json({ 
        message: 'Ошибка сервера при получении PDF',
        error: error.message 
      });
    }
  }

  @Get('files/list')
  @ApiOperation({ summary: 'Получить список всех PDF файлов' })
  async listAllPdfFiles() {
    try {
      const files = await this.findAllPdfFiles();
      return {
        totalFiles: files.length,
        uploadDirectory: this.pdfPath,
        files: files.map(file => ({
          name: file.name,
          path: file.path.replace(this.pdfPath, ''),
          size: file.size,
          modified: file.modified
        }))
      };
    } catch (error) {
      this.logger.error(`Ошибка получения списка файлов: ${error.message}`);
      throw new BadRequestException('Ошибка получения списка файлов');
    }
  }

  private async findAllPdfFiles(): Promise<Array<{
    name: string;
    path: string;
    size: number;
    modified: Date;
  }>> {
    const files: Array<{ name: string; path: string; size: number; modified: Date; }> = [];
    
    try {
      // Проверяем основную папку
      const mainFiles = await fs.readdir(this.pdfPath);
      for (const file of mainFiles) {
        const filePath = join(this.pdfPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && file.toLowerCase().endsWith('.pdf')) {
          files.push({
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          });
        } else if (stats.isDirectory()) {
          // Проверяем подпапки
          try {
            const subFiles = await fs.readdir(filePath);
            for (const subFile of subFiles) {
              const subFilePath = join(filePath, subFile);
              const subStats = await fs.stat(subFilePath);
              
              if (subStats.isFile() && subFile.toLowerCase().endsWith('.pdf')) {
                files.push({
                  name: subFile,
                  path: subFilePath,
                  size: subStats.size,
                  modified: subStats.mtime
                });
              }
            }
          } catch (error) {
            this.logger.warn(`Ошибка чтения подпапки ${filePath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка поиска PDF файлов: ${error.message}`);
    }
    
    return files;
  }

  private async sendPdfFile(res: Response, filePath: string, fileName: string) {
    try {
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
      this.logger.error(`Ошибка отправки файла: ${error.message}`);
      res.status(500).json({ message: 'Ошибка отправки файла' });
    }
  }
}
