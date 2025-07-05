/**
 * @file: priority-calculator.service.ts
 * @description: Сервис для интеллектуального расчета приоритетов заказов
 * @dependencies: nestjs
 * @created: 2025-07-03
 */
import { Injectable, Logger } from '@nestjs/common';
import { Priority } from './enums/priority.enum';
import { OperationType } from './enums/operation-type.enum';

export interface PriorityCalculationResult {
  priority: Priority;
  reason: string;
  urgencyScore: number;
  complexityScore: number;
  finalScore: number;
}

@Injectable()
export class PriorityCalculatorService {
  private readonly logger = new Logger(PriorityCalculatorService.name);

  /**
   * Рассчитать приоритет заказа на основе множества факторов
   */
  async calculatePriority(
    deadline: string | Date,
    workType: string = '',
    quantity: number = 1,
    operations: any[] = [],
  ): Promise<PriorityCalculationResult> {
    this.logger.log('🧮 Расчет приоритета заказа');
    
    try {
      // Рассчитываем срочность (0-100)
      const urgencyScore = this.calculateUrgencyScore(deadline);
      
      // Рассчитываем сложность (0-100)
      const complexityScore = this.calculateComplexityScore(workType, quantity, operations);
      
      // Рассчитываем финальный счет (0-100)
      const finalScore = this.calculateFinalScore(urgencyScore, complexityScore);
      
      // Определяем приоритет
      const priority = this.scoreToPriority(finalScore);
      
      // Формируем объяснение
      const reason = this.generateReason(urgencyScore, complexityScore, finalScore, deadline, workType, operations);
      
      const result: PriorityCalculationResult = {
        priority,
        reason,
        urgencyScore,
        complexityScore,
        finalScore,
      };
      
      this.logger.log(`✅ Приоритет рассчитан: ${priority} (${finalScore} баллов)`);
      return result;
    } catch (error) {
      this.logger.error('❌ Ошибка расчета приоритета:', error);
      
      // Возвращаем средний приоритет в случае ошибки
      return {
        priority: Priority.MEDIUM,
        reason: 'Ошибка расчета приоритета, установлен средний',
        urgencyScore: 50,
        complexityScore: 50,
        finalScore: 50,
      };
    }
  }

  /**
   * Рассчитать срочность на основе дедлайна
   */
  private calculateUrgencyScore(deadline: string | Date): number {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgencyScore = 0;
    
    if (daysLeft < 0) {
      // Просрочено
      urgencyScore = 100;
    } else if (daysLeft <= 1) {
      // Завтра или сегодня
      urgencyScore = 95;
    } else if (daysLeft <= 3) {
      // До 3 дней
      urgencyScore = 85;
    } else if (daysLeft <= 7) {
      // До недели
      urgencyScore = 70;
    } else if (daysLeft <= 14) {
      // До двух недель
      urgencyScore = 50;
    } else if (daysLeft <= 30) {
      // До месяца
      urgencyScore = 30;
    } else {
      // Больше месяца
      urgencyScore = 10;
    }
    
    this.logger.log(`⏰ Срочность: ${urgencyScore} баллов (дней осталось: ${daysLeft})`);
    return urgencyScore;
  }

  /**
   * Рассчитать сложность на основе типа работы, количества и операций
   */
  private calculateComplexityScore(workType: string, quantity: number, operations: any[]): number {
    let complexityScore = 0;
    
    // Базовая сложность по типу работы
    const workTypeScore = this.getWorkTypeComplexity(workType);
    complexityScore += workTypeScore;
    
    // Сложность по количеству
    const quantityScore = this.getQuantityComplexity(quantity);
    complexityScore += quantityScore;
    
    // Сложность по операциям
    const operationsScore = this.getOperationsComplexity(operations);
    complexityScore += operationsScore;
    
    // Ограничиваем до 100
    complexityScore = Math.min(complexityScore, 100);
    
    this.logger.log(`🔧 Сложность: ${complexityScore} баллов (тип: ${workTypeScore}, количество: ${quantityScore}, операции: ${operationsScore})`);
    return complexityScore;
  }

  /**
   * Определить сложность по типу работы
   */
  private getWorkTypeComplexity(workType: string): number {
    const workTypeLower = workType.toLowerCase();
    
    // Ключевые слова для высокой сложности
    const highComplexityKeywords = [
      'сложн', 'точн', 'прецизи', 'микро', 'nano', 'высокоточн',
      'специальн', 'уникальн', 'нестандартн', 'индивидуальн',
      'aerospace', 'медицин', 'авиацион'
    ];
    
    // Ключевые слова для средней сложности
    const mediumComplexityKeywords = [
      'обработка', 'механическ', 'фрезерн', 'токарн', 'сверлен',
      'шлифован', 'полировк', 'термообработк', 'сварк'
    ];
    
    for (const keyword of highComplexityKeywords) {
      if (workTypeLower.includes(keyword)) {
        return 40; // Высокая сложность
      }
    }
    
    for (const keyword of mediumComplexityKeywords) {
      if (workTypeLower.includes(keyword)) {
        return 20; // Средняя сложность
      }
    }
    
    return 10; // Низкая сложность
  }

