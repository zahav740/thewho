/**
 * @file: orders.service.ts
 * @description: Упрощенный сервис для работы с заказами (исправленный с учетом рекомендаций)
 * @dependencies: typeorm, entities
 * @created: 2025-01-28
 * @updated: 2025-06-01 // Исправлена типизация operations
 */
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  async findAll(filterDto?: OrdersFilterDto) {
    try {
      console.log('OrdersService.findAll: Получение всех заказов');
      console.log('OrdersService.findAll: Filter:', filterDto);

      const queryBuilder = this.orderRepository.createQueryBuilder('order');
      queryBuilder.leftJoinAndSelect('order.operations', 'operations');

      if (filterDto?.search) {
        queryBuilder.where(
          'order.drawingNumber ILIKE :search OR order.workType ILIKE :search',
          { search: `%${filterDto.search}%` }
        );
      }

      queryBuilder.orderBy('order.priority', 'ASC')
                  .addOrderBy('order.deadline', 'ASC');

      let page = filterDto?.page || 1;
      let limit = filterDto?.limit || 10;

      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      console.log(`OrdersService.findAll: Найдено ${orders.length} заказов из ${total} всего`);

      // Обогащаем каждый заказ с операциями
      const enrichedOrders = orders.map(order => this.enrichOrder(order));

      return {
        data: enrichedOrders,
        total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit) || 1
      };
    } catch (error) {
      console.error('OrdersService.findAll Ошибка:', error);
      throw new InternalServerErrorException('Ошибка при получении списка заказов');
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      console.log(`OrdersService.findOne: Поиск заказа с ID ${id}`);

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new NotFoundException(`Некорректный ID заказа: ${id}`);
      }

      // Включаем загрузку операций
      const order = await this.orderRepository.findOne({
        where: { id: numericId },
        relations: ['operations'],
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }

      console.log(`OrdersService.findOne: Найден заказ ${order.drawingNumber} с ${order.operations?.length || 0} операциями`);

      // Обогащаем заказ с операциями
      const enrichedOrder = this.enrichOrder(order);
      return enrichedOrder;
    } catch (error) {
      console.error(`OrdersService.findOne Ошибка для ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Ошибка при поиске заказа с ID ${id}`);
    }
  }

  async findByDrawingNumber(drawingNumber: string): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { drawingNumber },
        // Операции здесь также не загружаем по умолчанию
      });

      return order ? this.enrichOrder(order) : null;
    } catch (error) {
      console.error(`OrdersService.findByDrawingNumber Ошибка для ${drawingNumber}:`, error);
      throw new InternalServerErrorException(`Ошибка при поиске заказа по номеру чертежа ${drawingNumber}`);
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      console.log('OrdersService.create: Создание нового заказа:', createOrderDto);

      const { operations: operationsDto, ...orderData } = createOrderDto;

      // Преобразуем типы для совместимости с Entity
      const orderEntityData = {
        ...orderData,
        priority: orderData.priority, // Теперь число, не нужно преобразовывать
        deadline: new Date(orderData.deadline) // string -> Date
      };

      const orderEntity = this.orderRepository.create(orderEntityData);
      const savedOrder = await this.orderRepository.save(orderEntity);

      console.log(`OrdersService.create: Создан заказ с ID ${savedOrder.id}`);

      let createdOperationsEntities: Operation[] = [];
      if (operationsDto && operationsDto.length > 0) {
        console.log(`OrdersService.create: Создание ${operationsDto.length} операций`);
        const operationEntities = operationsDto.map(opDto =>
          this.operationRepository.create({
            sequenceNumber: opDto.operationNumber,
            operationType: opDto.operationType,
            estimatedTime: opDto.estimatedTime,
            machine: typeof opDto.machineAxes === 'number' ? `${opDto.machineAxes}-axis` : (String(opDto.machineAxes).includes('-axis') ? String(opDto.machineAxes) : `${opDto.machineAxes || 3}-axis`),
            status: 'pending',
            completedUnits: 0,
            operators: [],
            order: savedOrder,
          }),
        );
        createdOperationsEntities = await this.operationRepository.save(operationEntities);
        console.log(`OrdersService.create: Операции созданы (${createdOperationsEntities.length})`);
      }

      // Обогащаем заказ
      const enrichedOrder = this.enrichOrder(savedOrder);

      // Используем правильное приведение типов для operations
      // ВАЖНО: указываем any[] для предотвращения ошибки типизации TS2322
      (enrichedOrder.operations as any[]) = createdOperationsEntities.length > 0 
        ? createdOperationsEntities.map(op => ({
            id: op.id,
            operationNumber: op.sequenceNumber,
            operationType: op.operationType,
            machineAxes: this.extractMachineAxesNumber(op.machine),
            estimatedTime: op.estimatedTime,
            status: op.status,
            completedUnits: op.completedUnits,
          }))
        : [];

      return enrichedOrder;
    } catch (error) {
      console.error('OrdersService.create Ошибка:', error);
      throw new InternalServerErrorException('Ошибка при создании заказа');
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      console.log(`OrdersService.update: Обновление заказа ${id}:`, updateOrderDto);

      // Находим заказ с операциями
      const order = await this.findOne(id);

      const { operations: operationsDto, ...orderDataToUpdate } = updateOrderDto;

      // Преобразуем типы при обновлении
      const processedUpdateData: Partial<Order> = {};
      
      // Копируем поля с правильным преобразованием типов
      if (orderDataToUpdate.drawingNumber !== undefined) {
        processedUpdateData.drawingNumber = orderDataToUpdate.drawingNumber;
      }
      if (orderDataToUpdate.quantity !== undefined) {
        processedUpdateData.quantity = orderDataToUpdate.quantity;
      }
      if (orderDataToUpdate.workType !== undefined) {
        processedUpdateData.workType = orderDataToUpdate.workType;
      }
      if (orderDataToUpdate.priority !== undefined) {
        processedUpdateData.priority = orderDataToUpdate.priority; // Теперь число, не нужно преобразовывать
      }
      if (orderDataToUpdate.deadline !== undefined) {
        processedUpdateData.deadline = new Date(orderDataToUpdate.deadline);
      }

      // Обновляем поля самого заказа
      this.orderRepository.merge(order, processedUpdateData);
      const updatedOrderEntity = await this.orderRepository.save(order);

      console.log(`OrdersService.update: Основные данные заказа ${id} обновлены.`);

      let updatedOperationsResult: any[] = [];

      if (operationsDto !== undefined) {
        console.log(`OrdersService.update: Обновление операций для заказа ${id}`);
        try {
          // 1. Удаляем все старые операции
          await this.operationRepository.delete({ order: { id: updatedOrderEntity.id } });
          console.log(`OrdersService.update: Старые операции для заказа ${id} удалены.`);

          // 2. Создаем новые операции, если они есть
          if (operationsDto && operationsDto.length > 0) {
            const newOperationEntities = operationsDto.map(opDto => {
              // Безопасное преобразование machineAxes
              const machineAxes = typeof opDto.machineAxes === 'number' 
                ? `${opDto.machineAxes}-axis` 
                : (String(opDto.machineAxes).includes('-axis') 
                  ? String(opDto.machineAxes) 
                  : `${opDto.machineAxes || 3}-axis`);
              
              return this.operationRepository.create({
                sequenceNumber: opDto.operationNumber,
                operationType: opDto.operationType,
                estimatedTime: opDto.estimatedTime,
                machine: machineAxes,
                status: opDto.status || 'pending',
                completedUnits: opDto.completedUnits || 0,
                operators: [],
                order: updatedOrderEntity,
              });
            });
            
            const savedNewOperations = await this.operationRepository.save(newOperationEntities);
            console.log(`OrdersService.update: Создано ${savedNewOperations.length} новых операций.`);
            
            // Сохраняем новые операции для ответа
            updatedOperationsResult = savedNewOperations.map(op => ({
              id: op.id,
              operationNumber: op.sequenceNumber,
              operationType: op.operationType,
              machineAxes: this.extractMachineAxesNumber(op.machine),
              estimatedTime: op.estimatedTime,
              status: op.status,
              completedUnits: op.completedUnits,
            }));
          } else {
            console.log(`OrdersService.update: Новых операций для создания нет.`);
          }
        } catch (opError) {
          console.error(`OrdersService.update: Ошибка при обновлении операций:`, opError);
          // Не прерываем обновление заказа, но логируем ошибку
        }
      }

      // Обогащаем обновленную сущность заказа
      const enrichedUpdatedOrder = this.enrichOrder(updatedOrderEntity);
      
      // Используем правильное приведение типов для operations
      // ВАЖНО: указываем any[] для предотвращения ошибки типизации TS2322
      (enrichedUpdatedOrder.operations as any[]) = updatedOperationsResult;

      console.log(`OrdersService.update: Обновлен заказ ${updatedOrderEntity.id}`);
      return enrichedUpdatedOrder;
    } catch (error) {
      console.error(`OrdersService.update Ошибка для ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Ошибка при обновлении заказа с ID ${id}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      console.log(`OrdersService.remove: Удаление заказа ${id}`);
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new NotFoundException(`Некорректный ID заказа для удаления: ${id}`);
      }

      // Сначала проверим, существует ли заказ
      const order = await this.orderRepository.findOneBy({ id: numericId });
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден для удаления`);
      }
      // TypeORM должен каскадно удалить связанные операции, если настроено onDelete: 'CASCADE'
      const result = await this.orderRepository.delete(numericId);

      if (result.affected === 0) {
        throw new NotFoundException(`Заказ с ID ${id} не найден (возможно, удален параллельно)`);
      }
      console.log(`OrdersService.remove: Удален заказ ${id}`);
    } catch (error) {
      console.error(`OrdersService.remove Ошибка для ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Ошибка при удалении заказа с ID ${id}`);
    }
  }

  async removeBatch(ids: string[]): Promise<number> {
    try {
      console.log(`OrdersService.removeBatch: Удаление ${ids.length} заказов`);
      const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (numericIds.length === 0) {
        console.warn('OrdersService.removeBatch: Нет корректных ID для удаления.');
        return 0;
      }
      // Аналогично remove, операции должны удаляться каскадно или вручную
      const result = await this.orderRepository.delete(numericIds);
      const deletedCount = result.affected || 0;

      console.log(`OrdersService.removeBatch: Удалено ${deletedCount} заказов`);
      return deletedCount;
    } catch (error) {
      console.error('OrdersService.removeBatch Ошибка:', error);
      throw new InternalServerErrorException('Ошибка при пакетном удалении заказов');
    }
  }

  async removeAll(): Promise<number> {
    try {
      console.log('OrdersService.removeAll: Удаление всех заказов');
      // Сначала удаляем все операции, чтобы избежать проблем с внешними ключами, если нет каскадного удаления
      await this.operationRepository.clear(); // Удаляет все записи из таблицы операций
      console.log('OrdersService.removeAll: Все операции удалены.');

      const count = await this.orderRepository.count();
      await this.orderRepository.clear(); // Удаляет все записи из таблицы заказов

      console.log(`OrdersService.removeAll: Удалено ${count} заказов`);
      return count;
    } catch (error) {
      console.error('OrdersService.removeAll Ошибка:', error);
      throw new InternalServerErrorException('Ошибка при удалении всех заказов');
    }
  }

  async uploadPdf(id: string, filename: string): Promise<Order> {
    try {
      console.log(`OrdersService.uploadPdf: Загрузка PDF для заказа ${id}`);
      const order = await this.findOne(id);
      order.pdfPath = filename;
      const updatedOrder = await this.orderRepository.save(order);

      console.log(`OrdersService.uploadPdf: PDF загружен для заказа ${id}`);
      return this.enrichOrder(updatedOrder);
    } catch (error) {
      console.error(`OrdersService.uploadPdf Ошибка для ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Ошибка при загрузке PDF для заказа ${id}`);
    }
  }

  async loadOperations(orderId: number): Promise<any[]> {
    try {
      console.log(`Загрузка операций для заказа ${orderId}`);
      const operations = await this.operationRepository
        .createQueryBuilder('operation')
        .where('operation.order_id = :orderId', { orderId })
        .orderBy('operation.sequenceNumber', 'ASC')
        .getMany();

      console.log(`Найдено ${operations.length} операций для заказа ${orderId}`);
      return operations.map(op => ({
        id: op.id,
        operationNumber: op.sequenceNumber,
        operationType: op.operationType,
        machineAxes: this.extractMachineAxesNumber(op.machine),
        estimatedTime: op.estimatedTime,
        status: op.status,
        completedUnits: op.completedUnits,
      }));
    } catch (error) {
      console.error(`Ошибка загрузки операций для заказа ${orderId}:`, error);
      return [];
    }
  }

  private enrichOrder(order: Order): Order {
    const enriched = { ...order } as any;

    enriched.name = enriched.drawingNumber || 'Без имени';
    enriched.clientName = enriched.clientName || 'Не указан';
    enriched.remainingQuantity = enriched.quantity;
    enriched.status = enriched.status || 'planned';
    enriched.completionPercentage = enriched.completionPercentage || 0;
    enriched.forecastedCompletionDate = enriched.deadline;
    enriched.isOnSchedule = true;
    enriched.lastRecalculationAt = enriched.updatedAt || enriched.createdAt || new Date();
    
    // Если операции не загружены или не существуют
    if (!enriched.operations) {
      enriched.operations = [];
    } else {
      // Форматируем операции для фронтенда
      // ВАЖНО: используем as any для совместимости с TypeScript
      enriched.operations = (enriched.operations as any[]).map(op => ({
        id: op.id,
        operationNumber: op.sequenceNumber || op.operationNumber,
        operationType: op.operationType,
        machineAxes: this.extractMachineAxesNumber(op.machine),
        estimatedTime: op.estimatedTime,
        status: op.status || 'pending',
        completedUnits: op.completedUnits || 0,
      }));
    }

    return enriched as Order;
  }
 
  // Вспомогательный метод для извлечения числа из строки вида "3-axis" 
  private extractMachineAxesNumber(machineStr: string): number { 
    if (!machineStr) return 3; 
    try { 
      const match = machineStr.match(/(\d+)/); 
      return match && match[1] ? parseInt(match[1], 10) : 3;
    } catch (e) { 
      return 3; // По умолчанию 3 оси
    } 
  } 
}