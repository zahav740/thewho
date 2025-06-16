/**
 * ДИАГНОСТИКА ДАННЫХ СМЕН ДЛЯ МОНИТОРИНГА ПРОИЗВОДСТВА
 * 
 * Инструкция для исправления проблемы "День: 0, Ночь: 0":
 * 
 * 1. Откройте DevTools в браузере (F12)
 * 2. Перейдите на вкладку Console
 * 3. Найдите логи для станка "Doosan 3" с операцией "C6HP0021A"
 * 4. Скопируйте результат и отправьте разработчику
 */

// ДОБАВЬТЕ ЭТИ СТРОКИ В НАЧАЛО operationProgress в MachineCard.tsx:

console.log(`🔧 ДИАГНОСТИКА ИСПРАВЛЕНИЯ СМЕН - ${machine.machineName}`);
console.log('1. Данные машины:', {
  id: machine.id,
  machineName: machine.machineName,
  currentOperationId: machine.currentOperationId,
  orderDrawingNumber: machine.currentOperationDetails?.orderDrawingNumber,
  isAvailable: machine.isAvailable
});

console.log('2. Все полученные смены:', todayShifts?.map(shift => ({
  id: shift.id,
  machineId: shift.machineId,
  operationId: shift.operationId,
  drawingNumber: shift.drawingNumber,
  orderDrawingNumber: shift.orderDrawingNumber,
  drawingnumber: shift.drawingnumber,
  dayShiftQuantity: shift.dayShiftQuantity,
  nightShiftQuantity: shift.nightShiftQuantity,
  date: shift.date
})));

// ПРОБЛЕМЫ И РЕШЕНИЯ:

/*
ПРОБЛЕМА 1: Нет данных смен (todayShifts пустой)
РЕШЕНИЕ: 
- Проверьте что backend запущен на порту 3001
- Проверьте что API /api/shifts возвращает данные
- Очистите кэш браузера

ПРОБЛЕМА 2: ID не совпадают (машина ID=3, а в сменах machineId другой)
РЕШЕНИЕ:
- Проверьте в БД: SELECT * FROM shift_records WHERE "machineId" = 3
- Убедитесь что данные синхронизированы

ПРОБЛЕМА 3: Номера чертежей не совпадают
РЕШЕНИЕ:
- Проверьте в БД: SELECT * FROM shift_records WHERE "drawingnumber" = 'C6HP0021A'
- Убедитесь что номер чертежа точно совпадает

ПРОБЛЕМА 4: Типы данных (строка vs число)
РЕШЕНИЕ:
- В алгоритме используйте parseInt() для приведения к числам
- Убедитесь что ID сравниваются как числа, а не строки

ПРОБЛЕМА 5: Кэширование старых данных
РЕШЕНИЕ:
- Очистите кэш React Query
- Перезагрузите страницу
- Измените ключ запроса
*/
