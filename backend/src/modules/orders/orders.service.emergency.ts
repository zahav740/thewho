/**
 * @file: orders.service.EMERGENCY.ts
 * @description: Экстренная версия OrdersService без зависимости от soft delete
 * @created: 2025-07-08
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

    try {
      let query = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.operations', 'operation')
        .orderBy('order.createdAt', 'DESC')
        .addOrderBy('operation.operationNumber', 'ASC');

      if (filterDto?.search) {
        query = query.where(
          'order.drawingNumber ILIKE :search OR order.workType ILIKE :search',
          { search: `%${filterDto.search}%` },
        );
      }

      if (filterDto?.priority) {
        query = query.andWhere('order.priority = :priority', { priority: filterDto.priority });
      }

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

  // Остальные методы остаются без изменений...
  // (для краткости не включены, но они должны быть скопированы из оригинального файла)

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
}
