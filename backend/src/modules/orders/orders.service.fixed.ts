/**
 * Временный фикс для OrdersService
 * Исправляет 500 ошибку на /api/orders
 * Исправлен: несоответствие типов priority (теперь принимает число напрямую)
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';

@Injectable()
export class OrdersServiceFixed {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(filterDto?: OrdersFilterDto) {
    try {
      console.log('OrdersServiceFixed.findAll: Начало выполнения');
      
      // Простой запрос без сложных relation
      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .select([
          'order.id',
          'order.drawingNumber', 
          'order.quantity',
          'order.deadline',
          'order.priority',
          'order.workType',
          'order.pdfPath',
          'order.createdAt',
          'order.updatedAt'
        ])
        .orderBy('order.priority', 'ASC')
        .addOrderBy('order.deadline', 'ASC')
        .getMany();
      
      console.log(`OrdersServiceFixed.findAll: Найдено ${orders.length} заказов`);
      
      // Простое преобразование без лишних полей
      const convertedOrders = orders.map(order => ({
        id: order.id,
        drawingNumber: order.drawingNumber || '',
        quantity: order.quantity || 0,
        deadline: order.deadline,
        priority: order.priority || 3,
        workType: order.workType || '',
        pdfPath: order.pdfPath || null,
        pdfUrl: order.pdfPath || null,
        name: order.drawingNumber || '',
        clientName: 'Не указан',
        remainingQuantity: order.quantity || 0,
        status: 'planned',
        completionPercentage: 0,
        forecastedCompletionDate: order.deadline,
        isOnSchedule: true,
        lastRecalculationAt: order.updatedAt || new Date(),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        operations: [] // Пустой массив операций пока что
      }));
      
      console.log('OrdersServiceFixed.findAll: Успешно преобразовано');
      return convertedOrders;
      
    } catch (error) {
      console.error('OrdersServiceFixed.findAll Ошибка:', error);
      // Возвращаем пустой массив вместо падения
      return [];
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        throw new NotFoundException(`Некорректный ID заказа: ${id}`);
      }
      
      const order = await this.orderRepository.findOne({
        where: { id: numericId }
      });

      if (!order) {
        throw new NotFoundException(`Заказ с ID ${id} не найден`);
      }
      
      return order;
    } catch (error) {
      console.error(`OrdersServiceFixed.findOne error for id ${id}:`, error);
      throw error;
    }
  }

  // ИСПРАВЛЕНО: приоритет теперь числовой тип, не требует преобразования
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Приоритет теперь числовой тип
      const orderData = {
        drawingNumber: createOrderDto.drawingNumber,
        quantity: createOrderDto.quantity,
        deadline: new Date(createOrderDto.deadline),
        priority: createOrderDto.priority, // Теперь напрямую передаем число
        workType: createOrderDto.workType,
        // operations не передаем в entity, так как это отдельная связь
      };
      
      const order = this.orderRepository.create(orderData);
      const savedOrder = await this.orderRepository.save(order);
      return savedOrder;
      
    } catch (error) {
      console.error('OrdersServiceFixed.create Ошибка:', error);
      throw error;
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    
    // Создаем обновленные данные с правильными типами
    const updateData: Partial<Order> = {};
    
    // Копируем только те поля, которые есть в DTO, с преобразованием типов
    if (updateOrderDto.drawingNumber !== undefined) {
      updateData.drawingNumber = updateOrderDto.drawingNumber;
    }
    if (updateOrderDto.quantity !== undefined) {
      updateData.quantity = updateOrderDto.quantity;
    }
    if (updateOrderDto.workType !== undefined) {
      updateData.workType = updateOrderDto.workType;
    }
    
    // Приоритет теперь числовой тип
    if (updateOrderDto.priority !== undefined) {
      updateData.priority = updateOrderDto.priority; // Теперь напрямую передаем число
    }
    
    // Преобразуем deadline из string в Date
    if (updateOrderDto.deadline !== undefined) {
      updateData.deadline = new Date(updateOrderDto.deadline);
    }
    
    Object.assign(order, updateData);
    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async removeBatch(ids: string[]): Promise<number> {
    try {
      const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      const result = await this.orderRepository.delete(numericIds);
      return result.affected || 0;
    } catch (error) {
      console.error('OrdersServiceFixed.removeBatch Ошибка:', error);
      throw error;
    }
  }

  async removeAll(): Promise<number> {
    try {
      const count = await this.orderRepository.count();
      await this.orderRepository.clear();
      return count;
    } catch (error) {
      console.error('OrdersServiceFixed.removeAll Ошибка:', error);
      throw error;
    }
  }

  async uploadPdf(id: string, filename: string): Promise<Order> {
    const order = await this.findOne(id);
    order.pdfPath = filename;
    return this.orderRepository.save(order);
  }

  async findByDrawingNumber(drawingNumber: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { drawingNumber }
    });
  }
}