/**
 * @file: analyticsApi.ts
 * @description: API клиент для аналитики KPI и OEE с fallback данными
 * @created: 2025-06-30
 */
import { api } from './api';

export interface OEEKPIShift {
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
  result: {
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
  };
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

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
}

// Пустые данные для случая отсутствия информации
const getEmptyKPIOEEData = (): {
  shifts: OEEKPIShift[];
  aggregated: AggregatedMetrics;
} => ({
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
});

const getEmptyOperators = (): OperatorPerformance[] => [];

const getEmptyMachines = (): MachinePerformance[] => [];

export const analyticsApi = {
  /**
   * Получение данных KPI и OEE за период
   */
  getKPIOEEData: async (filter: AnalyticsFilter = {}) => {
    try {
      console.log('📊 Запрос KPI/OEE данных:', filter);
      
      const response = await api.get('/analytics/kpi-oee', {
        params: filter
      });
      
      console.log('✅ Получены KPI/OEE данные:', response.data);
      
      return response.data.data as {
        shifts: OEEKPIShift[];
        aggregated: AggregatedMetrics;
      };
    } catch (error) {
      console.error('❌ Ошибка получения KPI/OEE данных:', error);
      console.log('📭 Нет данных для отображения аналитики');
      
      return getEmptyKPIOEEData();
    }
  },

  /**
   * Получение аналитики по операторам
   */
  getOperatorPerformance: async (filter: AnalyticsFilter = {}) => {
    try {
      console.log('👥 Запрос аналитики операторов:', filter);
      
      const response = await api.get('/analytics/operators', {
        params: filter
      });
      
      console.log('✅ Получена аналитика операторов:', response.data);
      
      return response.data.data as OperatorPerformance[];
    } catch (error) {
      console.error('❌ Ошибка получения аналитики операторов:', error);
      console.log('📭 Нет данных по операторам');
      
      return getEmptyOperators();
    }
  },

  /**
   * Получение аналитики по станкам
   */
  getMachinePerformance: async (filter: AnalyticsFilter = {}) => {
    try {
      console.log('🏭 Запрос аналитики станков:', filter);
      
      const response = await api.get('/analytics/machines', {
        params: filter
      });
      
      console.log('✅ Получена аналитика станков:', response.data);
      
      return response.data.data as MachinePerformance[];
    } catch (error) {
      console.error('❌ Ошибка получения аналитики станков:', error);
      console.log('📭 Нет данных по станкам');
      
      return getEmptyMachines();
    }
  },

  /**
   * Получение полной сводки аналитики
   */
  getAnalyticsSummary: async (filter: AnalyticsFilter = {}) => {
    try {
      console.log('📋 Запрос сводки аналитики:', filter);
      
      const response = await api.get('/analytics/summary', {
        params: filter
      });
      
      console.log('✅ Получена сводка аналитики:', response.data);
      
      return response.data.data as {
        kpiOee: {
          shifts: OEEKPIShift[];
          aggregated: AggregatedMetrics;
        };
        operators: OperatorPerformance[];
        machines: MachinePerformance[];
        summary: {
          totalShifts: number;
          activeOperators: number;
          activeMachines: number;
          period: {
            startDate: string;
            endDate: string;
          };
        };
      };
    } catch (error) {
      console.error('❌ Ошибка получения сводки аналитики:', error);
      console.log('📭 Нет данных для сводки');
      
      // Пустые данные
      const kpiOeeData = getEmptyKPIOEEData();
      const operatorsData = getEmptyOperators();
      const machinesData = getEmptyMachines();
      
      return {
        kpiOee: kpiOeeData,
        operators: operatorsData,
        machines: machinesData,
        summary: {
          totalShifts: 0,
          activeOperators: 0,
          activeMachines: 0,
          period: {
            startDate: filter.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: filter.endDate || new Date().toISOString().split('T')[0]
          }
        }
      };
    }
  }
};
