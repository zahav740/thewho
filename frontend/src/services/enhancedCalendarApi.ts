/**
 * @file: enhancedCalendarApi.ts
 * @description: API для работы с улучшенным производственным календарем
 * @dependencies: api
 * @created: 2025-06-11
 */
import api from './api';

// Интерфейсы для enhanced календаря
export interface EnhancedCalendarData {
  period: {
    startDate: string;
    endDate: string;
  };
  totalWorkingDays: number;
  machineSchedules: MachineSchedule[];
}

export interface MachineSchedule {
  machineId: number;
  machineName: string;
  machineType: string;
  days: CalendarDay[];
}

export interface CalendarDay {
  date: string;
  isWorkingDay: boolean;
  dayType: 'WORKING' | 'WEEKEND' | 'HOLIDAY';
  plannedOperation?: PlannedOperation;
  completedShifts?: CompletedShift[];
}

export interface PlannedOperation {
  operationId: number;
  drawingNumber: string;
  operationNumber: number;
  estimatedTimePerPart: number;
  totalQuantity: number;
  estimatedDurationDays: number;
  startDate: string;
  endDate: string;
  currentProgress?: {
    completedQuantity: number;
    remainingQuantity: number;
    progressPercent: number;
  };
}

export interface CompletedShift {
  shiftType: 'DAY' | 'NIGHT';
  operatorName: string;
  drawingNumber: string;
  operationNumber: number;
  quantityProduced: number;
  timePerPart: number;
  setupTime?: number;
  totalTime: number;
  efficiency: number;
}

export interface MachineSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalWorkingDays: number;
  summary: {
    totalMachines: number;
    activeMachines: number;
    averageUtilization: number;
  };
  machines: Array<{
    machineId: number;
    machineName: string;
    machineType: string;
    workingDays: number;
    daysWithOperations: number;
    daysWithShifts: number;
    utilizationPercent: number;
    totalProduced: number;
    status: 'busy' | 'moderate' | 'available';
  }>;
}

export interface WorkingDaysCalculation {
  startDate: string;
  endDate: string;
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  workingDaysPercent: number;
}

export interface OperationDurationCalculation {
  input: {
    timePerPart: number;
    quantity: number;
    setupTime: number;
  };
  calculation: {
    productionTimeMinutes: number;
    totalTimeMinutes: number;
    estimatedDays: number;
    setupDays: number;
    efficiency: number;
  };
  breakdown: {
    hoursPerDay: number;
    minutesPerDay: number;
    totalHours: number;
    productionHours: number;
    setupHours: number;
  };
}

class EnhancedCalendarApi {
  private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

  /**
   * Получить улучшенное представление календаря
   */
  async getEnhancedCalendarView(startDate: string, endDate: string): Promise<EnhancedCalendarData> {
    try {
      console.log('Запрос календаря из БД:', { startDate, endDate });
      
      // Используем основной calendar API, который работает с БД
      const response = await api.get('/calendar', {
        params: { startDate, endDate },
      });
      
      console.log('Ответ от backend:', response.data);
      
      // Проверяем, что получили валидные данные
      if (response.data && !response.data.error && response.data.machineSchedules) {
        return {
          period: response.data.period || { startDate, endDate },
          totalWorkingDays: response.data.totalWorkingDays || 10,
          machineSchedules: response.data.machineSchedules || []
        };
      }
      
      // Если данные не валидные, выбрасываем ошибку
      throw new Error('Невалидные данные от backend');
      
    } catch (error) {
      console.error('Ошибка получения календаря из БД:', error);
      
      // В случае ошибки показываем пустой календарь вместо моков
      return {
        period: { startDate, endDate },
        totalWorkingDays: this.calculateWorkingDaysLocally(startDate, endDate).workingDays,
        machineSchedules: []
      };
    }
  }

  /**
   * Рассчитать количество рабочих дней
   */
  async calculateWorkingDays(startDate: string, endDate: string): Promise<WorkingDaysCalculation> {
    try {
      const response = await api.get('/enhanced-calendar/working-days', {
        params: { startDate, endDate },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Ошибка расчета рабочих дней');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Ошибка расчета рабочих дней:', error);
      
      // Локальный расчет в случае ошибки
      return this.calculateWorkingDaysLocally(startDate, endDate);
    }
  }

  /**
   * Рассчитать продолжительность операции
   */
  async calculateOperationDuration(
    timePerPart: number, 
    quantity: number, 
    setupTime?: number
  ): Promise<OperationDurationCalculation> {
    try {
      const response = await api.get('/enhanced-calendar/operation-duration', {
        params: { 
          timePerPart, 
          quantity, 
          setupTime: setupTime || 0
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Ошибка расчета продолжительности');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Ошибка расчета продолжительности операции:', error);
      
      // Локальный расчет в случае ошибки
      return this.calculateOperationDurationLocally(timePerPart, quantity, setupTime || 0);
    }
  }

  /**
   * Получить сводку по станкам
   */
  async getMachineSummary(startDate: string, endDate: string): Promise<MachineSummary> {
    try {
      const response = await api.get('/enhanced-calendar/machine-summary', {
        params: { startDate, endDate },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Ошибка получения сводки');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Ошибка получения сводки по станкам:', error);
      throw error;
    }
  }

  /**
   * Проверить, является ли день рабочим (локально)
   */
  isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=воскресенье, 6=суббота
    return ![5, 6].includes(dayOfWeek); // Пятница=5, Суббота=6 выходные
  }

  /**
   * Локальный расчет рабочих дней
   */
  private calculateWorkingDaysLocally(startDate: string, endDate: string): WorkingDaysCalculation {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    let totalDays = 0;
    
    const current = new Date(start);
    while (current <= end) {
      totalDays++;
      if (this.isWorkingDay(current)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    const weekendDays = totalDays - workingDays;
    const workingDaysPercent = totalDays > 0 ? Math.round((workingDays / totalDays) * 100) : 0;
    
    return {
      startDate,
      endDate,
      totalDays,
      workingDays,
      weekendDays,
      workingDaysPercent
    };
  }

  /**
   * Локальный расчет продолжительности операции
   */
  private calculateOperationDurationLocally(
    timePerPart: number, 
    quantity: number, 
    setupTime: number
  ): OperationDurationCalculation {
    const productionTimeMinutes = timePerPart * quantity;
    const totalTimeMinutes = productionTimeMinutes + setupTime;
    const minutesPerWorkDay = 16 * 60; // 2 смены по 8 часов
    
    const baseDays = Math.ceil(totalTimeMinutes / minutesPerWorkDay);
    const setupDays = setupTime > 0 ? 1 : 0;
    const estimatedDays = Math.max(1, baseDays);
    
    const theoreticalDays = productionTimeMinutes / minutesPerWorkDay;
    const efficiency = theoreticalDays > 0 ? (theoreticalDays / estimatedDays) * 100 : 0;
    
    return {
      input: {
        timePerPart,
        quantity,
        setupTime
      },
      calculation: {
        productionTimeMinutes,
        totalTimeMinutes,
        estimatedDays,
        setupDays,
        efficiency: Math.round(efficiency * 10) / 10
      },
      breakdown: {
        hoursPerDay: 16,
        minutesPerDay: minutesPerWorkDay,
        totalHours: Math.round(totalTimeMinutes / 60 * 10) / 10,
        productionHours: Math.round(productionTimeMinutes / 60 * 10) / 10,
        setupHours: Math.round(setupTime / 60 * 10) / 10
      }
    };
  }


}

export const enhancedCalendarApi = new EnhancedCalendarApi();
