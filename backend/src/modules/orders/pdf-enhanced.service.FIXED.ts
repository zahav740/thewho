/**
 * @file: pdf-enhanced.service.ts
 * @description: ИСПРАВЛЕННЫЙ сервис для работы с PDF файлами
 * @dependencies: TypeORM, path, fs, crypto
 * @created: 2025-07-08
 * @updated: 2025-07-08 - Полное исправление PDF модуля
 */
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { promises as fs, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import * as crypto from 'crypto';

export interface PdfUploadResult {
  success: boolean;
  filename: string;
  path: string;
  size: number;
  hash: string;
  orderId: number;
  drawingNumber: string;
  action: 'uploaded' | 'replaced' | 'revision' | 'existing';
  message: string;
  url: string;
  previewUrl: string;
}

export interface PdfDuplicateCheck {
  isDuplicate: boolean;
  existingFiles: Array<{
    filename: string;
    path: string;
    orderId: number;
    drawingNumber: string;
    hash: string;
    size: number;
    createdAt: Date;
  }>;
  duplicateType: 'none' | 'hash' | 'name' | 'both';
  hash: string;
}

export interface PdfUploadOptions {
  replaceDuplicate?: boolean;
  useExisting?: boolean;
  createRevision?: boolean;
}

@Injectable()
export class PdfEnhancedService {
  private readonly logger = new Logger(PdfEnhancedService.name);
  private readonly uploadsPath = join(process.cwd(), 'uploads');
  private readonly pdfPath = join(this.uploadsPath, 'pdf');

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = [this.uploadsPath, this.pdfPath];
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Проверить дубликат PDF по номеру чертежа
   */
  async checkDuplicateByDrawingNumber(drawingNumber: string): Promise<PdfDuplicateCheck> {
    try {
      const orders = await this.orderRepository.find({
        where: { drawingNumber },
        select: ['id', 'drawingNumber', 'pdfPath', 'createdAt']
      });

      const existingFiles = [];
      
      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = this.getFilePath(order.pdfPath, drawingNumber);
          
          if (existsSync(filePath)) {
            const stats = await fs.stat(filePath);
            const buffer = await fs.readFile(filePath);
            const hash = crypto.createHash('md5').update(buffer).digest('hex');
            
            existingFiles.push({
              filename: order.pdfPath,
              path: filePath,
              orderId: order.id,
              drawingNumber: order.drawingNumber,
              hash,
              size: stats.size,
              createdAt: order.createdAt
            });
          }
        }
      }

      return {
        isDuplicate: existingFiles.length > 0,
        existingFiles,
        duplicateType: existingFiles.length > 0 ? 'name' : 'none',
        hash: existingFiles[0]?.hash || ''
      };

    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка проверки дубликата');
    }
  }

  /**
   * Проверить дубликат PDF по хешу файла
   */
  async checkDuplicateByHash(fileHash: string): Promise<PdfDuplicateCheck> {
    try {
      // Поиск по всем PDF файлам в базе
      const orders = await this.orderRepository.find({
        where: { pdfPath: Not(IsNull()) },
        select: ['id', 'drawingNumber', 'pdfPath', 'createdAt']
      });

      const existingFiles = [];

      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = this.getFilePath(order.pdfPath, order.drawingNumber);
          
          if (existsSync(filePath)) {
            const buffer = await fs.readFile(filePath);
            const hash = crypto.createHash('md5').update(buffer).digest('hex');
            
            if (hash === fileHash) {
              const stats = await fs.stat(filePath);
              existingFiles.push({
                filename: order.pdfPath,
                path: filePath,
                orderId: order.id,
                drawingNumber: order.drawingNumber,
                hash,
                size: stats.size,
                createdAt: order.createdAt
              });
            }
          }
        }
      }

      return {
        isDuplicate: existingFiles.length > 0,
        existingFiles,
        duplicateType: existingFiles.length > 0 ? 'hash' : 'none',
        hash: fileHash
      };

    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата по хешу: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка проверки дубликата по хешу');
    }
  }

  /**
   * Загрузить PDF файл для заказа
   */
  async uploadPdf(
    orderId: number,
    drawingNumber: string,
    file: Express.Multer.File,
    options: PdfUploadOptions = {}
  ): Promise<PdfUploadResult> {
    try {
      this.logger.log(`Загрузка PDF: заказ ${orderId}, чертеж ${drawingNumber}`);

      // Проверяем заказ
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Заказ ${orderId} не найден`);
      }

      // Создаем хеш файла
      const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
      
      // Проверяем дубликаты
      const duplicateCheck = await this.checkDuplicateByHash(fileHash);
      
      if (duplicateCheck.isDuplicate && options.useExisting) {
        const existingFile = duplicateCheck.existingFiles[0];
        
        // Обновляем путь к файлу в заказе
        order.pdfPath = existingFile.filename;
        await this.orderRepository.save(order);
        
        return {
          success: true,
          filename: existingFile.filename,
          path: existingFile.path,
          size: existingFile.size,
          hash: fileHash,
          orderId,
          drawingNumber,
          action: 'existing',
          message: 'Используется существующий файл',
          url: this.generatePdfUrl(existingFile.filename, drawingNumber),
          previewUrl: this.generatePreviewUrl(existingFile.filename, drawingNumber)
        };
      }

      // Создаем папку для чертежа
      const drawingDir = join(this.pdfPath, drawingNumber);
      if (!existsSync(drawingDir)) {
        mkdirSync(drawingDir, { recursive: true });
      }

      // Генерируем имя файла
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      let filename = `${drawingNumber}_${timestamp}_${random}.pdf`;

      // Если создаем ревизию
      if (options.createRevision && order.pdfPath) {
        const revisionNumber = await this.getNextRevisionNumber(drawingNumber);
        filename = `${drawingNumber}_rev${revisionNumber}_${timestamp}.pdf`;
      }

      // Сохраняем файл
      const filePath = join(drawingDir, filename);
      await fs.writeFile(filePath, file.buffer);

      // Обновляем заказ
      const action = order.pdfPath && options.replaceDuplicate ? 'replaced' : 'uploaded';
      order.pdfPath = filename;
      await this.orderRepository.save(order);

      const result: PdfUploadResult = {
        success: true,
        filename,
        path: filePath,
        size: file.size,
        hash: fileHash,
        orderId,
        drawingNumber,
        action,
        message: `PDF файл ${action === 'replaced' ? 'заменен' : 'загружен'} успешно`,
        url: this.generatePdfUrl(filename, drawingNumber),
        previewUrl: this.generatePreviewUrl(filename, drawingNumber)
      };

      this.logger.log(`PDF загружен: ${filename} для заказа ${orderId}`);
      return result;

    } catch (error) {
      this.logger.error(`Ошибка загрузки PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Получить информацию о PDF файле заказа
   */
  async getPdfInfo(orderId: number) {
    try {
      const order = await this.orderRepository.findOne({ 
        where: { id: orderId },
        select: ['id', 'drawingNumber', 'pdfPath', 'createdAt']
      });

      if (!order) {
        throw new NotFoundException(`Заказ ${orderId} не найден`);
      }

      if (!order.pdfPath) {
        return {
          orderId,
          drawingNumber: order.drawingNumber,
          hasPdf: false,
          message: 'PDF файл не загружен'
        };
      }

      const filePath = this.getFilePath(order.pdfPath, order.drawingNumber);
      const exists = existsSync(filePath);

      let fileInfo = null;
      if (exists) {
        const stats = await fs.stat(filePath);
        const buffer = await fs.readFile(filePath);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        
        fileInfo = {
          filename: order.pdfPath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          hash,
          path: filePath
        };
      }

      return {
        orderId,
        drawingNumber: order.drawingNumber,
        hasPdf: true,
        filename: order.pdfPath,
        exists,
        fileInfo,
        url: exists ? this.generatePdfUrl(order.pdfPath, order.drawingNumber) : null,
        previewUrl: exists ? this.generatePreviewUrl(order.pdfPath, order.drawingNumber) : null,
        downloadUrl: exists ? this.generateDownloadUrl(order.pdfPath, order.drawingNumber) : null
      };

    } catch (error) {
      this.logger.error(`Ошибка получения информации о PDF: ${error.message}`);
      throw new BadRequestException('Ошибка получения информации о PDF');
    }
  }

  /**
   * Получить список PDF файлов для чертежа
   */
  async getPdfsByDrawingNumber(drawingNumber: string) {
    try {
      const orders = await this.orderRepository.find({
        where: { drawingNumber },
        select: ['id', 'drawingNumber', 'pdfPath', 'createdAt']
      });

      const pdfs = [];

      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = this.getFilePath(order.pdfPath, drawingNumber);
          const exists = existsSync(filePath);
          
          let fileInfo = null;
          if (exists) {
            const stats = await fs.stat(filePath);
            fileInfo = {
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            };
          }

          pdfs.push({
            orderId: order.id,
            filename: order.pdfPath,
            exists,
            fileInfo,
            url: exists ? this.generatePdfUrl(order.pdfPath, drawingNumber) : null,
            previewUrl: exists ? this.generatePreviewUrl(order.pdfPath, drawingNumber) : null
          });
        }
      }

      return {
        drawingNumber,
        totalFiles: pdfs.length,
        existingFiles: pdfs.filter(p => p.exists).length,
        pdfs
      };

    } catch (error) {
      this.logger.error(`Ошибка получения PDF для чертежа: ${error.message}`);
      throw new BadRequestException('Ошибка получения PDF для чертежа');
    }
  }

  /**
   * Удалить PDF файл заказа
   */
  async deletePdf(orderId: number, options: { archive?: boolean } = {}) {
    try {
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Заказ ${orderId} не найден`);
      }

      if (!order.pdfPath) {
        throw new NotFoundException('PDF файл не найден');
      }

      const filePath = this.getFilePath(order.pdfPath, order.drawingNumber);
      
      if (existsSync(filePath)) {
        if (options.archive) {
          // Архивируем файл вместо удаления
          const archiveDir = join(this.pdfPath, '_archived', order.drawingNumber);
          if (!existsSync(archiveDir)) {
            mkdirSync(archiveDir, { recursive: true });
          }
          
          const archivePath = join(archiveDir, `${Date.now()}_${order.pdfPath}`);
          await fs.rename(filePath, archivePath);
          
          this.logger.log(`PDF архивирован: ${order.pdfPath} -> ${archivePath}`);
        } else {
          await fs.unlink(filePath);
          this.logger.log(`PDF удален: ${filePath}`);
        }
      }

      // Обновляем заказ
      order.pdfPath = null;
      await this.orderRepository.save(order);

      return {
        success: true,
        message: options.archive ? 'PDF файл архивирован' : 'PDF файл удален',
        orderId,
        action: options.archive ? 'archived' : 'deleted'
      };

    } catch (error) {
      this.logger.error(`Ошибка удаления PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получить статистику по PDF файлам
   */
  async getPdfStatistics() {
    try {
      const totalOrders = await this.orderRepository.count();
      const ordersWithPdf = await this.orderRepository.count({
        where: { pdfPath: Not(IsNull()) }
      });
      
      const orders = await this.orderRepository.find({
        where: { pdfPath: Not(IsNull()) },
        select: ['id', 'drawingNumber', 'pdfPath']
      });

      let existingFiles = 0;
      let missingFiles = 0;
      let totalSize = 0;

      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = this.getFilePath(order.pdfPath, order.drawingNumber);
          if (existsSync(filePath)) {
            existingFiles++;
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
          } else {
            missingFiles++;
          }
        }
      }

      return {
        totalOrders,
        ordersWithPdf,
        ordersWithoutPdf: totalOrders - ordersWithPdf,
        existingFiles,
        missingFiles,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        coverage: Math.round((ordersWithPdf / totalOrders) * 100)
      };

    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw new BadRequestException('Ошибка получения статистики');
    }
  }

  /**
   * Очистить устаревшие PDF файлы
   */
  async cleanupOrphanedFiles() {
    try {
      let removedFiles = 0;
      let recoveredFiles = 0;
      
      // Получаем все заказы с PDF
      const orders = await this.orderRepository.find({
        where: { pdfPath: Not(IsNull()) },
        select: ['id', 'drawingNumber', 'pdfPath']
      });

      // Проверяем каждый заказ
      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = this.getFilePath(order.pdfPath, order.drawingNumber);
          
          if (!existsSync(filePath)) {
            // Пытаемся найти файл в других местах
            const recoveredPath = await this.tryRecoverFile(order.pdfPath, order.drawingNumber);
            
            if (recoveredPath) {
              recoveredFiles++;
              this.logger.log(`Файл восстановлен: ${order.pdfPath} -> ${recoveredPath}`);
            } else {
              // Очищаем ссылку на несуществующий файл
              order.pdfPath = null;
              await this.orderRepository.save(order);
              removedFiles++;
              this.logger.log(`Очищена ссылка на несуществующий файл: ${order.pdfPath}`);
            }
          }
        }
      }

      return {
        removedFiles,
        recoveredFiles,
        checkedOrders: orders.length,
        message: `Проверено ${orders.length} заказов, удалено ${removedFiles} ссылок, восстановлено ${recoveredFiles} файлов`
      };

    } catch (error) {
      this.logger.error(`Ошибка очистки файлов: ${error.message}`);
      throw new BadRequestException('Ошибка очистки файлов');
    }
  }

  // Вспомогательные методы

  private getFilePath(filename: string, drawingNumber: string): string {
    // Сначала ищем в папке чертежа
    const drawingPath = join(this.pdfPath, drawingNumber, filename);
    if (existsSync(drawingPath)) {
      return drawingPath;
    }
    
    // Затем в основной папке PDF
    const mainPath = join(this.pdfPath, filename);
    return mainPath;
  }

  private async tryRecoverFile(filename: string, drawingNumber: string): Promise<string | null> {
    const possiblePaths = [
      join(this.pdfPath, filename),
      join(this.pdfPath, drawingNumber, filename),
      join(this.uploadsPath, filename),
      join(this.uploadsPath, 'orders', filename)
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        // Перемещаем файл в правильное место
        const correctPath = join(this.pdfPath, drawingNumber);
        if (!existsSync(correctPath)) {
          mkdirSync(correctPath, { recursive: true });
        }
        
        const targetPath = join(correctPath, filename);
        await fs.rename(path, targetPath);
        return targetPath;
      }
    }

    return null;
  }

  private async getNextRevisionNumber(drawingNumber: string): Promise<number> {
    const orders = await this.orderRepository.find({
      where: { drawingNumber },
      select: ['pdfPath']
    });

    let maxRevision = 0;
    for (const order of orders) {
      if (order.pdfPath) {
        const match = order.pdfPath.match(/_rev(\d+)_/);
        if (match) {
          const revision = parseInt(match[1], 10);
          if (revision > maxRevision) {
            maxRevision = revision;
          }
        }
      }
    }

    return maxRevision + 1;
  }

  private generatePdfUrl(filename: string, drawingNumber: string): string {
    return `/api/pdf-enhanced/file/${drawingNumber}/${filename}`;
  }

  private generatePreviewUrl(filename: string, drawingNumber: string): string {
    return `/api/pdf-enhanced/preview/${drawingNumber}/${filename}`;
  }

  private generateDownloadUrl(filename: string, drawingNumber: string): string {
    return `/api/pdf-enhanced/file/${drawingNumber}/${filename}?download=true`;
  }
}
