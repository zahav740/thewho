/**
 * @file: ImprovedEfficiencyCalculation.ts
 * @description: Улучшенный расчет эффективности операторов с учетом реальных производственных факторов
 * @created: 2025-06-10
 */

interface MachineConfiguration {
  machineId: string;
  processingTime: number; // Время обработки детали в минутах
  serviceTime: number;    // Время загрузки/выгрузки в минутах
  totalCycleTime: number; // processingTime + serviceTime
}

interface OperatorShift {
  duration: number;      // Длительность смены в минутах
  machines: MachineConfiguration[];
  actualOutput: number;  // Фактически произведено деталей
  operatorTime: number;  // Время работы оператора
}

interface EfficiencyResult {
  theoreticalMax: number;        // Теоретический максимум деталей
  actualOutput: number;          // Фактический выпуск
  efficiency: number;            // Эффективность в %
  machineUtilization: number;    // Использование станков в %
  operatorUtilization: number;   // Загрузка оператора в %
  bottleneck: string;           // Узкое место
  recommendations: string[];     // Рекомендации по улучшению
}

/**
 * Расчет оптимального цикла обслуживания станков
 */
function calculateOptimalCycle(machines: MachineConfiguration[]): {
  cycleTime: number;
  sequence: string[];
  outputPerCycle: number;
} {
  // Находим станок с максимальным временем цикла (узкое место)
  const bottleneckMachine = machines.reduce((max, machine) => 
    machine.totalCycleTime > max.totalCycleTime ? machine : max
  );

  // Базовое время цикла = время самого медленного станка
  const baseCycleTime = bottleneckMachine.totalCycleTime;
  
  // Рассчитываем, сколько раз нужно обслужить каждый станок за цикл
  const sequence: string[] = [];
  let totalServiceTime = 0;
  let outputPerCycle = 0;

  machines.forEach(machine => {
    // Сколько раз этот станок может быть обслужен за базовый цикл
    const visitsPerCycle = Math.floor(baseCycleTime / machine.totalCycleTime);
    
    for (let i = 0; i < visitsPerCycle; i++) {
      sequence.push(machine.machineId);
      totalServiceTime += machine.serviceTime;
      outputPerCycle++;
    }
  });

  return {
    cycleTime: Math.max(baseCycleTime, totalServiceTime),
    sequence,
    outputPerCycle
  };
}

/**
 * Улучшенный расчет эффективности оператора
 */
export function calculateImprovedEfficiency(shift: OperatorShift): EfficiencyResult {
  // 1. Рассчитываем оптимальный цикл обслуживания
  const optimalCycle = calculateOptimalCycle(shift.machines);
  
  // 2. Теоретический максимум деталей за смену
  const numberOfCycles = Math.floor(shift.duration / optimalCycle.cycleTime);
  const theoreticalMax = numberOfCycles * optimalCycle.outputPerCycle;
  
  // 3. Базовая эффективность
  const baseEfficiency = (shift.actualOutput / theoreticalMax) * 100;
  
  // 4. Использование станков
  const totalMachineTime = shift.machines.reduce((sum, machine) => 
    sum + (machine.processingTime * shift.actualOutput), 0
  );
  const availableMachineTime = shift.machines.length * shift.duration;
  const machineUtilization = (totalMachineTime / availableMachineTime) * 100;
  
  // 5. Загрузка оператора
  const operatorServiceTime = shift.machines.reduce((sum, machine) => 
    sum + (machine.serviceTime * shift.actualOutput), 0
  );
  const operatorUtilization = (operatorServiceTime / shift.operatorTime) * 100;
  
  // 6. Определение узкого места
  let bottleneck = "Оператор";
  if (machineUtilization > 90) {
    const slowestMachine = shift.machines.reduce((max, machine) => 
      machine.totalCycleTime > max.totalCycleTime ? machine : max
    );
    bottleneck = `Станок ${slowestMachine.machineId}`;
  }
  
  // 7. Рекомендации
  const recommendations: string[] = [];
  
  if (baseEfficiency < 70) {
    recommendations.push("Низкая эффективность - требуется анализ причин простоев");
  }
  
  if (operatorUtilization > 95) {
    recommendations.push("Оператор перегружен - рассмотрите добавление помощника");
  } else if (operatorUtilization < 60) {
    recommendations.push("Низкая загрузка оператора - можно добавить станки");
  }
  
  if (machineUtilization < 60) {
    recommendations.push("Низкое использование станков - оптимизируйте цикл обслуживания");
  }
  
  // Проверяем синхронизацию
  const cycleTimeVariation = Math.max(...shift.machines.map(m => m.totalCycleTime)) - 
                             Math.min(...shift.machines.map(m => m.totalCycleTime));
  if (cycleTimeVariation > 10) {
    recommendations.push("Большая разница в циклах станков - рассмотрите перебалансировку");
  }

  return {
    theoreticalMax,
    actualOutput: shift.actualOutput,
    efficiency: Math.round(baseEfficiency),
    machineUtilization: Math.round(machineUtilization),
    operatorUtilization: Math.round(operatorUtilization),
    bottleneck,
    recommendations
  };
}

/**
 * Пример использования для данных из скриншота
 */
export function calculateKirillArkadyEfficiency(): EfficiencyResult[] {
  // Предположим конфигурацию станков (нужно получить из реальных данных)
  const machines: MachineConfiguration[] = [
    {
      machineId: "CNC-01",
      processingTime: 20,  // 20 минут обработка
      serviceTime: 4,      // 4 минуты загрузка/выгрузка
      totalCycleTime: 24
    },
    {
      machineId: "CNC-02", 
      processingTime: 15,  // 15 минут обработка
      serviceTime: 3,      // 3 минуты загрузка/выгрузка
      totalCycleTime: 18
    }
  ];

  // Данные смены Kirill (дневная)
  const kirillShift: OperatorShift = {
    duration: 480,        // 8 часов
    machines: machines,
    actualOutput: 10,     // 10 деталей по факту
    operatorTime: 250     // 4ч 10мин работы (из скриншота)
  };

  // Данные смены Аркадий (ночная)
  const arkadyShift: OperatorShift = {
    duration: 480,        // 8 часов
    machines: machines,
    actualOutput: 20,     // 20 деталей по факту
    operatorTime: 500     // 8ч 20мин работы (из скриншота)
  };

  return [
    calculateImprovedEfficiency(kirillShift),
    calculateImprovedEfficiency(arkadyShift)
  ];
}

/**
 * Расчет эффективности с учетом качества
 */
export function calculateQualityAdjustedEfficiency(
  baseEfficiency: number,
  defectRate: number,
  reworkTime: number
): number {
  const qualityFactor = (100 - defectRate) / 100;
  const reworkPenalty = reworkTime > 0 ? 0.9 : 1.0; // 10% штраф за переделки
  
  return baseEfficiency * qualityFactor * reworkPenalty;
}
