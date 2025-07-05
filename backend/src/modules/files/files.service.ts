/**
 * @file: files.service.ts
 * @description: Исправленный сервис для работы с файлами (ИСПРАВЛЕНО: TypeScript ошибки)
 * @dependencies: fs, path
 * @created: 2025-01-28
 * @updated: 2025-06-09 // ИСПРАВЛЕНО: TypeScript типы и Excel парсинг
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import type { MulterFile } from '../../types/express';


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

  async uploadFile(file: MulterFile, folder: string = ''): Promise<string> {
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

  async parseExcel(file: MulterFile): Promise<{
    headers: string[];
    rows: any[];
    sheetsCount: number;
  }> {
    console.log('🔍 ИСПРАВЛЕННЫЙ parseExcel: Начало обработки файла:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      hasBuffer: !!file.buffer,
      bufferSize: file.buffer?.length
    });

    try {
      // Проверяем, что файл передан
      if (!file || !file.buffer) {
        console.error('❌ Файл или buffer отсутствует');
        throw new BadRequestException('Файл не предоставлен или поврежден');
      }

      // Проверяем размер файла
      if (file.buffer.length === 0) {
        console.error('❌ Пустой файл');
        throw new BadRequestException('Файл пустой');
      }

      console.log('✅ Файл прошел базовые проверки, загружаем через ExcelJS...');

      const workbook = new ExcelJS.Workbook();
      
      try {
        await workbook.xlsx.load(file.buffer);
        console.log('✅ Excel файл успешно загружен через ExcelJS');
      } catch (loadError) {
        console.error('❌ Ошибка загрузки Excel через ExcelJS:', loadError);
        throw new BadRequestException(`Ошибка чтения Excel файла: ${loadError.message}`);
      }

      // Проверяем количество листов
      console.log(`📄 Количество листов в файле: ${workbook.worksheets.length}`);
      
      if (workbook.worksheets.length === 0) {
        throw new BadRequestException('Excel файл не содержит рабочих листов');
      }

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new BadRequestException('Первый рабочий лист не найден');
      }

      console.log('📊 Информация о рабочем листе:', {
        name: worksheet.name,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount
      });

      const headers: string[] = [];
      const rows: any[] = [];

      try {
        // ИСПРАВЛЕНО: Безопасное получение заголовков из первой строки
        const headerRow = worksheet.getRow(1);
        
        if (headerRow && headerRow.cellCount > 0) {
          console.log(`📋 Обработка заголовков из ${headerRow.cellCount} ячеек...`);
          
          // Используем более безопасный способ получения ячеек
          for (let colNum = 1; colNum <= Math.min(headerRow.cellCount, 50); colNum++) {
            try {
              const cell = headerRow.getCell(colNum);
              const cellValue = this.safeCellValue(cell);
              // ИСПРАВЛЕНО: Безопасное приведение к строке для заголовков
              const headerValue = cellValue !== null ? String(cellValue) : `Колонка ${colNum}`;
              headers.push(headerValue);
            } catch (cellError) {
              console.warn(`⚠️ Ошибка при чтении ячейки заголовка ${colNum}:`, cellError);
              headers.push(`Колонка ${colNum}`);
            }
          }
          
          console.log('✅ Заголовки получены:', headers.slice(0, 10)); // Показываем первые 10
        } else {
          // Если заголовков нет, создаем их автоматически
          console.log('⚠️ Заголовки не найдены, создаем автоматически');
          for (let i = 1; i <= 10; i++) {
            headers.push(`Колонка ${i}`);
          }
        }

        // ИСПРАВЛЕНО: Безопасное получение данных из строк
        let processedRows = 0;
        const maxRows = Math.min(worksheet.rowCount, 1000); // Ограничиваем обработку 1000 строками
        
        console.log(`📊 Начинаем обработку ${maxRows} строк данных...`);

        for (let rowNum = 2; rowNum <= maxRows; rowNum++) {
          try {
            const row = worksheet.getRow(rowNum);
            
            if (!row || row.cellCount === 0) {
              continue; // Пропускаем пустые строки
            }

            const rowData: any = {};
            let hasData = false;

            // Обрабатываем ячейки безопасно
            for (let colNum = 1; colNum <= headers.length; colNum++) {
              try {
                const cell = row.getCell(colNum);
                const cellValue = this.safeCellValue(cell);
                const header = headers[colNum - 1];
                
                if (header && cellValue !== null && cellValue !== '') {
                  rowData[header] = cellValue;
                  hasData = true;
                }
              } catch (cellError) {
                console.warn(`⚠️ Ошибка при чтении ячейки [${rowNum},${colNum}]:`, cellError);
                // Продолжаем обработку других ячеек
              }
            }

            if (hasData) {
              rows.push(rowData);
              processedRows++;
            }

            // Логируем прогресс каждые 100 строк
            if (processedRows % 100 === 0) {
              console.log(`📈 Обработано ${processedRows} строк...`);
            }

          } catch (rowError) {
            console.warn(`⚠️ Ошибка при обработке строки ${rowNum}:`, rowError);
            // Продолжаем обработку следующих строк
          }
        }

        console.log('✅ ИСПРАВЛЕННЫЙ parseExcel: Обработка завершена:', {
          headers: headers.length,
          rows: rows.length,
          sheetsCount: workbook.worksheets.length,
          processedRows
        });

        return {
          headers,
          rows,
          sheetsCount: workbook.worksheets.length,
        };

      } catch (processingError) {
        console.error('❌ Ошибка при обработке данных Excel:', processingError);
        throw new BadRequestException(`Ошибка обработки данных Excel: ${processingError.message}`);
      }

    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ошибка в parseExcel:', error);
      
      // Если это уже BadRequestException, пробрасываем как есть
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Для других ошибок создаем понятное сообщение
      throw new BadRequestException(`Не удалось обработать Excel файл: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * ИСПРАВЛЕНО: Безопасное извлечение значения из ячейки Excel с правильными типами
   */
  private safeCellValue(cell: ExcelJS.Cell): string | number | null {
    try {
      if (!cell) {
        return null;
      }

      const value = cell.value;
      
      if (value === null || value === undefined) {
        return null;
      }

      // Обрабатываем разные типы значений
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }

      // ИСПРАВЛЕНО: Обрабатываем формулы с правильной типизацией
      if (typeof value === 'object' && value !== null && 'result' in value) {
        const formulaValue = value as { result: any };
        const result = formulaValue.result;
        if (typeof result === 'string' || typeof result === 'number') {
          return result;
        }
        if (result === null || result === undefined) {
          return null;
        }
        // Приводим к строке остальные типы
        return String(result);
      }

      // Обрабатываем даты
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]; // Возвращаем дату в формате YYYY-MM-DD
      }

      // ИСПРАВЛЕНО: Обрабатываем богатый текст (rich text) с правильной типизацией
      if (typeof value === 'object' && value !== null && 'richText' in value) {
        const richTextValue = value as { richText: any[] };
        const richText = richTextValue.richText;
        if (Array.isArray(richText)) {
          return richText.map((rt: any) => rt.text || '').join('') || null;
        }
        return null;
      }

      // Обрабатываем булевы значения
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }

      // Для всех остальных случаев пытаемся преобразовать в строку
      return String(value);

    } catch (error) {
      console.warn('⚠️ Ошибка при извлечении значения ячейки:', error);
      return null;
    }
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