/**
 * @file: orders.controller.ts
 * @description: Контроллер для управления заказами (обновленный)
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-05-28
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import type { Express } from 'express';
import { OrdersService } from './orders.service';
import { ExcelImportService, ImportResult } from './excel-import.service';
// import { ExcelImportEnhancedService, ColumnMapping } from './excel-import-enhanced.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { ImportExcelDto } from './dto/import-excel.dto';
import { Order } from '../../database/entities/order.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly excelImportService: ExcelImportService,
    // private readonly excelImportEnhancedService: ExcelImportEnhancedService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все заказы с фильтрацией и пагинацией' })
  async findAll(@Query() filterDto: OrdersFilterDto) {
    try {
      console.log('OrdersController.findAll: Получен запрос с фильтрами:', filterDto);
      const result = await this.ordersService.findAll(filterDto);
      console.log(`OrdersController.findAll: Возвращено ${result.data?.length || 0} заказов`);
      return result;
    } catch (error) {
      console.error('OrdersController.findAll error:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  async findOne(@Param('id') id: string): Promise<Order> {
    try {
      return await this.ordersService.findOne(id);
    } catch (error) {
      console.error(`Orders findOne error for id ${id}:`, error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ' })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заказ' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ' })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      console.log(`🗑️ OrdersController.remove: Получен запрос на удаление заказа с ID: ${id}`);
      await this.ordersService.remove(id);
      console.log(`✅ OrdersController.remove: Заказ ${id} успешно удалён`);
    } catch (error) {
      console.error(`❌ OrdersController.remove error for id ${id}:`, {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  @Delete('batch/selected')
  @ApiOperation({ summary: 'Удалить выбранные заказы' })
  async removeBatch(@Body('ids') ids: string[]): Promise<{ deleted: number }> {
    try {
      const deleted = await this.ordersService.removeBatch(ids);
      return { deleted };
    } catch (error) {
      console.error('Orders batch remove error:', error);
      throw error;
    }
  }

  @Delete('all/confirm')
  @ApiOperation({ summary: 'Удалить все заказы (с подтверждением)' })
  async removeAll(@Body('confirm') confirm: boolean): Promise<{ deleted: number }> {
    if (!confirm) {
      throw new Error('Подтверждение удаления обязательно');
    }
    try {
      const deleted = await this.ordersService.removeAll();
      return { deleted };
    } catch (error) {
      console.error('Orders remove all error:', error);
      throw error;
    }
  }

  @Post('upload-excel')
  @ApiOperation({ summary: 'ПРОДАКШЕН: Загрузить и обработать РЕАЛЬНЫЙ Excel файл (с buffer)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel', {
    // НЕ сохраняем на диск - работаем с buffer напрямую
    fileFilter: (req, file, cb) => {
      console.log('🔍 Проверка реального файла:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/octet-stream' // некоторые браузеры отправляют этот MIME type
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/);
      
      if (isValidType) {
        console.log('✅ Файл прошел проверку');
        cb(null, true);
      } else {
        console.error('❌ Недопустимый тип файла:', file.mimetype);
        cb(new Error('ПРОДАКШЕН: Только Excel файлы (.xlsx, .xls) разрешены'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB максимум
    },
  }))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      console.log('📁 ПРОДАКШЕН: Получен РЕАЛЬНЫЙ Excel файл (с buffer):', {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        hasBuffer: !!file.buffer,
        bufferSize: file.buffer?.length,
        body: body
      });

      // Проверяем, что файл действительно существует и есть buffer
      if (!file || !file.buffer) {
        console.error('❌ Отсутствует file.buffer!');
        throw new Error('ПУСТОЙ ИЛИ НЕКОРРЕКТНЫЙ ФАЙЛ - нет buffer');
      }

      if (file.buffer.length === 0) {
        console.error('❌ Пустой buffer!');
        throw new Error('ПУСТОЙ ФАЙЛ - buffer пустой');
      }

      console.log('✅ Файл прошел проверку, buffer доступен:', file.buffer.length, 'байт');

      // Парсим фильтры цветов из запроса
      let colorFilters: string[] = [];
      if (body.colorFilters) {
        try {
          colorFilters = JSON.parse(body.colorFilters);
          console.log('🎨 Применяем цветовые фильтры:', colorFilters);
        } catch {
          console.log('⚠️ Не удалось распарсить цветовые фильтры');
        }
      }

      // Используем существующий сервис импорта для обработки РЕАЛЬНЫХ данных
      console.log('🔄 Начинаем обработку реального Excel файла с buffer...');
      const result = await this.excelImportService.importOrders(file, colorFilters);
      
      console.log('✅ ПРОДАКШЕН: Импорт реальных данных завершен:', {
        created: result.created,
        updated: result.updated,
        errors: result.errors?.length || 0,
        firstErrorExample: result.errors?.[0] || 'Нет ошибок'
      });

      return {
        success: true,
        message: 'ПРОДАКШЕН: Реальный Excel файл успешно обработан',
        data: {
          created: result.created,
          updated: result.updated,
          totalRows: result.created + result.updated + result.errors.length,
          importedRows: result.created + result.updated,
          skippedRows: result.errors.length,
          errors: result.errors
        },
        file: {
          originalname: file.originalname,
          size: file.size,
          realFile: true, // Подтверждаем, что это реальный файл
          bufferProcessed: true // Подтверждаем, что обработали buffer
        }
      };
    } catch (error) {
      console.error('❌ ПРОДАКШЕН: Ошибка при импорте реального Excel:', error);
      return {
        success: false,
        error: 'ПРОДАКШЕН: Ошибка при обработке реального Excel файла',
        message: error.message,
        details: {
          hasFile: !!file,
          hasBuffer: !!file?.buffer,
          bufferSize: file?.buffer?.length || 0
        }
      };
    }
  }

  // Новый эндпоинт для улучшенного импорта Excel
  /*
  @Post('upload-excel')
  @ApiOperation({ summary: 'Загрузить и обработать Excel файл с настраиваемым маппингом колонок' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('excel'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('columnMapping') columnMappingStr: string,
  ) {
    // Отключено для исправления TypeScript ошибок
  }
  */

  // Legacy методы
  @Post('import-excel')
  @ApiOperation({ summary: 'Импортировать заказы из Excel файла (legacy)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportExcelDto,
  ): Promise<ImportResult> {
    return this.excelImportService.importOrders(file, importDto.colorFilters);
  }

  @Post(':id/upload-pdf')
  @ApiOperation({ summary: 'ПРОДАКШЕН: Загрузить PDF файл для заказа' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const path = require('path');
          const fs = require('fs');
          
          // Создаем абсолютный путь к папке uploads/pdf
          const uploadDir = path.join(process.cwd(), 'uploads', 'pdf');
          
          // Создаем папку если её нет
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`📁 Создана папка для PDF: ${uploadDir}`);
          }
          
          console.log(`📁 Сохранение PDF в: ${uploadDir}`);
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          console.log(`📄 Имя PDF файла: ${filename}`);
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log('📄 Проверка PDF файла:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
        
        if (file.mimetype === 'application/pdf') {
          console.log('✅ PDF файл прошел проверку');
          cb(null, true);
        } else {
          console.error('❌ Недопустимый тип файла для PDF:', file.mimetype);
          cb(new Error('ПРОДАКШЕН: Только PDF файлы разрешены'), false);
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB максимум для PDF
      },
    }),
  )
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Order> {
    try {
      console.log(`📁 ПРОДАКШЕН: Загрузка PDF для заказа ${id}:`, {
        originalname: file.originalname,
        filename: file.filename,
        size: file.size,
        path: file.path,
        destination: file.destination
      });
      
      if (!file || !file.filename) {
        throw new Error('Ошибка сохранения PDF файла');
      }
      
      // Проверяем, что файл реально сохранился
      const path = require('path');
      const fs = require('fs');
      const fullPath = path.join(process.cwd(), 'uploads', 'pdf', file.filename);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ PDF файл не сохранился: ${fullPath}`);
        throw new Error('Ошибка сохранения PDF файла на диск');
      }
      
      const stats = fs.statSync(fullPath);
      console.log(`✅ PDF файл сохранен успешно:`, {
        filename: file.filename,
        path: fullPath,
        size: stats.size
      });
      
      const result = await this.ordersService.uploadPdf(id, file.filename);
      console.log(`✅ PDF успешно загружен для заказа ${id}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Ошибка загрузки PDF для заказа ${id}:`, error);
      throw error;
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Получить PDF файл заказа' })
  async getPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const order = await this.ordersService.findOne(id);
    if (!order.pdfPath) {
      res.status(404).send('PDF файл не найден');
      return;
    }
    res.sendFile(order.pdfPath, { root: './uploads/pdf' });
  }

  @Get('pdf/:filename')
  @ApiOperation({ summary: 'Получить PDF файл по имени файла' })
  async getPdfByFilename(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const path = require('path');
      const fs = require('fs');
      
      console.log(`🔴 DEBUG: Получен запрос на PDF: ${filename}`);
      console.log(`🔴 DEBUG: process.cwd() = ${process.cwd()}`);
      
      // Используем абсолютный путь от корня проекта
      const searchPaths = [
        path.join(process.cwd(), 'uploads', 'pdf', filename),
        path.join(process.cwd(), 'backend', 'uploads', 'pdf', filename),
        path.join(__dirname, '../../../uploads/pdf', filename),
        path.resolve('./uploads/pdf', filename),
        path.resolve('./backend/uploads/pdf', filename)
      ];
      
      console.log(`🔴 DEBUG: Поиск файла в путях:`);
      
      let foundPath = null;
      for (let i = 0; i < searchPaths.length; i++) {
        const searchPath = searchPaths[i];
        const exists = fs.existsSync(searchPath);
        console.log(`🔴   ${i + 1}. ${searchPath} -> ${exists ? '✅ НАЙДЕН' : '❌ НЕТ'}`);
        
        if (exists && !foundPath) {
          foundPath = searchPath;
        }
      }
      
      if (!foundPath) {
        console.error(`❌ PDF файл не найден ни в одном из путей`);
        
        res.status(404).json({ 
          message: 'PDF файл не найден', 
          filename,
          searchedPaths: searchPaths,
          cwd: process.cwd(),
          __dirname
        });
        return;
      }
      
      console.log(`✅ PDF файл найден: ${foundPath}`);
      
      // Проверяем размер файла
      const stats = fs.statSync(foundPath);
      console.log(`📊 Размер файла: ${stats.size} байт`);
      
      // Устанавливаем правильные заголовки для PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'SAMEORIGIN',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      console.log(`📄 Отправка PDF файла: ${filename}`);
      res.sendFile(foundPath);
      
    } catch (error) {
      console.error(`❌ Ошибка при отправке PDF файла ${filename}:`, {
        error: error.message,
        stack: error.stack,
        filename
      });
      res.status(500).json({ 
        message: 'Ошибка сервера при получении PDF', 
        error: error.message,
        filename 
      });
    }
  }

  @Get('debug/pdf/:filename')
  @ApiOperation({ summary: 'Диагностика PDF файла' })
  async debugPdf(
    @Param('filename') filename: string,
  ): Promise<any> {
    try {
      const path = require('path');
      const fs = require('fs');
      
      const searchPaths = [
        path.join(process.cwd(), 'uploads', 'pdf', filename),
        path.join(process.cwd(), 'backend', 'uploads', 'pdf', filename),
        path.join(__dirname, '../../../uploads/pdf', filename),
        path.resolve('./uploads/pdf', filename),
        path.resolve('./backend/uploads/pdf', filename)
      ];
      
      const results = searchPaths.map(searchPath => {
        const exists = fs.existsSync(searchPath);
        let stats = null;
        
        if (exists) {
          try {
            stats = fs.statSync(searchPath);
          } catch (e) {
            stats = { error: e.message };
          }
        }
        
        return {
          path: searchPath,
          exists,
          stats: stats ? {
            size: stats.size,
            isFile: stats.isFile?.(),
            isDirectory: stats.isDirectory?.(),
            modified: stats.mtime,
          } : null
        };
      });
      
      return {
        filename,
        cwd: process.cwd(),
        __dirname,
        searchResults: results,
        foundFiles: results.filter(r => r.exists)
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Delete(':id/pdf')
  @ApiOperation({ summary: 'ПРОДАКШЕН: Удалить PDF файл заказа' })
  async deletePdf(
    @Param('id') id: string,
  ): Promise<Order> {
    try {
      console.log(`📁 ПРОДАКШЕН: Удаление PDF для заказа ${id}`);
      
      const result = await this.ordersService.deletePdf(id);
      console.log(`✅ PDF успешно удален для заказа ${id}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Ошибка удаления PDF для заказа ${id}:`, error);
      throw error;
    }
  }
}