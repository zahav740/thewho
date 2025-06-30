/**
 * @file: CorrectedEfficiencyCalculations.ts
 * @description: Исправленные формулы OEE и KPI согласно требованиям производства
 * @created: 2025-06-30
 */

interface ShiftData {
  shiftTime: number;        // Общее время смены (480 мин)
  setupTime: number;        // Время наладки (включая ОТК, поправки)
  productionTime: number;   // Чистое время производства
  downTime: number;         // Простои (поломки, ожидание)
  plannedParts: number;     // План деталей
  actualParts: number;      // Факт произведено
  defectParts: number;      // Брак
  standardTimePerPart: number; // Норма времени на деталь (мин)
}

interface CalculationResult {
  oee: number;              // OEE станка %
  operatorKPI: number;      // KPI оператора %
  machineUtilization: number; // Загрузка станка %
  productionEfficiency: number; // Эффективность производства %
  qualityRate: number;      // Качество %
  timeCompliance: number;   // Соблюдение норм времени %
  breakdown: {
    setupTimePercent: number;
    productionTimePercent: number;
    downTimePercent: number;
    idleTimePercent: number;
  };
}

/**
 * ПРАВИЛЬНЫЙ расчет OEE и KPI
 */
export function calculateCorrectedMetrics(data: ShiftData): CalculationResult {
  // ===== OEE СТАНКА (загруженность) =====
  // OEE = (Время наладки + Время производства) / Общее время смены
  const machineUtilization = ((data.setupTime + data.productionTime) / data.shiftTime) * 100;
  const oee = machineUtilization; // OEE = загруженность станка
  
  // ===== KPI ОПЕРАТОРА (без штрафа за наладку) =====
  
  // 1. Эффективность производства (только рабочее время)
  const expectedTimeForActualParts = data.actualParts * data.standardTimePerPart;
  const productionEfficiency = data.productionTime > 0 
    ? Math.min(100, (expectedTimeForActualParts / data.productionTime) * 100)
    : 0;
  
  // 2. Качество (брак)
  const qualityRate = data.actualParts > 0 
    ? ((data.actualParts - data.defectParts) / data.actualParts) * 100
    : 100;
  
  // 3. Соблюдение норм времени
  const actualTimePerPart = data.actualParts > 0 
    ? data.productionTime / data.actualParts 
    : 0;
  const timeCompliance = actualTimePerPart > 0 
    ? Math.min(100, (data.standardTimePerPart / actualTimePerPart) * 100)
    : 100;
  
  // Комбинированный KPI оператора
  const operatorKPI = (productionEfficiency * 0.6) + (qualityRate * 0.3) + (timeCompliance * 0.1);
  
  // ===== ДЕТАЛИЗАЦИЯ =====
  const setupTimePercent = (data.setupTime / data.shiftTime) * 100;
  const productionTimePercent = (data.productionTime / data.shiftTime) * 100;
  const downTimePercent = (data.downTime / data.shiftTime) * 100;
  const idleTimePercent = 100 - setupTimePercent - productionTimePercent - downTimePercent;
  
  return {
    oee: Math.round(oee * 10) / 10,
    operatorKPI: Math.round(operatorKPI * 10) / 10,
    machineUtilization: Math.round(machineUtilization * 10) / 10,
    productionEfficiency: Math.round(productionEfficiency * 10) / 10,
    qualityRate: Math.round(qualityRate * 10) / 10,
    timeCompliance: Math.round(timeCompliance * 10) / 10,
    breakdown: {
      setupTimePercent: Math.round(setupTimePercent * 10) / 10,
      productionTimePercent: Math.round(productionTimePercent * 10) / 10,
      downTimePercent: Math.round(downTimePercent * 10) / 10,
      idleTimePercent: Math.round(idleTimePercent * 10) / 10,
    }
  };
}

/**
 * Пример расчета для Кирилла
 */
export function calculateKirillExample(): CalculationResult {
  const kirillData: ShiftData = {
    shiftTime: 480,           // 8 часов
    setupTime: 120,           // 2 часа наладка (сложная + ОТК + поправки)
    productionTime: 300,      // 5 часов производство
    downTime: 60,             // 1 час простои
    plannedParts: 15,         // план
    actualParts: 12,          // факт (пример)
    defectParts: 1,           // брак
    standardTimePerPart: 25   // норма 25 мин/деталь
  };
  
  return calculateCorrectedMetrics(kirillData);
}

/**
 * Сравнение старой и новой логики
 */
export function compareCalculationMethods(data: ShiftData) {
  // СТАРАЯ НЕПРАВИЛЬНАЯ логика
  const oldAvailability = ((data.shiftTime - data.downTime) / data.shiftTime) * 100;
  const oldPerformance = (data.actualParts / data.plannedParts) * 100;
  const oldQuality = ((data.actualParts - data.defectParts) / data.actualParts) * 100;
  const oldOEE = (oldAvailability * oldPerformance * oldQuality) / 10000;
  
  // НОВАЯ ПРАВИЛЬНАЯ логика
  const newResult = calculateCorrectedMetrics(data);
  
  return {
    old: {
      availability: Math.round(oldAvailability * 10) / 10,
      performance: Math.round(oldPerformance * 10) / 10,
      quality: Math.round(oldQuality * 10) / 10,
      oee: Math.round(oldOEE * 10) / 10,
      logic: "Штрафует за наладку как за простой"
    },
    new: {
      oee: newResult.oee,
      operatorKPI: newResult.operatorKPI,
      logic: "Наладка = полезное время станка"
    },
    difference: {
      oeeDiff: Math.round((newResult.oee - oldOEE) * 10) / 10,
      explanation: "Новая логика не штрафует за сложную наладку"
    }
  };
}

/**
 * Цветовые индикаторы для UI
 */
export function getMetricColor(value: number, type: 'oee' | 'kpi'): string {
  if (type === 'oee') {
    if (value >= 85) return '#52c41a'; // зеленый
    if (value >= 75) return '#faad14'; // желтый
    return '#f5222d'; // красный
  } else { // kpi
    if (value >= 90) return '#52c41a'; // зеленый
    if (value >= 80) return '#faad14'; // желтый
    return '#f5222d'; // красный
  }
}

/**
 * Рекомендации по улучшению
 */
export function getImprovementRecommendations(result: CalculationResult): string[] {
  const recommendations: string[] = [];
  
  if (result.oee < 75) {
    recommendations.push("Низкая загрузка станка - оптимизируйте планирование");
  }
  
  if (result.breakdown.downTimePercent > 10) {
    recommendations.push("Высокие простои - проверьте техническое состояние");
  }
  
  if (result.productionEfficiency < 80) {
    recommendations.push("Низкая эффективность производства - обучение оператора");
  }
  
  if (result.qualityRate < 95) {
    recommendations.push("Проблемы с качеством - анализ причин брака");
  }
  
  if (result.timeCompliance < 90) {
    recommendations.push("Превышение норм времени - оптимизация процесса");
  }
  
  if (result.breakdown.setupTimePercent > 30) {
    recommendations.push("Долгая наладка - стандартизация процедур");
  }
  
  return recommendations;
}
