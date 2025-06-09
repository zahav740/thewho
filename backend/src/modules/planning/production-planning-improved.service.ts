/**
 * @file: production-planning-improved.service.ts
 * @description: УЛУЧШЕННЫЙ сервис планирования - правильно учитывает операции в работе
 * @dependencies: typeorm, operations, orders, machines
 * @created: 2025-06-08
 * @improvement: Исправлена логика учета операций в работе и доступности станков
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface OrderWithPriority {
  id: number;
  drawingNumber: string;
  priority: number;
  quantity: number;
  deadline: Date;
  workType: string;
}

export interface OperationData {
  id: number;
  orderId: number;
  operationNumber: number;
  operationType: string;
  estimatedTime: number;
  machineAxes: number;
  status?: string;
}

export interface MachineAvailability {
  id: number;
  code: string;
  type: string;
  axes: number;
  isActive: boolean;
  isOccupied: boolean;
  currentOperation?: number;
}

export interface PlanningRequest {
  selectedMachines: number[];
  excelData?: any;
}

export interface PlanningResult {
  selectedOrders: OrderWithPriority[];
  operationsQueue: {
    orderId: number;
    operationId: number;
    operationNumber: number;
    operationType: string;
    machineId: number;
    machineAxes: number;
    priority: number;
    estimatedTime: number;
    startTime?: Date;
    endTime?: Date;
  }[];
  totalTime: number;
  calculationDate: Date;
  warnings?: string[];
}

export interface OperationAvailabilityCheck {
  operation: OperationData;
  isAvailable: boolean;
  reason?: string;
  compatibleMachines: MachineAvailability[];
  availableMachines: MachineAvailability[];
}

@Injectable()
export class ProductionPlanningImprovedService {
  private readonly logger = new Logger(ProductionPlanningImprovedService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 🎯 ОСНОВНОЙ МЕТОД ПЛАНИРОВАНИЯ (УЛУЧШЕННАЯ ВЕРСИЯ)
   */
  async planProduction(request: PlanningRequest): Promise<PlanningResult> {
    this.logger.log('🚀 УЛУЧШЕННОЕ ПЛАНИРОВАНИЕ: Начинаем анализ');

    try {
      // 1. Получаем базовые данные
      const orders = await this.getOrdersWithPriorities();
      const selectedOrders = await this.selectOrdersWithDifferentPriorities(orders);
      
      // 2. 🆕 УЛУЧШЕННАЯ ЛОГИКА: Получаем реально доступные операции
      const availabilityChecks = await this.getDetailedOperationAvailability(selectedOrders, request.selectedMachines);
      
      // 3. Фильтруем только доступные операции
      const availableOperations = availabilityChecks
        .filter(check => check.isAvailable)
        .map(check => check.operation);
      
      // 4. Логируем результаты анализа
      this.logAvailabilityAnalysis(availabilityChecks);
      
      if (availableOperations.length === 0) {
        this.logger.warn('❌ НЕТ ДОСТУПНЫХ ОПЕРАЦИЙ для планирования!');
        return this.createEmptyResult(selectedOrders, availabilityChecks);
      }
      
      // 5. Строим план для доступных операций
      const operationsQueue = await this.buildSmartQueue(availableOperations, selectedOrders, request.selectedMachines);
      
      // 6. Рассчитываем временные рамки
      const result = this.calculateTimelines(operationsQueue, selectedOrders);
      
      // 7. Сохраняем результаты
      await this.saveResults(result);
      
      this.logger.log('✅ УЛУЧШЕННОЕ ПЛАНИРОВАНИЕ: Завершено успешно');
      return result;
      
    } catch (error) {
      this.logger.error('❌ Ошибка при улучшенном планировании:', error);
      throw error;
    }
  }

  /**
   * 🆕 ДЕТАЛЬНЫЙ АНАЛИЗ ДОСТУПНОСТИ ОПЕРАЦИЙ
   */
  private async getDetailedOperationAvailability(
    orders: OrderWithPriority[], 
    selectedMachineIds: number[]
  ): Promise<OperationAvailabilityCheck[]> {
    this.logger.log('🔍 АНАЛИЗ ДОСТУПНОСТИ: Начинаем детальную проверку операций');
    
    const checks: OperationAvailabilityCheck[] = [];
    
    for (const order of orders) {
      this.logger.log(`\n📋 Анализируем заказ ID:${order.id} (${order.drawingNumber})`);
      
      // Получаем все операции заказа
      const allOperations = await this.getAllOperationsForOrder(order.id);
      
      // Находим следующую операцию для выполнения
      const nextOperation = await this.findNextAvailableOperation(allOperations);
      
      if (nextOperation) {
        this.logger.log(`🎯 Найдена кандидат-операция: ${nextOperation.operationNumber} (${nextOperation.operationType})`);
        
        // Детальная проверка доступности
        const availabilityCheck = await this.checkOperationAvailability(nextOperation, selectedMachineIds);
        checks.push(availabilityCheck);
        
        this.logger.log(`${availabilityCheck.isAvailable ? '✅' : '❌'} Операция ${nextOperation.operationNumber}: ${availabilityCheck.reason || 'доступна'}`);
      } else {
        this.logger.warn(`⚠️ Нет доступных операций для заказа ${order.drawingNumber}`);
      }
    }
    
    return checks;
  }

  /**
   * 🆕 ПРОВЕРКА ДОСТУПНОСТИ КОНКРЕТНОЙ ОПЕРАЦИИ
   */
  private async checkOperationAvailability(
    operation: OperationData, 
    selectedMachineIds: number[]
  ): Promise<OperationAvailabilityCheck> {
    
    // 1. Проверяем статус операции
    if (operation.status === 'IN_PROGRESS') {
      return {
        operation,
        isAvailable: false,
        reason: 'Операция уже выполняется',
        compatibleMachines: [],
        availableMachines: []
      };
    }
    
    if (operation.status === 'COMPLETED') {
      return {
        operation,
        isAvailable: false,
        reason: 'Операция уже завершена',
        compatibleMachines: [],
        availableMachines: []
      };
    }
    
    // 2. Проверяем, не выполняется ли операция на каком-то станке
    const isInProgress = await this.isOperationCurrentlyInProgress(operation.id);
    if (isInProgress) {
      return {
        operation,
        isAvailable: false,
        reason: 'Операция выполняется на другом станке',
        compatibleMachines: [],
        availableMachines: []
      };
    }
    
    // 3. Получаем совместимые станки
    const compatibleMachines = await this.getCompatibleMachines(operation, selectedMachineIds);
    
    if (compatibleMachines.length === 0) {
      return {
        operation,
        isAvailable: false,
        reason: `Нет совместимых станков для операции ${operation.operationType}`,
        compatibleMachines: [],
        availableMachines: []
      };
    }
    
    // 4. Фильтруем только свободные станки
    const availableMachines = compatibleMachines.filter(machine => !machine.isOccupied);
    
    if (availableMachines.length === 0) {
      return {
        operation,
        isAvailable: false,
        reason: `Все совместимые станки заняты (${compatibleMachines.length} станков)`,
        compatibleMachines,
        availableMachines: []
      };
    }
    
    // 5. Операция доступна!
    return {
      operation,
      isAvailable: true,
      reason: `Доступно ${availableMachines.length} станков`,
      compatibleMachines,
      availableMachines
    };
  }

  /**
   * 🆕 ПОЛУЧЕНИЕ СОВМЕСТИМЫХ СТАНКОВ ДЛЯ ОПЕРАЦИИ
   */
  private async getCompatibleMachines(
    operation: OperationData, 
    selectedMachineIds: number[]
  ): Promise<MachineAvailability[]> {
    
    let query = `
      SELECT 
        id, code, type, axes, "isActive", "isOccupied", "currentOperation"
      FROM machines 
      WHERE "isActive" = true
    `;
    
    let params = [];
    
    if (selectedMachineIds && selectedMachineIds.length > 0) {
      query += ' AND id = ANY($1)';
      params = [selectedMachineIds];
    }
    
    const allMachines = await this.dataSource.query(query, params);
    
    // Фильтруем по совместимости с операцией
    const compatibleMachines = allMachines.filter(machine => {
      return this.isOperationCompatibleWithMachine(operation, machine);
    });
    
    return compatibleMachines;
  }

  /**
   * 🆕 ПРОВЕРКА СОВМЕСТИМОСТИ ОПЕРАЦИИ И СТАНКА (ТОЛЬКО 3 ТИПА)
   */
  private isOperationCompatibleWithMachine(operation: OperationData, machine: MachineAvailability): boolean {
    const opType = operation.operationType?.toUpperCase();
    const machineType = machine.type?.toUpperCase();
    
    switch (opType) {
      case 'TURNING':
        // Только токарные станки (Okuma, JohnFord)
        return machineType === 'TURNING';
        
      case 'MILLING':
        if (operation.machineAxes === 4) {
          // 4-осевые операции только на 4+ осевых фрезерных станках
          return machineType === 'MILLING' && machine.axes >= 4;
        } else {
          // 3-осевые операции на любых фрезерных станках (3 или 4+ оси)
          return machineType === 'MILLING';
        }
        
      default:
        this.logger.warn(`Неподдерживаемый тип операции: ${opType}. Поддерживаются только: TURNING, MILLING (3-осевая), MILLING (4-осевая)`);
        return false;
    }
  }

  /**
   * 🆕 ПРОВЕРКА, ВЫПОЛНЯЕТСЯ ЛИ ОПЕРАЦИЯ В ДАННЫЙ МОМЕНТ
   */
  private async isOperationCurrentlyInProgress(operationId: number): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM machines 
      WHERE "currentOperation" = $1 AND "isOccupied" = true
    `, [operationId]);
    
    return parseInt(result[0].count) > 0;
  }

  /**
   * 🆕 ПОИСК СЛЕДУЮЩЕЙ ДОСТУПНОЙ ОПЕРАЦИИ ДЛЯ ЗАКАЗА (ИСПРАВЛЕНО)
   */
  private async findNextAvailableOperation(operations: OperationData[]): Promise<OperationData | null> {
    if (!operations || operations.length === 0) {
      return null;
    }
    
    // Сортируем операции по номеру
    const sortedOperations = operations.sort((a, b) => a.operationNumber - b.operationNumber);
    
    for (const operation of sortedOperations) {
      // Пропускаем завершенные операции
      if (operation.status === 'COMPLETED') {
        continue;
      }
      
      // 🆕 ИСПРАВЛЕНИЕ: Если это первая операция (номер 1), она всегда доступна
      if (operation.operationNumber === 1) {
        return operation;
      }
      
      // Проверяем, есть ли предыдущая операция
      const prevOperation = sortedOperations.find(op => op.operationNumber === operation.operationNumber - 1);
      
      // 🆕 ИСПРАВЛЕНИЕ: Если предыдущей операции нет вообще, текущая операция доступна
      if (!prevOperation) {
        this.logger.log(`✅ Операция ${operation.operationNumber} доступна (нет предыдущей операции ${operation.operationNumber - 1})`);
        return operation;
      }
      
      // Если предыдущая операция завершена, текущая доступна
      if (prevOperation.status === 'COMPLETED') {
        return operation;
      }
      
      // Если предыдущая операция не завершена, операция недоступна
      if (prevOperation.status !== 'COMPLETED') {
        this.logger.log(`❌ Операция ${operation.operationNumber} недоступна (операция ${prevOperation.operationNumber} не завершена: ${prevOperation.status})`);
        break; // Дальше проверять нет смысла
      }
    }
    
    return null;
  }

  /**
   * 🆕 ПОЛУЧЕНИЕ ВСЕХ ОПЕРАЦИЙ ДЛЯ ЗАКАЗА
   */
  private async getAllOperationsForOrder(orderId: number): Promise<OperationData[]> {
    const operations = await this.dataSource.query(`
      SELECT 
        id,
        "orderId",
        "operationNumber",
        operationtype as "operationType",
        "estimatedTime",
        machineaxes as "machineAxes",
        status,
        "assignedMachine",
        "assignedAt"
      FROM operations 
      WHERE "orderId" = $1
      ORDER BY "operationNumber" ASC
    `, [orderId]);
    
    return operations;
  }

  /**
   * 🆕 УМНОЕ ПОСТРОЕНИЕ ОЧЕРЕДИ
   */
  private async buildSmartQueue(
    operations: OperationData[], 
    orders: OrderWithPriority[], 
    selectedMachineIds: number[]
  ) {
    this.logger.log('🏗️ Строим умную очередь операций');
    
    const queue = [];
    
    for (const operation of operations) {
      const order = orders.find(o => o.id === operation.orderId);
      if (!order) continue;
      
      // Получаем лучший доступный станок для операции
      const bestMachine = await this.findBestMachineForOperation(operation, selectedMachineIds);
      
      if (bestMachine) {
        queue.push({
          orderId: operation.orderId,
          operationId: operation.id,
          operationNumber: operation.operationNumber,
          operationType: operation.operationType,
          machineId: bestMachine.id,
          machineAxes: operation.machineAxes,
          priority: order.priority,
          estimatedTime: operation.estimatedTime
        });
      }
    }
    
    // Сортируем по приоритету
    queue.sort((a, b) => a.priority - b.priority);
    
    this.logger.log(`✅ Построена очередь из ${queue.length} операций`);
    return queue;
  }

  /**
   * 🆕 ПОИСК ЛУЧШЕГО СТАНКА ДЛЯ ОПЕРАЦИИ
   */
  private async findBestMachineForOperation(
    operation: OperationData, 
    selectedMachineIds: number[]
  ): Promise<MachineAvailability | null> {
    
    const compatibleMachines = await this.getCompatibleMachines(operation, selectedMachineIds);
    const availableMachines = compatibleMachines.filter(m => !m.isOccupied);
    
    if (availableMachines.length === 0) {
      return null;
    }
    
    // Простая стратегия: берем первый доступный
    // Можно улучшить: выбирать по загрузке, оптимальности и т.д.
    return availableMachines[0];
  }

  /**
   * 🆕 ЛОГИРОВАНИЕ РЕЗУЛЬТАТОВ АНАЛИЗА
   */
  private logAvailabilityAnalysis(checks: OperationAvailabilityCheck[]) {
    this.logger.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА ДОСТУПНОСТИ:');
    this.logger.log('='.repeat(60));
    
    const available = checks.filter(c => c.isAvailable);
    const unavailable = checks.filter(c => !c.isAvailable);
    
    this.logger.log(`✅ Доступных операций: ${available.length}`);
    this.logger.log(`❌ Недоступных операций: ${unavailable.length}`);
    
    if (available.length > 0) {
      this.logger.log('\n🎯 ДОСТУПНЫЕ ОПЕРАЦИИ:');
      available.forEach(check => {
        this.logger.log(`  - Операция ${check.operation.operationNumber} (${check.operation.operationType}): ${check.reason}`);
      });
    }
    
    if (unavailable.length > 0) {
      this.logger.log('\n⚠️ НЕДОСТУПНЫЕ ОПЕРАЦИИ:');
      unavailable.forEach(check => {
        this.logger.log(`  - Операция ${check.operation.operationNumber} (${check.operation.operationType}): ${check.reason}`);
      });
    }
    
    this.logger.log('='.repeat(60));
  }

  /**
   * 🆕 СОЗДАНИЕ ПУСТОГО РЕЗУЛЬТАТА С ПРЕДУПРЕЖДЕНИЯМИ
   */
  private createEmptyResult(orders: OrderWithPriority[], checks: OperationAvailabilityCheck[]): PlanningResult {
    const warnings = [
      'Нет доступных операций для планирования',
      ...checks.filter(c => !c.isAvailable).map(c => `${c.operation.operationType} ${c.operation.operationNumber}: ${c.reason}`)
    ];
    
    return {
      selectedOrders: orders,
      operationsQueue: [],
      totalTime: 0,
      calculationDate: new Date(),
      warnings
    };
  }

  // ==========================================
  // БАЗОВЫЕ МЕТОДЫ (без изменений)
  // ==========================================

  private async getOrdersWithPriorities(): Promise<OrderWithPriority[]> {
    this.logger.log('📋 Загрузка заказов с приоритетами');
    
    const orders = await this.dataSource.query(`
      SELECT 
        id,
        drawing_number as "drawingNumber",
        priority,
        quantity,
        deadline,
        "workType"
      FROM orders 
      WHERE priority IN (1, 2, 3)
      ORDER BY priority ASC, deadline ASC
    `);

    this.logger.log(`Найдено ${orders.length} заказов с приоритетами`);
    return orders;
  }

  private async selectOrdersWithDifferentPriorities(orders: OrderWithPriority[]): Promise<OrderWithPriority[]> {
    this.logger.log('🎯 ИСПРАВЛЕНО: Выбор ВСЕХ заказов с приоритетами для более широкого планирования');
    
    // 🆕 ИСПРАВЛЕНИЕ: Вместо выбора одного заказа на приоритет, берем ВСЕ заказы с приоритетами
    // Это позволит найти больше доступных операций для планирования
    const selectedOrders = orders.filter(order => order.priority >= 1 && order.priority <= 3);
    
    if (selectedOrders.length === 0) {
      throw new NotFoundException('Не найдено ни одного заказа с приоритетами 1, 2 или 3');
    }
    
    // Сортируем по приоритету и дедлайну для оптимального планирования
    selectedOrders.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // По возрастанию приоритета
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); // По дедлайну
    });
    
    const priorityStats = selectedOrders.reduce((stats, order) => {
      stats[order.priority] = (stats[order.priority] || 0) + 1;
      return stats;
    }, {} as Record<number, number>);
    
    this.logger.log(`Выбрано ${selectedOrders.length} заказов:`);
    this.logger.log(`  - Приоритет 1: ${priorityStats[1] || 0} заказов`);
    this.logger.log(`  - Приоритет 2: ${priorityStats[2] || 0} заказов`);
    this.logger.log(`  - Приоритет 3: ${priorityStats[3] || 0} заказов`);
    
    return selectedOrders;
  }

  private calculateTimelines(queue: any[], orders: OrderWithPriority[]): PlanningResult {
    this.logger.log('⏱️ Расчет временных рамок');
    
    let currentTime = new Date();
    let totalTime = 0;
    
    const operationsQueue = queue.map(queueItem => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + queueItem.estimatedTime * 60000);
      
      totalTime += queueItem.estimatedTime;
      currentTime = endTime;
      
      return {
        ...queueItem,
        startTime,
        endTime
      };
    });

    return {
      selectedOrders: orders,
      operationsQueue,
      totalTime,
      calculationDate: new Date()
    };
  }

  private async saveResults(result: PlanningResult): Promise<void> {
    this.logger.log('💾 Сохранение результатов планирования');
    
    try {
      await this.dataSource.query(`
        INSERT INTO planning_results (
          calculation_date,
          selected_orders,
          selected_machines,
          queue_plan,
          total_time
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        result.calculationDate,
        JSON.stringify(result.selectedOrders),
        JSON.stringify(result.operationsQueue.map(op => op.machineId)),
        JSON.stringify(result.operationsQueue),
        result.totalTime
      ]);

      this.logger.log('✅ Результаты сохранены успешно');
    } catch (error) {
      this.logger.error('❌ Ошибка при сохранении результатов:', error);
      throw error;
    }
  }
}
