// Проверяет, является ли день рабочим (воскресенье-четверг)
export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  // В израильском календаре выходные - пятница (5) и суббота (6)
  return day !== 5 && day !== 6;
};

// Получает следующий рабочий день
export const getNextWorkingDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

// Корректирует время к рабочим часам
export const adjustToWorkingTime = (date: Date, forNightShift = false): Date => {
  // Проверяем, является ли день рабочим
  if (!isWorkingDay(date)) {
    const nextWorkingDay = getNextWorkingDay(date);
    
    if (forNightShift) {
      nextWorkingDay.setHours(16, 0, 0, 0); // Начало ночной смены - 16:00
    } else {
      nextWorkingDay.setHours(8, 0, 0, 0); // Начало дневной смены - 8:00
    }
    
    return nextWorkingDay;
  }
  
  // Проверяем текущее время
  const hour = date.getHours();
  const result = new Date(date);
  
  if (forNightShift) {
    // Для ночной смены (16:00 - 8:00 следующего дня)
    if (hour < 16) {
      result.setHours(16, 0, 0, 0);
    }
  } else {
    // Для дневной смены (8:00 - 16:00)
    if (hour < 8) {
      result.setHours(8, 0, 0, 0);
    } else if (hour >= 16) {
      // Переходим к следующему дню
      const nextWorkingDay = getNextWorkingDay(date);
      nextWorkingDay.setHours(8, 0, 0, 0);
      return nextWorkingDay;
    }
  }
  
  return result;
};

// Рассчитывает дату окончания с учетом рабочего времени
export const calculateEndDate = (startDate: Date, totalMinutes: number): Date => {
  let currentDate = new Date(startDate);
  let remainingMinutes = totalMinutes;
  
  // Определяем, начинается ли операция в ночную смену
  const isNightTimeStart = currentDate.getHours() >= 16 || currentDate.getHours() < 8;
  
  while (remainingMinutes > 0) {
    // Проверяем, является ли день рабочим
    if (!isWorkingDay(currentDate)) {
      // Переходим к следующему рабочему дню
      currentDate = getNextWorkingDay(currentDate);
      
      // Если начали ночью, продолжаем с ночи, иначе с утра
      if (isNightTimeStart) {
        currentDate.setHours(16, 0, 0, 0);
      } else {
        currentDate.setHours(8, 0, 0, 0);
      }
      
      continue;
    }
    
    // Текущий час и минута
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    
    // Определяем доступное время в текущем дне
    let availableMinutes;
    
    if (isNightTimeStart) {
      // Ночная смена
      if (currentHour >= 16) {
        // От текущего времени до 0:00
        availableMinutes = (24 - currentHour) * 60 - currentMinute;
      } else if (currentHour < 8) {
        // От текущего времени до 8:00
        availableMinutes = (8 - currentHour) * 60 - currentMinute;
      } else {
        // Ожидаем начала ночной смены
        currentDate.setHours(16, 0, 0, 0);
        continue;
      }
    } else {
      // Дневная смена
      if (currentHour >= 8 && currentHour < 16) {
        // От текущего времени до 16:00
        availableMinutes = (16 - currentHour) * 60 - currentMinute;
      } else {
        // Ожидаем начала дневной смены
        if (currentHour >= 16) {
          // Переход к следующему дню
          currentDate = getNextWorkingDay(currentDate);
        }
        currentDate.setHours(8, 0, 0, 0);
        continue;
      }
    }
    
    // Используем доступное время
    if (remainingMinutes <= availableMinutes) {
      // Все оставшееся время помещается в текущий отрезок
      const totalMinutesFromStart = currentHour * 60 + currentMinute + remainingMinutes;
      const newHour = Math.floor(totalMinutesFromStart / 60);
      const newMinute = totalMinutesFromStart % 60;
      
      currentDate.setHours(newHour, newMinute, 0, 0);
      remainingMinutes = 0;
    } else {
      // Используем весь доступный отрезок и переходим к следующему
      remainingMinutes -= availableMinutes;
      
      if (isNightTimeStart) {
        if (currentHour >= 16) {
          // Продолжаем ночную смену в следующий день
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
        } else {
          // Закончили утреннюю часть ночной смены
          currentDate.setHours(8, 0, 0, 0);
          
          // Если следующая часть в тот же день, ожидаем вечера
          if (remainingMinutes > 0) {
            currentDate.setHours(16, 0, 0, 0);
          }
        }
      } else {
        // Закончили дневную смену, переходим к следующему дню
        currentDate = getNextWorkingDay(currentDate);
        currentDate.setHours(8, 0, 0, 0);
      }
    }
  }
  
  return currentDate;
};

