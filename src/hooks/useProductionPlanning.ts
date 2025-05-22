import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductionPlanner, PlanningResult, ForceMajeure, Alert, PlanningUtils } from '../utils/productionPlanning';
import { Operation, Order, Shift } from '../types';
import { markSetupCompleted as markSetupCompletedHelper } from '../utils/setupCompletion';
// Импортируем исправленные функции планирования
import { planOrdersFixed, markSetupCompletedFixed, getCompatibleMachinesFix } from '../utils/planningFix';

// Ключи для localStorage
const PLANNING_RESULTS_KEY = 'planningResults';
const PLANNING_ALERTS_KEY = 'planningAlerts';

// Функция для обогащения заказов статусом выполнения операций
const enrichOrdersWithCompletionStatus = (orders: Order[], shifts: Shift[]): Order[] => {
  console.log('🔍 Начинаем обогащение заказов статусом выполнения...');
  console.log('📋 Всего заказов:', orders.length);
  console.log('🔄 Всего смен:', shifts.length);
  
  return orders.map(order => {
    console.log(`\n📦 Обрабатываем заказ ${order.drawingNumber} (ID: ${order.id})`);
    
    return {
      ...order,
      operations: order.operations.map(operation => {
        console.log(`\n  🔧 Операция ${operation.sequenceNumber} (ID: ${operation.id})`);
        
        // Находим все смены, связанные с этой операцией
        const relatedShiftOperations = shifts
          .flatMap(shift => shift.operations)
          .filter(shiftOp => shiftOp.operationId === operation.id);
        
        console.log(`    🔍 Найдено связанных операций в сменах: ${relatedShiftOperations.length}`);
        
        if (relatedShiftOperations.length > 0) {
          relatedShiftOperations.forEach((shiftOp, index) => {
            console.log(`      ${index + 1}. Выполнено единиц: ${shiftOp.completedUnits}, Время: ${shiftOp.timeSpent}`);
          });
        }
        
        // Вычисляем общее количество выполненных единиц
        const completedUnits = relatedShiftOperations.reduce(
          (sum, shiftOp) => sum + shiftOp.completedUnits, 0
        );
        
        // Вычисляем фактическое время
        const actualTimeTotal = relatedShiftOperations.reduce(
          (sum, shiftOp) => sum + Number(shiftOp.timeSpent || 0), 0
        );
        
        // Определяем статус операции
        const totalUnits = order.quantity;
        let status = "pending";
        let actualTime: number | undefined = undefined;
        
        if (completedUnits >= totalUnits) {
          status = "completed";
          // Если операция завершена, сохраняем фактическое время на единицу
          if (completedUnits > 0) {
            actualTime = actualTimeTotal / completedUnits;
          }
        } else if (completedUnits > 0) {
          status = "in-progress";
        }
        
        console.log(`    📊 Статус: ${status}, Выполнено: ${completedUnits}/${totalUnits}, Факт.время: ${actualTime || 'N/A'}`);
        
        return {
          ...operation,
          actualTime,
          completionStatus: status,
          completedUnits
        };
      })
    };
  });
};

