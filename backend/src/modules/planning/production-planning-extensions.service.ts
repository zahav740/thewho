/**
 * @file: production-planning-extensions.service.ts
 * @description: Расширения для сервиса планирования - методы для выбора операций пользователем
 * @created: 2025-06-07
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { 
  OrderWithPriority, 
  OperationData, 
  MachineAvailability,
  PlanningResult 
} from './production-planning.service';

@Injectable()
export class ProductionPlanningExtensionsService {
  private readonly logger = new Logger(ProductionPlanningExtensionsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Получить список доступных операций для выбора пользователем
   */
  async getAvailableOperations(selectedMachineIds?: number[]): Promise<{
    orders: OrderWithPriority[];
    availableOperations: (OperationData & { 
      orderInfo: OrderWithPriority; 
      compatibleMachines: MachineAvailability[];
      canStart: boolean;
      blockingReason?: string;
    })[];
    totalOperations: number;
  }> {
    this.logger.log('=== ПОЛУЧЕНИЕ ДОСТУПНЫХ ОПЕРАЦИЙ ДЛЯ ВЫБОРА ПОЛЬЗОВАТЕЛЕМ ===');

    try {
      // 1. Получаем заказы с приоритетами
      const orders = await this.getOrdersWithPriorities();
      
      // 2. Получаем доступные станки
      const machines = await this.getAvailableMachines(selectedMachineIds || []);
      
      // 3. Получаем ВСЕ доступные операции для этих заказов
      const allAvailableOperations = await this.getAvailableOperationsForOrders(orders);
      
      // 4. Расширяем информацию об операциях
      const enhancedOperations = [];
      
      for (const operation of allAvailableOperations) {
        const orderInfo = orders.find(o => o.id === operation.orderId);
        
        if (!orderInfo) continue;
        
        // Определяем совместимые станки для операции (УЛУЧШЕННАЯ ЛОГИКА)
        const compatibleMachines = machines.filter(machine => {
          const operationType = (operation.operationType || '').toLowerCase();
          const machineType = (machine.type || '').toLowerCase();
          
          this.logger.log(`  🔍 Проверяем совместимость: операция "${operation.operationType}" со станком ${machine.code} (${machine.type})`);
          
          // РАСШИРЕННАЯ ЛОГИКА СОПОСТАВЛЕНИЯ
          if (operationType.includes('turn') || operationType.includes('токар')) {
            return machineType.includes('turn') || machineType.includes('токар');
          } else if (operationType.includes('mill') || operationType.includes('фрез')) {
            if (operation.machineAxes === 4 || operationType.includes('4')) {
              return machineType.includes('mill') && machine.axes >= 4;
            } else {
              return machineType.includes('mill') || machineType.includes('фрез');
            }
          } else if (operationType.includes('drill') || operationType.includes('сверл')) {
            return machineType.includes('mill') || machineType.includes('фрез');
          } else if (operationType.includes('grind') || operationType.includes('шлиф')) {
            return true; // Любой станок
          } else {
            // По умолчанию считаем фрезерной
            this.logger.warn(`⚠️ Неизвестный тип операции: "${operation.operationType}", считаем фрезерной`);
            return machineType.includes('mill') || machineType.includes('фрез');
          }
        });
        
        // Проверяем, можно ли начать операцию
        let canStart = true;
        let blockingReason: string | undefined;
        
        // Специальная проверка для операций со статусом WAITING
        if (operation.status === 'WAITING') {
          canStart = false;
          blockingReason = `Ожидает завершения предыдущих операций`;
        } else {
          // Проверка на предыдущие операции
          if (operation.operationNumber > 1) {
            const prevOperations = await this.dataSource.query(`
              SELECT status FROM operations 
              WHERE "orderId" = $1 AND "operationNumber" < $2
              ORDER BY "operationNumber" DESC
            `, [operation.orderId, operation.operationNumber]);
            
            const uncompletedPrev = prevOperations.find(op => op.status !== 'COMPLETED');
            if (uncompletedPrev) {
              canStart = false;
              blockingReason = `Ожидается завершение операции ${operation.operationNumber - 1}`;
            }
          }
        }
        
        // Проверка на доступность станков
        if (compatibleMachines.length === 0) {
          canStart = false;
          blockingReason = `Нет доступных станков для операции ${operation.operationType}`;
        }
        
        // Проверка на текущий статус операции
        if (operation.status === 'IN_PROGRESS') {
          canStart = false;
          blockingReason = 'Операция уже выполняется';
        }
        
        enhancedOperations.push({
          ...operation,
          orderInfo,
          compatibleMachines,
          canStart,
          blockingReason
        });
      }
      
      // Сортируем операции по приоритету заказа и номеру операции
      enhancedOperations.sort((a, b) => {
        const priorityDiff = a.orderInfo.priority - b.orderInfo.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return a.operationNumber - b.operationNumber;
      });
      
      this.logger.log(`Найдено ${enhancedOperations.length} доступных операций из ${orders.length} заказов`);
      
      return {
        orders,
        availableOperations: enhancedOperations,
        totalOperations: enhancedOperations.length
      };
      
    } catch (error) {
      this.logger.error('Ошибка при получении доступных операций:', error);
      throw error;
    }
  }

  /**
   * Планирование с выбранными пользователем операциями
   */
  async planWithSelectedOperations(request: {
    selectedMachines: number[];
    selectedOperations: { operationId: number; machineId: number; }[];
  }): Promise<PlanningResult> {
    this.logger.log('=== ПЛАНИРОВАНИЕ С ВЫБРАННЫМИ ОПЕРАЦИЯМИ ===');
    
    try {
      // Валидация выбранных операций
      const operations = [];
      const orders = [];
      
      for (const selected of request.selectedOperations) {
        // Получаем информацию об операции
        const operationData = await this.dataSource.query(`
          SELECT 
            o.id,
            o."orderId",
            o."operationNumber",
            o.operationtype as "operationType",
            o."estimatedTime",
            o.machineaxes as "machineAxes",
            o.status,
            ord.drawing_number as "drawingNumber",
            ord.priority,
            ord.quantity,
            ord.deadline,
            ord."workType"
          FROM operations o
          JOIN orders ord ON o."orderId" = ord.id
          WHERE o.id = $1
        `, [selected.operationId]);
        
        if (operationData.length === 0) {
          throw new Error(`Операция с ID ${selected.operationId} не найдена`);
        }
        
        const opData = operationData[0];
        
        // Проверяем станок
        const machineData = await this.dataSource.query(`
          SELECT * FROM machines 
          WHERE id = $1 AND "isActive" = true AND "isOccupied" = false
        `, [selected.machineId]);
        
        if (machineData.length === 0) {
          throw new Error(`Станок с ID ${selected.machineId} недоступен`);
        }
        
        operations.push({
          id: opData.id,
          orderId: opData.orderId,
          operationNumber: opData.operationNumber,
          operationType: opData.operationType,
          estimatedTime: opData.estimatedTime,
          machineAxes: opData.machineAxes,
          status: opData.status
        });
        
        // Добавляем заказ если еще не добавлен
        if (!orders.find(o => o.id === opData.orderId)) {
          orders.push({
            id: opData.orderId,
            drawingNumber: opData.drawingNumber,
            priority: opData.priority,
            quantity: opData.quantity,
            deadline: opData.deadline,
            workType: opData.workType
          });
        }
      }
      
      // Строим очередь операций
      const operationsQueue = request.selectedOperations.map((selected, index) => {
        const operation = operations.find(op => op.id === selected.operationId);
        const order = orders.find(o => o.id === operation?.orderId);
        
        return {
          orderId: operation!.orderId,
          operationId: operation!.id,
          operationNumber: operation!.operationNumber,
          operationType: operation!.operationType,
          machineId: selected.machineId,
          machineAxes: operation!.machineAxes,
          priority: order!.priority,
          estimatedTime: operation!.estimatedTime
        };
      });
      
      // Рассчитываем время
      const result = this.calculateTimelines(operationsQueue, orders);
      
      // Сохраняем результаты
      await this.saveResults(result);
      
      this.logger.log('Планирование с выбранными операциями завершено успешно');
      return result;
      
    } catch (error) {
      this.logger.error('Ошибка при планировании с выбранными операциями:', error);
      throw error;
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

  private async getOrdersWithPriorities(): Promise<OrderWithPriority[]> {
    this.logger.log('🔍 Загрузка ВСЕХ заказов (не только с приоритетами 1-3)');
    
    const orders = await this.dataSource.query(`
      SELECT 
        id,
        drawing_number as "drawingNumber",
        priority,
        quantity,
        deadline,
        "workType"
      FROM orders 
      ORDER BY priority ASC, deadline ASC
    `);

    this.logger.log(`📋 Найдено ${orders.length} заказов в системе`);
    
    // Логируем найденные заказы
    orders.forEach(order => {
      this.logger.log(`  - ${order.drawingNumber}: приоритет ${order.priority}, срок ${order.deadline}`);
    });
    
    return orders;
  }

  private async getAvailableMachines(selectedMachineIds: number[]): Promise<MachineAvailability[]> {
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
    
    if (selectedMachineIds && selectedMachineIds.length > 0) {
      query += ' AND id = ANY($1)';
      params = [selectedMachineIds];
    }
    
    return await this.dataSource.query(query, params);
  }

  private async getAvailableOperationsForOrders(orders: OrderWithPriority[]): Promise<OperationData[]> {
    this.logger.log('🔧 === УЛУЧШЕННЫЙ ПОИСК ОПЕРАЦИЙ ===');
    const availableOperations: OperationData[] = [];
    
    for (const order of orders) {
      this.logger.log(`\n📦 Анализируем заказ: ${order.drawingNumber} (ID: ${order.id})`);
      
      // Получаем ВСЕ операции заказа
      const allOperations = await this.dataSource.query(`
        SELECT 
          id,
          "orderId",
          "operationNumber",
          operationtype as "operationType",
          "estimatedTime",
          machineaxes as "machineAxes",
          status,
          description
        FROM operations 
        WHERE "orderId" = $1
        ORDER BY "operationNumber" ASC
      `, [order.id]);

      this.logger.log(`  🔧 Найдено ${allOperations.length} операций`);
      
      if (allOperations.length === 0) {
        this.logger.warn(`  ⚠️ У заказа ${order.drawingNumber} нет операций!`);
        continue;
      }

      // Ищем ПЕРВУЮ доступную операцию (не обязательно следующую по порядку)
      for (const operation of allOperations) {
        this.logger.log(`    Операция ${operation.operationNumber}: ${operation.operationType}, статус: ${operation.status || 'PENDING'}`);
        
        // Пропускаем завершенные операции
        if (operation.status === 'COMPLETED') {
          this.logger.log(`      ✅ Операция завершена, пропускаем`);
          continue;
        }
        
        // Пропускаем выполняющиеся операции
        if (operation.status === 'IN_PROGRESS') {
          this.logger.log(`      ⏳ Операция выполняется, пропускаем`);
          continue;
        }
        
        // Проверяем, не занята ли операция на станке
        const isInProgress = await this.isOperationInProgress(operation.id);
        if (isInProgress) {
          this.logger.log(`      🚫 Операция занята на станке, пропускаем`);
          continue;
        }
        
        // Для первой операции - всегда доступна
        if (operation.operationNumber === 1) {
          this.logger.log(`      🎯 Первая операция - добавляем`);
          availableOperations.push({
            id: operation.id,
            orderId: operation.orderId,
            operationNumber: operation.operationNumber,
            operationType: operation.operationType || 'MILLING',
            estimatedTime: operation.estimatedTime || 60,
            machineAxes: operation.machineAxes || 3,
            status: operation.status || 'PENDING'
          });
          break; // Берем только одну операцию на заказ
        }
        
        // Для остальных операций - проверяем предыдущие
        const prevOperations = await this.dataSource.query(`
          SELECT "operationNumber", status 
          FROM operations 
          WHERE "orderId" = $1 AND "operationNumber" < $2
          ORDER BY "operationNumber" DESC
        `, [order.id, operation.operationNumber]);
        
        const allPrevCompleted = prevOperations.every(op => op.status === 'COMPLETED');
        
        if (allPrevCompleted) {
          this.logger.log(`      🎯 Все предыдущие операции завершены - добавляем`);
          availableOperations.push({
            id: operation.id,
            orderId: operation.orderId,
            operationNumber: operation.operationNumber,
            operationType: operation.operationType || 'MILLING',
            estimatedTime: operation.estimatedTime || 60,
            machineAxes: operation.machineAxes || 3,
            status: operation.status || 'PENDING'
          });
          break; // Берем только одну операцию на заказ
        } else {
          this.logger.log(`      ⏸️ Ожидает завершения предыдущих операций`);
          
          // ДОБАВЛЯЕМ ДАЖЕ ЗАБЛОКИРОВАННЫЕ ОПЕРАЦИИ для показа пользователю
          availableOperations.push({
            id: operation.id,
            orderId: operation.orderId,
            operationNumber: operation.operationNumber,
            operationType: operation.operationType || 'MILLING',
            estimatedTime: operation.estimatedTime || 60,
            machineAxes: operation.machineAxes || 3,
            status: 'WAITING' // Помечаем как ожидающую
          });
          break;
        }
      }
    }
    
    this.logger.log(`\n🎯 ИТОГО: Найдено ${availableOperations.length} операций для показа пользователю`);
    availableOperations.forEach(op => {
      this.logger.log(`  - Заказ ${op.orderId}, Операция ${op.operationNumber} (${op.operationType}) - ${op.status}`);
    });
    
    return availableOperations;
  }

  private async isOperationInProgress(operationId: number): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM machines 
      WHERE "currentOperation" = $1 AND "isOccupied" = true
    `, [operationId]);
    
    return parseInt(result[0].count) > 0;
  }

  private calculateTimelines(queue: any[], orders: OrderWithPriority[]): PlanningResult {
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
    } catch (error) {
      this.logger.error('Ошибка при сохранении результатов:', error);
      throw error;
    }
  }
}