  /**
   * Определить сложность по количеству
   */
  private getQuantityComplexity(quantity: number): number {
    if (quantity >= 1000) {
      return 30; // Очень большая партия
    } else if (quantity >= 100) {
      return 25; // Большая партия
    } else if (quantity >= 50) {
      return 20; // Средняя партия
    } else if (quantity >= 10) {
      return 15; // Малая партия
    } else if (quantity >= 5) {
      return 10; // Очень малая партия
    } else {
      return 5; // Штучное производство
    }
  }

  /**
   * Определить сложность по операциям
   */
  private getOperationsComplexity(operations: any[]): number {
    if (!operations || operations.length === 0) {
      return 10; // Нет операций
    }
    
    let operationsScore = 0;
    
    // Базовая сложность по количеству операций
    operationsScore += Math.min(operations.length * 3, 20);
    
    // Дополнительная сложность по типам операций
    for (const operation of operations) {
      // 4-осевые операции сложнее
      if (operation.machineAxes === 4) {
        operationsScore += 8;
      } else if (operation.machineAxes === 3) {
        operationsScore += 5;
      }
      
      // Токарные операции сложнее фрезерных
      if (operation.operationType === OperationType.TURNING) {
        operationsScore += 5;
      } else if (operation.operationType === OperationType.MILLING) {
        operationsScore += 3;
      }
      
      // Длительные операции сложнее
      if (operation.estimatedTime > 300) {
        operationsScore += 10; // Более 5 часов
      } else if (operation.estimatedTime > 120) {
        operationsScore += 6; // Более 2 часов
      } else if (operation.estimatedTime > 60) {
        operationsScore += 3; // Более часа
      }
    }
    
    return Math.min(operationsScore, 50); // Ограничиваем максимум
  }

  /**
   * Рассчитать финальный счет
   */
  private calculateFinalScore(urgencyScore: number, complexityScore: number): number {
    // Взвешиваем срочность и сложность
    // Срочность важнее (60%), сложность дополняет (40%)
    const finalScore = urgencyScore * 0.6 + complexityScore * 0.4;
    
    return Math.round(finalScore);
  }

  /**
   * Преобразовать счет в приоритет
   */
  private scoreToPriority(score: number): Priority {
    if (score >= 75) {
      return Priority.HIGH;
    } else if (score >= 40) {
      return Priority.MEDIUM;
    } else {
      return Priority.LOW;
    }
  }

  /**
   * Сгенерировать объяснение приоритета
   */
  private generateReason(
    urgencyScore: number,
    complexityScore: number,
    finalScore: number,
    deadline: string | Date,
    workType: string,
    operations: any[],
  ): string {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let reason = '';
    
    // Основание по срочности
    if (daysLeft < 0) {
      reason += `Просрочено на ${Math.abs(daysLeft)} дней`;
    } else if (daysLeft <= 3) {
      reason += `Критический дедлайн: ${daysLeft} дней`;
    } else if (daysLeft <= 7) {
      reason += `Срочный дедлайн: ${daysLeft} дней`;
    } else if (daysLeft <= 14) {
      reason += `Средний дедлайн: ${daysLeft} дней`;
    } else {
      reason += `Долгосрочный заказ: ${daysLeft} дней`;
    }
    
    // Добавляем информацию о сложности
    if (complexityScore > 70) {
      reason += `, очень сложная работа`;
    } else if (complexityScore > 50) {
      reason += `, сложная работа`;
    } else if (complexityScore > 30) {
      reason += `, средняя сложность`;
    }
    
    // Добавляем информацию об операциях
    if (operations && operations.length > 0) {
      const has4Axis = operations.some(op => op.machineAxes === 4);
      const totalTime = operations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0);
      
      if (has4Axis) {
        reason += `, включает 4-осевые операции`;
      }
      
      if (totalTime > 300) {
        reason += `, длительная обработка (${Math.round(totalTime / 60)} ч)`;
      }
    }
    
    // Добавляем финальный счет
    reason += ` (${finalScore} баллов)`;
    
    return reason;
  }

  /**
   * Пакетный расчет приоритетов
   */
  async calculateBatchPriorities(orders: any[]): Promise<Map<string, PriorityCalculationResult>> {
    this.logger.log(`🧮 Пакетный расчет приоритетов для ${orders.length} заказов`);
    
    const results = new Map<string, PriorityCalculationResult>();
    
    for (const order of orders) {
      try {
        const result = await this.calculatePriority(
          order.deadline,
          order.workType,
          order.quantity,
          order.operations,
        );
        
        results.set(order.drawingNumber || order.id, result);
      } catch (error) {
        this.logger.warn(`⚠️ Ошибка расчета приоритета для заказа ${order.drawingNumber}:`, error);
        
        // Устанавливаем средний приоритет
        results.set(order.drawingNumber || order.id, {
          priority: Priority.MEDIUM,
          reason: 'Ошибка расчета',
          urgencyScore: 50,
          complexityScore: 50,
          finalScore: 50,
        });
      }
    }
    
    this.logger.log(`✅ Пакетный расчет завершен для ${results.size} заказов`);
    return results;
  }
}
