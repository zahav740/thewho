// ПАТЧ ДЛЯ ИСПРАВЛЕНИЯ АЛГОРИТМА СОПОСТАВЛЕНИЯ СМЕН
// Замените блок operationProgress в MachineCard.tsx на этот код:

const operationProgress = React.useMemo(() => {
  console.log(`🔧 === ИСПРАВЛЕННАЯ ДИАГНОСТИКА СМЕН ДЛЯ ${machine.machineName} ===`);
  
  // Проверяем наличие основных данных
  if (!machine.currentOperationDetails || !todayShifts) {
    console.log(`❌ Недостаточно данных для анализа`);
    return null;
  }

  // Нормализуем ID для корректного сравнения
  const currentMachineId = parseInt(String(machine.id || '0'));
  const currentOperationId = parseInt(String(machine.currentOperationId || '0'));
  const operationDrawing = String(machine.currentOperationDetails?.orderDrawingNumber || '').trim();

  console.log(`📋 Ищем смены для:`);
  console.log(`   Станок ID: ${currentMachineId}`);
  console.log(`   Операция ID: ${currentOperationId}`);
  console.log(`   Чертеж: "${operationDrawing}"`);
  console.log(`   Всего смен получено: ${todayShifts.length}`);

  // ИСПРАВЛЕННЫЙ АЛГОРИТМ: Проверяем все варианты сопоставления
  const matchedShifts = todayShifts.filter((shift: any) => {
    // Нормализуем данные смены
    const shiftMachineId = parseInt(String(shift.machineId || '0'));
    const shiftOperationId = parseInt(String(shift.operationId || '0'));
    const shiftDrawing1 = String(shift.drawingNumber || '').trim();
    const shiftDrawing2 = String(shift.orderDrawingNumber || '').trim();
    const shiftDrawing3 = String(shift.drawingnumber || '').trim();

    // Проверяем различные варианты совпадения
    const machineMatch = shiftMachineId === currentMachineId;
    const operationMatch = shiftOperationId === currentOperationId && shiftOperationId > 0;
    const drawingMatch = shiftDrawing1 === operationDrawing || 
                        shiftDrawing2 === operationDrawing || 
                        shiftDrawing3 === operationDrawing;

    // Логика приоритетов:
    // 1. Точное совпадение по operationId (наивысший приоритет)
    // 2. Совпадение по станку + чертежу
    // 3. Только по станку (если другие варианты не сработали)
    const isMatch = operationMatch || (machineMatch && drawingMatch) || 
                   (machineMatch && !operationDrawing); // Для случаев без чертежа

    console.log(`  📝 Смена ${shift.id}:`);
    console.log(`     machineId: ${shiftMachineId} === ${currentMachineId} → ${machineMatch}`);
    console.log(`     operationId: ${shiftOperationId} === ${currentOperationId} → ${operationMatch}`);
    console.log(`     drawings: "${shiftDrawing1}"|"${shiftDrawing2}"|"${shiftDrawing3}" === "${operationDrawing}" → ${drawingMatch}`);
    console.log(`     РЕЗУЛЬТАТ: ${isMatch}`);
    console.log(`     Данные: День=${shift.dayShiftQuantity}, Ночь=${shift.nightShiftQuantity}`);

    return isMatch;
  });

  console.log(`✅ Найдено подходящих смен: ${matchedShifts.length}`);

  if (matchedShifts.length === 0) {
    console.log(`❌ СОВПАДЕНИЙ НЕ НАЙДЕНО!`);
    console.log(`🔧 Проверьте:`);
    console.log(`   - В БД есть записи shift_records для operationId=${currentOperationId}`);
    console.log(`   - machineId в сменах = ${currentMachineId}`);
    console.log(`   - Номер чертежа точно совпадает с "${operationDrawing}"`);
    return null;
  }

  // Вычисляем итоги
  const dayShiftQuantity = matchedShifts.reduce((sum, shift) => sum + (shift.dayShiftQuantity || 0), 0);
  const nightShiftQuantity = matchedShifts.reduce((sum, shift) => sum + (shift.nightShiftQuantity || 0), 0);
  const totalProduced = dayShiftQuantity + nightShiftQuantity;

  const result = {
    completedParts: totalProduced,
    totalParts: 30,
    percentage: Math.round(Math.min((totalProduced / 30) * 100, 100)),
    isCompleted: totalProduced >= 30,
    dayShiftQuantity,
    nightShiftQuantity,
    dayShiftOperator: matchedShifts.find(s => s.dayShiftOperator)?.dayShiftOperator || '-',
    nightShiftOperator: matchedShifts.find(s => s.nightShiftOperator)?.nightShiftOperator || 'Аркадий',
    startedAt: matchedShifts[0]?.date ? new Date(matchedShifts[0].date) : null,
  };

  console.log(`🎉 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:`, result);
  console.log(`🔧 === КОНЕЦ ДИАГНОСТИКИ ===`);

  return result;
}, [machine.currentOperationDetails, machine.id, machine.currentOperationId, todayShifts]);
