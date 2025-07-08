/**
 * @file: orders.service.ts
 * @description: Рабочая версия сервиса для работы с заказами (без soft delete)
 * @created: 2025-07-08
 * @note: Временная версия без зависимости от soft delete колонок
 */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { FileHash } from '../../database/entities/file-hash.entity';
import { PdfRevision } from '../../database/entities/pdf-revision.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { OrderFileSystemService, OrderFileSystemData } from './order-filesystem.service';
import * as path from 'path';
import { OperationType } from '../../database/entities/operation.entity';
import * as fs from 'fs';

// Интерфейс для обогащенного заказа
export interface EnrichedOrder extends Order {
  name: string;
  clientName: string;
  remainingQuantity: number;
  status: string;
  completionPercentage: number;
  forecastedCompletionDate: Date;
  isOnSchedule: boolean;
  lastRecalculationAt: Date;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(FileHash)
    private readonly fileHashRepository: Repository<FileHash>,
    @InjectRepository(PdfRevision)
    private readonly pdfRevisionRepository: Repository<PdfRevision>,
    private readonly orderFileSystemService: OrderFileSystemService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', path.join(process.cwd(), 'uploads', 'pdf'));
  }

  async findAll(filterDto?: OrdersFilterDto): Promise<{
    data: EnrichedOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Fetching all orders with filter: ${JSON.stringify(filterDto)}`);

    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.operations', 'operation')
      .orderBy('operation.operationNumber', 'ASC');

    if (filterDto?.search) {
      query = query.where(
        'order.drawingNumber ILIKE :search OR order.workType ILIKE :search',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto?.priority) {
      query = query.andWhere('order.priority = :priority', { priority: filterDto.priority });
    }

    query = query.addOrderBy('order.priority', 'ASC').addOrderBy('order.deadline', 'ASC');

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    try {
      const [orders, total] = await query.getManyAndCount();
      this.logger.log(`Found ${orders.length} orders out of ${total}`);

      const enrichedOrders = orders.map((order) => this.enrichOrder(order));
      return {
        data: enrichedOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching orders: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка получения заказов');
    }
  }

  async findOne(id: string): Promise<EnrichedOrder> {
    this.logger.log(`Fetching order with ID ${id}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Некорректный ID заказа: ${id}`);
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      this.logger.log(`Found order ${order.drawingNumber} with ${order.operations?.length || 0} operations`);
      return this.enrichOrder(order);
    } catch (error) {
      this.logger.error(`Error fetching order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByDrawingNumber(drawingNumber: string): Promise<EnrichedOrder | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { drawingNumber },
        relations: ['operations'],
      });
      return order ? this.enrichOrder(order) : null;
    } catch (error) {
      this.logger.error(`Error finding order by drawingNumber ${drawingNumber}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска заказа по номеру чертежа');
    }
  }

  async findByDrawingNumberIncludingDeleted(drawingNumber: string): Promise<EnrichedOrder | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { drawingNumber },
        relations: ['operations'],
      });
      return order ? this.enrichOrder(order) : null;
    } catch (error) {
      this.logger.error(`Error finding order by drawingNumber including deleted ${drawingNumber}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска заказа по номеру чертежа');
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.orderRepository.count();
    } catch (error) {
      this.logger.error(`Error counting all orders: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка подсчета заказов');
    }
  }

  async countUniqueDrawingNumbers(): Promise<number> {
    try {
      const result = await this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT order.drawingNumber)', 'count')
        .getRawOne();
      return parseInt(result.count, 10);
    } catch (error) {
      this.logger.error(`Error counting unique drawing numbers: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка подсчета уникальных номеров чертежей');
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<EnrichedOrder> {
    this.logger.log(`Creating order: ${JSON.stringify(createOrderDto)}`);

    const { operations: operationsDto, ...orderData } = createOrderDto;

    const orderEntityData = {
      ...orderData,
      priority: Number(orderData.priority),
      deadline: new Date(orderData.deadline),
    };

    try {
      const orderEntity = this.orderRepository.create(orderEntityData);
      const savedOrder = await this.orderRepository.save(orderEntity);
      this.logger.log(`Order created with ID ${savedOrder.id}`);

      if (operationsDto && operationsDto.length > 0) {
        this.logger.log(`Creating ${operationsDto.length} operations`);
        const operationEntities = operationsDto.map((opDto) =>
          this.operationRepository.create({
            operationNumber: Number(opDto.operationNumber),
            operationType: opDto.operationType,
            estimatedTime: Number(opDto.estimatedTime),
            machineAxes: Number(opDto.machineAxes),
            status: 'PENDING',
            order: savedOrder,
          }),
        );
        await this.operationRepository.save(operationEntities);
        this.logger.log(`Created ${operationEntities.length} operations`);
      }

      const orderWithOperations = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['operations'],
      });

      if (!orderWithOperations) {
        throw new InternalServerErrorException('Не удалось загрузить созданный заказ');
      }

      await this.saveOrderToFileSystem(orderWithOperations, orderWithOperations.operations || []);
      return this.enrichOrder(orderWithOperations);
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка создания заказа: ${error.message}`);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<EnrichedOrder> {
    this.logger.log(`Updating order ${id}: ${JSON.stringify(updateOrderDto)}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Некорректный ID заказа: ${id}`);
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      if (updateOrderDto.drawingNumber !== undefined) order.drawingNumber = updateOrderDto.drawingNumber;
      if (updateOrderDto.quantity !== undefined) order.quantity = updateOrderDto.quantity;
      if (updateOrderDto.workType !== undefined) order.workType = updateOrderDto.workType;
      if (updateOrderDto.priority !== undefined) order.priority = Number(updateOrderDto.priority);
      if (updateOrderDto.deadline !== undefined) order.deadline = new Date(updateOrderDto.deadline);

      const savedOrder = await this.orderRepository.save(order);

      if (updateOrderDto.operations) {
        await this.operationRepository.delete({ order: { id: numericId } });
        if (updateOrderDto.operations.length > 0) {
          const operationEntities = updateOrderDto.operations.map((opDto) =>
            this.operationRepository.create({
              operationNumber: Number(opDto.operationNumber),
              operationType: opDto.operationType,
              estimatedTime: Number(opDto.estimatedTime),
              machineAxes: Number(opDto.machineAxes),
              status: 'PENDING',
              order: savedOrder,
            }),
          );
          await this.operationRepository.save(operationEntities);
        }
      }

      const updatedOrder = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!updatedOrder) {
        throw new InternalServerErrorException('Не удалось загрузить обновленный заказ');
      }

      await this.updateOrderInFileSystem(updatedOrder, updatedOrder.operations || []);
      return this.enrichOrder(updatedOrder);
    } catch (error) {
      this.logger.error(`Error updating order ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing order ${id}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Некорректный ID заказа: ${id}`);
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      if (order.operations && order.operations.length > 0) {
        await this.operationRepository.delete({ order: { id: numericId } });
        this.logger.log(`Deleted ${order.operations.length} operations`);
      }

      await this.orderRepository.delete(numericId);
      this.logger.log(`Order ${id} successfully deleted`);
    } catch (error) {
      this.logger.error(`Error removing order ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка удаления заказа: ${error.message}`);
    }
  }

  // Заглушки для методов soft delete (для совместимости)
  async restore(id: string): Promise<EnrichedOrder> {
    this.logger.warn(`Restore method called but soft delete not available. Finding order ${id}`);
    return await this.findOne(id);
  }

  async findDeleted(): Promise<EnrichedOrder[]> {
    this.logger.warn('FindDeleted method called but soft delete not available. Returning empty array.');
    return [];
  }

  async removeBatch(ids: string[]): Promise<number> {
    this.logger.log(`Removing batch orders: ${ids.join(', ')}`);

    const numericIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    if (numericIds.length === 0) {
      return 0;
    }

    try {
      const result = await this.orderRepository.delete(numericIds);
      this.logger.log(`Deleted ${result.affected} orders`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Error removing batch orders: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка удаления заказов');
    }
  }

  async removeAll(): Promise<number> {
    try {
      const allOrders = await this.orderRepository.find({ select: ['id'] });
      
      if (allOrders.length > 0) {
        const orderIds = allOrders.map(order => order.id);
        
        this.logger.log(`Deleting operations for ${orderIds.length} orders`);
        await this.operationRepository.delete({ order: { id: In(orderIds) } });
        
        this.logger.log(`Deleting ${orderIds.length} orders`);
        const result = await this.orderRepository.delete(orderIds);
        
        const deletedCount = result.affected || allOrders.length;
        this.logger.log(`All orders removed successfully: ${deletedCount} deleted`);
        return deletedCount;
      }
      
      this.logger.log('No orders to delete');
      return 0;
    } catch (error) {
      this.logger.error(`Error removing all orders: ${error.message}`);
      throw new InternalServerErrorException('Ошибка удаления всех заказов');
    }
  }

  // Остальные методы остаются без изменений
  private enrichOrder(order: Order): EnrichedOrder {
    return {
      ...order,
      name: order.drawingNumber || 'Без имени',
      clientName: 'Не указан',
      remainingQuantity: order.quantity,
      status: this.calculateOrderStatus(order),
      completionPercentage: this.calculateCompletionPercentage(order),
      forecastedCompletionDate: order.deadline,
      isOnSchedule: this.isOrderOnSchedule(order),
      lastRecalculationAt: order.updatedAt || order.createdAt || new Date(),
      operations: order.operations || [],
    };
  }

  private calculateOrderStatus(order: Order): string {
    if (!order.operations || order.operations.length === 0) return 'planned';
    const completedOps = order.operations.filter((op) => op.status === 'COMPLETED').length;
    const totalOps = order.operations.length;
    if (completedOps === 0) return 'planned';
    if (completedOps === totalOps) return 'completed';
    return 'in_progress';
  }

  private calculateCompletionPercentage(order: Order): number {
    if (!order.operations || order.operations.length === 0) return 0;
    const completedOps = order.operations.filter((op) => op.status === 'COMPLETED').length;
    return Math.round((completedOps / order.operations.length) * 100);
  }

  private isOrderOnSchedule(order: Order): boolean {
    const now = new Date();
    const deadline = new Date(order.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const threshold = this.configService.get<number>('SCHEDULE_THRESHOLD_DAYS', 3);
    return daysUntilDeadline > threshold;
  }

  private async saveOrderToFileSystem(order: Order, operations: Operation[]): Promise<void> {
    try {
      const fileSystemData: OrderFileSystemData = {
        order: { ...order, operations: undefined },
        operations: operations.map((op) => ({ ...op, order: undefined })),
        metadata: {
          version: '1.0',
          created_at: order.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: order.updatedAt?.toISOString() || new Date().toISOString(),
          changes_summary: 'Создание заказа',
          data_source: 'orders_service',
          export_date: new Date().toISOString(),
        },
      };
      await this.orderFileSystemService.createOrderVersion(order.drawingNumber, fileSystemData);
      this.logger.log(`Order ${order.drawingNumber} saved to filesystem`);
    } catch (error) {
      this.logger.error(`Error saving order ${order.drawingNumber} to filesystem: ${error.message}`, error.stack);
    }
  }

  private async updateOrderInFileSystem(order: Order, operations: Operation[]): Promise<void> {
    try {
      const fileSystemData: OrderFileSystemData = {
        order: { ...order, operations: undefined },
        operations: operations.map((op) => ({ ...op, order: undefined })),
        metadata: {
          version: '1.1',
          created_at: order.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          changes_summary: 'Обновление заказа',
          data_source: 'orders_service',
          export_date: new Date().toISOString(),
        },
      };
      await this.orderFileSystemService.updateOrderVersion(order.drawingNumber, fileSystemData);
      this.logger.log(`New version of order ${order.drawingNumber} created in filesystem`);
    } catch (error) {
      this.logger.error(`Error updating order ${order.drawingNumber} in filesystem: ${error.message}`, error.stack);
    }
  }

  async exportAllOrdersToFileSystem(): Promise<{ success: number; errors: number; details: any[] }> {
    this.logger.log('Exporting all orders to filesystem');
    
    try {
      const allOrders = await this.orderRepository.find({
        relations: ['operations'],
      });
      
      let success = 0;
      let errors = 0;
      const details = [];
      
      for (const order of allOrders) {
        try {
          await this.saveOrderToFileSystem(order, order.operations || []);
          success++;
          details.push({
            drawingNumber: order.drawingNumber,
            status: 'success',
            message: 'Exported successfully'
          });
        } catch (error) {
          errors++;
          details.push({
            drawingNumber: order.drawingNumber,
            status: 'error',
            message: error.message
          });
          this.logger.error(`Error exporting order ${order.drawingNumber}: ${error.message}`);
        }
      }
      
      this.logger.log(`Export completed: ${success} success, ${errors} errors`);
      return { success, errors, details };
    } catch (error) {
      this.logger.error(`Error in exportAllOrdersToFileSystem: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка экспорта заказов в файловую систему');
    }
  }

  // Методы для работы с PDF файлами
  async findFileByHash(fileHash: string): Promise<FileHash | null> {
    try {
      return await this.fileHashRepository.findOne({ where: { fileHash } });
    } catch (error) {
      this.logger.error(`Error finding file by hash: ${error.message}`, error.stack);
      return null;
    }
  }

  async findFileByName(originalName: string, currentOrderId: string): Promise<FileHash | null> {
    try {
      const orderId = parseInt(currentOrderId, 10);
      return await this.fileHashRepository.findOne({ 
        where: { 
          originalName,
          orderId: Not(orderId)
        } 
      });
    } catch (error) {
      this.logger.error(`Error finding file by name: ${error.message}`, error.stack);
      return null;
    }
  }

  async uploadPdf(orderId: string, filename: string): Promise<EnrichedOrder> {
    try {
      const numericId = parseInt(orderId, 10);
      const order = await this.orderRepository.findOne({ where: { id: numericId } });
      
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${orderId} не найден`);
      }

      order.pdfPath = filename;
      const updatedOrder = await this.orderRepository.save(order);
      
      return this.enrichOrder(updatedOrder);
    } catch (error) {
      this.logger.error(`Error uploading PDF: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка загрузки PDF: ${error.message}`);
    }
  }

  async getPdfRevisions(orderId: string): Promise<PdfRevision[]> {
    try {
      const numericId = parseInt(orderId, 10);
      return await this.pdfRevisionRepository.find({ 
        where: { orderId: numericId },
        order: { revisionNumber: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error getting PDF revisions: ${error.message}`, error.stack);
      return [];
    }
  }

  async saveFileInfo(fileInfo: { fileHash: string; filename: string; originalName: string; fileSize: number; orderId: number }): Promise<void> {
    try {
      const fileHash = this.fileHashRepository.create({
        fileHash: fileInfo.fileHash,
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        fileSize: fileInfo.fileSize,
        orderId: fileInfo.orderId
      });
      
      await this.fileHashRepository.save(fileHash);
      this.logger.log(`Saved file info for: ${fileInfo.filename}`);
    } catch (error) {
      this.logger.error(`Error saving file info: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка сохранения информации о файле');
    }
  }

  async deletePdf(id: string): Promise<EnrichedOrder> {
    try {
      const numericId = parseInt(id, 10);
      const order = await this.orderRepository.findOne({ where: { id: numericId } });
      
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      if (order.pdfPath) {
        const filePath = path.join(this.uploadDir, order.pdfPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      order.pdfPath = null;
      const updatedOrder = await this.orderRepository.save(order);
      
      return this.enrichOrder(updatedOrder);
    } catch (error) {
      this.logger.error(`Error deleting PDF: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка удаления PDF: ${error.message}`);
    }
  }

  async getPdfRevision(orderId: string, revisionNumber: number): Promise<PdfRevision | null> {
    try {
      const numericId = parseInt(orderId, 10);
      return await this.pdfRevisionRepository.findOne({ 
        where: { 
          orderId: numericId, 
          revisionNumber 
        } 
      });
    } catch (error) {
      this.logger.error(`Error getting PDF revision: ${error.message}`, error.stack);
      return null;
    }
  }

  async deletePdfRevision(orderId: string, revisionNumber: number): Promise<void> {
    try {
      const numericId = parseInt(orderId, 10);
      await this.pdfRevisionRepository.delete({ 
        orderId: numericId, 
        revisionNumber 
      });
    } catch (error) {
      this.logger.error(`Error deleting PDF revision: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка удаления ревизии PDF');
    }
  }

  async getPdfStatistics(): Promise<any> {
    try {
      const totalFiles = await this.fileHashRepository.count();
      const uniqueHashes = await this.fileHashRepository
        .createQueryBuilder()
        .select('COUNT(DISTINCT fileHash)', 'count')
        .getRawOne();
      
      return {
        totalFiles,
        uniqueFiles: parseInt(uniqueHashes.count, 10),
        duplicateFiles: totalFiles - parseInt(uniqueHashes.count, 10)
      };
    } catch (error) {
      this.logger.error(`Error getting PDF statistics: ${error.message}`, error.stack);
      return { totalFiles: 0, uniqueFiles: 0, duplicateFiles: 0 };
    }
  }

  async cleanupMissingPdfReferences(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      const orders = await this.orderRepository.find({ 
        where: { 
          pdfPath: Not(IsNull()) 
        } 
      });
      
      let cleaned = 0;
      const errors: string[] = [];
      
      for (const order of orders) {
        if (order.pdfPath) {
          const filePath = path.join(this.uploadDir, order.pdfPath);
          if (!fs.existsSync(filePath)) {
            try {
              order.pdfPath = null;
              await this.orderRepository.save(order);
              cleaned++;
            } catch (error) {
              errors.push(`Ошибка очистки заказа ${order.id}: ${error.message}`);
            }
          }
        }
      }
      
      return { cleaned, errors };
    } catch (error) {
      this.logger.error(`Error in cleanup: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка очистки ссылок на PDF');
    }
  }
}
