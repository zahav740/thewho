import * as XLSX from 'xlsx';

interface ExportOptions {
  period: 'current' | 'custom' | 'full';
  dateFrom?: Date;
  dateTo?: Date;
  includeMachines: string[];
  includeStatuses: string[];
  format: 'summary' | 'detailed';
}

interface CalendarOperation {
  id: string;
  drawingNumber: string;
  quantity: number;
  operationNumber: string;
  machine: string;
  startDate: Date;
  endDate: Date;
  planningResult: {
    status: string;
    [key: string]: any;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  operations: CalendarOperation[];
}

export const exportCalendarToExcel = (
  calendarData: CalendarDay[],
  options: ExportOptions
) => {
  // Фильтрация данных по периоду
  let filteredDays = calendarData;
  
  if (options.period === 'current') {
    // Текущий месяц/неделя уже отфильтрован
  } else if (options.period === 'custom' && options.dateFrom && options.dateTo) {
    filteredDays = calendarData.filter(day => 
      day.date >= options.dateFrom! && day.date <= options.dateTo!
    );
  }
  
  // Фильтрация операций
  const filteredOperations: Array<{ day: CalendarDay; operation: CalendarOperation }> = [];
  
  filteredDays.forEach(day => {
    day.operations.forEach(operation => {
      // Фильтр по станкам
      const machineMatch = options.includeMachines.length === 0 || 
                          options.includeMachines.includes(operation.machine);
      
      // Фильтр по статусам
      const statusMatch = options.includeStatuses.length === 0 || 
                         options.includeStatuses.includes(operation.planningResult.status);
      
      if (machineMatch && statusMatch) {
        filteredOperations.push({ day, operation });
      }
    });
  });

  const workbook = XLSX.utils.book_new();
  
  if (options.format === 'summary') {
    createSummarySheet(workbook, filteredOperations);
  } else {
    createDetailedSheet(workbook, filteredOperations);
  }
  
  // Создаем дополнительные листы
  createStatisticsSheet(workbook, filteredOperations);
  createMachineUtilizationSheet(workbook, filteredOperations);
  
  // Формируем название файла
  const periodText = options.period === 'custom'
    ? `Custom_${options.dateFrom?.toISOString().slice(0, 10)}_${options.dateTo?.toISOString().slice(0, 10)}`
    : 'Production_Calendar';
  
  const fileName = `Production_Calendar_${options.format}_${periodText}.xlsx`;
  
  // Сохраняем файл
  XLSX.writeFile(workbook, fileName);
};

const createSummarySheet = (
  workbook: XLSX.WorkBook, 
  operations: Array<{ day: CalendarDay; operation: CalendarOperation }>
) => {
  const summaryData: any[][] = [];
  
  // Заголовки
  summaryData.push([
    'Дата',
    'Номер чертежа',
    'Операция',
    'Количество',
    'Станок',
    'Статус',
    'Начало',
    'Окончание',
    'Длительность (часы)',
    'Примечания'
  ]);
  
  // Группируем по дням
  const groupedByDay = new Map<string, CalendarOperation[]>();
  operations.forEach(({ day, operation }) => {
    const dateKey = day.date.toISOString().slice(0, 10);
    if (!groupedByDay.has(dateKey)) {
      groupedByDay.set(dateKey, []);
    }
    groupedByDay.get(dateKey)!.push(operation);
  });
  
  // Сортируем по датам
  const sortedDates = Array.from(groupedByDay.keys()).sort();
  
  sortedDates.forEach(dateKey => {
    const dayOperations = groupedByDay.get(dateKey)!;
    dayOperations.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    dayOperations.forEach(operation => {
      const duration = (operation.endDate.getTime() - operation.startDate.getTime()) / (1000 * 60 * 60);
      const status = getStatusText(operation.planningResult.status);
      
      summaryData.push([
        new Date(dateKey).toLocaleDateString('ru-RU'),
        operation.drawingNumber,
        `№${operation.operationNumber}`,
        operation.quantity,
        operation.machine,
        status,
        operation.startDate.toLocaleString('ru-RU'),
        operation.endDate.toLocaleString('ru-RU'),
        Math.round(duration * 100) / 100,
        '' // Примечания
      ]);
    });
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Автоширина колонок
  const colWidths = [
    { wch: 12 }, // Дата
    { wch: 18 }, // Номер чертежа  
    { wch: 10 }, // Операция
    { wch: 12 }, // Количество
    { wch: 15 }, // Станок
    { wch: 15 }, // Статус
    { wch: 20 }, // Начало
    { wch: 20 }, // Окончание
    { wch: 15 }, // Длительность
    { wch: 25 }  // Примечания
  ];
  worksheet['!cols'] = colWidths;
  
  // Стили для заголовков
  addHeaderStyles(worksheet, summaryData[0].length);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Сводный отчет');
};

const createDetailedSheet = (
  workbook: XLSX.WorkBook, 
  operations: Array<{ day: CalendarDay; operation: CalendarOperation }>
) => {
  const detailedData: any[][] = [];
  
  // Заголовки
  detailedData.push([
    'Дата',
    'День недели',
    'Номер чертежа',
    'Операция',
    'Последовательность',
    'Количество',
    'Станок',
    'Статус',
    'Плановое начало',
    'Плановое окончание',
    'Фактическое начало',
    'Фактическое окончание',
    'Планируемая длительность (ч)',
    'Фактическая длительность (ч)',
    'Отклонение (ч)',
    'Эффективность (%)',
    'Приоритет',
    'Комментарии'
  ]);
  
  // Данные
  operations.forEach(({ day, operation }) => {
    const plannedDuration = (operation.endDate.getTime() - operation.startDate.getTime()) / (1000 * 60 * 60);
    const dayOfWeek = getDayOfWeekName(day.date.getDay());
    const status = getStatusText(operation.planningResult.status);
    
    // Предполагаем, что в planningResult есть дополнительная информация
    const actualStart = operation.planningResult.actualStartDate || '';
    const actualEnd = operation.planningResult.actualEndDate || '';
    const actualDuration = actualStart && actualEnd 
      ? (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / (1000 * 60 * 60)
      : 0;
    const deviation = actualDuration ? actualDuration - plannedDuration : 0;
    const efficiency = actualDuration ? Math.round((plannedDuration / actualDuration) * 100) : 0;
    
    detailedData.push([
      day.date.toLocaleDateString('ru-RU'),
      dayOfWeek,
      operation.drawingNumber,
      `№${operation.operationNumber}`,
      operation.planningResult.sequenceNumber || '',
      operation.quantity,
      operation.machine,
      status,
      operation.startDate.toLocaleString('ru-RU'),
      operation.endDate.toLocaleString('ru-RU'),
      actualStart ? new Date(actualStart).toLocaleString('ru-RU') : '',
      actualEnd ? new Date(actualEnd).toLocaleString('ru-RU') : '',
      Math.round(plannedDuration * 100) / 100,
      actualDuration ? Math.round(actualDuration * 100) / 100 : '',
      deviation ? Math.round(deviation * 100) / 100 : '',
      efficiency || '',
      operation.planningResult.priority || '',
      operation.planningResult.comments || ''
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(detailedData);
  
  // Автоширина колонок
  const colWidths = [
    { wch: 12 }, // Дата
    { wch: 12 }, // День недели
    { wch: 18 }, // Номер чертежа
    { wch: 10 }, // Операция
    { wch: 12 }, // Последовательность
    { wch: 12 }, // Количество
    { wch: 15 }, // Станок
    { wch: 15 }, // Статус
    { wch: 20 }, // Плановое начало
    { wch: 20 }, // Плановое окончание
    { wch: 20 }, // Фактическое начало
    { wch: 20 }, // Фактическое окончание
    { wch: 15 }, // Плановая длительность
    { wch: 15 }, // Фактическая длительность
    { wch: 12 }, // Отклонение
    { wch: 12 }, // Эффективность
    { wch: 10 }, // Приоритет
    { wch: 30 }  // Комментарии
  ];
  worksheet['!cols'] = colWidths;
  
  // Стили для заголовков
  addHeaderStyles(worksheet, detailedData[0].length);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Детальный отчет');
};

const createStatisticsSheet = (
  workbook: XLSX.WorkBook, 
  operations: Array<{ day: CalendarDay; operation: CalendarOperation }>
) => {
  const statsData: any[][] = [];
  
  // Заголовок
  statsData.push(['СТАТИСТИКА ПО ОПЕРАЦИЯМ']);
  statsData.push([]);
  
  // Общая статистика
  const totalOperations = operations.length;
  const statusCounts = new Map<string, number>();
  const machineCounts = new Map<string, number>();
  const drawingCounts = new Map<string, number>();
  
  operations.forEach(({ operation }) => {
    // По статусам
    const status = operation.planningResult.status;
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    
    // По станкам
    machineCounts.set(operation.machine, (machineCounts.get(operation.machine) || 0) + 1);
    
    // По чертежам
    drawingCounts.set(operation.drawingNumber, (drawingCounts.get(operation.drawingNumber) || 0) + 1);
  });
  
  // Общие показатели
  statsData.push(['Общее количество операций:', totalOperations]);
  statsData.push(['Уникальных чертежей:', drawingCounts.size]);
  statsData.push(['Задействованных станков:', machineCounts.size]);
  statsData.push([]);
  
  // Статистика по статусам
  statsData.push(['РАСПРЕДЕЛЕНИЕ ПО СТАТУСАМ']);
  statsData.push(['Статус', 'Количество', 'Процент']);
  Array.from(statusCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .forEach(([status, count]) => {
      const percentage = Math.round((count / totalOperations) * 100);
      statsData.push([getStatusText(status), count, `${percentage}%`]);
    });
  
  statsData.push([]);
  
  // Статистика по станкам
  statsData.push(['ЗАГРУЗКА СТАНКОВ']);
  statsData.push(['Станок', 'Количество операций', 'Процент загрузки']);
  Array.from(machineCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .forEach(([machine, count]) => {
      const percentage = Math.round((count / totalOperations) * 100);
      statsData.push([machine, count, `${percentage}%`]);
    });
  
  statsData.push([]);
  
  // ТОП чертежей
  statsData.push(['ТОП 10 ЧЕРТЕЖЕЙ ПО КОЛИЧЕСТВУ ОПЕРАЦИЙ']);
  statsData.push(['Номер чертежа', 'Количество операций']);
  Array.from(drawingCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([drawing, count]) => {
      statsData.push([drawing, count]);
    });
  
  const worksheet = XLSX.utils.aoa_to_sheet(statsData);
  
  // Автоширина колонок
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 }
  ];
  
  // Стили для заголовков разделов
  const titleCells = ['A1', 'A7', 'A16', 'A26'];
  titleCells.forEach(cell => {
    if (worksheet[cell]) {
      worksheet[cell].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } }
      };
    }
  });
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика');
};

const createMachineUtilizationSheet = (
  workbook: XLSX.WorkBook, 
  operations: Array<{ day: CalendarDay; operation: CalendarOperation }>
) => {
  const utilizationData: any[][] = [];
  
  // Заголовки
  utilizationData.push([
    'Станок',
    'Общее время работы (ч)',
    'Количество операций',
    'Средняя длительность операции (ч)',
    'Статус загрузки'
  ]);
  
  // Группировка по станкам
  const machineStats = new Map<string, {
    totalTime: number;
    operationCount: number;
    operations: CalendarOperation[];
  }>();
  
  operations.forEach(({ operation }) => {
    const machine = operation.machine;
    const duration = (operation.endDate.getTime() - operation.startDate.getTime()) / (1000 * 60 * 60);
    
    if (!machineStats.has(machine)) {
      machineStats.set(machine, {
        totalTime: 0,
        operationCount: 0,
        operations: []
      });
    }
    
    const stats = machineStats.get(machine)!;
    stats.totalTime += duration;
    stats.operationCount += 1;
    stats.operations.push(operation);
  });
  
  // Формируем данные
  Array.from(machineStats.entries())
    .sort(([,a], [,b]) => b.totalTime - a.totalTime)
    .forEach(([machine, stats]) => {
      const avgDuration = stats.totalTime / stats.operationCount;
      const utilizationStatus = getUtilizationStatus(stats.totalTime);
      
      utilizationData.push([
        machine,
        Math.round(stats.totalTime * 100) / 100,
        stats.operationCount,
        Math.round(avgDuration * 100) / 100,
        utilizationStatus
      ]);
    });
  
  const worksheet = XLSX.utils.aoa_to_sheet(utilizationData);
  
  // Автоширина колонок
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 }
  ];
  
  // Стили для заголовков
  addHeaderStyles(worksheet, utilizationData[0].length);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Загрузка станков');
};

// Вспомогательные функции
const addHeaderStyles = (worksheet: XLSX.WorkSheet, columnCount: number) => {
  for (let col = 0; col < columnCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Завершено';
    case 'in-progress': return 'В работе';
    case 'rescheduled': return 'Перенесено';
    case 'planned': return 'Запланировано';
    default: return status;
  }
};

const getDayOfWeekName = (dayIndex: number): string => {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[dayIndex];
};



const getUtilizationStatus = (totalHours: number): string => {
  if (totalHours >= 40) return 'Высокая загрузка';
  if (totalHours >= 20) return 'Средняя загрузка';
  if (totalHours >= 8) return 'Низкая загрузка';
  return 'Очень низкая загрузка';
};