/**
 * @file: improved-operation-finder.service.ts
 * @description: Улучшенный поиск операций - находит ВСЕ доступные операции
 * @created: 2025-06-07
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface OperationInfo {
  id: number;
  orderId: number;
  operationNumber: number;
  operationType: string;
  estimatedTime: number;
  machineAxes: number;
  status: string;
  description: string;
  orderInfo: {
    drawingNumber: string;
    priority: number;
    quantity: number;
    deadline: string;
    workType: string;
  };
  canStart: boolean;
  blockingReason?: string;
  compatibleMachines: any[];
}

@Injectable()
export class ImprovedOperationFinderService {
  private readonly logger = new Logger(ImprovedOperationFinderService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * УЛУЧШЕННЫЙ ПОИСК - находит ВСЕ доступные операции
   */
  async findAllAvailableOperations(selectedMachineIds?: number[]): Promise<{
    totalOrders: number;
    totalOperations: number;
    availableOperations: OperationInfo[];
    readyToStart: number;
    needsPrerequisites: number;
    summary: string;
  }> {
    this.logger.log('🔍 === УЛУЧШЕННЫЙ ПОИСК ВСЕХ ДОСТУПНЫХ ОПЕРАЦИЙ ===');

    try {
      // 1. Получаем ВСЕ заказы (не только с приоритетами 1-3)
      const allOrders = await this.dataSource.query(`
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

      this.logger.log(`📋 Найдено ${allOrders.length} заказов в системе`);

      // 2. Получаем доступные станки
      const availableMachines = await this.getAvailableMachines(selectedMachineIds);
      this.logger.log(`🏭 Доступно ${availableMachines.length} станков`);

      // 3. Для каждого заказа ищем операции
      const allAvailableOperations: OperationInfo[] = [];
      let readyToStart = 0;
      let needsPrerequisites = 0;

      for (const order of allOrders) {
        this.logger.log(`\n📦 Анализируем заказ: ${order.drawingNumber} (приоритет ${order.priority})`);

        // Получаем ВСЕ операции заказа
        const orderOperations = await this.dataSource.query(`
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

        this.logger.log(`  🔧 Найдено ${orderOperations.length} операций`);

        // Анализируем каждую операцию
        for (const operation of orderOperations) {
          let canStart = true;
          let blockingReason: string | undefined;

          // Проверка статуса операции
          if (operation.status === 'COMPLETED') {
            this.logger.log(`    ✅ Операция ${operation.operationNumber} уже завершена`);
            continue; // Пропускаем завершенные
          }

          if (operation.status === 'IN_PROGRESS') {
            this.logger.log(`    ⏳ Операция ${operation.operationNumber} выполняется`);
            continue; // Пропускаем выполняющиеся
          }

          // Проверяем, выполняется ли операция на станке
          const isInProgress = await this.isOperationInProgress(operation.id);
          if (isInProgress) {
            this.logger.log(`    🚫 Операция ${operation.operationNumber} занята на станке`);
            continue;
          }

          // Проверка предыдущих операций
          if (operation.operationNumber > 1) {
            const prevOperations = await this.dataSource.query(`
              SELECT id, "operationNumber", status 
              FROM operations 
              WHERE "orderId" = $1 AND "operationNumber" < $2
              ORDER BY "operationNumber" DESC
            `, [order.id, operation.operationNumber]);

            const uncompletedPrev = prevOperations.find(op => op.status !== 'COMPLETED');
            if (uncompletedPrev) {
              canStart = false;
              blockingReason = `Ожидает завершения операции ${uncompletedPrev.operationNumber}`;
              needsPrerequisites++;
            }
          }

          // Найти совместимые станки
          const compatibleMachines = this.findCompatibleMachines(operation, availableMachines);

          if (compatibleMachines.length === 0) {
            canStart = false;
            if (!blockingReason) {
              blockingReason = `Нет подходящих станков для ${operation.operationType}`;
            }
          }

          if (canStart) {
            readyToStart++;
          }

          // Добавляем операцию в список (даже если заблокирована)
          allAvailableOperations.push({
            id: operation.id,
            orderId: operation.orderId,
            operationNumber: operation.operationNumber,
            operationType: operation.operationType,
            estimatedTime: operation.estimatedTime || 60, // По умолчанию 60 минут
            machineAxes: operation.machineAxes || 3,
            status: operation.status || 'PENDING',
            description: operation.description || '',
            orderInfo: {
              drawingNumber: order.drawingNumber,
              priority: order.priority,
              quantity: order.quantity,
              deadline: order.deadline,
              workType: order.workType
            },
            canStart,
            blockingReason,
            compatibleMachines
          });

          this.logger.log(`    ${canStart ? '✅' : '⏸️'} Операция ${operation.operationNumber}: ${canStart ? 'ГОТОВА' : blockingReason}`);
        }
      }

      // Сортируем операции: сначала готовые, потом по приоритету
      allAvailableOperations.sort((a, b) => {
        // Сначала готовые к старту
        if (a.canStart && !b.canStart) return -1;
        if (!a.canStart && b.canStart) return 1;
        
        // Потом по приоритету заказа
        const priorityDiff = a.orderInfo.priority - b.orderInfo.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        // Потом по номеру операции
        return a.operationNumber - b.operationNumber;
      });

      const summary = `Найдено ${allAvailableOperations.length} операций: ${readyToStart} готовы к старту, ${needsPrerequisites} ожидают`;
      
      this.logger.log(`\n🎯 ИТОГО: ${summary}`);

      return {
        totalOrders: allOrders.length,
        totalOperations: allAvailableOperations.length,
        availableOperations: allAvailableOperations,
        readyToStart,
        needsPrerequisites,
        summary
      };

    } catch (error) {
      this.logger.error('❌ Ошибка при поиске операций:', error);
      throw error;
    }
  }

  /**
   * Найти совместимые станки для операции (УЛУЧШЕННАЯ ВЕРСИЯ)
   */
  private findCompatibleMachines(operation: any, availableMachines: any[]): any[] {
    const operationType = (operation.operationType || '').toLowerCase();
    
    this.logger.log(`🔍 Ищем станки для операции: "${operation.operationType}" (нормализовано: "${operationType}")`);
    
    return availableMachines.filter(machine => {
      const machineType = (machine.type || '').toLowerCase();
      this.logger.log(`  Проверяем станок ${machine.code}: тип "${machine.type}" (нормализовано: "${machineType}")`);
      
      let isCompatible = false;
      
      // РАСШИРЕННАЯ ЛОГИКА СОПОСТАВЛЕНИЯ
      if (operationType.includes('turn') || operationType.includes('токар')) {
        // Токарные операции
        isCompatible = machineType.includes('turn') || machineType.includes('токар');
        this.logger.log(`    Токарная операция: ${isCompatible}`);
      } 
      else if (operationType.includes('mill') || operationType.includes('фрез')) {
        // Фрезерные операции
        if (operation.machineAxes === 4 || operationType.includes('4')) {
          isCompatible = machineType.includes('mill') && machine.axes >= 4;
          this.logger.log(`    Фрезерная 4-осевая: ${isCompatible}`);
        } else {
          isCompatible = machineType.includes('mill') || machineType.includes('фрез');
          this.logger.log(`    Фрезерная 3-осевая: ${isCompatible}`);
        }
      }
      else if (operationType.includes('drill') || operationType.includes('сверл')) {
        // Сверление
        isCompatible = machineType.includes('mill') || machineType.includes('фрез');
        this.logger.log(`    Сверление (на фрезерных): ${isCompatible}`);
      }
      else if (operationType.includes('grind') || operationType.includes('шлиф')) {
        // Шлифование
        isCompatible = true;
        this.logger.log(`    Шлифование (на любом): ${isCompatible}`);
      }
      else {
        // НЕИЗВЕСТНЫЙ ТИП - пробуем угадать по ключевым словам
        this.logger.warn(`    ⚠️ Неизвестный тип операции: "${operation.operationType}"`);
        
        // По умолчанию считаем фрезерной операцией
        isCompatible = machineType.includes('mill') || machineType.includes('фрез');
        this.logger.log(`    По умолчанию (фрезерная): ${isCompatible}`);
      }
      
      if (isCompatible) {
        this.logger.log(`    ✅ Станок ${machine.code} СОВМЕСТИМ`);
      } else {
        this.logger.log(`    ❌ Станок ${machine.code} НЕ совместим`);
      }
      
      return isCompatible;
    });
  }

  /**
   * Получить доступные станки
   */
  private async getAvailableMachines(selectedMachineIds?: number[]): Promise<any[]> {
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
    
    const machines = await this.dataSource.query(query, params);
    
    this.logger.log(`🏭 Доступные станки:`);
    machines.forEach(m => {
      this.logger.log(`  - ${m.code}: ${m.type}, ${m.axes} осей`);
    });
    
    return machines;
  }

  /**
   * Проверить, выполняется ли операция на станке
   */
  private async isOperationInProgress(operationId: number): Promise<boolean> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM machines 
      WHERE "currentOperation" = $1 AND "isOccupied" = true
    `, [operationId]);
    
    return parseInt(result[0].count) > 0;
  }

  /**
   * Получить топ-3 лучших операции для планирования
   */
  async getTopRecommendedOperations(selectedMachineIds?: number[]): Promise<OperationInfo[]> {
    const result = await this.findAllAvailableOperations(selectedMachineIds);
    
    // Берем только готовые к старту операции
    const readyOperations = result.availableOperations.filter(op => op.canStart);
    
    // Сортируем по приоритету и берем топ-3
    const topOperations = readyOperations
      .sort((a, b) => {
        // Критический приоритет (1) - сначала
        if (a.orderInfo.priority === 1 && b.orderInfo.priority !== 1) return -1;
        if (a.orderInfo.priority !== 1 && b.orderInfo.priority === 1) return 1;
        
        // Потом по дедлайну
        const aDeadline = new Date(a.orderInfo.deadline);
        const bDeadline = new Date(b.orderInfo.deadline);
        return aDeadline.getTime() - bDeadline.getTime();
      })
      .slice(0, 3);

    this.logger.log(`🌟 Топ-${topOperations.length} рекомендуемых операций:`);
    topOperations.forEach((op, i) => {
      this.logger.log(`  ${i+1}. ${op.orderInfo.drawingNumber} - Операция ${op.operationNumber} (${op.operationType})`);
    });

    return topOperations;
  }
}
