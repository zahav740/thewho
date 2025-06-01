/**
 * @file: calendarApi.ts
 * @description: API для работы с производственным календарем
 * @dependencies: api
 * @created: 2025-01-28
 */
import api from './api';

interface CalendarView {
  startDate: Date;
  endDate: Date;
  totalWorkingDays: number;
  machineSchedules: Array<{
    machineId: number;
    machineCode: string;
    machineType: string;
    days: Array<{
      date: Date;
      isWorkingDay: boolean;
      shifts: Array<{
        shiftType: string;
        operationId: number;
        orderDrawingNumber: string;
        quantity: number;
        operator: string;
      }>;
      currentOperation?: {
        operationId: number;
        orderDrawingNumber: string;
        operationNumber: number;
        estimatedTime: number;
      };
    }>;
  }>;
}

interface MachineUtilization {
  machineId: number;
  machineCode: string;
  totalCapacityMinutes: number;
  usedMinutes: number;
  utilizationPercent: number;
}

interface UpcomingDeadline {
  orderId: number;
  drawingNumber: string;
  deadline: Date;
  daysUntilDeadline: number;
  completedOperations: number;
  totalOperations: number;
  isAtRisk: boolean;
}

export const calendarApi = {
  // Получить календарное представление
  getCalendarView: async (startDate: string, endDate: string): Promise<CalendarView> => {
    const response = await api.get('/calendar', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Получить рабочие дни
  getWorkingDays: async (startDate: string, endDate: string) => {
    const response = await api.get('/calendar/working-days', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Запланировать операцию
  scheduleOperation: async (operationId: number, startDate?: string) => {
    const response = await api.post('/calendar/schedule-operation', {
      operationId,
      startDate,
    });
    return response.data;
  },

  // Получить загруженность станков
  getMachineUtilization: async (
    startDate: string,
    endDate: string
  ): Promise<MachineUtilization[]> => {
    const response = await api.get('/calendar/machine-utilization', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Получить предстоящие дедлайны
  getUpcomingDeadlines: async (days: number = 7): Promise<UpcomingDeadline[]> => {
    const response = await api.get('/calendar/upcoming-deadlines', {
      params: { days },
    });
    return response.data;
  },

  // Проверить, является ли день рабочим
  isWorkingDay: async (date: string): Promise<boolean> => {
    const response = await api.get(`/calendar/is-working-day/${date}`);
    return response.data.isWorkingDay;
  },

  // Получить следующий рабочий день
  getNextWorkingDay: async (date: string): Promise<Date> => {
    const response = await api.get(`/calendar/next-working-day/${date}`);
    return response.data.nextWorkingDay;
  },

  // Рассчитать продолжительность в рабочих днях
  calculateDuration: async (minutes: number) => {
    const response = await api.get(`/calendar/calculate-duration/${minutes}`);
    return response.data;
  },
};
