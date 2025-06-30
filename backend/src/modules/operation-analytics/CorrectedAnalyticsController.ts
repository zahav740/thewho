/**
 * @file: CorrectedAnalyticsController.ts
 * @description: Исправленный контроллер аналитики с правильными формулами OEE и KPI
 * @created: 2025-06-30
 */
import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Machine } from '../../database/entities/machine.entity';
import { Operation } from '../../database/entities/operation.entity';
import { Order } from '../../database/entities/order.entity';
import { ShiftRecord } from '../../database/entities/shift-record.entity';

interface CorrectedMetrics {
  oeeStanoka: number;           // OEE станка (загруженность)
  kpiOperatora: number;         // KPI оператора (без штрафа за наладку)
  zagruzkaStanoka: number;      // Загрузка станка %
  effektivnostProizvodstva: number; // Эффективность производства %
  kachestvo: number;            // Качество %
  soblyudenieNorm: number;      // Соблюдение норм времени %
  razbivkaVremeni: {
    naladkaPercent: number;     // % времени на наладку
    proizvodstvoPercent: number; // % времени на производство
    prostoiPercent: number;     // % простоев
    svobodnoPercent: number;    // % свободного времени
  };
}

@ApiTags('corrected-analytics')
@Controller('analytics')
export class CorrectedAnalyticsController {
  private readonly logger = new Logger(CorrectedAnalyticsController.name);
  
