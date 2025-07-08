/**
 * @file: orders.service.ts
 * @description: Сервис для работы с заказами в производственной системе с поддержкой дубликатов PDF и ревизий
 * @dependencies: typeorm, entities, ConfigService
 * @created: 2025-01-28
 * @updated: 2025-06-23 - Добавлена поддержка дубликатов PDF, ревизий, улучшено логирование и типизация
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
  private hasSoftDeleteColumns: boolean | null = null; // Кеш проверки колонок

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

  /**
   * Проверяет наличие колонок soft delete в базе данных
   */
  private async checkSoftDeleteColumns(): Promise<boolean> {
    if (this.hasSoftDeleteColumns !== null) {
      return this.hasSoftDeleteColumns;
    }

    try {
      // Пробуем выполнить запрос с полем isDeleted
      await this.orderRepository.query(
        'SELECT "isDeleted" FROM orders WHERE 1=0'
      );
      this.hasSoftDeleteColumns = true;
      this.logger.log('✅ Soft delete columns are available');
      return true;
    } catch (error) {
      this.hasSoftDeleteColumns = false;
      this.logger.warn('⚠️ Soft delete columns not found. Using legacy mode. Please run migration: apply-soft-delete-migration.bat');
      return false;
    }
  }

  async findAll(filterDto?: OrdersFilterDto): Promise<{
    data: EnrichedOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Fetching all orders with filter: ${JSON.stringify(filterDto)}`);

    try {
      let query = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.operations', 'operation');

      // Проверяем наличие поля isDeleted безопасно
      const metadata = await this.orderRepository.manager.connection.getMetadata(Order);
      const hasIsDeletedColumn = metadata.columns.some(column => column.propertyName === 'isDeleted');
      
      if (hasIsDeletedColumn) {
        query = query.where('(order.isDeleted IS NULL OR order.isDeleted = :isDeleted)', { isDeleted: false });
      }

      query = query.orderBy('operation.operationNumber', 'ASC');

      if (filterDto?.search) {
        query = query.andWhere(
          '(order.drawingNumber ILIKE :search OR order.workType ILIKE :search)',
          { search: `%${filterDto.search}%` },
        );
      }

      if (filterDto?.priority) {
        const priorityNum = parseInt(filterDto.priority, 10);
        if (!isNaN(priorityNum)) {
          query = query.andWhere('order.priority = :priority', { priority: priorityNum });
        }
      }

      if (filterDto?.status) {
        query = query.andWhere('operation.status = :status', { status: filterDto.status });
      }

      if (filterDto?.deadlineFrom) {
        query = query.andWhere('order.deadline >= :deadlineFrom', {
          deadlineFrom: new Date(filterDto.deadlineFrom),
        });
      }

      if (filterDto?.deadlineTo) {
        query = query.andWhere('order.deadline <= :deadlineTo', {
          deadlineTo: new Date(filterDto.deadlineTo),
        });
      }

      query = query.addOrderBy('order.priority', 'ASC').addOrderBy('order.deadline', 'ASC');

      const page = filterDto?.page || 1;
      const limit = filterDto?.limit || 10;
      const skip = (page - 1) * limit;
      query = query.skip(skip).take(limit);

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
      // Проверяем наличие поля isDeleted
      const metadata = await this.orderRepository.manager.connection.getMetadata(Order);
      const hasIsDeletedColumn = metadata.columns.some(column => column.propertyName === 'isDeleted');
      
      const whereCondition: any = { id: numericId };
      if (hasIsDeletedColumn) {
        whereCondition.isDeleted = false;
      }

      const order = await this.orderRepository.findOne({
        where: whereCondition,
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
      // Проверяем наличие поля isDeleted
      const metadata = await this.orderRepository.manager.connection.getMetadata(Order);
      const hasIsDeletedColumn = metadata.columns.some(column => column.propertyName === 'isDeleted');
      
      const whereCondition: any = { drawingNumber };
      if (hasIsDeletedColumn) {
        whereCondition.isDeleted = false;
      }

      const order = await this.orderRepository.findOne({
        where: whereCondition,
        relations: ['operations'],
      });
      return order ? this.enrichOrder(order) : null;
    } catch (error) {
      this.logger.error(`Error finding order by drawingNumber ${drawingNumber}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска заказа по номеру чертежа');
    }
  }

  /**
   * Поиск заказа по номеру чертежа включая удаленные (для проверки дубликатов)
   */
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
      // Проверяем наличие поля isDeleted
      const metadata = await this.orderRepository.manager.connection.getMetadata(Order);
      const hasIsDeletedColumn = metadata.columns.some(column => column.propertyName === 'isDeleted');
      
      const whereCondition: any = {};
      if (hasIsDeletedColumn) {
        whereCondition.isDeleted = false;
      }

      return await this.orderRepository.count({ where: whereCondition });
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

  async findOrdersWithPdf(): Promise<Order[]> {
    try {
      this.logger.log('Fetching orders with PDF files');
      const orders = await this.orderRepository.find({
        where: { pdfPath: Not(IsNull()) },
        select: ['id', 'drawingNumber', 'pdfPath', 'createdAt', 'updatedAt'],
        order: { updatedAt: 'DESC' },
      });
      this.logger.log(`Found ${orders.length} orders with PDF`);
      return orders;
    } catch (error) {
      this.logger.error(`Error fetching orders with PDF: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска заказов с PDF');
    }
  }

  async findOrdersByPdfName(partialFilename: string): Promise<Order[]> {
    try {
      this.logger.log(`Fetching orders with similar PDF name: ${partialFilename}`);
      const cleanOriginal = partialFilename.replace(/\.(pdf|PDF)$/, '').replace(/^\d+-\d+-/, '');
      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.pdfPath ILIKE :name', { name: `%${cleanOriginal}%` })
        .getMany();
      this.logger.log(`Found ${orders.length} orders with similar PDF names`);
      return orders;
    } catch (error) {
      this.logger.error(`Error finding orders by PDF name: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска заказов по имени PDF');
    }
  }

  async findFileByHash(fileHash: string): Promise<FileHash | null> {
    try {
      this.logger.log(`Searching for file with hash: ${fileHash}`);
      const fileHashRecord = await this.fileHashRepository.findOne({
        where: { fileHash },
        relations: ['order'],
      });
      return fileHashRecord || null;
    } catch (error) {
      this.logger.error(`Error finding file by hash: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска файла по хешу');
    }
  }

  async findFileByName(originalName: string, excludeOrderId?: string): Promise<FileHash | null> {
    try {
      this.logger.log(`Searching for file with name: ${originalName}`);
      let query = this.fileHashRepository
        .createQueryBuilder('fileHash')
        .leftJoinAndSelect('fileHash.order', 'order')
        .where('fileHash.originalName ILIKE :name', { name: originalName });

      if (excludeOrderId) {
        query = query.andWhere('order.id != :id', { id: parseInt(excludeOrderId) });
      }

      const fileHashRecord = await query.getOne();
      return fileHashRecord || null;
    } catch (error) {
      this.logger.error(`Error finding file by name: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка поиска файла по имени');
    }
  }

  async getPdfStatistics(): Promise<{
    totalOrders: number;
    ordersWithPdf: number;
    ordersWithoutPdf: number;
    percentageWithPdf: number;
  }> {
    try {
      this.logger.log('Fetching PDF statistics');
      const totalOrders = await this.orderRepository.count();
      const ordersWithPdf = await this.orderRepository.count({
        where: { pdfPath: Not(IsNull()) },
      });
      const ordersWithoutPdf = totalOrders - ordersWithPdf;
      const percentageWithPdf = totalOrders > 0 ? Math.round((ordersWithPdf / totalOrders) * 100) : 0;

      this.logger.log(`PDF statistics: ${JSON.stringify({ totalOrders, ordersWithPdf, ordersWithoutPdf, percentageWithPdf })}`);
      return { totalOrders, ordersWithPdf, ordersWithoutPdf, percentageWithPdf };
    } catch (error) {
      this.logger.error(`Error fetching PDF statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка получения статистики PDF');
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
        where: { id: numericId, isDeleted: false },
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

  async remove(id: string, deletedBy?: string): Promise<void> {
    this.logger.log(`Soft deleting order ${id}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Некорректный ID заказа: ${id}`);
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: numericId, isDeleted: false },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден или уже удален`);
      }

      // Мягкое удаление - помечаем как удаленный
      await this.orderRepository.update(numericId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || 'system'
      });
      
      this.logger.log(`Order ${id} soft deleted successfully`);
    } catch (error) {
      this.logger.error(`Error soft deleting order ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка удаления заказа: ${error.message}`);
    }
  }

  /**
   * Восстановление удаленного заказа
   */
  async restore(id: string): Promise<EnrichedOrder> {
    this.logger.log(`Restoring order ${id}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException(`Некорректный ID заказа: ${id}`);
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id: numericId, isDeleted: true },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Удаленный заказ с ID ${id} не найден`);
      }

      // Восстанавливаем заказ
      await this.orderRepository.update(numericId, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      });

      const restoredOrder = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!restoredOrder) {
        throw new InternalServerErrorException('Не удалось восстановить заказ');
      }

      this.logger.log(`Order ${id} restored successfully`);
      return this.enrichOrder(restoredOrder);
    } catch (error) {
      this.logger.error(`Error restoring order ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ошибка восстановления заказа: ${error.message}`);
    }
  }

  /**
   * Получение списка удаленных заказов
   */
  async findDeleted(): Promise<EnrichedOrder[]> {
    try {
      const orders = await this.orderRepository.find({
        where: { isDeleted: true },
        relations: ['operations'],
        order: { deletedAt: 'DESC' }
      });
      return orders.map(order => this.enrichOrder(order));
    } catch (error) {
      this.logger.error(`Error finding deleted orders: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка получения удаленных заказов');
    }
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
      // Сначала получаем все ID заказов
      const allOrders = await this.orderRepository.find({ select: ['id'] });
      
      if (allOrders.length > 0) {
        const orderIds = allOrders.map(order => order.id);
        
        // Сначала удаляем все операции, связанные с заказами
        this.logger.log(`Deleting operations for ${orderIds.length} orders`);
        await this.operationRepository.delete({ order: { id: In(orderIds) } });
        
        // Затем удаляем сами заказы
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
  async uploadPdf(id: string, filename: string): Promise<EnrichedOrder> {
    this.logger.log(`Uploading PDF for order ${id}: ${filename}`);

    try {
      const order = await this.findOne(id);
      order.pdfPath = filename;
      await this.orderRepository.update(parseInt(id), { pdfPath: filename });
      this.logger.log(`PDF file ${filename} attached to order ${id}`);
      return this.enrichOrder(order);
    } catch (error) {
      this.logger.error(`Error uploading PDF for order ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка загрузки PDF');
    }
  }

  async saveFileInfo(fileInfo: {
    fileHash: string;
    filename: string;
    originalName: string;
    fileSize: number;
    orderId: number;
  }): Promise<void> {
    try {
      this.logger.log(`Saving file info for order ${fileInfo.orderId}: ${fileInfo.filename}`);
      await this.fileHashRepository.save({
        fileHash: fileInfo.fileHash,
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        fileSize: fileInfo.fileSize,
        order: { id: fileInfo.orderId },
      });
      this.logger.log(`File info saved: ${fileInfo.filename}`);
    } catch (error) {
      this.logger.error(`Error saving file info: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка сохранения информации о файле');
    }
  }

  async deletePdf(id: string): Promise<EnrichedOrder> {
    this.logger.log(`Deleting PDF for order ${id}`);

    try {
      const order = await this.findOne(id);
      if (order.pdfPath) {
        const filePath = path.join(this.uploadDir, order.pdfPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.log(`File ${order.pdfPath} deleted from disk`);
        }
      }

      await this.orderRepository.update(parseInt(id), { pdfPath: null });
      const updatedOrder = await this.findOne(id);
      this.logger.log(`PDF deleted from order ${id}`);
      return updatedOrder;
    } catch (error) {
      this.logger.error(`Error deleting PDF for order ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка удаления PDF');
    }
  }

  async getPdfRevisions(orderId: string): Promise<PdfRevision[]> {
    try {
      this.logger.log(`Fetching PDF revisions for order ${orderId}`);
      const revisions = await this.pdfRevisionRepository.find({
        where: { order: { id: parseInt(orderId) } },
        order: { revisionNumber: 'ASC' },
      });
      this.logger.log(`Found ${revisions.length} revisions`);
      return revisions;
    } catch (error) {
      this.logger.error(`Error fetching PDF revisions for order ${orderId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка получения ревизий PDF');
    }
  }

  async getPdfRevision(orderId: string, revisionNumber: number): Promise<PdfRevision | null> {
    try {
      this.logger.log(`Fetching PDF revision ${revisionNumber} for order ${orderId}`);
      const revision = await this.pdfRevisionRepository.findOne({
        where: { order: { id: parseInt(orderId) }, revisionNumber },
      });
      return revision || null;
    } catch (error) {
      this.logger.error(`Error fetching PDF revision ${revisionNumber} for order ${orderId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка получения ревизии PDF');
    }
  }

  async deletePdfRevision(orderId: string, revisionNumber: number): Promise<void> {
    try {
      this.logger.log(`Deleting PDF revision ${revisionNumber} for order ${orderId}`);
      const revision = await this.getPdfRevision(orderId, revisionNumber);
      if (!revision) {
        throw new NotFoundException(`Ревизия ${revisionNumber} не найдена для заказа ${orderId}`);
      }
      const filePath = path.join(this.uploadDir, revision.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File ${revision.filename} deleted from disk`);
      }
      await this.pdfRevisionRepository.delete({ order: { id: parseInt(orderId) }, revisionNumber });
      this.logger.log(`Revision ${revisionNumber} deleted`);
    } catch (error) {
      this.logger.error(`Error deleting PDF revision ${revisionNumber} for order ${orderId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createOrderCopy(originalOrderId: string, suffix: string = '_copy'): Promise<EnrichedOrder> {
    this.logger.log(`Creating copy of order ${originalOrderId} with suffix ${suffix}`);

    try {
      const originalOrder = await this.findOne(originalOrderId);
      const copyData: CreateOrderDto = {
        drawingNumber: `${originalOrder.drawingNumber}${suffix}`,
        deadline: originalOrder.deadline.toISOString(),
        quantity: originalOrder.quantity,
        priority: originalOrder.priority,
        workType: originalOrder.workType,
        operations: originalOrder.operations.map((op) => ({
          operationNumber: op.operationNumber,
          operationType: op.operationType as OperationType,
          estimatedTime: op.estimatedTime,
          machineAxes: op.machineAxes,
        })),
      };

      const newOrder = await this.create(copyData);
      this.logger.log(`Created copy of order ${originalOrderId} -> ${newOrder.id}`);
      return newOrder;
    } catch (error) {
      this.logger.error(`Error creating copy of order ${originalOrderId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка создания копии заказа');
    }
  }

  async cleanupMissingPdfReferences(): Promise<{ checked: number; cleaned: number; errors: string[] }> {
    this.logger.log('Starting cleanup of missing PDF references');

    try {
      const ordersWithPdf = await this.findOrdersWithPdf();
      let checked = 0;
      let cleaned = 0;
      const errors: string[] = [];

      for (const order of ordersWithPdf) {
        checked++;
        try {
          const filePath = path.join(this.uploadDir, order.pdfPath);
          if (!fs.existsSync(filePath)) {
            await this.orderRepository.update(order.id, { pdfPath: null });
            cleaned++;
            this.logger.log(`Cleared missing PDF reference for order ${order.id}: ${order.pdfPath}`);
          }
        } catch (error) {
          errors.push(`Error checking file ${order.pdfPath} for order ${order.id}: ${error.message}`);
        }
      }

      this.logger.log(`Cleanup completed: checked ${checked}, cleaned ${cleaned}, errors ${errors.length}`);
      return { checked, cleaned, errors };
    } catch (error) {
      this.logger.error(`Error during PDF cleanup: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка очистки PDF-ссылок');
    }
  }

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

  async exportAllOrdersToFileSystem(): Promise<{ success: number; errors: number }> {
    this.logger.log('Starting export of all orders to filesystem');

    try {
      const orders = await this.orderRepository.find({ relations: ['operations'] });
      let success = 0;
      let errors = 0;

      for (const order of orders) {
        try {
          await this.orderFileSystemService.exportOrderFromDatabase(order, order.operations || []);
          success++;
          this.logger.log(`Exported order ${order.drawingNumber}`);
        } catch (error) {
          errors++;
          this.logger.error(`Error exporting order ${order.drawingNumber}: ${error.message}`, error.stack);
        }
      }

      this.logger.log(`Export completed: ${success} successful, ${errors} errors`);
      return { success, errors };
    } catch (error) {
      this.logger.error(`Error during export: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Ошибка экспорта заказов');
    }
  }
}