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
      return await this.ordersService.remove(id);
    } catch (error) {
      console.error(`Orders remove error for id ${id}:`, error);
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
  @ApiOperation({ summary: 'Загрузить PDF файл для заказа' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/pdf',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Order> {
    return this.ordersService.uploadPdf(id, file.filename);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Получить PDF файл заказа' })
  async getPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const order = await this.ordersService.findOne(id);
    if (!order.pdfUrl) {
      res.status(404).send('PDF файл не найден');
      return;
    }
    res.sendFile(order.pdfUrl, { root: './uploads/pdf' });
  }
}