/**
 * @file: orders-filesystem.controller.ts
 * @description: Контроллер для работы с файловой системой заказов
 * @dependencies: OrderFileSystemService
 * @created: 2025-06-07
 */
import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  HttpException, 
  HttpStatus, 
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrderFileSystemService } from './order-filesystem.service';
import { OrdersService } from './orders.service';

@ApiTags('Orders Filesystem API')
@Controller('filesystem')
export class OrdersFilesystemController {
  private readonly logger = new Logger(OrdersFilesystemController.name);

  constructor(
    private readonly orderFileSystemService: OrderFileSystemService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('orders')
  @ApiOperation({ summary: 'Получить список всех заказов в файловой системе' })
  @ApiResponse({ status: 200, description: 'Список заказов получен успешно' })
  async getAllOrders() {
    try {
      const orders = await this.orderFileSystemService.getAllOrders();
      
      // Получаем дополнительную информацию для каждого заказа
      const ordersWithDetails = await Promise.all(
        orders.map(async (drawingNumber) => {
          const versions = await this.orderFileSystemService.getOrderVersions(drawingNumber);
          const latestVersion = await this.orderFileSystemService.getLatestOrderVersion(drawingNumber);
          
          return {
            drawing_number: drawingNumber,
            versions_count: versions.length,
            versions: versions,
            latest_version: latestVersion?.metadata || null,
            has_data: !!latestVersion
          };
        })
      );

      return {
        success: true,
        data: ordersWithDetails,
        total: ordersWithDetails.length
      };
    } catch (error) {
      this.logger.error('Ошибка получения списка заказов:', error);
      throw new HttpException(
        'Ошибка получения списка заказов из файловой системы',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/:drawingNumber')
  @ApiOperation({ summary: 'Получить последнюю версию заказа' })
  @ApiParam({ name: 'drawingNumber', description: 'Номер чертежа заказа' })
  @ApiResponse({ status: 200, description: 'Данные заказа получены успешно' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  async getLatestOrderVersion(@Param('drawingNumber') drawingNumber: string) {
    try {
      const orderData = await this.orderFileSystemService.getLatestOrderVersion(drawingNumber);
      
      if (!orderData) {
        throw new HttpException(
          `Заказ ${drawingNumber} не найден в файловой системе`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: orderData
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Ошибка получения заказа ${drawingNumber}:`, error);
      throw new HttpException(
        'Ошибка получения данных заказа',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/:drawingNumber/versions')
  @ApiOperation({ summary: 'Получить список версий заказа' })
  @ApiParam({ name: 'drawingNumber', description: 'Номер чертежа заказа' })
  @ApiResponse({ status: 200, description: 'Список версий получен успешно' })
  async getOrderVersions(@Param('drawingNumber') drawingNumber: string) {
    try {
      const versions = await this.orderFileSystemService.getOrderVersions(drawingNumber);
      
      // Получаем метаданные для каждой версии
      const versionsWithMetadata = await Promise.all(
        versions.map(async (version) => {
          const versionData = await this.orderFileSystemService.getOrderVersion(drawingNumber, version);
          return {
            version,
            metadata: versionData?.metadata || null,
            has_shifts: !!versionData?.shifts,
            has_planning: !!versionData?.planning,
            has_history: !!versionData?.history,
            operations_count: versionData?.operations?.length || 0
          };
        })
      );

      return {
        success: true,
        drawing_number: drawingNumber,
        versions: versionsWithMetadata,
        total_versions: versionsWithMetadata.length
      };
    } catch (error) {
      this.logger.error(`Ошибка получения версий заказа ${drawingNumber}:`, error);
      throw new HttpException(
        'Ошибка получения версий заказа',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/:drawingNumber/versions/:version')
  @ApiOperation({ summary: 'Получить конкретную версию заказа' })
  @ApiParam({ name: 'drawingNumber', description: 'Номер чертежа заказа' })
  @ApiParam({ name: 'version', description: 'Версия заказа (YYYY-MM-DD или YYYY-MM-DD_HH-MM)' })
  @ApiResponse({ status: 200, description: 'Данные версии получены успешно' })
  @ApiResponse({ status: 404, description: 'Версия не найдена' })
  async getOrderVersion(
    @Param('drawingNumber') drawingNumber: string,
    @Param('version') version: string
  ) {
    try {
      const orderData = await this.orderFileSystemService.getOrderVersion(drawingNumber, version);
      
      if (!orderData) {
        throw new HttpException(
          `Версия ${version} заказа ${drawingNumber} не найдена`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        drawing_number: drawingNumber,
        version,
        data: orderData
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Ошибка получения версии ${version} заказа ${drawingNumber}:`, error);
      throw new HttpException(
        'Ошибка получения версии заказа',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('orders/export-all')
  @ApiOperation({ summary: 'Экспортировать все заказы из БД в файловую систему' })
  @ApiResponse({ status: 200, description: 'Экспорт завершен успешно' })
  async exportAllOrdersFromDatabase() {
    try {
      this.logger.log('Начинаем экспорт всех заказов из БД в файловую систему');
      
      const result = await this.ordersService.exportAllOrdersToFileSystem();
      
      this.logger.log(`Экспорт завершен. Успешно: ${result.success}, Ошибок: ${result.errors}`);
      
      return {
        success: true,
        message: 'Экспорт заказов завершен',
        statistics: result
      };
    } catch (error) {
      this.logger.error('Ошибка экспорта заказов:', error);
      throw new HttpException(
        'Ошибка экспорта заказов в файловую систему',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/:drawingNumber/shifts')
  @ApiOperation({ summary: 'Получить данные смен для заказа' })
  @ApiParam({ name: 'drawingNumber', description: 'Номер чертежа заказа' })
  @ApiResponse({ status: 200, description: 'Данные смен получены успешно' })
  async getOrderShifts(@Param('drawingNumber') drawingNumber: string) {
    try {
      const orderData = await this.orderFileSystemService.getLatestOrderVersion(drawingNumber);
      
      if (!orderData) {
        throw new HttpException(
          `Заказ ${drawingNumber} не найден`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        drawing_number: drawingNumber,
        shifts: orderData.shifts || null,
        has_shifts_data: !!orderData.shifts
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Ошибка получения смен заказа ${drawingNumber}:`, error);
      throw new HttpException(
        'Ошибка получения данных смен',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/:drawingNumber/planning')
  @ApiOperation({ summary: 'Получить данные планирования для заказа' })
  @ApiParam({ name: 'drawingNumber', description: 'Номер чертежа заказа' })
  @ApiResponse({ status: 200, description: 'Данные планирования получены успешно' })
  async getOrderPlanning(@Param('drawingNumber') drawingNumber: string) {
    try {
      const orderData = await this.orderFileSystemService.getLatestOrderVersion(drawingNumber);
      
      if (!orderData) {
        throw new HttpException(
          `Заказ ${drawingNumber} не найден`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        drawing_number: drawingNumber,
        planning: orderData.planning || null,
        has_planning_data: !!orderData.planning
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Ошибка получения планирования заказа ${drawingNumber}:`, error);
      throw new HttpException(
        'Ошибка получения данных планирования',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('orders/statistics/overview')
  @ApiOperation({ summary: 'Получить статистику файловой системы заказов' })
  @ApiResponse({ status: 200, description: 'Статистика получена успешно' })
  async getFileSystemStatistics() {
    try {
      const orders = await this.orderFileSystemService.getAllOrders();
      
      let totalVersions = 0;
      let ordersWithShifts = 0;
      let ordersWithPlanning = 0;
      let ordersWithHistory = 0;
      
      for (const drawingNumber of orders) {
        const versions = await this.orderFileSystemService.getOrderVersions(drawingNumber);
        totalVersions += versions.length;
        
        const latestVersion = await this.orderFileSystemService.getLatestOrderVersion(drawingNumber);
        if (latestVersion?.shifts) ordersWithShifts++;
        if (latestVersion?.planning) ordersWithPlanning++;
        if (latestVersion?.history) ordersWithHistory++;
      }

      return {
        success: true,
        statistics: {
          total_orders: orders.length,
          total_versions: totalVersions,
          average_versions_per_order: orders.length > 0 ? (totalVersions / orders.length).toFixed(2) : 0,
          orders_with_shifts: ordersWithShifts,
          orders_with_planning: ordersWithPlanning,
          orders_with_history: ordersWithHistory,
          coverage: {
            shifts_coverage: orders.length > 0 ? ((ordersWithShifts / orders.length) * 100).toFixed(2) + '%' : '0%',
            planning_coverage: orders.length > 0 ? ((ordersWithPlanning / orders.length) * 100).toFixed(2) + '%' : '0%',
            history_coverage: orders.length > 0 ? ((ordersWithHistory / orders.length) * 100).toFixed(2) + '%' : '0%'
          }
        }
      };
    } catch (error) {
      this.logger.error('Ошибка получения статистики:', error);
      throw new HttpException(
        'Ошибка получения статистики файловой системы',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
