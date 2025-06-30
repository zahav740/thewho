/**
 * @file: orders.controller.ts
 * @description: Контроллер для управления заказами с защитой от дубликатов заказов и PDF
 * @dependencies: services, ConfigService
 * @created: 2025-01-28
 * @updated: 2025-06-23 - Добавлена защита от дубликатов, улучшена типизация, оптимизирована работа с файлами
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
  BadRequestException,
  NotFoundException,
  ConflictException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import type { Express } from 'express';
import { OrdersService, EnrichedOrder } from './orders.service';
import { ExcelImportService, ImportResult } from './excel-import.service';
import { ExcelColumnMapperService, ExcelFileAnalysis, ExcelImportSettings } from './excel-column-mapper.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { ImportExcelDto } from './dto/import-excel.dto';
import { Order } from '../../database/entities/order.entity';
import { FileHash } from '../../database/entities/file-hash.entity'; // Предполагается сущность для хешей файлов
import { PdfRevision } from '../../database/entities/pdf-revision.entity'; // Предполагается сущность для ревизий PDF
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Интерфейсы
interface DuplicateInfo {
  isDuplicate: boolean;
  byHash?: FileHash | null;
  byName?: FileHash | null;
  hash: string;
}

interface UploadAction {
  key: string;
  label: string;
  description: string;
}

interface UploadResult {
  action: string;
  filename: string;
  orderId: string;
  fileHash: string;
  message: string;
  revision?: number;
  newOrderId?: string;
  originalOrderId?: string;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  private readonly uploadDir: string;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly excelImportService: ExcelImportService,
    private readonly excelColumnMapperService: ExcelColumnMapperService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', join(process.cwd(), 'uploads', 'pdf'));
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить все заказы с фильтрацией и пагинацией' })
  @ApiResponse({ status: 200, description: 'Список заказов', type: [Order] })
  @UsePipes(new ValidationPipe())
  async findAll(@Query() filterDto: OrdersFilterDto): Promise<{
    data: EnrichedOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Received request with filters: ${JSON.stringify(filterDto)}`);
    try {
      const result = await this.ordersService.findAll(filterDto);
      this.logger.log(`Returned ${result.data?.length || 0} orders`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching orders: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка получения заказов');
    }
  }

  @Get('check-duplicate/:drawingNumber')
  @ApiOperation({ summary: 'Проверить дубликат заказа по номеру чертежа' })
  @ApiResponse({ status: 200, description: 'Результат проверки дубликата' })
  async checkOrderDuplicate(@Param('drawingNumber') drawingNumber: string) {
    try {
      const existingOrder = await this.ordersService.findByDrawingNumber(drawingNumber);
      this.logger.log(`Checked duplicate for drawingNumber: ${drawingNumber}, exists: ${!!existingOrder}`);
      return {
        isDuplicate: !!existingOrder,
        existingOrder: existingOrder
          ? {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              quantity: existingOrder.quantity,
              deadline: existingOrder.deadline,
              createdAt: existingOrder.createdAt,
              operations: existingOrder.operations?.length || 0,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`Error checking duplicate for drawingNumber ${drawingNumber}: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка проверки дубликата заказа');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID' })
  @ApiResponse({ status: 200, description: 'Заказ', type: Order })
  async findOne(@Param('id') id: string): Promise<Order> {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      return order;
    } catch (error) {
      this.logger.error(`Error fetching order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ с проверкой дубликатов' })
  @ApiResponse({ status: 201, description: 'Созданный заказ', type: Order })
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Query('action') action?: 'update' | 'create_copy' | 'force',
    @Query('force') force?: string,
  ): Promise<Order> {
    this.logger.log(`Creating order: ${JSON.stringify(createOrderDto)}`);
    try {
      const forceCreate = force === 'true' || force === '1';

      if (!forceCreate && !action) {
        const existingOrder = await this.ordersService.findByDrawingNumber(createOrderDto.drawingNumber);
        if (existingOrder) {
          this.logger.warn(`Duplicate order found for drawingNumber: ${createOrderDto.drawingNumber}`);
          throw new ConflictException({
            error: 'DUPLICATE_ORDER_DETECTED',
            message: `Заказ с номером чертежа "${createOrderDto.drawingNumber}" уже существует`,
            existingOrder: {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              quantity: existingOrder.quantity,
              deadline: existingOrder.deadline,
              createdAt: existingOrder.createdAt,
            },
            actions: [
              { key: 'update', label: 'Обновить существующий заказ', description: 'Заменить данные существующего заказа новыми' },
              { key: 'create_copy', label: 'Создать копию с другим номером', description: 'Создать новый заказ с измененным номером чертежа' },
              { key: 'force', label: 'Создать дубликат принудительно', description: 'Создать заказ несмотря на дубликат' },
            ],
          });
        }
      }

      if (action && action !== 'force') {
        const existingOrder = await this.ordersService.findByDrawingNumber(createOrderDto.drawingNumber);
        switch (action) {
          case 'update':
            if (!existingOrder) {
              throw new NotFoundException('Заказ для обновления не найден');
            }
            this.logger.log(`Updating existing order ${existingOrder.id}`);
            return await this.ordersService.update(existingOrder.id.toString(), createOrderDto);
          case 'create_copy':
            this.logger.log('Creating copy with modified drawing number');
            const modifiedDto = {
              ...createOrderDto,
              drawingNumber: await this.generateUniqueDrawingNumber(createOrderDto.drawingNumber),
            };
            return await this.ordersService.create(modifiedDto);
          default:
            throw new BadRequestException(`Неизвестное действие: ${action}`);
        }
      }

      this.logger.log('Creating new order');
      return await this.ordersService.create(createOrderDto);
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заказ' })
  @ApiResponse({ status: 200, description: 'Обновленный заказ', type: Order })
  @UsePipes(new ValidationPipe())
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      if (updateOrderDto.drawingNumber) {
        const existingOrder = await this.ordersService.findByDrawingNumber(updateOrderDto.drawingNumber);
        if (existingOrder && existingOrder.id.toString() !== id) {
          throw new ConflictException({
            error: 'DUPLICATE_DRAWING_NUMBER',
            message: `Номер чертежа "${updateOrderDto.drawingNumber}" уже используется в заказе ${existingOrder.id}`,
            existingOrder: {
              id: existingOrder.id,
              drawingNumber: existingOrder.drawingNumber,
              createdAt: existingOrder.createdAt,
            },
          });
        }
      }
      return await this.ordersService.update(id, updateOrderDto);
    } catch (error) {
      this.logger.error(`Error updating order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ' })
  @ApiResponse({ status: 204, description: 'Заказ удален' })
  async remove(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log(`Received request to delete order ${id}`);
      await this.ordersService.remove(id);
      this.logger.log(`Order ${id} successfully deleted`);
    } catch (error) {
      this.logger.error(`Error deleting order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('batch/selected')
  @ApiOperation({ summary: 'Удалить выбранные заказы' })
  @ApiResponse({ status: 200, description: 'Количество удаленных заказов' })
  async removeBatch(@Body('ids') ids: string[]): Promise<{ deleted: number }> {
    try {
      const deleted = await this.ordersService.removeBatch(ids);
      this.logger.log(`Deleted ${deleted} orders`);
      return { deleted };
    } catch (error) {
      this.logger.error(`Error deleting batch orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('all/confirm')
  @ApiOperation({ summary: 'Удалить все заказы (с подтверждением)' })
  @ApiResponse({ status: 200, description: 'Количество удаленных заказов' })
  async removeAll(@Body() body?: { confirm?: boolean }): Promise<{ deleted: number }> {
    try {
      // Убираем обязательное подтверждение для совместимости с фронтендом
      this.logger.log('Received request to delete all orders');
      const deleted = await this.ordersService.removeAll();
      this.logger.log(`Deleted all orders: ${deleted}`);
      return { deleted };
    } catch (error) {
      this.logger.error(`Error deleting all orders: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateUniqueDrawingNumber(originalNumber: string): Promise<string> {
    let counter = 1;
    let newNumber = `${originalNumber}_copy`;
    while (await this.ordersService.findByDrawingNumber(newNumber)) {
      counter++;
      newNumber = `${originalNumber}_copy${counter}`;
    }
    this.logger.log(`Generated unique drawing number: ${newNumber}`);
    return newNumber;
  }

  @Post('upload-excel')
  @ApiOperation({ summary: 'Загрузить и обработать Excel файл' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат импорта Excel' })
  @UseInterceptors(
    FileInterceptor('excel', {
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ];
        const isValidType = allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/);
        if (isValidType) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Только Excel файлы (.xlsx, .xls, .csv) разрешены'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    try {
      this.logger.log(`Received Excel file: ${file.originalname}, size: ${file.size}`);
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл отсутствует или некорректен');
      }
      let colorFilters: string[] = [];
      if (body.colorFilters) {
        try {
          colorFilters = JSON.parse(body.colorFilters);
          this.logger.log(`Applying color filters: ${colorFilters}`);
        } catch {
          this.logger.warn('Failed to parse color filters');
        }
      }
      const result = await this.excelImportService.importOrders(file, colorFilters);
      this.logger.log(`Excel import completed: created=${result.created}, updated=${result.updated}, errors=${result.errors?.length || 0}`);
      return {
        success: true,
        message: 'Excel файл успешно обработан',
        data: {
          created: result.created,
          updated: result.updated,
          totalRows: result.created + result.updated + result.errors.length,
          importedRows: result.created + result.updated,
          skippedRows: result.errors.length,
          errors: result.errors,
        },
        file: {
          originalname: file.originalname,
          size: file.size,
          realFile: true,
          bufferProcessed: true,
        },
      };
    } catch (error) {
      this.logger.error(`Error importing Excel: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка обработки Excel файла: ${error.message}`);
    }
  }

  @Post('analyze-excel')
  @ApiOperation({ summary: 'Анализ структуры Excel файла для выбора колонок' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Анализ структуры Excel файла' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ];
        const isValidType = allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/);
        if (isValidType) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Только Excel файлы (.xlsx, .xls) разрешены'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async analyzeExcel(@UploadedFile() file: Express.Multer.File): Promise<ExcelFileAnalysis> {
    try {
      this.logger.log(`Analyzing Excel structure: ${file.originalname}`);
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл отсутствует или некорректен');
      }
      return await this.excelColumnMapperService.analyzeExcelStructure(file);
    } catch (error) {
      this.logger.error(`Error analyzing Excel: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка анализа Excel файла: ${error.message}`);
    }
  }

  @Post('import-excel-with-mapping')
  @ApiOperation({ summary: 'Импорт Excel с пользовательским маппингом колонок' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат импорта с маппингом' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream',
        ];
        const isValidType = allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/);
        if (isValidType) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Только Excel файлы (.xlsx, .xls) разрешены'), false);
        }
      },
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async importExcelWithMapping(
    @UploadedFile() file: Express.Multer.File,
    @Body('settings') settingsJson: string
  ) {
    try {
      this.logger.log(`Import Excel with mapping: ${file.originalname}`);
      if (!file || !file.buffer) {
        throw new BadRequestException('Файл отсутствует или некорректен');
      }

      let settings: ExcelImportSettings;
      try {
        settings = JSON.parse(settingsJson);
      } catch {
        throw new BadRequestException('Некорректные настройки импорта');
      }

      // Импортируем данные с пользовательским маппингом
      const parsedOrders = await this.excelColumnMapperService.importWithMapping(file, settings);
      
      // Создаем заказы в базе данных
      let created = 0;
      let updated = 0;
      const errors: Array<{ order: string; error: string }> = [];

      for (const orderData of parsedOrders) {
        try {
          const existingOrder = await this.ordersService.findByDrawingNumber(orderData.drawingNumber);
          
          if (existingOrder) {
            await this.ordersService.update(existingOrder.id.toString(), orderData);
            updated++;
          } else {
            await this.ordersService.create(orderData);
            created++;
          }
        } catch (error) {
          errors.push({
            order: orderData.drawingNumber || 'Неизвестный',
            error: error.message
          });
        }
      }

      const result = {
        success: true,
        message: 'Excel файл успешно импортирован с пользовательским маппингом',
        data: {
          created,
          updated,
          totalRows: parsedOrders.length,
          importedRows: created + updated,
          skippedRows: errors.length,
          errors
        },
        file: {
          originalname: file.originalname,
          size: file.size,
          customMapping: true
        }
      };

      this.logger.log(`Excel import with mapping completed: created=${created}, updated=${updated}, errors=${errors.length}`);
      return result;
    } catch (error) {
      this.logger.error(`Error importing Excel with mapping: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка импорта Excel: ${error.message}`);
    }
  }

  @Post('import-excel')
  @ApiOperation({ summary: 'Импортировать заказы из Excel файла (legacy)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат импорта Excel' })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe())
  async importExcel(@UploadedFile() file: Express.Multer.File, @Body() importDto: ImportExcelDto): Promise<ImportResult> {
    try {
      this.logger.log(`Legacy Excel import: ${file.originalname}`);
      return await this.excelImportService.importOrders(file, importDto.colorFilters);
    } catch (error) {
      this.logger.error(`Error in legacy Excel import: ${error.message}`, error.stack);
      throw new BadRequestException(`Ошибка импорта Excel: ${error.message}`);
    }
  }

  @Post(':id/upload-pdf')
  @ApiOperation({ summary: 'Загрузить PDF файл для заказа с защитой от дубликатов' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Результат загрузки PDF' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, join(process.cwd(), 'uploads', 'pdf'));
        },
        filename: (req, file, cb) => {
          const tempName = `temp_${Date.now()}_${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, tempName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new BadRequestException('Только PDF файлы разрешены'), false);
        }
      },
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Query('action') action?: 'replace' | 'new_order' | 'revision' | 'force',
    @Query('force') force?: string,
  ) {
    try {
      this.logger.log(`Uploading PDF for order ${id}: ${file.originalname}, size: ${file.size}`);
      const order = await this.ordersService.findOne(id);
      if (!order) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      const fileBuffer = fs.readFileSync(file.path);
      const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      this.logger.log(`File hash: ${fileHash}`);

      const forceUpload = force === 'true' || force === '1';
      const duplicateInfo = await this.checkForDuplicate(fileHash, file.originalname, id);

      if (duplicateInfo.isDuplicate && !forceUpload && !action) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(409).json({
          error: 'DUPLICATE_DETECTED',
          message: 'Обнаружен дубликат файла',
          duplicate: duplicateInfo,
          actions: [
            { key: 'replace', label: 'Перезаписать существующий файл', description: 'Заменить текущий PDF файл новым' },
            { key: 'revision', label: 'Создать новую ревизию', description: 'Добавить как версию v2, v3 и т.д.' },
            { key: 'new_order', label: 'Создать новый заказ', description: 'Создать отдельный заказ с этим файлом' },
            { key: 'force', label: 'Принудительно загрузить', description: 'Загрузить несмотря на дубликат' },
          ],
        });
      }

      const result = await this.handleFileUpload(order, file, fileHash, action, duplicateInfo);
      return res.json(result);
    } catch (error) {
      this.logger.error(`Error uploading PDF for order ${id}: ${error.message}`, error.stack);
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        this.logger.log('Temporary file deleted after error');
      }
      throw new BadRequestException(`Ошибка загрузки файла: ${error.message}`);
    }
  }

  private async checkForDuplicate(fileHash: string, originalName: string, currentOrderId: string): Promise<DuplicateInfo> {
    try {
      const existingByHash = await this.ordersService.findFileByHash(fileHash);
      const existingByName = await this.ordersService.findFileByName(originalName, currentOrderId);
      return {
        isDuplicate: !!(existingByHash || existingByName),
        byHash: existingByHash,
        byName: existingByName,
        hash: fileHash,
      };
    } catch (error) {
      this.logger.error(`Error checking duplicates: ${error.message}`, error.stack);
      throw new BadRequestException('Не удалось проверить дубликаты файла');
    }
  }

  private async handleFileUpload(
    order: Order,
    file: Express.Multer.File,
    fileHash: string,
    action: string,
    duplicateInfo: DuplicateInfo,
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    let finalFilename: string;

    try {
      switch (action) {
        case 'replace':
          finalFilename = duplicateInfo.byHash?.filename || `${timestamp}-${randomNum}.pdf`;
          const oldFilePath = join(this.uploadDir, finalFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
          break;
        case 'revision':
          const revisionNumber = await this.getNextRevisionNumber(order.id);
          finalFilename = `${timestamp}-${randomNum}-rev${revisionNumber}.pdf`;
          break;
        case 'new_order':
          const newOrder = await this.createDuplicateOrder(order);
          finalFilename = `${timestamp}-${randomNum}.pdf`;
          const newOrderFilePath = join(this.uploadDir, finalFilename);
          fs.renameSync(file.path, newOrderFilePath);
          await this.ordersService.uploadPdf(newOrder.id.toString(), finalFilename);
          return {
            action: 'new_order_created',
            filename: finalFilename,
            orderId: order.id.toString(),
            fileHash,
            newOrderId: newOrder.id.toString(),
            originalOrderId: order.id.toString(),
            message: `Создан новый заказ ${newOrder.id} с PDF файлом`,
          };
        default:
          finalFilename = `${timestamp}-${randomNum}.pdf`;
      }

      const finalFilePath = join(this.uploadDir, finalFilename);
      fs.renameSync(file.path, finalFilePath);
      const updatedOrder = await this.ordersService.uploadPdf(order.id.toString(), finalFilename);
      await this.saveFileInfo(fileHash, finalFilename, file.originalname, file.size, order.id);

      const result: UploadResult = {
        action: action || 'uploaded',
        filename: finalFilename,
        orderId: order.id.toString(),
        fileHash,
        message: `PDF файл успешно загружен для заказа ${order.id}`,
      };

      if (action === 'revision') {
        result.revision = await this.getNextRevisionNumber(order.id) - 1;
        result.message = `Создана ревизия v${result.revision} для заказа ${order.id}`;
      }

      return result;
    } catch (error) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      this.logger.error(`Error handling file upload: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getNextRevisionNumber(orderId: number): Promise<number> {
    try {
      const revisions = await this.ordersService.getPdfRevisions(orderId.toString());
      const maxRevision = revisions.length > 0 ? Math.max(...revisions.map((r) => r.revisionNumber)) : 0;
      return maxRevision + 1;
    } catch (error) {
      this.logger.error(`Error getting next revision number: ${error.message}`, error.stack);
      return 2;
    }
  }

  private async createDuplicateOrder(originalOrder: Order): Promise<Order> {
    try {
      const duplicateOrderData: CreateOrderDto = {
        drawingNumber: await this.generateUniqueDrawingNumber(originalOrder.drawingNumber),
        deadline: originalOrder.deadline.toISOString(),
        quantity: originalOrder.quantity,
        priority: originalOrder.priority,
        workType: originalOrder.workType,
        operations: [],
      };
      return await this.ordersService.create(duplicateOrderData);
    } catch (error) {
      this.logger.error(`Error creating duplicate order: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка создания нового заказа');
    }
  }

  private async saveFileInfo(fileHash: string, filename: string, originalName: string, fileSize: number, orderId: number): Promise<void> {
    try {
      await this.ordersService.saveFileInfo({ fileHash, filename, originalName, fileSize, orderId });
      this.logger.log(`Saved file info: ${filename}, hash: ${fileHash}`);
    } catch (error) {
      this.logger.error(`Error saving file info: ${error.message}`, error.stack);
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Получить PDF файл заказа' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getPdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order.pdfPath) {
        res.status(404).send('PDF файл не найден');
        return;
      }
      const filePath = join(this.uploadDir, order.pdfPath);
      if (!fs.existsSync(filePath)) {
        res.status(404).send('PDF файл не найден на сервере');
        return;
      }
      res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Error fetching PDF for order ${id}: ${error.message}`, error.stack);
      res.status(500).send('Ошибка сервера при получении PDF');
    }
  }

  @Get('pdf/:filename')
  @ApiOperation({ summary: 'Получить PDF файл по имени файла' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  async getPdfByFilename(@Param('filename') filename: string, @Res() res: Response): Promise<void> {
    try {
      const filePath = join(this.uploadDir, filename);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ message: 'PDF файл не найден', filename });
        return;
      }
      const stats = fs.statSync(filePath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Error fetching PDF ${filename}: ${error.message}`, error.stack);
      res.status(500).json({ message: 'Ошибка сервера при получении PDF', error: error.message });
    }
  }

  @Get('debug/pdf/:filename')
  @ApiOperation({ summary: 'Диагностика PDF файла' })
  @ApiResponse({ status: 200, description: 'Информация о PDF файле' })
  async debugPdf(@Param('filename') filename: string): Promise<any> {
    try {
      const filePath = join(this.uploadDir, filename);
      const exists = fs.existsSync(filePath);
      let stats = null;
      if (exists) {
        stats = fs.statSync(filePath);
      }
      return {
        filename,
        cwd: process.cwd(),
        searchResults: [{ path: filePath, exists, stats: stats ? { size: stats.size, modified: stats.mtime } : null }],
        foundFiles: exists ? [{ path: filePath, size: stats?.size, modified: stats?.mtime }] : [],
      };
    } catch (error) {
      this.logger.error(`Error debugging PDF ${filename}: ${error.message}`, error.stack);
      return { error: error.message };
    }
  }

  @Delete(':id/pdf')
  @ApiOperation({ summary: 'Удалить PDF файл заказа' })
  @ApiResponse({ status: 200, description: 'Обновленный заказ', type: Order })
  async deletePdf(@Param('id') id: string): Promise<Order> {
    try {
      this.logger.log(`Deleting PDF for order ${id}`);
      const result = await this.ordersService.deletePdf(id);
      this.logger.log(`PDF deleted for order ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting PDF for order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/pdf/revisions')
  @ApiOperation({ summary: 'Получить список ревизий PDF для заказа' })
  @ApiResponse({ status: 200, description: 'Список ревизий PDF' })
  async getPdfRevisions(@Param('id') id: string) {
    try {
      const revisions = await this.ordersService.getPdfRevisions(id);
      return {
        orderId: id,
        revisions: revisions.map((r) => ({
          filename: r.filename,
          revision: r.revisionNumber,
          size: r.fileSize,
          modified: r.createdAt,
          url: `/api/orders/pdf/${r.filename}`,
        })),
        total: revisions.length,
      };
    } catch (error) {
      this.logger.error(`Error fetching PDF revisions for order ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка получения списка ревизий');
    }
  }

  @Get(':id/pdf/revision/:revisionNumber')
  @ApiOperation({ summary: 'Получить конкретную ревизию PDF' })
  @ApiResponse({ status: 200, description: 'PDF ревизия' })
  async getPdfRevision(@Param('id') id: string, @Param('revisionNumber') revisionNumber: string, @Res() res: Response) {
    try {
      const revision = await this.ordersService.getPdfRevision(id, parseInt(revisionNumber));
      if (!revision) {
        return res.status(404).json({ message: `Ревизия v${revisionNumber} не найдена для заказа ${id}` });
      }
      const filePath = join(this.uploadDir, revision.filename);
      const stats = fs.statSync(filePath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${revision.filename}"`,
        'Content-Length': stats.size.toString(),
      });
      res.sendFile(filePath);
    } catch (error) {
      this.logger.error(`Error fetching PDF revision ${revisionNumber} for order ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка получения ревизии PDF');
    }
  }

  @Delete(':id/pdf/revision/:revisionNumber')
  @ApiOperation({ summary: 'Удалить конкретную ревизию PDF' })
  @ApiResponse({ status: 200, description: 'Результат удаления ревизии' })
  async deletePdfRevision(@Param('id') id: string, @Param('revisionNumber') revisionNumber: string) {
    try {
      const revision = await this.ordersService.getPdfRevision(id, parseInt(revisionNumber));
      if (!revision) {
        throw new NotFoundException(`Ревизия v${revisionNumber} не найдена для заказа ${id}`);
      }
      const filePath = join(this.uploadDir, revision.filename);
      fs.unlinkSync(filePath);
      await this.ordersService.deletePdfRevision(id, parseInt(revisionNumber));
      this.logger.log(`Deleted revision v${revisionNumber} for order ${id}: ${revision.filename}`);
      return {
        message: `Ревизия v${revisionNumber} успешно удалена`,
        orderId: id,
        revision: revisionNumber,
        filename: revision.filename,
      };
    } catch (error) {
      this.logger.error(`Error deleting PDF revision ${revisionNumber} for order ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка удаления ревизии PDF');
    }
  }

  @Get('statistics/duplicates')
  @ApiOperation({ summary: 'Получить статистику дубликатов заказов и PDF' })
  @ApiResponse({ status: 200, description: 'Статистика дубликатов' })
  async getDuplicateStatistics() {
    try {
      const pdfStats = await this.ordersService.getPdfStatistics();
      const orderStats = await this.getOrderDuplicateStats();
      this.logger.log('Fetched duplicate statistics');
      return { pdf: pdfStats, orders: orderStats };
    } catch (error) {
      this.logger.error(`Error fetching duplicate statistics: ${error.message}`, error.stack);
      throw new NotFoundException('Не удалось получить статистику дубликатов');
    }
  }

  private async getOrderDuplicateStats() {
    try {
      const totalOrders = await this.ordersService.countAll();
      const uniqueDrawings = await this.ordersService.countUniqueDrawingNumbers();
      const potentialDuplicates = totalOrders - uniqueDrawings;
      return {
        total: totalOrders,
        uniqueDrawingNumbers: uniqueDrawings,
        potentialDuplicates,
      };
    } catch (error) {
      this.logger.error(`Error calculating order duplicate stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('cleanup/missing-pdfs')
  @ApiOperation({ summary: 'Очистка ссылок на несуществующие PDF файлы' })
  @ApiResponse({ status: 200, description: 'Результат очистки' })
  async cleanupMissingPdfs() {
    try {
      const result = await this.ordersService.cleanupMissingPdfReferences();
      this.logger.log(`Cleanup completed: ${JSON.stringify(result)}`);
      return { success: true, message: 'Очистка завершена', ...result };
    } catch (error) {
      this.logger.error(`Error cleaning up PDF references: ${error.message}`, error.stack);
      throw new BadRequestException('Ошибка очистки PDF ссылок');
    }
  }
}