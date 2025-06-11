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
      // Используем основной calendar API, который работает с БД
      const response = await api.get('/calendar', {
        params: { startDate, endDate },
      });
      
      // Проверяем структуру ответа
      if (response.data.period && response.data.machineSchedules) {
        return response.data;
      }
      
      // Если структура не матчит, преобразуем данные
      return {
        period: response.data.period || { startDate, endDate },
        totalWorkingDays: response.data.totalWorkingDays || 10,
        machineSchedules: response.data.machineSchedules || []
      };
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

  /**
   * Генерация моковых данных для демонстрации
   */
  private getMockCalendarData(startDate: string, endDate: string): EnhancedCalendarData {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    
    // Генерируем список дней
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    // Моковые станки
    const machines = [
      { id: 1, name: 'Doosan 3', type: 'MILLING' },
      { id: 2, name: 'Haas ST-10Y', type: 'TURNING' },
      { id: 3, name: 'Mitsubishi', type: 'MILLING' },
      { id: 4, name: 'DMG Mori', type: 'TURNING' },
    ];

    const machineSchedules: MachineSchedule[] = machines.map(machine => ({
      machineId: machine.id,
      machineName: machine.name,
      machineType: machine.type,
      days: days.map(date => {
        const dateObj = new Date(date);
        const isWorkingDay = this.isWorkingDay(dateObj);
        const isPast = dateObj < new Date();
        const dayType = isWorkingDay ? 'WORKING' : 'WEEKEND';
        
        const calendarDay: CalendarDay = {
          date,
          isWorkingDay,
          dayType
        };

        // Добавляем моковые данные для некоторых дней
        if (isWorkingDay && Math.random() > 0.3) {
          if (isPast) {
            // Для прошедших дней - выполненные смены
            calendarDay.completedShifts = [];
            
            if (Math.random() > 0.4) {
              calendarDay.completedShifts.push({
                shiftType: 'DAY',
                operatorName: ['Кирилл', 'Аркадий', 'Denis'][Math.floor(Math.random() * 3)],
                drawingNumber: ['C6HP0021A', 'TH1K4108A', 'G63828A'][Math.floor(Math.random() * 3)],
                operationNumber: Math.floor(Math.random() * 3) + 1,
                quantityProduced: Math.floor(Math.random() * 20) + 5,
                timePerPart: Math.floor(Math.random() * 10) + 15,
                setupTime: Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 60 : undefined,
                totalTime: Math.floor(Math.random() * 200) + 300,
                efficiency: Math.floor(Math.random() * 40) + 60,
              });
            }
            
            if (Math.random() > 0.6) {
              calendarDay.completedShifts.push({
                shiftType: 'NIGHT',
                operatorName: ['Кирилл', 'Аркадий', 'Denis'][Math.floor(Math.random() * 3)],
                drawingNumber: ['C6HP0021A', 'TH1K4108A', 'G63828A'][Math.floor(Math.random() * 3)],
                operationNumber: Math.floor(Math.random() * 3) + 1,
                quantityProduced: Math.floor(Math.random() * 15) + 3,
                timePerPart: Math.floor(Math.random() * 8) + 18,
                totalTime: Math.floor(Math.random() * 150) + 200,
                efficiency: Math.floor(Math.random() * 35) + 65,
              });
            }
          } else {
            // Для будущих дней - запланированные операции
            if (Math.random() > 0.6) {
              calendarDay.plannedOperation = {
                operationId: Math.floor(Math.random() * 100) + 1,
                drawingNumber: ['C6HP0021A', 'TH1K4108A', 'G63828A'][Math.floor(Math.random() * 3)],
                operationNumber: Math.floor(Math.random() * 3) + 1,
                estimatedTimePerPart: Math.floor(Math.random() * 10) + 15,
                totalQuantity: Math.floor(Math.random() * 50) + 20,
                estimatedDurationDays: Math.floor(Math.random() * 5) + 1,
                startDate: date,
                endDate: new Date(new Date(date).getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                currentProgress: Math.random() > 0.7 ? {
                  completedQuantity: Math.floor(Math.random() * 15),
                  remainingQuantity: Math.floor(Math.random() * 35) + 10,
                  progressPercent: Math.floor(Math.random() * 60) + 10,
                } : undefined
              };
            }
          }
        }

        return calendarDay;
      })
    }));

    const workingDaysCount = days.filter(date => this.isWorkingDay(new Date(date))).length;

    return {
      period: { startDate, endDate },
      totalWorkingDays: workingDaysCount,
      machineSchedules
    };
  }
}

export const enhancedCalendarApi = new EnhancedCalendarApi();
