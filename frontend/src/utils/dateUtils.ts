/**
 * @file: dateUtils.ts
 * @description: Утилиты для работы с датами
 * @created: 2025-06-30
 */

export const format = (date: Date, formatString: string, options?: { locale?: any }): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Простая реализация для основных форматов
  if (formatString === 'dd.MM.yyyy HH:mm') {
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
  
  if (formatString === 'dd.MM.yyyy') {
    return `${day}.${month}.${year}`;
  }
  
  // Fallback на стандартное форматирование
  return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Заглушка для совместимости
export const ru = {};
