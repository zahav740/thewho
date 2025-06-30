/**
 * @file: ComprehensiveKPISystem.ts
 * @description: Полная система KPI/OEE для всех типов операторов и станков
 * @created: 2025-06-30
 */

interface OperatorData {
  operatorId: string;
  operatorName: string;
  operatorType: 'operator' | 'setup_specialist' | 'universal';
  shiftTime: number;
  participationTime: number; // Время фактического участия
}

interface OperatorShiftData extends OperatorData {
  // Для операторов станков
  productionTime?: number;
  producedParts?: number;
  defectParts?: number;
  standardTimePerPart?: number;
  
  // Для наладчиков
  setupsCompleted?: number;
  setupQuality?: number;        // % качества (0-100)
  machineReadiness?: number;    // Готовность станка (0-100)
  safetyCompliance?: number;    // Соблюдение безопасности (0-100)
  
  // Для универсальных
  productionPart?: number;      // Доля времени на производство (0-1)
  setupPart?: number;          // Доля времени на наладку (0-1)
}

interface MachineData {
  machineId: string;
  machineName: string;
  shiftTime: number;
  setupTime: number;
  productionTime: number;
  downTime: number;
  operatingTime: number; // Время участия в общей работе
}

interface ComprehensiveMetrics {
  // Индивидуальные метрики
  operators: {
    [operatorId: string]: {
      kpi: number;
      type: string;
      details: any;
    };
  };
  machines: {
    [machineId: string]: {
      oee: number;
      utilization: number;
      details: any;
    };
  };
  
  // Общие метрики
  overall: {
    totalKPI: number;           // Общий KPI всех операторов
    totalOEE: number;           // Общий OEE всех станков
    participatingOperators: number;
    activeMachines: number;
    averageKPIByType: {
      operators: number;
      setupSpecialists: number;
      universal: number;
    };
  };
  
  // Рейтинги
  rankings: {
    operatorsByKPI: Array<{operatorName: string; kpi: number; type: string}>;
    machinesByOEE: Array<{machineName: string; oee: number}>;
  };
}

/**
 * Расчет KPI для оператора станка
 */
function calculateOperatorKPI(data: OperatorShiftData): number {
  if (!data.productionTime || !data.producedParts) return 0;
  
  // 1. Эффективность производства
  const expectedTime = (data.producedParts || 0) * (data.standardTimePerPart || 25);
  const productionEfficiency = Math.min(100, (expectedTime / data.productionTime) * 100);
  
  // 2. Качество
  const qualityRate = data.producedParts > 0 
    ? ((data.producedParts - (data.defectParts || 0)) / data.producedParts) * 100
    : 100;
  
  // 3. Соблюдение норм времени
  const actualTimePerPart = data.productionTime / data.producedParts;
  const timeCompliance = Math.min(100, ((data.standardTimePerPart || 25) / actualTimePerPart) * 100);
  
  return (productionEfficiency * 0.6) + (qualityRate * 0.3) + (timeCompliance * 0.1);
}

/**
 * Расчет KPI для наладчика (СПЕЦИАЛЬНАЯ ЛОГИКА)
 */
function calculateSetupSpecialistKPI(data: OperatorShiftData): number {
  // КPI наладчика НЕ зависит от времени наладки (сложность разная!)
  
  // 1. Качество наладки (50% веса)
  const setupQuality = data.setupQuality || 0;
  
  // 2. Готовность станка (30% веса)
  const machineReadiness = data.machineReadiness || 0;
  
  // 3. Безопасность и процедуры (20% веса)
  const safetyCompliance = data.safetyCompliance || 0;
  
  return (setupQuality * 0.5) + (machineReadiness * 0.3) + (safetyCompliance * 0.2);
}

/**
 * Расчет KPI для универсального оператора
 */
function calculateUniversalOperatorKPI(data: OperatorShiftData): number {
  const productionKPI = calculateOperatorKPI(data);
  const setupKPI = calculateSetupSpecialistKPI(data);
  
  // Взвешенный KPI по времени участия
  const productionWeight = data.productionPart || 0.5;
  const setupWeight = data.setupPart || 0.5;
  
  return (productionKPI * productionWeight) + (setupKPI * setupWeight);
}

/**
 * Расчет OEE станка
 */
