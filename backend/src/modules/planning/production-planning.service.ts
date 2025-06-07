/**
 * @file: production-planning.service.ts
 * @description: Сервис для планирования производства согласно алгоритму выбора операций
 * @dependencies: typeorm, operations, orders, machines
 * @created: 2025-05-28
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
  operationType: string; // 3-axis, 4-axis, turning
  estimatedTime: number;
  machineAxes: number;
}

export interface MachineAvailability {
  id: number;
  code: string;
  type: string;
  axes: number;
  isActive: boolean;
  isOccupied: boolean;
}

export interface PlanningRequest {
  selectedMachines: number[]; // ID выбранных станков
  excelData?: any; // Данные из Excel файла
}

export interface PlanningResult {
  selectedOrders: OrderWithPriority[];
  operationsQueue: {
    orderId: number;
    operationId: number;
    machineId: number;
    priority: number;
    estimatedTime: number;
    startTime?: Date;
    endTime?: Date;
  }[];
  totalTime: number;
  calculationDate: Date;
}

@Injectable()
export class ProductionPlanningService {
  private readonly logger = new Logger(ProductionPlanningService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Основной метод планирования - реализует алгоритм выбора операций
   */
  async planProduction(request: PlanningRequest): Promise<PlanningResult> {
    this.logger.log('Начинаем планирование производства');

    try {
      // 1. Загрузка данных
      const orders = await this.getOrdersWithPriorities();
      const machines = await this.getAvailableMachines(request.selectedMachines);
      
      // 2. Выбор 3 заказов с разными приоритетами
      const selectedOrders = await this.selectOrdersWithDifferentPriorities(orders);
      
      // 3. Получение первых операций для каждого заказа
      const operations = await this.getFirstOperationsForOrders(selectedOrders);
      
      // 4. Сопоставление операций со станками
      const machineMatching = this.matchOperationsWithMachines(operations, machines);
      
      // 5. Построение очереди по приоритетам
      const queue = this.buildPriorityQueue(machineMatching, selectedOrders);
      
      // 6. Расчет временных рамок
      const result = this.calculateTimelines(queue, selectedOrders);
      
      // 7. Сохранение результатов
      await this.saveResults(result);
      
      this.logger.log('Планирование завершено успешно');
      return result;
      
    } catch (error) {
      this.logger.error('Ошибка при планировании:', error);
      throw error;
    }
  }

  /**
   * Получить заказы с приоритетами из БД
   */
  private async getOrdersWithPriorities(): Promise<OrderWithPriority[]> {
    this.logger.log('Загрузка заказов с приоритетами');
    
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

  /**
   * Выбрать 3 заказа с разными приоритетами (1, 2, 3)
   */
  private async selectOrdersWithDifferentPriorities(orders: OrderWithPriority[]): Promise<OrderWithPriority[]> {
    this.logger.log('Выбор 3 заказов с разными приоритетами');
    
    const selectedOrders: OrderWithPriority[] = [];
    
    // Выбираем по одному заказу для каждого приоритета
    for (let priority = 1; priority <= 3; priority++) {
      const orderWithPriority = orders.find(order => order.priority === priority);
      if (orderWithPriority) {
        selectedOrders.push(orderWithPriority);
      }
    }
    
    if (selectedOrders.length < 3) {
      throw new NotFoundException(`Не найдено заказов для всех приоритетов (1,2,3). Найдено: ${selectedOrders.length}`);
    }
    
    this.logger.log(`Выбрано 3 заказа с приоритетами: ${selectedOrders.map(o => o.priority).join(', ')}`);
    return selectedOrders;
  }

  /**
   * Получить первые операции для выбранных заказов
   */
  private async getFirstOperationsForOrders(orders: OrderWithPriority[]): Promise<OperationData[]> {
    this.logger.log('Получение первых операций для заказов');
    
    const orderIds = orders.map(o => o.id);
    
    // Получаем первую операцию (с минимальным operationNumber) для каждого заказа
    const operations = await this.dataSource.query(`
      WITH first_operations AS (
        SELECT 
          id,
          "orderId",
          "operationNumber",
          operationtype as "operationType",
          "estimatedTime",
          machineaxes as "machineAxes",
          ROW_NUMBER() OVER (PARTITION BY "orderId" ORDER BY "operationNumber" ASC) as rn
        FROM operations 
        WHERE "orderId" = ANY($1)
      )
      SELECT 
        id,
        "orderId",
        "operationNumber",
        "operationType",
        "estimatedTime",
        "machineAxes"
      FROM first_operations 
      WHERE rn = 1
      ORDER BY "orderId"
    `, [orderIds]);

    this.logger.log(`Найдено ${operations.length} первых операций`);
    
    // Логируем найденные операции
    operations.forEach(op => {
      this.logger.log(`Операция ID:${op.id}, Заказ:${op.orderId}, Номер:${op.operationNumber}, Тип:${op.operationType}`);
    });
    
    return operations;
  }

  /**
   * Получить доступные станки
   */
  private async getAvailableMachines(selectedMachineIds: number[]): Promise<MachineAvailability[]> {
    this.logger.log('Получение доступных станков');
    
    let query = `
      SELECT 
        id,
        code,
        type,
        axes,
        "isActive",
        "isOccupied"
      FROM machines 
      WHERE "isActive" = true AND "isOccupied" = false
    `;
    
    let params = [];
    
    // Если указаны конкретные станки, фильтруем по ним
    if (selectedMachineIds && selectedMachineIds.length > 0) {
      query += ' AND id = ANY($1)';
      params = [selectedMachineIds];
    }
    
    const machines = await this.dataSource.query(query, params);

    this.logger.log(`Найдено ${machines.length} доступных станков`);
    
    // Логируем найденные станки
    machines.forEach(machine => {
      this.logger.log(`Станок ID:${machine.id}, Код:${machine.code}, Тип:${machine.type}, Оси:${machine.axes}`);
    });
    
    return machines;
  }

  /**
   * Сопоставить операции со станками по типу
   */
  private matchOperationsWithMachines(operations: OperationData[], machines: MachineAvailability[]) {
    this.logger.log('=== НАЧАЛО СОПОСТАВЛЕНИЯ ОПЕРАЦИЙ СО СТАНКАМИ ===');
    this.logger.log(`Всего операций: ${operations.length}`);
    this.logger.log(`Всего доступных станков: ${machines.length}`);
    
    const matching = [];
    
    for (const operation of operations) {
      this.logger.log(`\n--- Обрабатываем операцию ID:${operation.id} ---`);
      this.logger.log(`Тип: ${operation.operationType}, Оси: ${operation.machineAxes}, Заказ: ${operation.orderId}`);
      
      const compatibleMachines = machines.filter(machine => {
        this.logger.log(`Проверяем станок ${machine.code} (${machine.type}, ${machine.axes} осей)`);
        
        let isCompatible = false;
        
        // Логика сопоставления согласно обновленному алгоритму
        if (operation.operationType === 'TURNING') {
          isCompatible = machine.type === 'TURNING'; // Okuma, JohnFord
          this.logger.log(`TURNING операция: совместим = ${isCompatible}`);
        } else if (operation.operationType === 'MILLING') {
          // Для фрезерных операций:
          if (operation.machineAxes === 4) {
            // 4-осевые операции могут выполнять только 4-осевые станки
            isCompatible = machine.type === 'MILLING' && machine.axes >= 4;
            this.logger.log(`MILLING 4-осевая операция: совместим = ${isCompatible}`);
          } else {
            // 3-осевые операции могут выполнять все фрезерные станки (и 3-осевые и 4-осевые)
            isCompatible = machine.type === 'MILLING';
            this.logger.log(`MILLING 3-осевая операция: совместим = ${isCompatible}`);
          }
        } else if (operation.operationType === 'DRILLING') {
          // Сверление может выполняться на фрезерных станках
          isCompatible = machine.type === 'MILLING';
          this.logger.log(`DRILLING операция: совместим = ${isCompatible}`);
        } else if (operation.operationType === 'GRINDING') {
          // Шлифовка - специальная операция, может выполняться на любых станках
          isCompatible = true; // Любой доступный станок
          this.logger.log(`GRINDING операция: совместим = ${isCompatible}`);
        } else {
          this.logger.warn(`Неизвестный тип операции: ${operation.operationType}`);
        }
        
        return isCompatible;
      });

      this.logger.log(`Найдено ${compatibleMachines.length} совместимых станков для операции ${operation.operationType}`);
      
      if (compatibleMachines.length > 0) {
        const selectedMachine = compatibleMachines[0]; // Выбираем первый подходящий
        this.logger.log(`✅ Выбран станок: ${selectedMachine.code} (ID:${selectedMachine.id}, тип: ${selectedMachine.type}, оси: ${selectedMachine.axes})`);
        
        matching.push({
          operation,
          machines: compatibleMachines,
          selectedMachine
        });
      } else {
        this.logger.error(`❌ НЕ НАЙДЕНО совместимых станков для операции ${operation.operationType}!`);
        this.logger.error(`Операция требует: ${operation.operationType}, оси: ${operation.machineAxes}`);
        this.logger.error(`Доступные станки:`);
        machines.forEach(m => {
          this.logger.error(`- ${m.code}: ${m.type}, ${m.axes} осей`);
        });
      }
    }
    
    this.logger.log(`\n=== ИТОГ СОПОСТАВЛЕНИЯ ===`);
    this.logger.log(`Сопоставлено ${matching.length} операций из ${operations.length}`);
    
    if (matching.length === 0) {
      this.logger.error('🚨 КРИТИЧЕСКАЯ ОШИБКА: НЕ СОПОСТАВЛЕНО НИ ОДНОЙ ОПЕРАЦИИ!');
    }
    
    return matching;
  }

  /**
   * Построить очередь по приоритетам
   */
  private buildPriorityQueue(machineMatching: any[], orders: OrderWithPriority[]) {
    this.logger.log('Построение очереди по приоритетам');
    
    const queue = machineMatching.map(match => {
      const order = orders.find(o => o.id === match.operation.orderId);
      return {
        orderId: match.operation.orderId,
        operationId: match.operation.id,
        machineId: match.selectedMachine.id,
        priority: order?.priority || 999,
        estimatedTime: match.operation.estimatedTime,
        operationType: match.operation.operationType
      };
    });

    // Сортировка по приоритету (1 - высший приоритет)
    queue.sort((a, b) => a.priority - b.priority);
    
    this.logger.log(`Построена очередь из ${queue.length} операций`);
    return queue;
  }

  /**
   * Расчет временных рамок
   */
  private calculateTimelines(queue: any[], orders: OrderWithPriority[]): PlanningResult {
    this.logger.log('Расчет временных рамок');
    
    let currentTime = new Date();
    let totalTime = 0;
    
    // Расчет времени начала и окончания для каждой операции
    const operationsQueue = queue.map(queueItem => {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + queueItem.estimatedTime * 60000); // минуты в миллисекунды
      
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

  /**
   * Сохранить результаты в БД
   */
  private async saveResults(result: PlanningResult): Promise<void> {
    this.logger.log('Сохранение результатов планирования');
    
    try {
      // Сохранение в planning_results
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

      // Сохранение прогресса для каждого заказа в operation_progress
      for (const order of result.selectedOrders) {
        const orderOperations = result.operationsQueue.filter(op => op.orderId === order.id);
        
        await this.dataSource.query(`
          INSERT INTO operation_progress (
            order_id,
            calculation_date,
            deadline,
            quantity,
            total_production_time,
            operations
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          order.id,
          result.calculationDate,
          order.deadline,
          order.quantity,
          orderOperations.reduce((sum, op) => sum + op.estimatedTime, 0),
          JSON.stringify(orderOperations)
        ]);
      }
      
      this.logger.log('Результаты сохранены успешно');
    } catch (error) {
      this.logger.error('Ошибка при сохранении результатов:', error);
      throw error;
    }
  }

  /**
   * Получить последние результаты планирования
   */
  async getLatestPlanningResults(): Promise<any> {
    this.logger.log('Получение последних результатов планирования');
    
    const results = await this.dataSource.query(`
      SELECT * FROM planning_results 
      ORDER BY calculation_date DESC 
      LIMIT 1
    `);

    return results[0] || null;
  }

  /**
   * Получить прогресс операций для заказов
   */
  async getOperationProgress(orderIds?: number[]): Promise<any[]> {
    this.logger.log('Получение прогресса операций');
    
    let query = 'SELECT * FROM operation_progress ORDER BY calculation_date DESC';
    let params = [];
    
    if (orderIds && orderIds.length > 0) {
      query = 'SELECT * FROM operation_progress WHERE order_id = ANY($1) ORDER BY calculation_date DESC';
      params = [orderIds];
    }

    return await this.dataSource.query(query, params);
  }
}
