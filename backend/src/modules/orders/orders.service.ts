/**
 * @file: orders.service.ts
 * @description: ПРОИЗВОДСТВЕННЫЙ сервис для работы с заказами (БЕЗ ТЕСТОВЫХ ДАННЫХ)
 * @dependencies: typeorm, entities
 * @created: 2025-01-28
 * @updated: 2025-06-07 // УБРАНЫ ВСЕ ЗАГЛУШКИ - ТОЛЬКО РЕАЛЬНЫЕ ДАННЫЕ
 */
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { OrderFileSystemService, OrderFileSystemData } from './order-filesystem.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly orderFileSystemService: OrderFileSystemService,
  ) {}

  async findAll(filterDto?: OrdersFilterDto) {
    console.log('OrdersService.findAll: Получение всех заказов');
    console.log('OrdersService.findAll: Filter:', filterDto);

    // Загружаем заказы с операциями
    let query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.operations', 'operation')
      .orderBy('operation.operationNumber', 'ASC'); // Сортируем операции по номеру

    if (filterDto?.search) {
      query = query.where(
        'order.drawingNumber ILIKE :search OR order.workType ILIKE :search',
        { search: `%${filterDto.search}%` }
      );
    }

    if (filterDto?.priority) {
      query = query.andWhere('order.priority = :priority', { priority: filterDto.priority });
    }

    // Сортировка заказов
    query = query.addOrderBy('order.priority', 'ASC')
              .addOrderBy('order.deadline', 'ASC');

    let page = filterDto?.page || 1;
    let limit = filterDto?.limit || 10;

    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    const [orders, total] = await query.getManyAndCount();

    console.log(`OrdersService.findAll: Найдено ${orders.length} заказов из ${total}`);

    // Обогащаем заказы с информацией об операциях
    const enrichedOrders = orders.map(order => {
      return {
        ...order,
        name: order.drawingNumber || 'Без имени',
        clientName: 'Не указан', // Можно добавить поле в БД позже
        remainingQuantity: order.quantity,
        status: this.calculateOrderStatus(order),
        completionPercentage: this.calculateCompletionPercentage(order),
        forecastedCompletionDate: order.deadline,
        isOnSchedule: this.isOrderOnSchedule(order),
        lastRecalculationAt: order.updatedAt || order.createdAt || new Date(),
        operations: order.operations || []
      };
    });

    return {
      data: enrichedOrders,
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  async findOne(id: string): Promise<Order> {
    console.log(`OrdersService.findOne: Поиск заказа с ID ${id}`);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new NotFoundException(`Некорректный ID заказа: ${id}`);
    }

    // Поиск с загрузкой операций
    const order = await this.orderRepository.findOne({
      where: { id: numericId },
      relations: ['operations']
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    console.log(`OrdersService.findOne: Найден заказ ${order.drawingNumber} с ${order.operations?.length || 0} операциями`);

    // Обогащаем заказ
    const enrichedOrder = this.enrichOrder(order);
    return enrichedOrder;
  }

  async findByDrawingNumber(drawingNumber: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { drawingNumber },
      relations: ['operations']
    });

    return order ? this.enrichOrder(order) : null;
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    console.log('OrdersService.create: Начало создания заказа:', createOrderDto);

    const { operations: operationsDto, ...orderData } = createOrderDto;

    // Преобразуем типы для совместимости с Entity
    const orderEntityData = {
      ...orderData,
      priority: Number(orderData.priority), 
      deadline: new Date(orderData.deadline)
    };

    console.log('OrdersService.create: Данные заказа для сохранения:', orderEntityData);

    // Создаем и сохраняем заказ
    const orderEntity = this.orderRepository.create(orderEntityData);
    const savedOrder = await this.orderRepository.save(orderEntity);

    console.log(`OrdersService.create: Заказ создан с ID ${savedOrder.id}`);

    // Создаем операции если они переданы
    if (operationsDto && operationsDto.length > 0) {
      console.log(`OrdersService.create: Создание ${operationsDto.length} операций`);
      
      const operationEntities = operationsDto.map(opDto => {
        return this.operationRepository.create({
          operationNumber: Number(opDto.operationNumber),
          operationType: opDto.operationType,
          estimatedTime: Number(opDto.estimatedTime),
          machineAxes: Number(opDto.machineAxes),
          status: 'PENDING',
          order: savedOrder, // Связь с заказом
        });
      });
      
      const savedOperations = await this.operationRepository.save(operationEntities);
      console.log(`OrdersService.create: Создано ${savedOperations.length} операций`);
    }

    // Загружаем заказ с операциями для возврата
    const orderWithOperations = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['operations']
    });

    if (!orderWithOperations) {
      throw new InternalServerErrorException('Не удалось загрузить созданный заказ');
    }

    console.log(`OrdersService.create: Заказ создан с ${orderWithOperations.operations?.length || 0} операциями`);

    // 🆕 Сохраняем в файловую систему
    await this.saveOrderToFileSystem(orderWithOperations, orderWithOperations.operations || []);

    return this.enrichOrder(orderWithOperations);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    console.log(`OrdersService.update: Обновление заказа ${id}:`, updateOrderDto);

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new NotFoundException(`Некорректный ID заказа: ${id}`);
    }

    const order = await this.orderRepository.findOne({
      where: { id: numericId },
      relations: ['operations']
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    // Обновляем поля заказа
    if (updateOrderDto.drawingNumber !== undefined) {
      order.drawingNumber = updateOrderDto.drawingNumber;
    }
    if (updateOrderDto.quantity !== undefined) {
      order.quantity = updateOrderDto.quantity;
    }
    if (updateOrderDto.workType !== undefined) {
      order.workType = updateOrderDto.workType;
    }
    if (updateOrderDto.priority !== undefined) {
      order.priority = Number(updateOrderDto.priority);
    }
    if (updateOrderDto.deadline !== undefined) {
      order.deadline = new Date(updateOrderDto.deadline);
    }

    const savedOrder = await this.orderRepository.save(order);
    
    // Обновляем операции если переданы
    if (updateOrderDto.operations) {
      // Удаляем старые операции
      await this.operationRepository.delete({ order: { id: numericId } });
      
      // Создаем новые операции
      if (updateOrderDto.operations.length > 0) {
        const operationEntities = updateOrderDto.operations.map(opDto => {
          return this.operationRepository.create({
            operationNumber: Number(opDto.operationNumber),
            operationType: opDto.operationType,
            estimatedTime: Number(opDto.estimatedTime),
            machineAxes: Number(opDto.machineAxes),
            status: 'PENDING',
            order: savedOrder,
          });
        });
        
        await this.operationRepository.save(operationEntities);
      }
    }

    // Загружаем обновленный заказ с операциями
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: numericId },
      relations: ['operations']
    });

    // 🆕 Создаем новую версию в файловой системе
    await this.updateOrderInFileSystem(updatedOrder, updatedOrder.operations || []);

    return this.enrichOrder(updatedOrder);
  }

  async remove(id: string): Promise<void> {
    console.log(`OrdersService.remove: Удаление заказа ${id}`);
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error(`Некорректный ID: ${id}`);
      throw new NotFoundException(`Некорректный ID заказа: ${id}`);
    }

    // Проверяем, что заказ существует
    const order = await this.orderRepository.findOne({
      where: { id: numericId },
      relations: ['operations']
    });
    
    if (!order) {
      console.error(`Заказ с ID ${id} не найден`);
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    console.log(`Найден заказ ${order.drawingNumber} с ${order.operations?.length || 0} операциями`);

    try {
      // Сначала удаляем все операции вручную (в качестве гарантии)
      if (order.operations && order.operations.length > 0) {
        console.log(`Удаляем ${order.operations.length} операций`);
        await this.operationRepository.delete({ order: { id: numericId } });
        console.log('Операции удалены');
      }
      
      // Теперь удаляем сам заказ
      const result = await this.orderRepository.delete(numericId);
      
      if (result.affected === 0) {
        throw new Error('Заказ не был удалён');
      }
      
      console.log(`✅ Заказ ${id} успешно удалён`);
    } catch (error) {
      console.error(`❌ Ошибка при удалении заказа ${id}:`, error);
      throw new InternalServerErrorException(`Ошибка при удалении заказа: ${error.message}`);
    }
  }

  async removeBatch(ids: string[]): Promise<number> {
    console.log(`OrdersService.removeBatch: Удаление заказов ${ids.join(', ')}`);
    
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    if (numericIds.length === 0) {
      return 0;
    }

    const result = await this.orderRepository.delete(numericIds);
    
    console.log(`OrdersService.removeBatch: Удалено ${result.affected} заказов`);
    return result.affected || 0;
  }

  async removeAll(): Promise<number> {
    console.log(`OrdersService.removeAll: Удаление всех заказов`);
    
    const result = await this.orderRepository.delete({});
    
    console.log(`OrdersService.removeAll: Удалено ${result.affected} заказов`);
    return result.affected || 0;
  }

  async uploadPdf(id: string, filename: string): Promise<Order> {
    console.log(`OrdersService.uploadPdf: Загрузка PDF для заказа ${id}`);
    
    const order = await this.findOne(id);
    order.pdfPath = filename;
    
    const numericId = parseInt(id, 10);
    await this.orderRepository.update(numericId, { pdfPath: filename });
    
    return order;
  }

  async deletePdf(id: string): Promise<Order> {
    console.log(`OrdersService.deletePdf: Удаление PDF для заказа ${id}`);
    
    const order = await this.findOne(id);
    
    // Удаляем файл с диска (если он есть)
    if (order.pdfPath) {
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join('./uploads/pdf', order.pdfPath);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Файл ${order.pdfPath} удален с диска`);
        }
      } catch (error) {
        console.error(`⚠️ Ошибка удаления файла ${order.pdfPath}:`, error);
        // Не прерываем выполнение - обновляем БД в любом случае
      }
    }
    
    // Обнуляем поле в БД
    const numericId = parseInt(id, 10);
    await this.orderRepository.update(numericId, { pdfPath: null });
    
    // Возвращаем обновленный заказ
    const updatedOrder = await this.findOne(id);
    return updatedOrder;
  }

  private enrichOrder(order: Order): Order {
    const enriched = { ...order } as any;

    enriched.name = enriched.drawingNumber || 'Без имени';
    enriched.clientName = 'Не указан'; // Можно добавить поле в БД
    enriched.remainingQuantity = enriched.quantity;
    enriched.status = this.calculateOrderStatus(order);
    enriched.completionPercentage = this.calculateCompletionPercentage(order);
    enriched.forecastedCompletionDate = enriched.deadline;
    enriched.isOnSchedule = this.isOrderOnSchedule(order);
    enriched.lastRecalculationAt = enriched.updatedAt || enriched.createdAt || new Date();
    
    // Устанавливаем реальные операции
    enriched.operations = enriched.operations || [];

    return enriched as Order;
  }

  private calculateOrderStatus(order: Order): string {
    if (!order.operations || order.operations.length === 0) {
      return 'planned';
    }

    const completedOps = order.operations.filter(op => op.status === 'COMPLETED').length;
    const totalOps = order.operations.length;

    if (completedOps === 0) return 'planned';
    if (completedOps === totalOps) return 'completed';
    return 'in_progress';
  }

  private calculateCompletionPercentage(order: Order): number {
    if (!order.operations || order.operations.length === 0) {
      return 0;
    }

    const completedOps = order.operations.filter(op => op.status === 'COMPLETED').length;
    return Math.round((completedOps / order.operations.length) * 100);
  }

  private isOrderOnSchedule(order: Order): boolean {
    const now = new Date();
    const deadline = new Date(order.deadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Простая логика: если до дедлайна больше 3 дней - на графике
    return daysUntilDeadline > 3;
  }

  // 🆕 Новые методы для работы с файловой системой

  /**
   * Сохранить заказ в файловую систему
   */
  private async saveOrderToFileSystem(order: Order, operations: Operation[]): Promise<void> {
    try {
      const fileSystemData: OrderFileSystemData = {
        order: {
          ...order,
          operations: undefined // Удаляем циклические ссылки
        },
        operations: operations.map(op => ({
          ...op,
          order: undefined // Удаляем циклическую ссылку
        })),
        metadata: {
          version: '1.0',
          created_at: order.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: order.updatedAt?.toISOString() || new Date().toISOString(),
          changes_summary: 'Создание заказа',
          data_source: 'orders_service',
          export_date: new Date().toISOString()
        }
      };

      await this.orderFileSystemService.createOrderVersion(order.drawingNumber, fileSystemData);
      console.log(`OrdersService: Заказ ${order.drawingNumber} сохранен в файловую систему`);
    } catch (error) {
      console.error(`Ошибка сохранения заказа ${order.drawingNumber} в файловую систему:`, error);
      // Не прерываем выполнение - файловая система опциональна
    }
  }

  /**
   * Обновить заказ в файловой системе
   */
  private async updateOrderInFileSystem(order: Order, operations: Operation[]): Promise<void> {
    try {
      const fileSystemData: OrderFileSystemData = {
        order: {
          ...order,
          operations: undefined
        },
        operations: operations.map(op => ({
          ...op,
          order: undefined
        })),
        metadata: {
          version: '1.1',
          created_at: order.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          changes_summary: 'Обновление заказа',
          data_source: 'orders_service',
          export_date: new Date().toISOString()
        }
      };

      await this.orderFileSystemService.updateOrderVersion(order.drawingNumber, fileSystemData);
      console.log(`OrdersService: Создана новая версия заказа ${order.drawingNumber} в файловой системе`);
    } catch (error) {
      console.error(`Ошибка обновления заказа ${order.drawingNumber} в файловой системе:`, error);
    }
  }

  /**
   * Экспортировать все заказы в файловую систему
   */
  async exportAllOrdersToFileSystem(): Promise<{ success: number; errors: number }> {
    console.log('OrdersService: Начинаем экспорт всех заказов в файловую систему');
    
    const orders = await this.orderRepository.find({ relations: ['operations'] });
    let success = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        await this.orderFileSystemService.exportOrderFromDatabase(order, order.operations || []);
        success++;
        console.log(`Экспортирован заказ ${order.drawingNumber}`);
      } catch (error) {
        errors++;
        console.error(`Ошибка экспорта заказа ${order.drawingNumber}:`, error);
      }
    }

    console.log(`OrdersService: Экспорт завершен. Успешно: ${success}, Ошибок: ${errors}`);
    return { success, errors };
  }
}
