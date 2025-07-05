/**
 * @file: orders-v2.service.ts
 * @description: Улучшенный сервис для заказов версии 2 с интеллектуальными приоритетами
 * @dependencies: nestjs, typeorm, orders.service
 * @created: 2025-07-03
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Order } from '../../../database/entities/order.entity';
import { Operation } from '../../../database/entities/operation.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrdersFilterDto } from '../dto/orders-filter.dto';
import { PriorityCalculatorService } from './priority-calculator.service';
import { Priority } from './enums/priority.enum';

@Injectable()
export class OrdersV2Service {
  private readonly logger = new Logger(OrdersV2Service.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    private readonly priorityCalculatorService: PriorityCalculatorService,
  ) {}

  /**
   * Получить все заказы с умными приоритетами
   */
  async getAllWithSmartPriorities(filter: OrdersFilterDto) {
    this.logger.log('📋 V2: Получение заказов с умными приоритетами');
    
    try {
      const query = this.buildSmartQuery(filter);
      
      // Получаем общее количество
      const total = await query.getCount();
      
      // Получаем данные с пагинацией
      const orders = await query
        .skip((filter.page - 1) * filter.limit)
        .take(filter.limit)
        .getMany();
      
      // Обогащаем данные расчетными приоритетами
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
            order.deadline,
            order.workType,
            order.quantity,
            order.operations,
          );
          
          return {
            ...order,
            calculatedPriority: calculatedPriority.priority,
            priorityReason: calculatedPriority.reason,
            complexityScore: calculatedPriority.complexityScore,
            urgencyScore: calculatedPriority.urgencyScore,
          };
        }),
      );
      
      // Сортируем по приоритету и дедлайну
      const sortedOrders = this.sortBySmartPriority(enrichedOrders);
      
      this.logger.log(`✅ V2: Получено ${orders.length} заказов из ${total}`);
      
      return {
        data: sortedOrders,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit),
      };
    } catch (error) {
      this.logger.error('❌ V2: Ошибка получения заказов:', error);
      throw error;
    }
  }

  /**
   * Получить заказ по ID с расчетным приоритетом
   */
  async getByIdWithCalculatedPriority(id: number) {
    this.logger.log(`📋 V2: Получение заказа ${id} с расчетным приоритетом`);
    
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['operations'],
      });
      
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      
      // Рассчитываем приоритет
      const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
        order.deadline,
        order.workType,
        order.quantity,
        order.operations,
      );
      
      const enrichedOrder = {
        ...order,
        calculatedPriority: calculatedPriority.priority,
        priorityReason: calculatedPriority.reason,
        complexityScore: calculatedPriority.complexityScore,
        urgencyScore: calculatedPriority.urgencyScore,
      };
      
      this.logger.log(`✅ V2: Заказ получен: ${order.drawingNumber}`);
      return enrichedOrder;
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка получения заказа ${id}:`, error);
      throw error;
    }
  }

  /**
   * Создать заказ с умным приоритетом
   */
  async createWithSmartPriority(createOrderDto: CreateOrderDto) {
    this.logger.log('📝 V2: Создание заказа с умным приоритетом');
    
    try {
      // Рассчитываем приоритет
      const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
        createOrderDto.deadline,
        createOrderDto.workType,
        createOrderDto.quantity,
        createOrderDto.operations,
      );
      
      // Используем рассчитанный приоритет, если он выше заданного
      const finalPriority = this.chooseBestPriority(
        createOrderDto.priority as Priority,
        calculatedPriority.priority,
      );
      
      const orderData = {
        ...createOrderDto,
        priority: finalPriority as number,
      };
      
      // Создаем заказ напрямую
      const order = this.orderRepository.create(orderData);
      const savedOrder = await this.orderRepository.save(order);
      
      // Создаем операции
      if (createOrderDto.operations && createOrderDto.operations.length > 0) {
        const operations = createOrderDto.operations.map(opDto => 
          this.operationRepository.create({
            ...opDto,
            order: savedOrder,
          })
        );
        await this.operationRepository.save(operations);
      }
      
      // Возвращаем заказ с операциями
      const orderWithOperations = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['operations'],
      });
      
      this.logger.log(`✅ V2: Заказ создан: ${savedOrder.drawingNumber} (приоритет: ${finalPriority})`);
      return orderWithOperations;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка создания заказа:', error);
      throw error;
    }
  }

  /**
   * Обновить заказ с умным приоритетом
   */
  async updateWithSmartPriority(id: number, updateOrderDto: UpdateOrderDto) {
    this.logger.log(`📝 V2: Обновление заказа ${id} с умным приоритетом`);
    
    try {
      const existingOrder = await this.orderRepository.findOne({
        where: { id },
        relations: ['operations'],
      });
      
      if (!existingOrder) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      
      // Рассчитываем новый приоритет
      const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
        updateOrderDto.deadline || existingOrder.deadline,
        updateOrderDto.workType || existingOrder.workType,
        updateOrderDto.quantity || existingOrder.quantity,
        updateOrderDto.operations || existingOrder.operations,
      );
      
      // Используем рассчитанный приоритет, если он выше заданного
      const finalPriority = this.chooseBestPriority(
        (updateOrderDto.priority || existingOrder.priority) as Priority,
        calculatedPriority.priority,
      );
      
      // Создаем объект для обновления заказа (без операций)
      const { operations, ...orderUpdateData } = updateOrderDto;
      
      const orderData = {
        ...orderUpdateData,
        priority: finalPriority as number,
      };
      
      // Обновляем заказ напрямую
      await this.orderRepository.update(id, orderData);
      
      // Если есть операции для обновления, обрабатываем их отдельно
      if (operations && operations.length > 0) {
        // Сначала удаляем существующие операции
        await this.operationRepository.delete({ order: { id } });
        
        // Создаем новые операции (без id, чтобы Автоинкремент работал)
        const newOperations = operations.map(opDto => {
          const { id: operationId, ...operationData } = opDto;
          
          return this.operationRepository.create({
            ...operationData,
            order: { id } as Order, // id заказа
          });
        });
        await this.operationRepository.save(newOperations);
      }
      
      // Получаем обновленный заказ
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['operations'],
      });
      
      this.logger.log(`✅ V2: Заказ обновлен: ${order.drawingNumber} (приоритет: ${finalPriority})`);
      return order;
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка обновления заказа ${id}:`, error);
      throw error;
    }
  }

  /**
   * Удалить заказ с очисткой
   */
  async deleteWithCleanup(id: number) {
    this.logger.log(`🗑️ V2: Удаление заказа ${id} с очисткой`);
    
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['operations'],
      });
      
      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      
      // Удаляем заказ (операции удалятся каскадно)
      await this.orderRepository.delete(id);
      
      this.logger.log(`✅ V2: Заказ ${id} удален с очисткой`);
    } catch (error) {
      this.logger.error(`❌ V2: Ошибка удаления заказа ${id}:`, error);
      throw error;
    }
  }

  /**
   * Массовое создание заказов с умными приоритетами
   */
  async createBatchWithSmartPriorities(orders: CreateOrderDto[]) {
    this.logger.log(`📝 V2: Массовое создание ${orders.length} заказов с умными приоритетами`);
    
    let created = 0;
    let errors = 0;
    const errorDetails = [];
    
    try {
      for (const orderDto of orders) {
        try {
          await this.createWithSmartPriority(orderDto);
          created++;
        } catch (error) {
          errors++;
          errorDetails.push({
            order: orderDto.drawingNumber,
            error: error.message,
          });
          this.logger.warn(`⚠️ V2: Ошибка создания заказа ${orderDto.drawingNumber}:`, error.message);
        }
      }
      
      this.logger.log(`✅ V2: Массовое создание завершено: создано ${created}, ошибок ${errors}`);
      
      return {
        created,
        errors,
        total: orders.length,
        errorDetails,
        success: created > 0,
      };
    } catch (error) {
      this.logger.error('❌ V2: Ошибка массового создания заказов:', error);
      throw error;
    }
  }

  /**
   * Пересчитать приоритеты всех заказов
   */
  async recalculateAllPriorities() {
    this.logger.log('🔄 V2: Пересчет приоритетов всех заказов');
    
    try {
      const orders = await this.orderRepository.find({
        relations: ['operations'],
      });
      
      let updated = 0;
      
      for (const order of orders) {
        try {
          const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
            order.deadline,
            order.workType,
            order.quantity,
            order.operations,
          );
          
          const newPriority = calculatedPriority.priority;
          
          if (order.priority !== newPriority) {
            await this.orderRepository.update(order.id, { priority: newPriority });
            updated++;
            this.logger.log(`🔄 V2: Обновлен приоритет заказа ${order.drawingNumber}: ${order.priority} → ${newPriority}`);
          }
        } catch (error) {
          this.logger.warn(`⚠️ V2: Ошибка пересчета приоритета для заказа ${order.drawingNumber}:`, error.message);
        }
      }
      
      this.logger.log(`✅ V2: Пересчет завершен: обновлено ${updated} из ${orders.length} заказов`);
      
      return {
        total: orders.length,
        updated,
        success: true,
      };
    } catch (error) {
      this.logger.error('❌ V2: Ошибка пересчета приоритетов:', error);
      throw error;
    }
  }

  /**
   * Получить умную статистику заказов
   */
  async getSmartStats() {
    this.logger.log('📊 V2: Получение умной статистики заказов');
    
    try {
      const orders = await this.orderRepository.find({
        relations: ['operations'],
      });
      
      const stats = {
        total: orders.length,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
        byStatus: {
          pending: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
        },
        complexity: {
          simple: 0,
          medium: 0,
          complex: 0,
        },
        avgProcessingTime: 0,
        urgentCount: 0,
      };
      
      const now = new Date();
      let totalProcessingTime = 0;
      
      for (const order of orders) {
        // Статистика по приоритетам
        switch (order.priority) {
          case Priority.HIGH:
          case 1:
            stats.byPriority.high++;
            break;
          case Priority.MEDIUM:
          case 2:
            stats.byPriority.medium++;
            break;
          case Priority.LOW:
          case 3:
            stats.byPriority.low++;
            break;
        }
        
        // Статистика по статусам
        const deadline = new Date(order.deadline);
        if (deadline < now) {
          stats.byStatus.overdue++;
        } else if (order.operations?.some(op => op.completedAt)) {
          stats.byStatus.inProgress++;
        } else {
          stats.byStatus.pending++;
        }
        
        // Рассчитываем сложность
        const calculatedPriority = await this.priorityCalculatorService.calculatePriority(
          order.deadline,
          order.workType,
          order.quantity,
          order.operations,
        );
        
        if (calculatedPriority.complexityScore < 30) {
          stats.complexity.simple++;
        } else if (calculatedPriority.complexityScore < 70) {
          stats.complexity.medium++;
        } else {
          stats.complexity.complex++;
        }
        
        // Время обработки
        const operationTime = order.operations?.reduce((sum, op) => sum + (op.estimatedTime || 0), 0) || 0;
        totalProcessingTime += operationTime;
        
        // Срочные заказы
        if (calculatedPriority.urgencyScore > 70) {
          stats.urgentCount++;
        }
      }
      
      stats.avgProcessingTime = orders.length > 0 ? Math.round(totalProcessingTime / orders.length) : 0;
      
      this.logger.log('✅ V2: Умная статистика получена');
      return stats;
    } catch (error) {
      this.logger.error('❌ V2: Ошибка получения умной статистики:', error);
      throw error;
    }
  }

  /**
   * Построить умный запрос с фильтрацией
   */
  private buildSmartQuery(filter: OrdersFilterDto): SelectQueryBuilder<Order> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.operations', 'operations')
      .orderBy('order.priority', 'DESC')
      .addOrderBy('order.deadline', 'ASC')
      .addOrderBy('order.createdAt', 'DESC');
    
    // Фильтр по поиску
    if (filter.search) {
      query.andWhere(
        '(order.drawingNumber ILIKE :search OR order.workType ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }
    
    // Фильтр по приоритету
    if (filter.priority) {
      query.andWhere('order.priority = :priority', { priority: filter.priority });
    }
    
    // Фильтр по дедлайну
    if (filter.deadlineFrom) {
      query.andWhere('order.deadline >= :deadlineFrom', { deadlineFrom: filter.deadlineFrom });
    }
    
    if (filter.deadlineTo) {
      query.andWhere('order.deadline <= :deadlineTo', { deadlineTo: filter.deadlineTo });
    }
    
    return query;
  }

  /**
   * Сортировать по умному приоритету
   */
  private sortBySmartPriority(orders: any[]): any[] {
    return orders.sort((a, b) => {
      // Сначала по приоритету
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Затем по срочности
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      
      // Затем по дедлайну
      const aDeadline = new Date(a.deadline);
      const bDeadline = new Date(b.deadline);
      
      return aDeadline.getTime() - bDeadline.getTime();
    });
  }

  /**
   * Выбрать лучший приоритет
   */
  private chooseBestPriority(manualPriority: Priority | number, calculatedPriority: Priority): Priority {
    const getScore = (priority: Priority | number): number => {
      if (typeof priority === 'number') {
        switch (priority) {
          case 1: return 3; // HIGH
          case 2: return 2; // MEDIUM
          case 3: return 1; // LOW
          case 4: return 4; // URGENT
          default: return 0;
        }
      } else {
        switch (priority) {
          case Priority.HIGH: return 3;
          case Priority.MEDIUM: return 2;
          case Priority.LOW: return 1;
          case Priority.URGENT: return 4;
          default: return 0;
        }
      }
    };
    
    const manualScore = getScore(manualPriority);
    const calculatedScore = getScore(calculatedPriority);
    
    // Возвращаем приоритет с более высоким весом
    return calculatedScore >= manualScore ? calculatedPriority : (manualPriority as Priority);
  }
}