export const useProductionPlanning = () => {
  const { orders, shifts } = useApp();
  
  // Загружаем данные из localStorage при инициализации
  const [planningResults, setPlanningResults] = useState<PlanningResult[]>(() => {
    const saved = localStorage.getItem(PLANNING_RESULTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem(PLANNING_ALERTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isPlanning, setIsPlanning] = useState(false);
  const [planner] = useState(() => new ProductionPlanner());

  // Функция для очистки планирования
  const clearPlanning = useCallback(() => {
    setPlanningResults([]);
    setAlerts([]);
    localStorage.removeItem(PLANNING_RESULTS_KEY);
    localStorage.removeItem(PLANNING_ALERTS_KEY);
  }, []);

  // Сохраняем планирование в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(PLANNING_RESULTS_KEY, JSON.stringify(planningResults));
  }, [planningResults]);

  // Сохраняем алерты в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(PLANNING_ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Отслеживаем изменения в заказах для возможности очистки устаревшего плана
  useEffect(() => {
    // Проверяем, соответствуют ли запланированные операции текущим заказам
    if (planningResults.length > 0 && orders.length > 0) {
      const validResults = planningResults.filter(result => {
        const order = orders.find(o => o.id === result.orderId);
        if (!order) return false;
        
        const operation = order.operations.find(op => op.id === result.operationId);
        return !!operation;
      });
      
      // Если некоторые операции больше не актуальны
      if (validResults.length !== planningResults.length) {
        if (validResults.length === 0) {
          // Все операции устарели - очищаем полностью
          clearPlanning();
        } else {
          // Оставляем только актуальные операции
          setPlanningResults(validResults);
        }
      }
    }
  }, [orders, planningResults, clearPlanning]);

  // Основное планирование
  const planProduction = useCallback(async () => {
    setIsPlanning(true);
    try {
      // Используем исправленную версию планирования
      console.log('∞ Запуск исправленного планирования');
      
      // Перед планированием обогащаем заказы статусом выполнения операций
      const ordersWithCompletionStatus = enrichOrdersWithCompletionStatus(orders, shifts);
      
      // Вызываем исправленную функцию планирования
      const results = await planOrdersFixed(ordersWithCompletionStatus);
      setPlanningResults(results);
      
      // Проверяем соответствие дедлайнам
      const deadlineAlerts = PlanningUtils.checkDeadlineCompliance(ordersWithCompletionStatus, results);
      setAlerts(prev => [...prev, ...deadlineAlerts]);
      
      return results;
    } catch (error) {
      console.error('Ошибка планирования:', error);
      throw error;
    } finally {
      setIsPlanning(false);
    }
  }, [orders, shifts, planner]);

  // Адаптивное планирование
  const adaptivePlanning = useCallback(async () => {
    setIsPlanning(true);
    try {
      // Обогащаем заказы статусом выполнения операций
      const ordersWithCompletionStatus = enrichOrdersWithCompletionStatus(orders, shifts);
      
      const results = await planner.adaptivePlanning(ordersWithCompletionStatus, shifts);
      setPlanningResults(results);
      
      // Проверяем соответствие дедлайнам
      const deadlineAlerts = PlanningUtils.checkDeadlineCompliance(ordersWithCompletionStatus, results);
      setAlerts(prev => [...prev, ...deadlineAlerts]);
      
      return results;
    } catch (error) {
      console.error('Ошибка адаптивного планирования:', error);
      throw error;
    } finally {
      setIsPlanning(false);
    }
  }, [orders, shifts, planner]);

  // Обработка форс-мажора
  const handleForceMajeure = useCallback(async (forceMajeure: ForceMajeure) => {
    setIsPlanning(true);
    try {
      const results = await planner.handleForceMajeure(forceMajeure, orders);
      setPlanningResults(results);
      
      // Создаем алерт о форс-мажоре
      const forceMajeureAlert = planner.createAlert({
        type: 'force_majeure',
        severity: 'high',
        title: `Форс-мажор: ${forceMajeure.type}`,
        description: forceMajeure.description,
        affectedEntityType: forceMajeure.entityType as 'machine' | 'order' | 'operation' | 'system',
        affectedEntityId: forceMajeure.entityId,
        status: 'new'
      });
      
      setAlerts(prev => [...prev, forceMajeureAlert]);
      
      return results;
    } catch (error) {
      console.error('Ошибка обработки форс-мажора:', error);
      throw error;
    } finally {
      setIsPlanning(false);
    }
  }, [orders, planner]);

  // Отправка данных планирования в webhook
  const sendPlanningToWebhook = useCallback(async (webhookUrl?: string) => {
    try {
      const url = webhookUrl || localStorage.getItem('webhookUrl');
      if (!url) {
        throw new Error('Webhook URL не настроен. Пожалуйста, настройте URL в настройках приложения.');
      }

      if (planningResults.length === 0) {
        throw new Error('Нет данных планирования для отправки. Сначала выполните планирование.');
      }

      // Подготавливаем данные для отправки в n8n
      const webhookData = {
        orders: orders.map(order => ({
          ...order,
          planningResults: planningResults.filter(pr => pr.orderId === order.id)
        })),
        summary: {
          totalOrders: orders.length,
          totalOperations: orders.reduce((sum, order) => sum + order.operations.length, 0),
          planningResults: planningResults.length
        }
      };
      
      const payload = {
        eventType: 'production_planning',
        timestamp: new Date().toISOString(),
        source: 'TheWho App',
        environment: window.location.hostname,
        data: webhookData
      };

      console.log('📤 Отправка данных в n8n webhook:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Данные планирования успешно отправлены в n8n:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('❌ Ошибка отправки планирования в n8n webhook:', error);
      throw error;
    }
  }, [orders, planningResults]);

  // Анализ загрузки станков
  const analyzeMachineLoad = useCallback(() => {
    return PlanningUtils.analyzeMachineLoad(planningResults);
  }, [planningResults]);

  // Закрытие алерта
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'resolved', 
            resolvedAt: new Date().toISOString() 
          }
        : alert
    ));
  }, []);

  // Получение статистики планирования
  const getPlanningStats = useCallback(() => {
    const totalOrders = orders.length;
    const plannedOrders = new Set(planningResults.map(pr => pr.orderId)).size;
    const totalOperations = orders.reduce((sum, order) => sum + order.operations.length, 0);
    const plannedOperations = planningResults.length;
    
    const onTimeOrders = orders.filter(order => {
      const orderResults = planningResults.filter(pr => pr.orderId === order.id);
      if (orderResults.length === 0) return false;
      
      const lastResult = orderResults.reduce((latest, current) => 
        new Date(current.plannedEndDate) > new Date(latest.plannedEndDate) ? current : latest
      );
      
      return new Date(lastResult.plannedEndDate) <= new Date(order.deadline);
    }).length;

    return {
      totalOrders,
      plannedOrders,
      totalOperations,
      plannedOperations,
      onTimeOrders,
      lateOrders: plannedOrders - onTimeOrders,
      planningCompletion: totalOrders > 0 ? (plannedOrders / totalOrders) * 100 : 0,
      onTimePercentage: plannedOrders > 0 ? (onTimeOrders / plannedOrders) * 100 : 0
    };
  }, [orders, planningResults]);

  // Обновление планирования операции вручную
  const updatePlanningResult = useCallback(async (resultId: string, updates: Partial<PlanningResult>) => {
    try {
      const updatedResults = await planner.updatePlanningResult(resultId, updates, planningResults);
      setPlanningResults(updatedResults);
      
      // Проверяем дедлайны после ручного обновления
      const deadlineAlerts = PlanningUtils.checkDeadlineCompliance(orders, updatedResults);
      setAlerts(prev => {
        // Удаляем старые алерты о дедлайнах и добавляем новые
        const filtered = prev.filter(a => a.type !== 'deadline_risk');
        return [...filtered, ...deadlineAlerts];
      });
    } catch (error) {
      console.error('Ошибка обновления планирования:', error);
    }
  }, [planner, planningResults, orders]);
  
  // Отметка о завершении наладки (с поддержкой смены станка)
  const markSetupCompleted = useCallback(async (resultId: string, setupData: any) => {
    try {
      console.log('∞ Запуск исправленной функции отметки наладки');
      console.log('Данные:', setupData);
      
      // Используем исправленную функцию наладки
      const updatedResults = await markSetupCompletedFixed(resultId, setupData, planningResults, orders);
      setPlanningResults(updatedResults.updatedResults);
      
      return updatedResults;
    } catch (error) {
      console.error('Ошибка отметки наладки:', error);
      throw error;
    }
  }, [planningResults, orders]);
  
  // Получение совместимых станков для операции
  const getCompatibleMachines = useCallback((operation: Operation) => {
    // Используем новую функцию
    return getCompatibleMachinesFix(operation);
  }, []);
  
  // Получение операции по ID
  const getOperationById = useCallback((operationId: string): Operation | null => {
    for (const order of orders) {
      const operation = order.operations.find(op => op.id === operationId);
      if (operation) return operation;
    }
    return null;
  }, [orders]);

  return {
    planningResults,
    setPlanningResults,
    alerts,
    isPlanning,
    planProduction,
    adaptivePlanning,
    handleForceMajeure,
    sendPlanningToWebhook,
    analyzeMachineLoad,
    resolveAlert,
    getPlanningStats,
    updatePlanningResult,
    markSetupCompleted,
    getCompatibleMachines,
    getOperationById,
    clearPlanning  // Функция для очистки
  };
};
