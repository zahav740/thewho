/**
 * @file: orders.service.fixed-operations.ts
 * @description: Исправленный сервис для работы с заказами (фикс ошибки сохранения операций)
 * @dependencies: typeorm, entities
 * @created: 2025-05-31
 */
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
      // Теперь с исправленной логикой операций, мы можем безопасно загружать их
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
        relations: ['operations'], // Включаем загрузку операций
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

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      console.log('OrdersService.create: Создание нового заказа:', createOrderDto);

      const { operations: operationsDto, ...orderData } = createOrderDto;

      // Проверка и преобразование типов
      const priorityValue = parseInt(String(orderData.priority), 10);
      if (isNaN(priorityValue)) {
        throw new BadRequestException(`Некорректное значение приоритета: ${orderData.priority}`);
      }

      // Преобразуем типы для совместимости с Entity
      const orderEntityData = {
        ...orderData,
        priority: priorityValue,
        deadline: new Date(orderData.deadline)
      };

      const orderEntity = this.orderRepository.create(orderEntityData);
      const savedOrder = await this.orderRepository.save(orderEntity);

      console.log(`OrdersService.create: Создан заказ с ID ${savedOrder.id}`);

      let createdOperationsEntities: Operation[] = [];
      if (operationsDto && operationsDto.length > 0) {
        console.log(`OrdersService.create: Создание ${operationsDto.length} операций`);
        try {
          const operationEntities = operationsDto.map(opDto => {
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
              status: 'pending',
              completedUnits: 0,
              operators: [],
              order: savedOrder,
            });
          });
          
          createdOperationsEntities = await this.operationRepository.save(operationEntities);
          console.log(`OrdersService.create: Операции созданы (${createdOperationsEntities.length})`);
        } catch (opError) {
          console.error('OrdersService.create: Ошибка при создании операций:', opError);
          // Не прерываем сохранение заказа, но логируем ошибку
        }
      }

      // Обогащаем заказ
      const enrichedOrder = this.enrichOrder(savedOrder);

      // Форматируем созданные операции для ответа
      if (createdOperationsEntities.length > 0) {
         enrichedOrder.operations = createdOperationsEntities.map(op => ({
           id: op.id,
           operationNumber: op.sequenceNumber,
           operationType: op.operationType,
           machineAxes: this.extractMachineAxesNumber(op.machine),
           estimatedTime: op.estimatedTime,
           status: op.status,
           completedUnits: op.completedUnits,
         }));
      } else {
        enrichedOrder.operations = [];
      }

      return enrichedOrder;
    } catch (error) {
      console.error('OrdersService.create Ошибка:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Ошибка при создании заказа');
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      console.log(`OrdersService.update: Обновление заказа ${id}:`, updateOrderDto);

      // Находим заказ с операциями
      const order = await this.findOne(id);

      const { operations: operationsDto, ...orderDataToUpdate } = updateOrderDto;

      // Преобразуем типы при обновлении с проверкой
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
        const priorityValue = parseInt(String(orderDataToUpdate.priority), 10);
        if (isNaN(priorityValue)) {
          throw new BadRequestException(`Некорректное значение приоритета: ${orderDataToUpdate.priority}`);
        }
        processedUpdateData.priority = priorityValue;
      }
      if (orderDataToUpdate.deadline !== undefined) {
        processedUpdateData.deadline = new Date(orderDataToUpdate.deadline);
      }

      // Обновляем поля самого заказа
      this.orderRepository.merge(order, processedUpdateData);
      const updatedOrderEntity = await this.orderRepository.save(order);

      console.log(`OrdersService.update: Основные данные заказа ${id} обновлены.`);

      let updatedOperationsResult: any[] = []; // Для хранения результата операций

      if (operationsDto !== undefined) { // Если поле operations пришло в DTO
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
      enrichedUpdatedOrder.operations = updatedOperationsResult;

      console.log(`OrdersService.update: Обновлен заказ ${updatedOrderEntity.id}`);
      return enrichedUpdatedOrder;
    } catch (error) {
      console.error(`OrdersService.update Ошибка для ID ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Ошибка при обновлении заказа с ID ${id}`);
    }
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

  /**
   * Обогащает заказ дополнительными полями для совместимости с UI.
   */
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
      enriched.operations = enriched.operations.map(op => ({
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

  // Остальные методы остаются без изменений
}
