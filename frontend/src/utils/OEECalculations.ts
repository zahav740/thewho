/**
 * @file: OEECalculations.ts
 * @description: Правильные расчеты OEE и KPI согласно требованиям пользователя
 * @version: 2.0.0 - Исправленная логика
 * @created: 2025-06-30
 */

export interface ProductionShiftData {
  // Базовые данные смены
  shiftTime: number;           // Общее время смены (минуты) - обычно 480
  setupTime: number;           // Время наладки (включает: наладка + ОТК + поправки)
  productionTime: number;      // Время работы оператора
  downTime: number;           // Реальные простои
  
  // Производственные данные
  plannedParts: number;       // План деталей
  actualParts: number;        // Фактически произведено
  defectParts: number;        // Брак
  
  // Данные оператора
  operatorName: string;
  machineName: string;
  shift: number;
  date: string;
}

export interface OEEKPIResult {
  // OEE станка
  machineOEE: number;          // OEE = (наладка + работа) / смена * 100
  machineUtilization: number; // Загруженность станка
  
  // KPI оператора (БЕЗ штрафа за наладку)
  operatorKPI: number;         // KPI оператора
  operatorEfficiency: number;  // Эффективность оператора
  
  // Качество
  qualityRate: number;         // Процент качества
  
  // Детализация времени
  timeBreakdown: {
    setupTimePercent: number;    // % времени на наладку
    productionTimePercent: number; // % времени на производство  
    downTimePercent: number;     // % простоев
    activeTimePercent: number;   // % активного времени (наладка + производство)
  };
  