  constructor(
    @InjectRepository(Machine)
    private readonly machineRepository: Repository<Machine>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ShiftRecord)
    private readonly shiftRecordRepository: Repository<ShiftRecord>,
  ) {}

  @Get('machine/:machineId/corrected-metrics')
  @ApiOperation({ summary: 'Исправленные метрики OEE и KPI' })
  async getCorrectedMachineMetrics(
    @Param('machineId') machineId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(`🔧 Получение исправленных метрик для станка ${machineId}`);

      // Получаем информацию о станке
      const machine = await this.machineRepository.findOne({
        where: { id: machineId }
      });

      if (!machine) {
        return {
          status: 'error',
          message: 'Станок не найден'
        };
      }

      // Фильтр по датам
      const dateFilter = startDate && endDate ? {
        date: Between(new Date(startDate), new Date(endDate))
      } : {};

      // Получаем записи смен
      const shiftRecords = await this.shiftRecordRepository.find({
        where: {
          machineId: machineId,
          ...dateFilter
        },
        relations: ['operation', 'operation.order'],
        order: { date: 'ASC' }
      });

      console.log(`Найдено ${shiftRecords.length} записей смен для анализа`);

      if (shiftRecords.length === 0) {
        return {
          status: 'no_data',
          message: 'Нет данных за указанный период'
        };
      }

      // Рассчитываем исправленные метрики
      const metrics = this.calculateCorrectedMetrics(shiftRecords);

      return {
        status: 'success',
        machine: {
          id: machine.id,
          code: machine.code,
          type: machine.type
        },
        period: {
          startDate,
          endDate,
          shiftsCount: shiftRecords.length
        },
        metrics,
        explanation: {
          oeeFormula: "OEE = (Время наладки + Время производства) / Общее время смены * 100%",
          kpiFormula: "KPI = Эффективность производства * 0.6 + Качество * 0.3 + Соблюдение норм * 0.1",
          note: "Наладка НЕ считается простоем. KPI оператора не штрафуется за сложность наладки."
        }
      };
    } catch (error) {
      console.error('Ошибка получения исправленных метрик:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('operators-kpi')
  @ApiOperation({ summary: 'KPI всех операторов с правильными расчетами' })
  async getOperatorsKPI(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const dateFilter = startDate && endDate ? {
        date: Between(new Date(startDate), new Date(endDate))
      } : {};

      const allShifts = await this.shiftRecordRepository.find({
        where: dateFilter,
        relations: ['operation', 'operation.order'],
        order: { date: 'ASC' }
      });

      // Группируем по операторам
      const operatorGroups = this.groupShiftsByOperator(allShifts);
      
      const operatorKPIs = [];

      for (const [operatorName, shifts] of operatorGroups.entries()) {
        const metrics = this.calculateCorrectedMetrics(shifts);
        
        operatorKPIs.push({
          operatorName,
          shiftsCount: shifts.length,
          metrics,
          avgProductionPerShift: this.calculateAvgProduction(shifts),
          totalDefects: this.calculateTotalDefects(shifts),
          recommendations: this.generateRecommendations(metrics)
        });
      }

      // Сортируем по KPI
      operatorKPIs.sort((a, b) => b.metrics.kpiOperatora - a.metrics.kpiOperatora);

      return {
        status: 'success',
        period: { startDate, endDate },
        operatorKPIs,
        summary: {
          totalOperators: operatorKPIs.length,
          avgKPI: operatorKPIs.reduce((sum, op) => sum + op.metrics.kpiOperatora, 0) / operatorKPIs.length,
          bestOperator: operatorKPIs[0]?.operatorName,
          worstOperator: operatorKPIs[operatorKPIs.length - 1]?.operatorName
        }
      };
    } catch (error) {
      console.error('Ошибка получения KPI операторов:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('machines-oee')
  @ApiOperation({ summary: 'OEE всех станков с правильными расчетами' })
  async getMachinesOEE(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const machines = await this.machineRepository.find();
      const machineOEEs = [];

      for (const machine of machines) {
        const dateFilter = startDate && endDate ? {
          date: Between(new Date(startDate), new Date(endDate))
        } : {};

        const shifts = await this.shiftRecordRepository.find({
          where: {
            machineId: machine.id,
            ...dateFilter
          },
          relations: ['operation', 'operation.order']
        });

        if (shifts.length > 0) {
          const metrics = this.calculateCorrectedMetrics(shifts);
          
          machineOEEs.push({
            machineId: machine.id,
            machineName: machine.code,
            machineType: machine.type,
            shiftsCount: shifts.length,
            metrics,
            status: this.getStatusByOEE(metrics.oeeStanoka),
            utilizationBreakdown: metrics.razbivkaVremeni
          });
        }
      }

      // Сортируем по OEE
      machineOEEs.sort((a, b) => b.metrics.oeeStanoka - a.metrics.oeeStanoka);

      return {
        status: 'success',
        period: { startDate, endDate },
        machineOEEs,
        summary: {
          totalMachines: machineOEEs.length,
          avgOEE: machineOEEs.reduce((sum, m) => sum + m.metrics.oeeStanoka, 0) / machineOEEs.length,
          excellentMachines: machineOEEs.filter(m => m.status === 'excellent').length,
          needsAttention: machineOEEs.filter(m => m.status === 'needs_attention').length
        }
      };
    } catch (error) {
      console.error('Ошибка получения OEE станков:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * ПРАВИЛЬНЫЙ расчет метрик согласно новой логике
   */
  private calculateCorrectedMetrics(shifts: ShiftRecord[]): CorrectedMetrics {
    let totalShiftTime = 0;       // Общее время смен
    let totalSetupTime = 0;       // Общее время наладки
    let totalProductionTime = 0;  // Общее время производства  
    let totalDownTime = 0;        // Общие простои
    let totalProduced = 0;        // Всего произведено
    let totalDefects = 0;         // Всего брака
    let totalWorkingMinutes = 0;  // Рабочее время

    shifts.forEach(shift => {
      // Время смены (обычно 480 минут)
      const shiftDuration = 480; // можно получать из настроек
      totalShiftTime += shiftDuration;

      // Время наладки
      const setupTime = shift.setupTime || 0;
      totalSetupTime += setupTime;

      // Произведенные детали
      const dayQty = shift.dayShiftQuantity || 0;
      const nightQty = shift.nightShiftQuantity || 0;
      const shiftProduced = dayQty + nightQty;
      totalProduced += shiftProduced;

      // Время производства (рассчитываем из времени на деталь)
      const dayTimePerUnit = shift.dayShiftTimePerUnit || 0;
      const nightTimePerUnit = shift.nightShiftTimePerUnit || 0;
      const productionTime = (dayQty * dayTimePerUnit) + (nightQty * nightTimePerUnit);
      totalProductionTime += productionTime;

      // Простои = остальное время
      const usedTime = setupTime + productionTime;
      const downTime = Math.max(0, shiftDuration - usedTime);
      totalDownTime += downTime;

      // Рабочее время (без простоев)
      totalWorkingMinutes += usedTime;
    });

    // ===== ИСПРАВЛЕННЫЙ OEE СТАНКА =====
    // OEE = (Время наладки + Время производства) / Общее время смены * 100%
    const utilizationTime = totalSetupTime + totalProductionTime;
    const oeeStanoka = totalShiftTime > 0 ? (utilizationTime / totalShiftTime) * 100 : 0;

    // ===== ИСПРАВЛЕННЫЙ KPI ОПЕРАТОРА =====
    
    // 1. Эффективность производства (только в рабочее время)
    const standardTimePerPart = 25; // стандартное время (можно получать из настроек)
    const expectedTimeForActualParts = totalProduced * standardTimePerPart;
    const effektivnostProizvodstva = totalProductionTime > 0 
      ? Math.min(100, (expectedTimeForActualParts / totalProductionTime) * 100)
      : 0;

    // 2. Качество
    const kachestvo = totalProduced > 0 
      ? ((totalProduced - totalDefects) / totalProduced) * 100
      : 100;

    // 3. Соблюдение норм времени
    const actualTimePerPart = totalProduced > 0 
      ? totalProductionTime / totalProduced 
      : 0;
    const soblyudenieNorm = actualTimePerPart > 0 
      ? Math.min(100, (standardTimePerPart / actualTimePerPart) * 100)
      : 100;

    // Комбинированный KPI оператора (без штрафа за наладку!)
    const kpiOperatora = (effektivnostProizvodstva * 0.6) + (kachestvo * 0.3) + (soblyudenieNorm * 0.1);

    // ===== РАЗБИВКА ВРЕМЕНИ =====
    const naladkaPercent = totalShiftTime > 0 ? (totalSetupTime / totalShiftTime) * 100 : 0;
    const proizvodstvoPercent = totalShiftTime > 0 ? (totalProductionTime / totalShiftTime) * 100 : 0;
    const prostoiPercent = totalShiftTime > 0 ? (totalDownTime / totalShiftTime) * 100 : 0;
    const svobodnoPercent = 100 - naladkaPercent - proizvodstvoPercent - prostoiPercent;

    return {
      oeeStanoka: Math.round(oeeStanoka * 10) / 10,
      kpiOperatora: Math.round(kpiOperatora * 10) / 10,
      zagruzkaStanoka: Math.round(oeeStanoka * 10) / 10, // то же что OEE
      effektivnostProizvodstva: Math.round(effektivnostProizvodstva * 10) / 10,
      kachestvo: Math.round(kachestvo * 10) / 10,
      soblyudenieNorm: Math.round(soblyudenieNorm * 10) / 10,
      razbivkaVremeni: {
        naladkaPercent: Math.round(naladkaPercent * 10) / 10,
        proizvodstvoPercent: Math.round(proizvodstvoPercent * 10) / 10,
        prostoiPercent: Math.round(prostoiPercent * 10) / 10,
        svobodnoPercent: Math.round(svobodnoPercent * 10) / 10
      }
    };
  }

  private groupShiftsByOperator(shifts: ShiftRecord[]): Map<string, ShiftRecord[]> {
    const groups = new Map<string, ShiftRecord[]>();

    shifts.forEach(shift => {
      // Учитываем операторов дневной и ночной смены
      if (shift.dayShiftOperator && shift.dayShiftQuantity > 0) {
        if (!groups.has(shift.dayShiftOperator)) {
          groups.set(shift.dayShiftOperator, []);
        }
        groups.get(shift.dayShiftOperator)!.push(shift);
      }

      if (shift.nightShiftOperator && shift.nightShiftQuantity > 0) {
        if (!groups.has(shift.nightShiftOperator)) {
          groups.set(shift.nightShiftOperator, []);
        }
        groups.get(shift.nightShiftOperator)!.push(shift);
      }
    });

    return groups;
  }

  private calculateAvgProduction(shifts: ShiftRecord[]): number {
    const totalProduced = shifts.reduce((sum, shift) => 
      sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
    );
    return shifts.length > 0 ? totalProduced / shifts.length : 0;
  }

  private calculateTotalDefects(shifts: ShiftRecord[]): number {
    // В текущей схеме БД нет поля для брака в shift_records
    // Это нужно будет добавить или получать из другой таблицы
    return 0; // заглушка
  }

  private getStatusByOEE(oee: number): string {
    if (oee >= 85) return 'excellent';
    if (oee >= 75) return 'good';
    return 'needs_attention';
  }

  private generateRecommendations(metrics: CorrectedMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.oeeStanoka < 75) {
      recommendations.push('Низкая загрузка станка - оптимизировать планирование');
    }

    if (metrics.razbivkaVremeni.prostoiPercent > 15) {
      recommendations.push('Высокие простои - техническое обслуживание');
    }

    if (metrics.effektivnostProizvodstva < 80) {
      recommendations.push('Низкая эффективность - дополнительное обучение');
    }

    if (metrics.kachestvo < 95) {
      recommendations.push('Проблемы с качеством - анализ причин брака');
    }

    if (metrics.razbivkaVremeni.naladkaPercent > 30) {
      recommendations.push('Долгая наладка - стандартизация процедур');
    }

    if (recommendations.length === 0) {
      recommendations.push('Отличная работа - поддерживать уровень');
    }

    return recommendations;
  }
}
