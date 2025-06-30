/**
 * @file: improved-efficiency-calculation.service.ts
 * @description: Правильный расчет KPI и OEE с учетом времени наладки
 * @created: 2025-06-30
 */

export interface ShiftData {
  shiftDuration: number;        // Общее время смены (мин)
  setupTime: number;           // Время наладки (мин)
  downTime?: number;           // Время простоев (мин)
  plannedTimePerUnit: number;  // Плановое время на деталь (мин)
  actualProduced: number;      // Фактически произведено (шт)
  defectParts?: number;        // Брак (шт)
  operatorName: string;
}

export interface KPIResult {
  // Основные компоненты OEE
  availability: number;        // Доступность %
  performance: number;         // Производительность %
  quality: number;            // Качество %
  oee: number;               // OEE %
  
  // Дополнительные метрики
  setupRatio: number;         // Доля наладки %
  kpi: number;               // Общий KPI %
  
  // Детализация
  availableTime: number;      // Доступное время для производства
  plannedQuantity: number;    // План для доступного времени
  goodParts: number;         // Годные детали
  
  // Статус
  status: 'excellent' | 'good' | 'needs_attention' | 'poor';
  recommendations: string[];
}

export class ImprovedEfficiencyCalculationService {
  
  /**
   * Расчет KPI и OEE по вашей логике
   */
  calculateKPI(data: ShiftData): KPIResult {
    const {
      shiftDuration,
      setupTime,
      downTime = 0,
      plannedTimePerUnit,
      actualProduced,
      defectParts = 0,
      operatorName
    } = data;

    // 1. ДОСТУПНОЕ ВРЕМЯ (ваша логика)
    const availableTime = shiftDuration - setupTime - downTime;
    
    // 2. ПЛАН ДЛЯ ДОСТУПНОГО ВРЕМЕНИ (ваша логика)
    const plannedQuantity = Math.floor(availableTime / plannedTimePerUnit);
    
    // 3. ПРОИЗВОДИТЕЛЬНОСТЬ (ваша логика: факт / план для доступного времени)
    const performance = plannedQuantity > 0 ? (actualProduced / plannedQuantity) * 100 : 0;
    
    // 4. КАЧЕСТВО
    const goodParts = actualProduced - defectParts;
    const quality = actualProduced > 0 ? (goodParts / actualProduced) * 100 : 0;
    
    // 5. ДОСТУПНОСТЬ
    // Вариант A: Считаем наладку плановой деятельностью (доступность = 100%)
    // Вариант B: Считаем только простои как потери
    const availability = shiftDuration > 0 ? ((shiftDuration - downTime) / shiftDuration) * 100 : 0;
    
    // 6. OEE (классическая формула)
    const oee = (availability * performance * quality) / 10000;
    
    // 7. ДОЛЯ НАЛАДКИ
    const setupRatio = shiftDuration > 0 ? (setupTime / shiftDuration) * 100 : 0;
    
    // 8. KPI (комплексная формула)
    const kpi = oee * 0.5 + (100 - setupRatio) * 0.2 + quality * 0.15 + 90 * 0.15;
    
    // 9. СТАТУС
    let status: 'excellent' | 'good' | 'needs_attention' | 'poor';
    if (kpi >= 85) status = 'excellent';
    else if (kpi >= 75) status = 'good';
    else if (kpi >= 65) status = 'needs_attention';
    else status = 'poor';
    
    // 10. РЕКОМЕНДАЦИИ
    const recommendations: string[] = [];
    
    if (performance < 80) {
      recommendations.push(`Низкая производительность: ${actualProduced}/${plannedQuantity} = ${performance.toFixed(1)}%`);
    }
    
    if (setupRatio > 50) {
      recommendations.push(`Высокая доля наладки: ${setupRatio.toFixed(1)}% (${setupTime} мин из ${shiftDuration} мин)`);
    }
    
    if (quality < 95 && defectParts > 0) {
      recommendations.push(`Проблемы с качеством: брак ${defectParts} из ${actualProduced} деталей`);
    }
    
    if (downTime > 0) {
      recommendations.push(`Простои: ${downTime} минут`);
    }
    
    return {
      availability: Math.round(availability * 10) / 10,
      performance: Math.round(performance * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      oee: Math.round(oee * 10) / 10,
      setupRatio: Math.round(setupRatio * 10) / 10,
      kpi: Math.round(kpi * 10) / 10,
      availableTime,
      plannedQuantity,
      goodParts,
      status,
      recommendations
    };
  }

  /**
   * Пример расчета для случая Кирилла
   */
  calculateKirillExample(): KPIResult {
    return this.calculateKPI({
      shiftDuration: 480,      // 8 часов
      setupTime: 300,          // 5 часов наладка
      downTime: 0,             // Нет простоев
      plannedTimePerUnit: 30,  // 30 мин на деталь
      actualProduced: 5,       // Сделал 5 деталей
      defectParts: 0,          // Без брака
      operatorName: 'Кирилл'
    });
  }

  /**
   * Расчет для нескольких операторов
   */
  calculateForOperators(shifts: ShiftData[]): { [operatorName: string]: KPIResult } {
    const results: { [operatorName: string]: KPIResult } = {};
    
    shifts.forEach(shift => {
      results[shift.operatorName] = this.calculateKPI(shift);
    });
    
    return results;
  }

  /**
   * Сравнение операторов
   */
  compareOperators(results: { [operatorName: string]: KPIResult }): {
    best: string;
    worst: string;
    average: number;
    ranking: Array<{ name: string; kpi: number; status: string }>;
  } {
    const ranking = Object.entries(results)
      .map(([name, result]) => ({
        name,
        kpi: result.kpi,
        status: result.status
      }))
      .sort((a, b) => b.kpi - a.kpi);

    const kpiValues = Object.values(results).map(r => r.kpi);
    const average = kpiValues.reduce((sum, kpi) => sum + kpi, 0) / kpiValues.length;

    return {
      best: ranking[0]?.name || '',
      worst: ranking[ranking.length - 1]?.name || '',
      average: Math.round(average * 10) / 10,
      ranking
    };
  }
}

// Пример использования
export function demonstrateKirillCalculation() {
  const service = new ImprovedEfficiencyCalculationService();
  
  console.log('🧮 Расчет KPI для Кирилла:');
  const result = service.calculateKirillExample();
  
  console.log(`
📊 РЕЗУЛЬТАТЫ:
• Смена: 480 мин
• Наладка: 300 мин  
• Доступное время: ${result.availableTime} мин
• План для доступного времени: ${result.plannedQuantity} деталей
• Факт: 5 деталей
• Производительность: ${result.performance}% (5/${result.plannedQuantity})
• Доступность: ${result.availability}%
• Качество: ${result.quality}%
• OEE: ${result.oee}%
• KPI: ${result.kpi}%
• Статус: ${result.status}
• Рекомендации: ${result.recommendations.join(', ')}
  `);
  
  return result;
}
