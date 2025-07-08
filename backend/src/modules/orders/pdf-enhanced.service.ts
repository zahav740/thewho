/**
 * @file: pdf-enhanced.service.ts
 * @description: Улучшенный сервис для работы с PDF файлами с организацией по папкам
 * @dependencies: fs, path, crypto, typeorm
 * @created: 2025-07-07
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import * as crypto from 'crypto';
import { FileHash } from '../../database/entities/file-hash.entity';
import { PdfRevision } from '../../database/entities/pdf-revision.entity';
import { Order } from '../../database/entities/order.entity';

export interface PdfUploadResult {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  uploadedAt: string;
  isDuplicate?: boolean;
  duplicateInfo?: {
    originalOrderId: number;
    originalDrawingNumber: string;
    originalFilePath: string;
  };
}

export interface PdfDuplicateCheck {
  isDuplicate: boolean;
  existingFile?: {
    orderId: number;
    drawingNumber: string;
    filePath: string;
    uploadedAt: string;
  };
}

@Injectable()
export class PdfEnhancedService {
  private readonly logger = new Logger(PdfEnhancedService.name);
  private readonly uploadsPath = join(process.cwd(), 'uploads');
  private readonly pdfPath = join(this.uploadsPath, 'pdf');

  constructor(
    @InjectRepository(FileHash)
    private readonly fileHashRepository: Repository<FileHash>,
    @InjectRepository(PdfRevision)
    private readonly pdfRevisionRepository: Repository<PdfRevision>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = [this.uploadsPath, this.pdfPath];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Создает папку для номера чертежа если её нет
   */
  private async ensureDrawingFolder(drawingNumber: string): Promise<string> {
    const folderPath = join(this.pdfPath, drawingNumber);
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
      this.logger.log(`Создана папка для чертежа: ${drawingNumber}`);
    }
    return folderPath;
  }

  /**
   * Вычисляет MD5 хеш файла
   */
  private calculateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  /**
   * Проверяет дубликат по номеру чертежа
   */
  async checkDuplicateByDrawingNumber(drawingNumber: string): Promise<PdfDuplicateCheck> {
    try {
      const existingFile = await this.fileHashRepository.findOne({
        where: { drawingNumber },
        relations: ['order'],
        order: { createdAt: 'DESC' }
      });

      if (existingFile) {
        return {
          isDuplicate: true,
          existingFile: {
            orderId: existingFile.order.id,
            drawingNumber: existingFile.drawingNumber,
            filePath: existingFile.filePath,
            uploadedAt: existingFile.createdAt.toISOString()
          }
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата по чертежу ${drawingNumber}: ${error.message}`);
      return { isDuplicate: false };
    }
  }

  /**
   * Проверяет дубликат по хешу файла
   */
  async checkDuplicateByHash(fileHash: string): Promise<PdfDuplicateCheck> {
    try {
      const existingFile = await this.fileHashRepository.findOne({
        where: { fileHash },
        relations: ['order']
      });

      if (existingFile) {
        return {
          isDuplicate: true,
          existingFile: {
            orderId: existingFile.order.id,
            drawingNumber: existingFile.drawingNumber,
            filePath: existingFile.filePath,
            uploadedAt: existingFile.createdAt.toISOString()
          }
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      this.logger.error(`Ошибка проверки дубликата по хешу ${fileHash}: ${error.message}`);
      return { isDuplicate: false };
    }
  }

  /**
   * Загружает PDF файл с организацией по папкам
   */
  async uploadPdf(
    orderId: number,
    drawingNumber: string,
    file: Express.Multer.File,
    options?: {
      replaceDuplicate?: boolean;
      useExisting?: boolean;
      createRevision?: boolean;
    }
  ): Promise<PdfUploadResult> {
    this.logger.log(`📁 Загрузка PDF для заказа ${orderId}, чертеж: ${drawingNumber}`);
    this.logger.log(`📄 Файл: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // Проверяем заказ
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${orderId} не найден`);
      }

      // Вычисляем хеш файла
      const fileHash = this.calculateFileHash(file.buffer);
      this.logger.log(`🔐 Хеш файла: ${fileHash}`);

      // Проверяем дубликаты
      const hashDuplicate = await this.checkDuplicateByHash(fileHash);
      const drawingDuplicate = await this.checkDuplicateByDrawingNumber(drawingNumber);

      // Если нашли дубликат и не разрешили замену/использование существующего
      if ((hashDuplicate.isDuplicate || drawingDuplicate.isDuplicate) && !options?.replaceDuplicate && !options?.useExisting) {
        return {
          success: false,
          filePath: '',
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
          uploadedAt: new Date().toISOString(),
          isDuplicate: true,
          duplicateInfo: {
            originalOrderId: hashDuplicate.existingFile?.orderId || drawingDuplicate.existingFile?.orderId || 0,
            originalDrawingNumber: hashDuplicate.existingFile?.drawingNumber || drawingDuplicate.existingFile?.drawingNumber || '',
            originalFilePath: hashDuplicate.existingFile?.filePath || drawingDuplicate.existingFile?.filePath || ''
          }
        };
      }

      // Если используем существующий файл
      if (options?.useExisting && drawingDuplicate.isDuplicate) {
        // Обновляем заказ, чтобы ссылался на существующий файл
        await this.orderRepository.update(orderId, { 
          pdfPath: drawingDuplicate.existingFile!.filePath 
        });

        return {
          success: true,
          filePath: drawingDuplicate.existingFile!.filePath,
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
          uploadedAt: new Date().toISOString(),
          isDuplicate: true,
          duplicateInfo: {
            originalOrderId: drawingDuplicate.existingFile!.orderId,
            originalDrawingNumber: drawingDuplicate.existingFile!.drawingNumber,
            originalFilePath: drawingDuplicate.existingFile!.filePath
          }
        };
      }

      // Создаем папку для чертежа
      const drawingFolder = await this.ensureDrawingFolder(drawingNumber);

      // Генерируем имя файла
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000000);
      const extension = extname(file.originalname) || '.pdf';
      const fileName = `${drawingNumber}_${timestamp}_${randomNum}${extension}`;
      const filePath = join(drawingFolder, fileName);

      // Сохраняем файл
      await fs.writeFile(filePath, file.buffer);
      this.logger.log(`💾 Файл сохранен: ${filePath}`);

      // Определяем относительный путь для БД
      const relativePath = join(drawingNumber, fileName);

      // Создаем/обновляем запись в file_hashes
      if (options?.replaceDuplicate && hashDuplicate.isDuplicate) {
        // Удаляем старый файл
        const oldFilePath = join(this.pdfPath, hashDuplicate.existingFile!.filePath);
        try {
          await fs.unlink(oldFilePath);
        } catch (error) {
          this.logger.warn(`Не удалось удалить старый файл: ${oldFilePath}`);
        }

        // Обновляем запись
        await this.fileHashRepository.update(
          { fileHash: hashDuplicate.existingFile!.filePath },
          {
            filename: fileName,
            originalName: file.originalname,
            fileSize: file.size,
            filePath: relativePath,
            drawingNumber,
            order,
            updatedAt: new Date()
          }
        );
      } else {
        // Создаем новую запись
        const fileHashRecord = this.fileHashRepository.create({
          fileHash,
          filename: fileName,
          originalName: file.originalname,
          fileSize: file.size,
          filePath: relativePath,
          drawingNumber,
          order
        });
        await this.fileHashRepository.save(fileHashRecord);
      }

      // Создаем ревизию если нужно
      if (options?.createRevision) {
        const nextRevision = await this.getNextRevisionNumber(orderId);
        const pdfRevision = this.pdfRevisionRepository.create({
          order,
          revisionNumber: nextRevision,
          filename: fileName,
          filePath: relativePath,
          fileSize: file.size,
          fileHash
        });
        await this.pdfRevisionRepository.save(pdfRevision);
        this.logger.log(`📋 Создана ревизия v${nextRevision} для заказа ${orderId}`);
      }

      // Обновляем заказ
      await this.orderRepository.update(orderId, { pdfPath: relativePath });

      this.logger.log(`✅ PDF успешно загружен для заказа ${orderId}`);

      return {
        success: true,
        filePath: relativePath,
        fileName,
        fileSize: file.size,
        fileHash,
        uploadedAt: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`❌ Ошибка загрузки PDF: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка загрузки PDF: ${error.message}`);
    }
  }

  /**
   * Получает следующий номер ревизии для заказа
   */
  private async getNextRevisionNumber(orderId: number): Promise<number> {
    const lastRevision = await this.pdfRevisionRepository.findOne({
      where: { order: { id: orderId } },
      order: { revisionNumber: 'DESC' }
    });

    return lastRevision ? lastRevision.revisionNumber + 1 : 1;
  }

  /**
   * Получает информацию о PDF файле заказа
   */
  async getPdfInfo(orderId: number): Promise<{
    exists: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
  }> {
    try {
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order || !order.pdfPath) {
        return { exists: false };
      }

      const fileInfo = await this.fileHashRepository.findOne({
        where: { filePath: order.pdfPath },
        relations: ['order']
      });

      if (!fileInfo) {
        return { exists: false };
      }

      return {
        exists: true,
        filePath: fileInfo.filePath,
        fileName: fileInfo.filename,
        fileSize: fileInfo.fileSize,
        uploadedAt: fileInfo.createdAt.toISOString()
      };
    } catch (error) {
      this.logger.error(`Ошибка получения информации о PDF для заказа ${orderId}: ${error.message}`);
      return { exists: false };
    }
  }

  /**
   * Получает список всех PDF файлов для чертежа
   */
  async getPdfsByDrawingNumber(drawingNumber: string): Promise<Array<{
    orderId: number;
    filePath: string;
    fileName: string;
    uploadedAt: string;
  }>> {
    try {
      const files = await this.fileHashRepository.find({
        where: { drawingNumber },
        relations: ['order'],
        order: { createdAt: 'DESC' }
      });

      return files.map(file => ({
        orderId: file.order.id,
        filePath: file.filePath,
        fileName: file.filename,
        uploadedAt: file.createdAt.toISOString()
      }));
    } catch (error) {
      this.logger.error(`Ошибка получения PDF для чертежа ${drawingNumber}: ${error.message}`);
      return [];
    }
  }

  /**
   * Удаляет PDF файл
   */
  async deletePdf(orderId: number, options?: { archive?: boolean }): Promise<void> {
    this.logger.log(`🗑️ Удаление PDF для заказа ${orderId}`);

    try {
      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order || !order.pdfPath) {
        throw new NotFoundException(`PDF файл для заказа ${orderId} не найден`);
      }

      const fileInfo = await this.fileHashRepository.findOne({
        where: { filePath: order.pdfPath }
      });

      // Удаляем физический файл
      const fullPath = join(this.pdfPath, order.pdfPath);
      try {
        await fs.unlink(fullPath);
        this.logger.log(`🗑️ Физический файл удален: ${fullPath}`);
      } catch (error) {
        this.logger.warn(`Не удалось удалить физический файл: ${fullPath}`);
      }

      // Удаляем записи из БД
      if (fileInfo) {
        await this.fileHashRepository.remove(fileInfo);
      }

      // Удаляем ревизии
      await this.pdfRevisionRepository.delete({ order: { id: orderId } });

      // Обновляем заказ
      await this.orderRepository.update(orderId, { pdfPath: null });

      this.logger.log(`✅ PDF удален для заказа ${orderId}`);
    } catch (error) {
      this.logger.error(`❌ Ошибка удаления PDF: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка удаления PDF: ${error.message}`);
    }
  }

  /**
   * Получает статистику по PDF файлам
   */
  async getPdfStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    byDrawingNumber: Record<string, number>;
    recentUploads: Array<{
      orderId: number;
      drawingNumber: string;
      fileName: string;
      uploadedAt: string;
    }>;
  }> {
    try {
      const files = await this.fileHashRepository.find({
        relations: ['order'],
        order: { createdAt: 'DESC' }
      });

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + Number(file.fileSize), 0);
      
      const byDrawingNumber: Record<string, number> = {};
      files.forEach(file => {
        byDrawingNumber[file.drawingNumber] = (byDrawingNumber[file.drawingNumber] || 0) + 1;
      });

      const recentUploads = files.slice(0, 10).map(file => ({
        orderId: file.order.id,
        drawingNumber: file.drawingNumber,
        fileName: file.filename,
        uploadedAt: file.createdAt.toISOString()
      }));

      return {
        totalFiles,
        totalSize,
        byDrawingNumber,
        recentUploads
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики PDF: ${error.message}`);
      throw new BadRequestException(`Ошибка получения статистики PDF: ${error.message}`);
    }
  }

  /**
   * Очищает устаревшие файлы
   */
  async cleanupOrphanedFiles(): Promise<{
    deletedFiles: number;
    freedSpace: number;
  }> {
    this.logger.log('🧹 Начинаем очистку устаревших файлов');

    try {
      let deletedFiles = 0;
      let freedSpace = 0;

      // Находим файлы в БД без соответствующих физических файлов
      const fileRecords = await this.fileHashRepository.find();
      
      for (const record of fileRecords) {
        const fullPath = join(this.pdfPath, record.filePath);
        try {
          await fs.access(fullPath);
        } catch {
          // Файл не существует, удаляем запись из БД
          await this.fileHashRepository.remove(record);
          deletedFiles++;
          freedSpace += Number(record.fileSize);
          this.logger.log(`🗑️ Удалена запись о несуществующем файле: ${record.filePath}`);
        }
      }

      // Ищем физические файлы без записей в БД
      const pdfFolders = await this.getAllPdfFolders();
      
      for (const folderPath of pdfFolders) {
        const files = await fs.readdir(folderPath);
        for (const fileName of files) {
          const filePath = join(folderPath, fileName);
          const relativePath = filePath.replace(this.pdfPath + '/', '');
          
          const exists = await this.fileHashRepository.findOne({
            where: { filePath: relativePath }
          });

          if (!exists) {
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            deletedFiles++;
            freedSpace += stats.size;
            this.logger.log(`🗑️ Удален файл-сирота: ${relativePath}`);
          }
        }
      }

      this.logger.log(`✅ Очистка завершена: удалено ${deletedFiles} файлов, освобождено ${(freedSpace / 1024 / 1024).toFixed(2)} MB`);

      return { deletedFiles, freedSpace };
    } catch (error) {
      this.logger.error(`❌ Ошибка очистки файлов: ${error.message}`);
      throw new BadRequestException(`Ошибка очистки файлов: ${error.message}`);
    }
  }

  /**
   * Получает все папки с PDF файлами
   */
  private async getAllPdfFolders(): Promise<string[]> {
    try {
      const items = await fs.readdir(this.pdfPath, { withFileTypes: true });
      const folders = items
        .filter(item => item.isDirectory())
        .map(item => join(this.pdfPath, item.name));
      return folders;
    } catch (error) {
      this.logger.error(`Ошибка получения списка папок: ${error.message}`);
      return [];
    }
  }
}