  // Рекомендации и статус
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ РАСЧЕТА
 * Реализует правильную логику согласно требованиям:
 * 1. OEE станка = загруженность (наладка + работа) / смена
 * 2. КPI оператора БЕЗ штрафа за наладку (сложность разная)
 * 3. Наладка включает: наладка + ОТК + поправки на ошибки
 */
export function calculateOEEAndKPI(data: ProductionShiftData): OEEKPIResult {
  const {
    shiftTime,
    setupTime,
    productionTime, 
    downTime,
    plannedParts,
    actualParts,
    defectParts
  } = data;

  // ============ РАСЧЕТ OEE СТАНКА ============
  // OEE = загруженность станка (время_наладки + время_работы) / общее_время_смены * 100
  const totalActiveTime = setupTime + productionTime;
  const machineOEE = (totalActiveTime / shiftTime) * 100;
  const machineUtilization = machineOEE; // То же самое

  // ============ РАСЧЕТ KPI ОПЕРАТОРА (БЕЗ ШТРАФА ЗА НАЛАДКУ) ============
  // Оператор НЕ виноват в сложности наладки
  
  // 1. Эффективность производства (только в рамках производственного времени)
  const expectedTimeForActualParts = actualParts * 25; // 25 мин - норматив на деталь
  const operatorEfficiency = productionTime > 0 ? 
    Math.min(100, (expectedTimeForActualParts / productionTime) * 100) : 0;
  
  // 2. Качество продукции
  const qualityRate = actualParts > 0 ? 
    ((actualParts - defectParts) / actualParts) * 100 : 100;
  
  // 3. Комплексный KPI оператора
  // Вес: эффективность 70%, качество 30%
  const operatorKPI = (operatorEfficiency * 0.7) + (qualityRate * 0.3);

  // ============ ДЕТАЛИЗАЦИЯ ВРЕМЕНИ ============
  const timeBreakdown = {
    setupTimePercent: (setupTime / shiftTime) * 100,
    productionTimePercent: (productionTime / shiftTime) * 100,
    downTimePercent: (downTime / shiftTime) * 100,
    activeTimePercent: (totalActiveTime / shiftTime) * 100
  };

  // ============ ОПРЕДЕЛЕНИЕ СТАТУСА ============
  let status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  const recommendations: string[] = [];

  // Оценка по OEE станка
  if (machineOEE >= 90 && operatorKPI >= 90) {
    status = 'excellent';
    recommendations.push('🏆 Отличные результаты!', 'Поддерживать высокий уровень');
  } else if (machineOEE >= 80 && operatorKPI >= 80) {
    status = 'good';
    recommendations.push('✅ Хорошие показатели', 'Есть потенциал для роста');
  } else if (machineOEE >= 70 || operatorKPI >= 70) {
    status = 'needs_attention';
    recommendations.push('⚠️ Требуется внимание');
  } else {
    status = 'critical';
    recommendations.push('🚨 Критическое состояние', 'Необходимы срочные меры');
  }

  // Специфические рекомендации
  if (timeBreakdown.downTimePercent > 15) {
    recommendations.push('Высокие простои - анализ причин');
  }
  if (timeBreakdown.setupTimePercent > 40) {
    recommendations.push('Длительная наладка - оптимизация процесса');
  }
  if (qualityRate < 95) {
    recommendations.push('Контроль качества продукции');
  }
  if (operatorEfficiency < 80) {
    recommendations.push('Повышение эффективности оператора');
  }

  return {
    machineOEE: Math.round(machineOEE * 10) / 10,
    machineUtilization: Math.round(machineUtilization * 10) / 10,
    operatorKPI: Math.round(operatorKPI * 10) / 10,
    operatorEfficiency: Math.round(operatorEfficiency * 10) / 10,
    qualityRate: Math.round(qualityRate * 10) / 10,
    timeBreakdown: {
      setupTimePercent: Math.round(timeBreakdown.setupTimePercent * 10) / 10,
      productionTimePercent: Math.round(timeBreakdown.productionTimePercent * 10) / 10,
      downTimePercent: Math.round(timeBreakdown.downTimePercent * 10) / 10,
      activeTimePercent: Math.round(timeBreakdown.activeTimePercent * 10) / 10
    },
    status,
    recommendations
  };
}

// Функция примера удалена в продакшн версии

/**
 * Расчет совокупных метрик для всей смены/дня
 */
export function calculateAggregatedMetrics(shifts: ProductionShiftData[]): {
  overallOEE: number;
  overallKPI: number;
  totalActiveTime: number;
  totalProducedParts: number;
  averageQuality: number;
  machineCount: number;
  operatorCount: number;
} {
  if (shifts.length === 0) {
    return {
      overallOEE: 0,
      overallKPI: 0,
      totalActiveTime: 0,
      totalProducedParts: 0,
      averageQuality: 0,
      machineCount: 0,
      operatorCount: 0
    };
  }

  let totalShiftTime = 0;
  let totalActiveTime = 0;
  let totalKPIWeighted = 0;
  let totalProductionTime = 0;
  let totalProducedParts = 0;
  let totalDefectParts = 0;
  
  const uniqueMachines = new Set<string>();
  const uniqueOperators = new Set<string>();

  shifts.forEach(shift => {
    const result = calculateOEEAndKPI(shift);
    
    totalShiftTime += shift.shiftTime;
    totalActiveTime += shift.setupTime + shift.productionTime;
    totalKPIWeighted += result.operatorKPI * shift.productionTime;
    totalProductionTime += shift.productionTime;
    totalProducedParts += shift.actualParts;
    totalDefectParts += shift.defectParts;
    
    uniqueMachines.add(shift.machineName);
    uniqueOperators.add(shift.operatorName);
  });

  const overallOEE = totalShiftTime > 0 ? (totalActiveTime / totalShiftTime) * 100 : 0;
  const overallKPI = totalProductionTime > 0 ? totalKPIWeighted / totalProductionTime : 0;
  const averageQuality = totalProducedParts > 0 ? 
    ((totalProducedParts - totalDefectParts) / totalProducedParts) * 100 : 100;

  return {
    overallOEE: Math.round(overallOEE * 10) / 10,
    overallKPI: Math.round(overallKPI * 10) / 10,
    totalActiveTime: Math.round(totalActiveTime),
    totalProducedParts,
    averageQuality: Math.round(averageQuality * 10) / 10,
    machineCount: uniqueMachines.size,
    operatorCount: uniqueOperators.size
  };
}

/**
 * Экспорт формул для Excel (правильные)
 */
export const EXCEL_FORMULAS = {
  // OEE станка = (наладка + работа) / смена * 100
  machineOEE: "=(E2+F2)/D2*100",
  
  // KPI оператора (БЕЗ штрафа за наладку)
  operatorKPI: "=IF(F2>0,(I2/(F2/25))*70+(J2-K2)/J2*100*30,0)",
  
  // Качество
  qualityRate: "=IF(J2>0,(J2-K2)/J2*100,100)",
  
  // Эффективность оператора
  operatorEfficiency: "=IF(F2>0,MIN(100,(I2*25/F2)*100),0)",
  
  // Разбивка времени
  setupPercent: "=E2/D2*100",
  productionPercent: "=F2/D2*100",
  downPercent: "=G2/D2*100",
  activePercent: "=(E2+F2)/D2*100"
};

// Пример использования
export const USAGE_EXAMPLE = `
// Использование в компоненте:
const shiftData: ProductionShiftData = {
  shiftTime: 480,
  setupTime: 300,      // 5 часов наладка
  productionTime: 150, // 2.5 часа работа 
  downTime: 30,
  plannedParts: 8,
  actualParts: 6,
  defectParts: 0,
  operatorName: 'Кирилл',
  machineName: 'Doosan Yashana',
  shift: 1,
  date: '2025-06-30'
};

const result = calculateOEEAndKPI(shiftData);
console.log('OEE станка:', result.machineOEE); // 93.75%
console.log('KPI оператора:', result.operatorKPI); // Без штрафа за наладку
`;
