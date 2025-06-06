/**
 * @file: planning-algorithm.service.ts
 * @description: Сервис алгоритма планирования операций
 * @dependencies: typeorm, entities
 * @created: 2025-05-28
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { OperationProgress } from '../../database/entities/operation-progress.entity';
import { PdfFile } from '../../database/entities/pdf-file.entity';
import { MachineAvailability } from '../../database/entities/machine-availability.entity';
import { RecommendedOrderDto } from './dto/recommended-order.dto';

interface PlanningResult {
  operations: RecommendedOrderDto[];
  hasChanges: boolean;
  calculationHash: string;
}

@Injectable()
export class PlanningAlgorithmService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(OperationProgress)
    private readonly operationProgressRepository: Repository<OperationProgress>,
    @InjectRepository(PdfFile)
    private readonly pdfFileRepository: Repository<PdfFile>,
    @InjectRepository(MachineAvailability)
    private readonly machineAvailabilityRepository: Repository<MachineAvailability>,
  ) {}

  /**
   * Главная функция алгоритма планирования
   */
  async planOperationsForMachine(machineName: string): Promise<RecommendedOrderDto[]> {
    try {
      console.log(`PlanningAlgorithm: Планирование для станка ${machineName}`);

      // 1. Проверяем доступность станка
      const machine = await this.machineAvailabilityRepository.findOne({
        where: { machineName }
      });

      if (!machine || !machine.isAvailable) {
        console.log(`PlanningAlgorithm: Станок ${machineName} недоступен`);
        return [];
      }

      // 2. Получаем заказы из БД
      const orders = await this.getOrdersForPlanning();

      // 3. Проверяем изменения с последним расчетом
      const calculationHash = this.generateCalculationHash(orders, machineName);
      const hasChanges = await this.checkForChanges(calculationHash);

      if (!hasChanges) {
        console.log('PlanningAlgorithm: Нет изменений, возвращаем кэшированный результат');
        return await this.getCachedResult(machineName);
      }

      // 4. Выбираем заказы с разными приоритетами
      const selectedOrders = this.selectOrdersByPriority(orders);

      // 5. Получаем первые операции для каждого заказа
      const firstOperations = await this.getFirstOperationsForOrders(selectedOrders);

      // 6. Фильтруем операции по совместимости со станком
      const compatibleOperations = this.filterOperationsByMachineCompatibility(
        firstOperations, 
        machine
      );

      // 7. Сортируем и выбираем топ-3
      const topOperations = this.sortAndSelectTopOperations(compatibleOperations, 3);

      // 8. Обогащаем данными PDF
      const enrichedOperations = await this.enrichWithPdfData(topOperations);

      // 9. Сохраняем результаты планирования
      await this.savePlanningResults(enrichedOperations, machineName, calculationHash);

      console.log(`PlanningAlgorithm: Найдено ${enrichedOperations.length} операций`);
      return enrichedOperations;

    } catch (error) {
      console.error('PlanningAlgorithm: Ошибка планирования:', error);
      return [];
    }
  }

  /**
   * Получение заказов для планирования
   */
  private async getOrdersForPlanning(): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.status != :status', { status: 'completed' })
      .orderBy('order.priority', 'ASC')
      .addOrderBy('order.deadline', 'ASC')
      .getMany();
  }

  /**
   * Выбор заказов с разными приоритетами (1, 2, 3)
   */
  private selectOrdersByPriority(orders: Order[]): Order[] {
    const ordersByPriority = {
      1: orders.filter(o => o.priority === 1),
      2: orders.filter(o => o.priority === 2),
      3: orders.filter(o => o.priority === 3),
    };

    const selectedOrders: Order[] = [];

    // Выбираем по одному заказу каждого приоритета
    if (ordersByPriority[1].length > 0) {
      selectedOrders.push(ordersByPriority[1][0]);
    }
    if (ordersByPriority[2].length > 0) {
      selectedOrders.push(ordersByPriority[2][0]);
    }
    if (ordersByPriority[3].length > 0) {
      selectedOrders.push(ordersByPriority[3][0]);
    }

    return selectedOrders;
  }

  /**
   * Получение только первых операций для заказов
   */
  private async getFirstOperationsForOrders(orders: Order[]): Promise<Operation[]> {
    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);

    return this.operationRepository
      .createQueryBuilder('operation')
      .leftJoinAndSelect('operation.order', 'order')
      .where('operation.order_id IN (:...orderIds)', { orderIds })
      .andWhere('operation.sequence_number = :sequenceNumber', { sequenceNumber: 1 })
      .andWhere('operation.status = :status', { status: 'pending' })
      .orderBy('order.priority', 'ASC')
      .addOrderBy('order.deadline', 'ASC')
      .getMany();
  }

  /**
   * Фильтрация операций по совместимости со станком
   */
  private filterOperationsByMachineCompatibility(
    operations: Operation[], 
    machine: MachineAvailability
  ): Operation[] {
    return operations.filter(operation => {
      if (!operation.operationType) {
        console.log(`PlanningAlgorithm: Операция ${operation.id} без типа операции`);
        return false;
      }

      const isCompatible = machine.canPerformOperation(operation.operationType);
      console.log(`PlanningAlgorithm: Операция ${operation.operationType} на станке ${machine.machineName}: ${isCompatible}`);
      return isCompatible;
    });
  }

  /**
   * Сортировка и выбор топ операций
   */
  private sortAndSelectTopOperations(operations: Operation[], limit: number = 3): Operation[] {
    return operations
      .sort((a, b) => {
        // Сначала по приоритету заказа (1 > 2 > 3)
        if (a.order.priority !== b.order.priority) {
          return a.order.priority - b.order.priority;
        }
        // Затем по дедлайну
        return new Date(a.order.deadline).getTime() - new Date(b.order.deadline).getTime();
      })
      .slice(0, limit);
  }

  /**
   * Обогащение данных PDF файлами
   */
  private async enrichWithPdfData(operations: Operation[]): Promise<RecommendedOrderDto[]> {
    const enrichedOperations: RecommendedOrderDto[] = [];

    for (const operation of operations) {
      const pdfFile = await this.pdfFileRepository.findOne({
        where: { orderId: operation.order.id }
      });

      const recommendedOrder: RecommendedOrderDto = {
        orderId: operation.order.id,
        operationId: operation.id,
        drawingNumber: operation.order.drawingNumber || `ORDER-${operation.order.id}`,
        revision: 'A', // Пока по умолчанию
        quantity: operation.order.quantity,
        operationNumber: operation.sequenceNumber,
        operationType: operation.operationType || 'unknown',
        estimatedTime: operation.estimatedTime,
        priority: operation.order.priority as any, // Приведение к совместимому типу
        deadline: operation.order.deadline,
        pdfUrl: pdfFile?.fileUrl || null,
        previewUrl: pdfFile?.previewUrl || null,
        previewHtml: pdfFile ? 
          `<a href="${pdfFile.fileUrl}" target="_blank">
            <img src="${pdfFile.previewUrl}" alt="Превью чертежа" class="w-full h-32 object-cover cursor-pointer">
          </a>` : null,
      };

      enrichedOperations.push(recommendedOrder);
    }

    return enrichedOperations;
  }

  /**
   * Генерация хэша для проверки изменений
   */
  private generateCalculationHash(orders: Order[], machineName: string): string {
    const dataString = JSON.stringify({
      orders: orders.map(o => ({ 
        id: o.id, 
        priority: o.priority, 
        deadline: o.deadline,
        quantity: o.quantity
      })),
      machine: machineName,
      date: new Date().toDateString() // Только дата, не время
    });

    // Простая хэш-функция
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразование в 32-битное число
    }
    return hash.toString();
  }

  /**
   * Проверка изменений с последним расчетом
   */
  private async checkForChanges(calculationHash: string): Promise<boolean> {
    const lastCalculation = await this.operationProgressRepository
      .createQueryBuilder('progress')
      .orderBy('progress.calculation_date', 'DESC')
      .limit(1)
      .getOne();

    if (!lastCalculation) {
      return true; // Нет предыдущих расчетов
    }

    // Сравниваем хэши (в реальности можно добавить поле hash в OperationProgress)
    return true; // Пока всегда пересчитываем
  }

  /**
   * Получение кэшированного результата
   */
  private async getCachedResult(machineName: string): Promise<RecommendedOrderDto[]> {
    // Заглушка для кэшированного результата
    return [];
  }

  /**
   * Сохранение результатов планирования
   */
  private async savePlanningResults(
    operations: RecommendedOrderDto[], 
    machineName: string,
    calculationHash: string
  ): Promise<void> {
    for (const operation of operations) {
      const calculationDate = new Date();
      const startDate = new Date();
      const estimatedTime = operation.estimatedTime * operation.quantity;
      const setupTime = 30; // 30 минут на наладку
      const totalTime = estimatedTime + setupTime;
      const estimatedCompletionDate = new Date(startDate.getTime() + totalTime * 60000);
      
      const willMeetDeadline = estimatedCompletionDate <= new Date(operation.deadline);
      const timeMargin = willMeetDeadline ? 
        (new Date(operation.deadline).getTime() - estimatedCompletionDate.getTime()) / (1000 * 60) :
        (estimatedCompletionDate.getTime() - new Date(operation.deadline).getTime()) / (1000 * 60) * -1;

      const operationProgress = this.operationProgressRepository.create({
        orderId: operation.orderId, // Он уже number в RecommendedOrderDto
        calculationDate,
        startDate,
        deadline: operation.deadline,
        estimatedCompletionDate,
        quantity: operation.quantity,
        totalProductionTime: estimatedTime,
        totalSetupTime: setupTime,
        totalRequiredTime: totalTime,
        requiredWorkdays: Math.ceil(totalTime / (8 * 60)), // 8 часов в день
        willMeetDeadline,
        timeMargin: Math.round(timeMargin),
        operations: [{
          operationId: operation.operationId,
          sequenceNumber: operation.operationNumber,
          machine: machineName,
          operationType: operation.operationType,
          estimatedTime: operation.estimatedTime
        }]
      });

      await this.operationProgressRepository.save(operationProgress);
    }
  }
}