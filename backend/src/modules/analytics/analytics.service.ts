/**
 * @file: analytics.service.ts 
 * @description: Сервис для расчета KPI и OEE аналитики на основе реальных данных смен
 * @created: 2025-06-30
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ShiftRecord } from '../../database/entities/shift-record.entity';
import { Machine } from '../../database/entities/machine.entity';
import { Operator } from '../../database/entities/operator.entity';

export interface OEEKPIData {
  shiftTime: number;
  setupTime: number;
  productionTime: number;
  downTime: number;
  plannedParts: number;
  actualParts: number;
  defectParts: number;
  operatorName: string;
  machineName: string;
  shift: number;
  date: string;
}

export interface OEEKPIResult {
  machineOEE: number;
  operatorKPI: number;
  qualityRate: number;
  operatorEfficiency: number;
  timeBreakdown: {
    setupTimePercent: number;
    productionTimePercent: number;
    downTimePercent: number;
  };
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  recommendations: string[];
}

export interface OperatorPerformance {
  operatorName: string;
  oee: number;
  kpi: number;
  totalShifts: number;
  avgProduction: number;
  qualityRate: number;
  recommendations: string[];
}

export interface MachinePerformance {
  machineId: number;
  machineName: string;
  oee: number;
  utilization: number;
  setupTimePercent: number;
  productionTimePercent: number;
  downTimePercent: number;
  status: 'excellent' | 'good' | 'needs_attention';
}

export interface AggregatedMetrics {
  overallOEE: number;
  overallKPI: number;
  totalProducedParts: number;
  averageQuality: number;
  totalActiveTime: number;
  machineCount: number;
  operatorCount: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operator)
    private readonly operatorRepository: Repository<Operator>,
  ) {}

  /**
   * Правильный расчет OEE и KPI
   */
  private calculateOEEAndKPI(data: OEEKPIData): OEEKPIResult {
    const { 
      shiftTime, 
      setupTime, 
      productionTime, 
      downTime, 
      plannedParts, 
      actualParts, 
      defectParts 
    } = data;

    // OEE станка = загруженность = (наладка + производство) / общее время смены
    const activeTime = setupTime + productionTime;
    const machineOEE = Math.round((activeTime / shiftTime) * 100);
    
    // Качество продукции
    const qualityRate = actualParts > 0 ? Math.round(((actualParts - defectParts) / actualParts) * 100) : 0;
    
    // Эффективность оператора (БЕЗ штрафа за время наладки)
    const operatorEfficiency = productionTime > 0 && plannedParts > 0 
      ? Math.round((actualParts / plannedParts) * 100)
      : 0;
    
    // KPI оператора = эффективность * 70% + качество * 30%
    const operatorKPI = Math.round(operatorEfficiency * 0.7 + qualityRate * 0.3);
    
    // Разбивка времени
    const timeBreakdown = {
      setupTimePercent: Math.round((setupTime / shiftTime) * 100),
      productionTimePercent: Math.round((productionTime / shiftTime) * 100),
      downTimePercent: Math.round((downTime / shiftTime) * 100)
    };
    
    // Статус
    let status: 'excellent' | 'good' | 'needs_attention' | 'critical' = 'critical';
    if (machineOEE >= 90 && operatorKPI >= 90) status = 'excellent';
    else if (machineOEE >= 80 && operatorKPI >= 80) status = 'good';
    else if (machineOEE >= 70 || operatorKPI >= 70) status = 'needs_attention';
    
    // Рекомендации
    const recommendations = [];
    if (machineOEE < 80) recommendations.push('Увеличить загруженность станка');
    if (operatorKPI < 80) recommendations.push('Повысить эффективность оператора');
    if (qualityRate < 95) recommendations.push('Улучшить качество');
    if (downTime / shiftTime > 0.15) recommendations.push('Сократить простои');
    
    return {
      machineOEE,
      operatorKPI,
      qualityRate,
      operatorEfficiency,
      timeBreakdown,
      status,
      recommendations
    };
  }

  /**
   * Конвертация записи смены в формат для расчета OEE/KPI
   */
  private convertShiftRecordToOEEData(record: ShiftRecord): OEEKPIData {
    const shiftTime = 480; // 8 часов в минутах
    const setupTime = record.setupTime || 0;
    
    // Производственное время рассчитываем из количества и времени на деталь
    const dayProductionTime = (record.dayShiftQuantity || 0) * (record.dayShiftTimePerUnit || 0);
    const nightProductionTime = (record.nightShiftQuantity || 0) * (record.nightShiftTimePerUnit || 0);
    const productionTime = dayProductionTime + nightProductionTime;
    
    // Простои = общее время - наладка - производство
    const downTime = Math.max(0, shiftTime - setupTime - productionTime);
    
    const actualParts = (record.dayShiftQuantity || 0) + (record.nightShiftQuantity || 0);
    const plannedParts = Math.round(actualParts * 1.1); // Предполагаем план на 10% больше факта
    const defectParts = Math.round(actualParts * 0.05); // Предполагаем 5% брака
    
    const operatorName = record.dayShiftOperator || record.nightShiftOperator || 'Неизвестно';
    const machineName = record.machine?.code || `Станок ${record.machineId}`;

    return {
      shiftTime,
      setupTime,
      productionTime,
      downTime,
      plannedParts,
      actualParts,
      defectParts,
      operatorName,
      machineName,
      shift: 1,
      date: record.date.toISOString().split('T')[0]
    };
  }

  /**
   * Получение KPI/OEE данных за период
   */
  async getKPIOEEData(startDate: Date, endDate: Date): Promise<{
    shifts: Array<OEEKPIData & { result: OEEKPIResult }>;
    aggregated: AggregatedMetrics;
  }> {
    this.logger.log(`📊 Получение KPI/OEE данных за период ${startDate.toISOString()} - ${endDate.toISOString()}`);

    const shiftRecords = await this.shiftRecordRepository.find({
      where: {
        date: Between(startDate, endDate)
      },
      relations: ['machine', 'operation', 'operation.order']
    });

    this.logger.log(`📋 Найдено ${shiftRecords.length} записей смен`);

    if (shiftRecords.length === 0) {
      return {
        shifts: [],
        aggregated: {
          overallOEE: 0,
          overallKPI: 0,
          totalProducedParts: 0,
          averageQuality: 0,
          totalActiveTime: 0,
          machineCount: 0,
          operatorCount: 0
        }
      };
    }

    const shifts = shiftRecords.map(record => {
      const oeeData = this.convertShiftRecordToOEEData(record);
      const result = this.calculateOEEAndKPI(oeeData);
      return { ...oeeData, result };
    });

    // Агрегированные метрики
    const totalOEE = shifts.reduce((sum, shift) => sum + shift.result.machineOEE, 0);
    const totalKPI = shifts.reduce((sum, shift) => sum + shift.result.operatorKPI, 0);
    const totalParts = shifts.reduce((sum, shift) => sum + shift.actualParts, 0);
    const totalQuality = shifts.reduce((sum, shift) => sum + shift.result.qualityRate, 0);
    const totalActiveTime = shifts.reduce((sum, shift) => sum + shift.setupTime + shift.productionTime, 0);
    
    const uniqueMachines = new Set(shifts.map(s => s.machineName)).size;
    const uniqueOperators = new Set(shifts.map(s => s.operatorName)).size;

    const aggregated: AggregatedMetrics = {
      overallOEE: Math.round(totalOEE / shifts.length),
      overallKPI: Math.round(totalKPI / shifts.length),
      totalProducedParts: totalParts,
      averageQuality: Math.round(totalQuality / shifts.length),
      totalActiveTime,
      machineCount: uniqueMachines,
      operatorCount: uniqueOperators
    };

    return { shifts, aggregated };
  }

  /**
   * Получение аналитики по операторам
   */
  async getOperatorPerformance(startDate: Date, endDate: Date): Promise<OperatorPerformance[]> {
    this.logger.log(`👥 Получение аналитики по операторам за период ${startDate.toISOString()} - ${endDate.toISOString()}`);

    const { shifts } = await this.getKPIOEEData(startDate, endDate);
    
    const operatorMap = new Map<string, {
      oeeSum: number;
      kpiSum: number;
      qualitySum: number;
      shiftsCount: number;
      totalProduction: number;
    }>();

    shifts.forEach(shift => {
      const { operatorName, result, actualParts } = shift;
      
      if (!operatorMap.has(operatorName)) {
        operatorMap.set(operatorName, {
          oeeSum: 0,
          kpiSum: 0,
          qualitySum: 0,
          shiftsCount: 0,
          totalProduction: 0
        });
      }

      const operatorData = operatorMap.get(operatorName)!;
      operatorData.oeeSum += result.machineOEE;
      operatorData.kpiSum += result.operatorKPI;
      operatorData.qualitySum += result.qualityRate;
      operatorData.shiftsCount += 1;
      operatorData.totalProduction += actualParts;
    });

    const performance: OperatorPerformance[] = Array.from(operatorMap.entries()).map(([operatorName, data]) => {
      const avgOEE = Math.round(data.oeeSum / data.shiftsCount);
      const avgKPI = Math.round(data.kpiSum / data.shiftsCount);
      const avgQuality = Math.round(data.qualitySum / data.shiftsCount);
      const avgProduction = Math.round(data.totalProduction / data.shiftsCount);

      const recommendations = [];
      if (avgKPI < 80) recommendations.push('Повысить эффективность');
      if (avgQuality < 95) recommendations.push('Улучшить качество');
      if (avgProduction < 10) recommendations.push('Увеличить производительность');

      return {
        operatorName,
        oee: avgOEE,
        kpi: avgKPI,
        totalShifts: data.shiftsCount,
        avgProduction,
        qualityRate: avgQuality,
        recommendations
      };
    });

    return performance.sort((a, b) => b.kpi - a.kpi); // Сортируем по KPI убыванию
  }

  /**
   * Получение аналитики по станкам
   */
  async getMachinePerformance(startDate: Date, endDate: Date): Promise<MachinePerformance[]> {
    this.logger.log(`🏭 Получение аналитики по станкам за период ${startDate.toISOString()} - ${endDate.toISOString()}`);

    const { shifts } = await this.getKPIOEEData(startDate, endDate);
    
    const machineMap = new Map<string, {
      oeeSum: number;
      shiftsCount: number;
      setupTimeSum: number;
      productionTimeSum: number;
      downTimeSum: number;
      shiftTimeSum: number;
      machineId?: number;
    }>();

    shifts.forEach(shift => {
      const { machineName, result, setupTime, productionTime, downTime, shiftTime } = shift;
      
      if (!machineMap.has(machineName)) {
        machineMap.set(machineName, {
          oeeSum: 0,
          shiftsCount: 0,
          setupTimeSum: 0,
          productionTimeSum: 0,
          downTimeSum: 0,
          shiftTimeSum: 0
        });
      }

      const machineData = machineMap.get(machineName)!;
      machineData.oeeSum += result.machineOEE;
      machineData.shiftsCount += 1;
      machineData.setupTimeSum += setupTime;
      machineData.productionTimeSum += productionTime;
      machineData.downTimeSum += downTime;
      machineData.shiftTimeSum += shiftTime;
    });

    const performance: MachinePerformance[] = Array.from(machineMap.entries()).map(([machineName, data]) => {
      const avgOEE = Math.round(data.oeeSum / data.shiftsCount);
      const utilization = Math.round(((data.setupTimeSum + data.productionTimeSum) / data.shiftTimeSum) * 100);
      const setupTimePercent = Math.round((data.setupTimeSum / data.shiftTimeSum) * 100);
      const productionTimePercent = Math.round((data.productionTimeSum / data.shiftTimeSum) * 100);
      const downTimePercent = Math.round((data.downTimeSum / data.shiftTimeSum) * 100);

      let status: 'excellent' | 'good' | 'needs_attention' = 'needs_attention';
      if (avgOEE >= 85) status = 'excellent';
      else if (avgOEE >= 75) status = 'good';

      return {
        machineId: data.machineId || 0,
        machineName,
        oee: avgOEE,
        utilization,
        setupTimePercent,
        productionTimePercent,
        downTimePercent,
        status
      };
    });

    return performance.sort((a, b) => b.oee - a.oee); // Сортируем по OEE убыванию
  }
}