// Находит доступный временной слот для операции
export const findAvailableTimeSlot = async (
  machineName: string, 
  earliestStart: Date, 
  estimatedDuration: number, 
  machineSchedule: { [key: string]: any[] }
): Promise<{ machine: string; availableStartTime: Date } | null> => {
  // Получаем расписание станка
  const schedule = machineSchedule[machineName] || [];
  
  // Разделение расписания на дневное и ночное
  const daySchedule = schedule.filter(slot => 
    slot.start.getHours() >= 8 && slot.start.getHours() < 16
  );
  
  const nightSchedule = schedule.filter(slot => 
    slot.start.getHours() < 8 || slot.start.getHours() >= 16
  );
  
  // Начинаем поиск с запрошенного времени
  let candidateStart = new Date(earliestStart);
  
  // Убеждаемся, что начинаем в рабочее время
  candidateStart = adjustToWorkingTime(candidateStart);
  
  // Защита от бесконечного цикла
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const candidateEnd = calculateEndDate(candidateStart, estimatedDuration);
    const candidateDate = candidateStart.toDateString();
    
    // Проверяем, в какую смену попадает время начала
    const isNightTimeStart = candidateStart.getHours() >= 16 || candidateStart.getHours() < 8;
    
    // Фильтруем операции на станке в текущий день
    const operationsInDay = schedule.filter(slot => 
      slot.start.toDateString() === candidateDate
    );
    
    // ОГРАНИЧЕНИЕ 1: Максимум 2 операции на станок в день
    if (operationsInDay.length >= 2) {
      candidateStart = getNextWorkingDay(candidateStart);
      candidateStart.setHours(8, 0, 0, 0);
      continue;
    }
    
    // Проверка конфликтов с существующими операциями в соответствующей смене
    const conflictingSchedule = isNightTimeStart ? nightSchedule : daySchedule;
    
    const hasConflict = conflictingSchedule.some(slot => 
      (candidateStart >= slot.start && candidateStart < slot.end) ||
      (candidateEnd > slot.start && candidateEnd <= slot.end) ||
      (candidateStart <= slot.start && candidateEnd >= slot.end)
    );
    
    if (!hasConflict) {
      return {
        machine: machineName,
        availableStartTime: candidateStart
      };
    }
    
    // Найти следующий свободный слот
    const conflictingSlots = conflictingSchedule.filter(slot => 
      (candidateStart >= slot.start && candidateStart < slot.end) ||
      (candidateEnd > slot.start && candidateEnd <= slot.end) ||
      (candidateStart <= slot.start && candidateEnd >= slot.end)
    );
    
    if (conflictingSlots.length > 0) {
      // Берем конец самого позднего конфликтующего слота
      const latestEnd = conflictingSlots.reduce((latest, slot) => 
        slot.end > latest ? slot.end : latest, conflictingSlots[0].end
      );
      candidateStart = new Date(latestEnd);
      candidateStart = adjustToWorkingTime(candidateStart);
    } else {
      // Переходим к следующей смене
      if (isNightTimeStart) {
        // Из ночной в дневную (следующий день)
        candidateStart = getNextWorkingDay(candidateStart);
        candidateStart.setHours(8, 0, 0, 0);
      } else {
        // Из дневной в ночную (тот же день)
        candidateStart = new Date(candidateStart);
        candidateStart.setHours(16, 0, 0, 0);
      }
    }
  }
  
  // Если не нашли слот, возвращаем null
  return null;
};