function calculateMachineOEE(data: MachineData): number {
  // OEE = (Время наладки + Время производства) / Общее время смены * 100%
  const utilizationTime = data.setupTime + data.productionTime;
  return data.shiftTime > 0 ? (utilizationTime / data.shiftTime) * 100 : 0;
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ - расчет всех метрик
 */
export function calculateComprehensiveMetrics(
  operatorShifts: OperatorShiftData[],
  machineShifts: MachineData[]
): ComprehensiveMetrics {
  
  const result: ComprehensiveMetrics = {
    operators: {},
    machines: {},
    overall: {
      totalKPI: 0,
      totalOEE: 0,
      participatingOperators: 0,
      activeMachines: 0,
      averageKPIByType: {
        operators: 0,
        setupSpecialists: 0,
        universal: 0
      }
    },
    rankings: {
      operatorsByKPI: [],
      machinesByOEE: []
    }
  };

  // ===== РАСЧЕТ ИНДИВИДУАЛЬНЫХ KPI ОПЕРАТОРОВ =====
  
  let totalWeightedKPI = 0;
  let totalParticipationTime = 0;
  const kpiByType: { operators: number[], setupSpecialists: number[], universal: number[] } = { 
    operators: [], 
    setupSpecialists: [], 
    universal: [] 
  };

  operatorShifts.forEach(operatorData => {
    let kpi = 0;
    let details = {};

    switch (operatorData.operatorType) {
      case 'operator':
        kpi = calculateOperatorKPI(operatorData);
        details = {
          type: 'Оператор станка',
          productionTime: operatorData.productionTime,
          producedParts: operatorData.producedParts,
          defectParts: operatorData.defectParts
        };
        kpiByType.operators.push(kpi);
        break;

      case 'setup_specialist':
        kpi = calculateSetupSpecialistKPI(operatorData);
        details = {
          type: 'Наладчик',
          setupsCompleted: operatorData.setupsCompleted,
          setupQuality: operatorData.setupQuality,
          machineReadiness: operatorData.machineReadiness,
          safetyCompliance: operatorData.safetyCompliance
        };
        kpiByType.setupSpecialists.push(kpi);
        break;

      case 'universal':
        kpi = calculateUniversalOperatorKPI(operatorData);
        details = {
          type: 'Универсальный оператор',
          productionPart: operatorData.productionPart,
          setupPart: operatorData.setupPart
        };
        kpiByType.universal.push(kpi);
        break;
    }

    result.operators[operatorData.operatorId] = {
      kpi: Math.round(kpi * 10) / 10,
      type: operatorData.operatorType,
      details
    };

    // Для общего KPI (взвешенный по времени участия)
    totalWeightedKPI += kpi * operatorData.participationTime;
    totalParticipationTime += operatorData.participationTime;

    // Для рейтинга
    result.rankings.operatorsByKPI.push({
      operatorName: operatorData.operatorName,
      kpi: Math.round(kpi * 10) / 10,
      type: operatorData.operatorType
    });
  });

  // ===== РАСЧЕТ ИНДИВИДУАЛЬНЫХ OEE СТАНКОВ =====
  
  let totalWeightedOEE = 0;
  let totalOperatingTime = 0;

  machineShifts.forEach(machineData => {
    const oee = calculateMachineOEE(machineData);
    const utilization = ((machineData.setupTime + machineData.productionTime) / machineData.shiftTime) * 100;

    result.machines[machineData.machineId] = {
      oee: Math.round(oee * 10) / 10,
      utilization: Math.round(utilization * 10) / 10,
      details: {
        setupTime: machineData.setupTime,
        productionTime: machineData.productionTime,
        downTime: machineData.downTime,
        setupPercent: (machineData.setupTime / machineData.shiftTime) * 100,
        productionPercent: (machineData.productionTime / machineData.shiftTime) * 100,
        downPercent: (machineData.downTime / machineData.shiftTime) * 100
      }
    };

    // Для общего OEE (взвешенный по времени работы)
    totalWeightedOEE += oee * machineData.operatingTime;
    totalOperatingTime += machineData.operatingTime;

    // Для рейтинга
    result.rankings.machinesByOEE.push({
      machineName: machineData.machineName,
      oee: Math.round(oee * 10) / 10
    });
  });

  // ===== ОБЩИЕ МЕТРИКИ =====
  
  result.overall.totalKPI = totalParticipationTime > 0 
    ? Math.round((totalWeightedKPI / totalParticipationTime) * 10) / 10
    : 0;

  result.overall.totalOEE = totalOperatingTime > 0 
    ? Math.round((totalWeightedOEE / totalOperatingTime) * 10) / 10
    : 0;

  result.overall.participatingOperators = operatorShifts.length;
  result.overall.activeMachines = machineShifts.length;

  // Средние KPI по типам операторов
  result.overall.averageKPIByType.operators = kpiByType.operators.length > 0
    ? Math.round((kpiByType.operators.reduce((a, b) => a + b, 0) / kpiByType.operators.length) * 10) / 10
    : 0;

  result.overall.averageKPIByType.setupSpecialists = kpiByType.setupSpecialists.length > 0
    ? Math.round((kpiByType.setupSpecialists.reduce((a, b) => a + b, 0) / kpiByType.setupSpecialists.length) * 10) / 10
    : 0;

  result.overall.averageKPIByType.universal = kpiByType.universal.length > 0
    ? Math.round((kpiByType.universal.reduce((a, b) => a + b, 0) / kpiByType.universal.length) * 10) / 10
    : 0;

  // Сортировка рейтингов
  result.rankings.operatorsByKPI.sort((a, b) => b.kpi - a.kpi);
  result.rankings.machinesByOEE.sort((a, b) => b.oee - a.oee);

  return result;
}

/**
 * Пример использования с реальными данными
 */
export function exampleComprehensiveCalculation(): ComprehensiveMetrics {
  const operatorShifts: OperatorShiftData[] = [
    // Оператор станка Kirill
    {
      operatorId: 'OP001',
      operatorName: 'Kirill',
      operatorType: 'operator',
      shiftTime: 480,
      participationTime: 300, // 5 часов производства
      productionTime: 300,
      producedParts: 12,
      defectParts: 1,
      standardTimePerPart: 25
    },
    
    // Наладчик Arkady
    {
      operatorId: 'SP001', 
      operatorName: 'Arkady',
      operatorType: 'setup_specialist',
      shiftTime: 480,
      participationTime: 360, // 6 часов наладочных работ
      setupsCompleted: 3,
      setupQuality: 95,      // 95% качество наладки
      machineReadiness: 100,  // Станок готов без доработок
      safetyCompliance: 90    // 90% соблюдение процедур
    },
    
    // Универсальный оператор Denis
    {
      operatorId: 'UN001',
      operatorName: 'Denis',
      operatorType: 'universal',
      shiftTime: 480,
      participationTime: 420, // 7 часов общего участия
      productionTime: 200,    // 200 мин производство
      producedParts: 8,
      defectParts: 0,
      standardTimePerPart: 25,
      setupQuality: 85,
      machineReadiness: 90,
      safetyCompliance: 95,
      productionPart: 0.6,    // 60% времени на производство
      setupPart: 0.4          // 40% времени на наладку
    }
  ];

  const machineShifts: MachineData[] = [
    {
      machineId: 'M001',
      machineName: 'Doosan Yashana',
      shiftTime: 480,
      setupTime: 120,
      productionTime: 300,
      downTime: 60,
      operatingTime: 480  // Полная смена участия
    },
    {
      machineId: 'M002', 
      machineName: 'Doosan Hadasha',
      shiftTime: 480,
      setupTime: 80,
      productionTime: 320,
      downTime: 80,
      operatingTime: 480
    },
    {
      machineId: 'M003',
      machineName: 'Mitsubishi',
      shiftTime: 480,
      setupTime: 150,
      productionTime: 200,
      downTime: 130,
      operatingTime: 480
    }
  ];

  return calculateComprehensiveMetrics(operatorShifts, machineShifts);
}

/**
 * Функция для анализа результатов
 */
export function analyzeResults(metrics: ComprehensiveMetrics): string[] {
  const insights: string[] = [];
  
  // Общие выводы
  insights.push(`📊 ОБЩИЕ МЕТРИКИ:`);
  insights.push(`• Общий KPI всех операторов: ${metrics.overall.totalKPI}%`);
  insights.push(`• Общий OEE всех станков: ${metrics.overall.totalOEE}%`);
  insights.push(`• Участвует операторов: ${metrics.overall.participatingOperators}`);
  insights.push(`• Активных станков: ${metrics.overall.activeMachines}`);
  
  // KPI по типам
  insights.push(`\n👥 KPI ПО ТИПАМ ОПЕРАТОРОВ:`);
  insights.push(`• Операторы станков: ${metrics.overall.averageKPIByType.operators}%`);
  insights.push(`• Наладчики: ${metrics.overall.averageKPIByType.setupSpecialists}%`);
  insights.push(`• Универсальные: ${metrics.overall.averageKPIByType.universal}%`);
  
  // Лидеры
  insights.push(`\n🏆 ЛИДЕРЫ:`);
  if (metrics.rankings.operatorsByKPI.length > 0) {
    const topOperator = metrics.rankings.operatorsByKPI[0];
    insights.push(`• Лучший оператор: ${topOperator.operatorName} (${topOperator.kpi}%)`);
  }
  if (metrics.rankings.machinesByOEE.length > 0) {
    const topMachine = metrics.rankings.machinesByOEE[0];
    insights.push(`• Лучший станок: ${topMachine.machineName} (${topMachine.oee}%)`);
  }
  
  return insights;
}
