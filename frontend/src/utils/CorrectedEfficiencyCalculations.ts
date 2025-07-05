/**
 * @file: CorrectedEfficiencyCalculations.ts
 * @description: Исправленная логика расчета OEE и KPI с правильным подходом к наладке
 * @created: 2025-06-30
 * @author: Production Team
 */

export interface ShiftData {
  shiftTime: number;           // Общее время смены (минуты)
  setupTime: number;           // Время наладки (минуты) - НЕ простой!
  productionTime: number;      // Время производства (минуты)
  downTime: number;           // Простои (минуты) - реальные потери
  plannedParts: number;       // Плановое количество деталей
  actualParts: number;        // Фактически произведено
  defectParts: number;        // Количество брака
  standardTimePerPart?: number; // Нормативное время на деталь (минуты)
}

export interface CalculationResult {
  // OEE станка
  machineOEE: number;          // Общая эффективность оборудования
  availability: number;        // Доступность = (Наладка + Производство) / Смена
  utilization: number;         // То же что availability, для совместимости
  
  // KPI оператора (БЕЗ штрафа за наладку)
  operatorKPI: number;         // KPI оператора
  productionEfficiency: number; // Эффективность в рамках производственного времени
  qualityRate: number;         // Процент качества
  
  // Детализация времени
  timeBreakdown: {
    setupPercent: number;      // % времени на наладку
    productionPercent: number; // % времени на производство
    downPercent: number;       // % простоев
    totalActivePercent: number; // % общего активного времени
  };
  
  // Рекомендации
  recommendations: string[];
  status: 'excellent' | 'good' | 'needs_attention';
}

/**
 * ИСПРАВЛЕННАЯ ЛОГИКА РАСЧЕТА
 * 
 * Принципы:
 * 1. Наладка - это РАБОЧЕЕ время станка, не простой
 * 2. OEE показывает загруженность станка (наладка + производство)
 * 3. KPI оператора НЕ штрафуется за сложность наладки
 * 4. Простои - это единственные потери времени
 */
export function calculateCorrectedMetrics(data: ShiftData): CalculationResult {
  const {
    shiftTime,
    setupTime,
    productionTime,
    downTime,
    plannedParts,
    actualParts,
    defectParts,
    standardTimePerPart = 25 // Значение по умолчанию
  } = data;

  // 1. ПРАВИЛЬНЫЙ РАСЧЕТ ДОСТУПНОСТИ СТАНКА
  // Станок работает = наладка + производство (НЕ вычитаем наладку!)
  const totalActiveTime = setupTime + productionTime;
  const availability = (totalActiveTime / shiftTime) * 100;
  
  // 2. ПРОИЗВОДИТЕЛЬНОСТЬ (план vs факт)
  const performance = plannedParts > 0 ? (actualParts / plannedParts) * 100 : 0;
  
  // 3. КАЧЕСТВО
  const qualityRate = actualParts > 0 ? ((actualParts - defectParts) / actualParts) * 100 : 100;
  
  // 4. OEE СТАНКА (загруженность оборудования)
  const machineOEE = (availability * performance * qualityRate) / 10000;
  
  // 5. KPI ОПЕРАТОРА (эффективность в рамках доступного времени)
  // НЕ штрафуем за наладку - это технологическая необходимость
  const productionEfficiency = productionTime > 0 ? 
    (actualParts / (productionTime / standardTimePerPart)) * 100 : 0;
  
  // Комплексный KPI оператора
  const operatorKPI = (productionEfficiency * 0.6 + qualityRate * 0.4);
  
  // 6. РАЗБИВКА ВРЕМЕНИ
  const timeBreakdown = {
    setupPercent: (setupTime / shiftTime) * 100,
    productionPercent: (productionTime / shiftTime) * 100,
    downPercent: (downTime / shiftTime) * 100,
    totalActivePercent: availability
  };
  
  // 7. СТАТУС И РЕКОМЕНДАЦИИ
  let status: 'excellent' | 'good' | 'needs_attention';
  const recommendations: string[] = [];
  
  if (machineOEE >= 85 && operatorKPI >= 90) {
    status = 'excellent';
    recommendations.push('Отличная работа!', 'Поддерживать высокий уровень');
  } else if (machineOEE >= 75 && operatorKPI >= 80) {
    status = 'good';
    recommendations.push('Хорошие результаты', 'Есть потенциал для улучшения');
  } else {
    status = 'needs_attention';
    if (machineOEE < 75) {
      recommendations.push('Низкая загруженность станка');
    }
    if (operatorKPI < 80) {
      recommendations.push('Нужно повысить эффективность оператора');
    }
  }
  
  // Специфические рекомендации
  if (timeBreakdown.downPercent > 15) {
    recommendations.push('Высокие простои - требуется анализ причин');
  }
  if (timeBreakdown.setupPercent > 40) {
    recommendations.push('Длительная наладка - возможно нужна оптимизация');
  }
  if (qualityRate < 90) {
    recommendations.push('Проблемы с качеством - требуется контроль');
  }
  
  return {
    machineOEE: Math.round(machineOEE * 10) / 10,
    availability: Math.round(availability * 10) / 10,
    utilization: Math.round(availability * 10) / 10,
    operatorKPI: Math.round(operatorKPI * 10) / 10,
    productionEfficiency: Math.round(productionEfficiency * 10) / 10,
    qualityRate: Math.round(qualityRate * 10) / 10,
    timeBreakdown: {
      setupPercent: Math.round(timeBreakdown.setupPercent * 10) / 10,
      productionPercent: Math.round(timeBreakdown.productionPercent * 10) / 10,
      downPercent: Math.round(timeBreakdown.downPercent * 10) / 10,
      totalActivePercent: Math.round(timeBreakdown.totalActivePercent * 10) / 10
    },
    recommendations,
    status
  };
}

