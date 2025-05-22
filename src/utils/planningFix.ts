// Модуль для фиксированного планирования и работы с Supabase
// Основная точка входа для взаимодействия с обновленной логикой планирования

import { Order, Shift } from '../types';
import { ProductionPlannerFix } from './productionPlanningFix';
import { PlanningResult } from './productionPlanning';
import { supabase, syncWithSupabase } from './supabaseClient';

// Глобальный экземпляр планировщика
const fixedPlanner = new ProductionPlannerFix();

/**
 * Выполняет планирование заказов с обновленной логикой
 */
export async function planOrdersFixed(orders: Order[]): Promise<PlanningResult[]> {
  console.log('📋 Запуск исправленного планирования для', orders.length, 'заказов');
  
  try {
    // Выполняем планирование с новой логикой
    const results = await fixedPlanner.planOrders(orders);
    
    // Синхронизируем результаты с Supabase
    try {
      await syncWithSupabase(orders, results);
      console.log('✅ Результаты планирования синхронизированы с Supabase');
    } catch (syncError) {
      console.error('❌ Ошибка синхронизации с Supabase:', syncError);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Ошибка в процессе планирования:', error);
    throw error;
  }
}

/**
 * Отмечает наладку как выполненную с правильной обработкой смены станка
 */
export async function markSetupCompletedFixed(
  resultId: string,
  setupData: { actualSetupTime: number; actualStartTime?: string; newMachine?: string },
  existingResults: PlanningResult[],
  allOrders: Order[]
): Promise<{
  updatedResults: PlanningResult[];
  replanningResults: PlanningResult[];
  affectedMachine: string;
  machineChanged?: boolean;
}> {
  console.log('🔧 Запуск исправленной функции отметки наладки');
  console.log('📃 Данные:', setupData);

  try {
    // Находим текущую операцию для проверки смены станка
    const targetResult = existingResults.find(r => r.id === resultId);
    if (!targetResult) {
      console.error('❌ Не найдена операция для наладки:', resultId);
      throw new Error('Операция не найдена');
    }
    
    // Проверяем, изменился ли станок
    const oldMachine = targetResult.machine;
    const machineChanged = setupData.newMachine && setupData.newMachine !== oldMachine;
    
    if (machineChanged) {
      console.log(`🔄 Смена станка: ${oldMachine} -> ${setupData.newMachine}`);
    }

    // Выполняем обновление наладки с новой логикой
    const result = await fixedPlanner.markSetupCompleted(
      resultId,
      setupData,
      existingResults,
      allOrders
    );
    
    // Синхронизируем результаты с Supabase
    try {
      await syncWithSupabase(allOrders, result.updatedResults);
      console.log('✅ Обновленные результаты синхронизированы с Supabase');
    } catch (syncError) {
      console.error('❌ Ошибка синхронизации с Supabase:', syncError);
    }
    
    // Добавляем информацию о смене станка
    return {
      ...result,
      machineChanged: machineChanged || false
    };
  } catch (error) {
    console.error('❌ Ошибка отметки наладки:', error);
    throw error;
  }
}

/**
 * Получает совместимые станки для операции
 */
export function getCompatibleMachinesFix(operation: any): any[] {
  return fixedPlanner.getCompatibleMachines(operation);
}

/**
 * Экспортирует планировщик напрямую для расширенного использования
 */
export { fixedPlanner };
