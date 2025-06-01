/**
 * @file: files.service.ts
 * @description: Сервис для работы с файлами
 * @dependencies: fs, path
 * @created: 2025-01-28
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import type { Express } from 'express';

@Injectable()
export class FilesService {
  private readonly uploadsPath = join(process.cwd(), 'uploads');
  private readonly pdfPath = join(this.uploadsPath, 'pdf');
  private readonly excelPath = join(this.uploadsPath, 'excel');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    const dirs = [this.uploadsPath, this.pdfPath, this.excelPath];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    const targetPath = folder ? join(this.uploadsPath, folder) : this.uploadsPath;
    await fs.mkdir(targetPath, { recursive: true });
    
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(targetPath, filename);
    
    await fs.writeFile(filepath, file.buffer);
    
    return filename;
  }

  async getFile(filename: string, folder: string = ''): Promise<Buffer> {
    const filepath = folder 
      ? join(this.uploadsPath, folder, filename)
      : join(this.uploadsPath, filename);
    
    try {
      return await fs.readFile(filepath);
    } catch (error) {
      throw new NotFoundException('Файл не найден');
    }
  }

  async deleteFile(filename: string, folder: string = ''): Promise<void> {
    const filepath = folder 
      ? join(this.uploadsPath, folder, filename)
      : join(this.uploadsPath, filename);
    
    try {
      await fs.unlink(filepath);
    } catch (error) {
      throw new NotFoundException('Файл не найден');
    }
  }

  async parseExcel(file: Express.Multer.File): Promise<{
    headers: string[];
    rows: any[];
    sheetsCount: number;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('Рабочий лист не найден');
    }

    const headers: string[] = [];
    const rows: any[] = [];

    // Получаем заголовки из первой строки
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      headers.push(cell.value?.toString() || '');
    });

    // Получаем данные
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });

    return {
      headers,
      rows,
      sheetsCount: workbook.worksheets.length,
    };
  }

  async generatePdfPreview(pdfBuffer: Buffer): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new BadRequestException('PDF файл не содержит страниц');
      }

      // Получаем первую страницу для превью
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Создаем новый PDF с только первой страницей
      const previewDoc = await PDFDocument.create();
      const [copiedPage] = await previewDoc.copyPages(pdfDoc, [0]);
      previewDoc.addPage(copiedPage);
      
      const previewBytes = await previewDoc.save();
      const previewBase64 = Buffer.from(previewBytes).toString('base64');
      
      return `data:application/pdf;base64,${previewBase64}`;
    } catch (error) {
      throw new BadRequestException('Не удалось создать превью PDF');
    }
  }

  async listFiles(folder: string = ''): Promise<{
    filename: string;
    size: number;
    createdAt: Date;
  }[]> {
    const targetPath = folder 
      ? join(this.uploadsPath, folder)
      : this.uploadsPath;
    
    try {
      const files = await fs.readdir(targetPath);
      const fileInfo = [];
      
      for (const file of files) {
        const filepath = join(targetPath, file);
        const stats = await fs.stat(filepath);
        
        if (stats.isFile()) {
          fileInfo.push({
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime,
          });
        }
      }
      
      return fileInfo;
    } catch (error) {
      return [];
    }
  }

  async getFileInfo(filename: string, folder: string = '') {
    const filepath = folder 
      ? join(this.uploadsPath, folder, filename)
      : join(this.uploadsPath, filename);
    
    try {
      const stats = await fs.stat(filepath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile(),
        extension: filename.split('.').pop(),
      };
    } catch (error) {
      throw new NotFoundException('Файл не найден');
    }
  }
}
