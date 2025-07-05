/**
 * @file: orders-v2.controller.ts
 * @description: Улучшенный контроллер для заказов версии 2 с интеллектуальными приоритетами
 * @dependencies: nestjs, typeorm, orders.service, excel-parser
 * @created: 2025-07-03
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
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CreateOrderV2Dto } from '../dto/create-order-v2.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { convertPriorityV2ToNumber as convertPriority, convertWorkTypeV2ToString, convertOperationV2ToV1 } from '../dto/v2-to-v1-converter';
import { OrdersFilterDto } from '../dto/orders-filter.dto';
import { Order } from '../../../database/entities/order.entity';
import { OrdersV2Service } from './orders-v2.service';
import { ExcelParserService, ExcelParseResult } from './excel-parser.service';
import { PriorityCalculatorService } from './priority-calculator.service';
import * as multer from 'multer';
import * as path from 'path';

@ApiTags('orders-v2')
@Controller('v2/orders')
export class OrdersV2Controller {
  private readonly logger = new Logger(OrdersV2Controller.name);

  constructor(
    private readonly ordersV2Service: OrdersV2Service,
    private readonly excelParserService: ExcelParserService,
    private readonly priorityCalculatorService: PriorityCalculatorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все заказы V2 с улучшенной фильтрацией' })
  @ApiResponse({ status: 200, description: 'Список заказов получен успешно' })
  async getAllOrders(@Query(ValidationPipe) filter: OrdersFilterDto) {
    this.logger.log('📋 V2: Получение всех заказов с фильтрами:', filter);
    
    try {
      const result = await this.ordersV2Service.getAllWithSmartPriorities(filter);
      
      this.logger.log(`✅ V2: Получено ${result.data.length} заказов из ${result.total}`);
      return result;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка получения заказов:', error);
      throw new HttpException(
        'Ошибка получения заказов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику заказов V2' })
  @ApiResponse({ status: 200, description: 'Статистика получена успешно' })
  async getOrdersStats() {
    this.logger.log('📊 V2: Получение статистики заказов');
    
    try {
      const stats = await this.ordersV2Service.getSmartStats();
      
      this.logger.log('✅ V2: Статистика получена:', stats);
      return stats;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка получения статистики:', error);
      throw new HttpException(
        'Ошибка получения статистики',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по ID V2' })
  @ApiResponse({ status: 200, description: 'Заказ получен успешно' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  async getOrderById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`📋 V2: Получение заказа по ID: ${id}`);
    
    try {
      const order = await this.ordersV2Service.getByIdWithCalculatedPriority(id);
      
      if (!order) {
        this.logger.warn(`⚠️ V2: Заказ с ID ${id} не найден`);
        throw new HttpException('Заказ не найден', HttpStatus.NOT_FOUND);
      }
      
      this.logger.log(`✅ V2: Заказ получен: ${order.drawingNumber}`);
      return order;
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка получения заказа ${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Ошибка получения заказа',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый заказ V2' })
  @ApiResponse({ status: 201, description: 'Заказ создан успешно' })
  @ApiResponse({ status: 400, description: 'Некорректные данные' })
  async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    this.logger.log('📝 V2: Создание нового заказа:', createOrderDto);
    
    try {
      // Рассчитываем приоритет автоматически
      const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
        createOrderDto.deadline,
        createOrderDto.workType,
        createOrderDto.quantity,
        createOrderDto.operations,
      );
      
      // Используем рассчитанный приоритет, если он не задан явно
      const orderData = {
        ...createOrderDto,
        priority: createOrderDto.priority || calculatedPriority.priority,
      };
      
      const order = await this.ordersV2Service.createWithSmartPriority(orderData);
      
      this.logger.log(`✅ V2: Заказ создан: ${order.drawingNumber} (приоритет: ${order.priority})`);
      return order;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка создания заказа:', error);
      
      if (error.code === '23505') {
        throw new HttpException(
          'Заказ с таким номером чертежа уже существует',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        'Ошибка создания заказа',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заказ V2' })
  @ApiResponse({ status: 200, description: 'Заказ обновлен успешно' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateOrderDto: UpdateOrderDto,
  ) {
    this.logger.log(`📝 V2: Обновление заказа ${id}:`, updateOrderDto);
    
    try {
      const order = await this.ordersV2Service.updateWithSmartPriority(id, updateOrderDto);
      
      this.logger.log(`✅ V2: Заказ обновлен: ${order.drawingNumber}`);
      return order;
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка обновления заказа ${id}:`, error);
      
      if (error.message === 'Order not found') {
        throw new HttpException('Заказ не найден', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Ошибка обновления заказа',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ V2' })
  @ApiResponse({ status: 200, description: 'Заказ удален успешно' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  async deleteOrder(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`🗑️ V2: Удаление заказа ${id}`);
    
    try {
      await this.ordersV2Service.deleteWithCleanup(id);
      
      this.logger.log(`✅ V2: Заказ ${id} удален успешно`);
      return { message: 'Заказ удален успешно' };
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка удаления заказа ${id}:`, error);
      
      if (error.message === 'Order not found') {
        throw new HttpException('Заказ не найден', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        'Ошибка удаления заказа',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('parse-excel')
  @ApiOperation({ summary: 'Парсинг Excel файла V2' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Файл обработан успешно' })
  @ApiResponse({ status: 400, description: 'Некорректный файл' })
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      console.log('📁 Проверка файла:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname
      });
      
      // Проверяем тип файла
      const isExcel = file.mimetype.includes('spreadsheet') || 
                     file.mimetype.includes('excel') ||
                     file.originalname.match(/\.(xlsx|xls)$/i);
      
      if (isExcel) {
        console.log('✅ Файл Excel принят');
        cb(null, true);
      } else {
        console.log('❌ Неподдерживаемый формат файла');
        cb(new Error('Поддерживаются только Excel файлы (.xlsx, .xls)'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async parseExcelFile(@UploadedFile() file: any): Promise<ExcelParseResult> {
    this.logger.log('📊 V2: Парсинг Excel файла:', file?.originalname);
    this.logger.log('🔍 V2: Инфо о файле:', {
      filename: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferSize: file?.buffer?.length,
      hasBuffer: !!file?.buffer
    });
    
    if (!file) {
      this.logger.error('❌ V2: Файл не загружен');
      throw new HttpException('Файл не загружен', HttpStatus.BAD_REQUEST);
    }
    
    if (!file.buffer) {
      this.logger.error('❌ V2: Отсутствует buffer для файла');
      throw new HttpException('Ошибка чтения файла', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const parsedData = await this.excelParserService.parseExcelFile(file.buffer);
      
      this.logger.log(`✅ V2: Excel файл обработан: ${parsedData.parsedRows} записей`);
      
      return parsedData;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка парсинга Excel файла:', error);
      throw new HttpException(
        'Ошибка обработки Excel файла: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Массовое создание заказов V2' })
  @ApiResponse({ status: 201, description: 'Заказы созданы успешно' })
  @ApiResponse({ status: 400, description: 'Ошибка создания заказов' })
  async createOrdersBatch(@Body() data: { orders: CreateOrderDto[] }) {
    this.logger.log(`📝 V2: Массовое создание ${data.orders.length} заказов`);
    
    try {
      const result = await this.ordersV2Service.createBatchWithSmartPriorities(data.orders);
      
      this.logger.log(`✅ V2: Массовое создание завершено: создано ${result.created}, ошибок ${result.errors}`);
      return result;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка массового создания заказов:', error);
      throw new HttpException(
        'Ошибка массового создания заказов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('recalculate-priorities')
  @ApiOperation({ summary: 'Пересчитать приоритеты всех заказов V2' })
  @ApiResponse({ status: 200, description: 'Приоритеты пересчитаны успешно' })
  async recalculateAllPriorities() {
    this.logger.log('🔄 V2: Пересчет приоритетов всех заказов');
    
    try {
      const result = await this.ordersV2Service.recalculateAllPriorities();
      
      this.logger.log(`✅ V2: Приоритеты пересчитаны для ${result.updated} заказов`);
      return result;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка пересчета приоритетов:', error);
      throw new HttpException(
        'Ошибка пересчета приоритетов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('import-from-excel')
  @ApiOperation({ summary: 'Импорт заказов из Excel файла V2' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Заказы импортированы успешно' })
  @ApiResponse({ status: 400, description: 'Ошибка импорта' })
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), // Используем память вместо диска
    fileFilter: (req, file, cb) => {
      if (file.mimetype.includes('spreadsheet') || file.originalname.match(/\\.(xlsx|xls)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Поддерживаются только Excel файлы'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async importOrdersFromExcel(@UploadedFile() file: any) {
    this.logger.log('📤 V2: Импорт заказов из Excel файла:', file.originalname);
    
    if (!file) {
      throw new HttpException('Файл не загружен', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // Сначала парсим файл
      const parsedData = await this.excelParserService.parseExcelFile(file.buffer);
      
      this.logger.log(`📊 V2: Спарсено ${parsedData.parsedRows} записей из Excel`);
      
      // Конвертируем спарсенные данные из V2 в V1 для сервиса
      const convertedOrders: CreateOrderDto[] = parsedData.data.map(orderV2 => ({
        ...orderV2,
        priority: convertPriority(orderV2.priority),
        workType: convertWorkTypeV2ToString(orderV2.workType),
        operations: orderV2.operations.map(convertOperationV2ToV1),
      }));
      
      this.logger.log(`🔄 V2: Конвертировано ${convertedOrders.length} заказов для V1 сервиса`);
      
      // Создаем заказы массово с уже конвертированными данными
      const result = await this.ordersV2Service.createBatchWithSmartPriorities(convertedOrders);
      
      this.logger.log(`✅ V2: Импорт завершен: создано ${result.created}, ошибок ${result.errors}`);
      
      return {
        success: true,
        ...result,
        message: `Импорт завершен: создано ${result.created} заказов`,
      };
    } catch (error) {
      this.logger.error('❌ V2: Ошибка импорта из Excel:', error);
      throw new HttpException(
        'Ошибка импорта из Excel: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
