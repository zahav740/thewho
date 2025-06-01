/**
 * @file: working-days.service.ts
 * @description: Сервис для работы с рабочими днями
 * @dependencies: -
 * @created: 2025-01-28
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkingDaysService {
  /**
   * Проверяет, является ли день рабочим
   * Рабочие дни: Воскресенье (0), Понедельник (1), Вторник (2), Среда (3), Четверг (4)
   * Выходные: Пятница (5), Суббота (6)
   */
  isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 5 && dayOfWeek !== 6; // Не пятница и не суббота
  }

  /**
   * Получает следующий рабочий день
   */
  getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date);
    do {
      nextDay.setDate(nextDay.getDate() + 1);
    } while (!this.isWorkingDay(nextDay));
    return nextDay;
  }

  /**
   * Получает предыдущий рабочий день
   */
  getPreviousWorkingDay(date: Date): Date {
    const prevDay = new Date(date);
    do {
      prevDay.setDate(prevDay.getDate() - 1);
    } while (!this.isWorkingDay(prevDay));
    return prevDay;
  }

  /**
   * Подсчитывает количество рабочих дней между двумя датами
   */
  countWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isWorkingDay(currentDate)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  /**
   * Добавляет рабочие дни к дате
   */
  addWorkingDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (this.isWorkingDay(result)) {
        addedDays++;
      }
    }
    
    return result;
  }

  /**
   * Получает список рабочих дней в заданном периоде
   */
  getWorkingDaysInPeriod(startDate: Date, endDate: Date): Date[] {
    const workingDays: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isWorkingDay(currentDate)) {
        workingDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  }

  /**
   * Рассчитывает количество рабочих часов для операций
   * Учитывает 2 смены по 8 часов (480 минут) каждая
   */
  calculateWorkingHours(totalMinutes: number): {
    days: number;
    hours: number;
    minutes: number;
  } {
    const minutesPerDay = 480 * 2; // 2 смены по 480 минут
    const days = Math.floor(totalMinutes / minutesPerDay);
    const remainingMinutes = totalMinutes % minutesPerDay;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    return { days, hours, minutes };
  }

  /**
   * Проверяет, является ли дата праздником
   * В будущем можно расширить для учета государственных праздников
   */
  isHoliday(date: Date): boolean {
    // Пока только проверка на выходные
    return !this.isWorkingDay(date);
  }
}