/**
 * Пример расчета для Кирилла
 */
export function calculateKirillExample() {
  const kirillData: ShiftData = {
    shiftTime: 480,      // 8 часов
    setupTime: 120,      // 2 часа наладка (сложная + ОТК + поправки)
    productionTime: 300, // 5 часов производство
    downTime: 60,        // 1 час простои
    plannedParts: 15,    // план
    actualParts: 12,     // факт
    defectParts: 1,      // брак
    standardTimePerPart: 25 // норматив
  };
  
  return calculateCorrectedMetrics(kirillData);
}

/**
 * Сравнение старой и новой логики
 */
export function compareCalculationMethods(data: ShiftData) {
  // Старая неправильная логика
  const oldAvailability = ((data.shiftTime - data.downTime) / data.shiftTime) * 100;
  const oldPerformance = (data.actualParts / data.plannedParts) * 100;
  const oldQuality = ((data.actualParts - data.defectParts) / data.actualParts) * 100;
  const oldOEE = (oldAvailability * oldPerformance * oldQuality) / 10000;
  
  // Новая правильная логика
  const newResult = calculateCorrectedMetrics(data);
  
  return {
    old: {
      oee: Math.round(oldOEE * 10) / 10,
      logic: "Наладка считалась простоем"
    },
    new: {
      oee: newResult.machineOEE,
      operatorKPI: newResult.operatorKPI,
      logic: "Наладка = рабочее время"
    },
    difference: {
      oeeDiff: Math.round((newResult.machineOEE - oldOEE) * 10) / 10,
      explanation: "Правильный учет наладки как рабочего времени"
    }
  };
}

/**
 * Цветовая схема для метрик
 */
export function getMetricColor(value: number, type: 'oee' | 'kpi'): string {
  const thresholds = type === 'oee' 
    ? { excellent: 85, good: 75 }
    : { excellent: 90, good: 80 };
    
  if (value >= thresholds.excellent) return '#52c41a'; // Зеленый
  if (value >= thresholds.good) return '#faad14';      // Оранжевый
  return '#f5222d';                                    // Красный
}

/**
 * Получение рекомендаций по улучшению
 */
export function getImprovementRecommendations(result: CalculationResult): string[] {
  const recommendations: string[] = [...result.recommendations];
  
  // Дополнительные рекомендации на основе анализа
  if (result.timeBreakdown.setupPercent > 30) {
    recommendations.push('Рассмотрите возможность предварительной подготовки инструментов');
  }
  
  if (result.productionEfficiency < 85) {
    recommendations.push('Анализ движений оператора для повышения эффективности');
  }
  
  if (result.timeBreakdown.downPercent > 10) {
    recommendations.push('Профилактическое обслуживание для снижения простоев');
  }
  
  return recommendations;
}

/**
 * Формулы для Excel (исправленные)
 */
export const CORRECTED_EXCEL_FORMULAS = {
  // OEE станка = (наладка + производство) / смена × производительность × качество / 100
  machineOEE: "=(E2+F2)/D2*I2/H2*(I2-J2)/I2",
  
  // Доступность = (наладка + производство) / смена
  availability: "=(E2+F2)/D2*100",
  
  // KPI оператора = эффективность производства × качество (БЕЗ штрафа за наладку)
  operatorKPI: "=IF(F2>0,(I2/(F2/25))*0.6+((I2-J2)/I2*100)*0.4,0)",
  
  // Разбивка времени
  setupPercent: "=E2/D2*100",
  productionPercent: "=F2/D2*100", 
  downPercent: "=G2/D2*100"
};
