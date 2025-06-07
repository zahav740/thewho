// ИСПРАВЛЕННАЯ ЛОГИКА: Объединяем данные станков с активными операциями и производством ПО ТЕКУЩЕЙ ОПЕРАЦИИ
  const activeMachines: ActiveMachine[] = React.useMemo(() => {
    if (!machines) return [];

    return machines.map(machine => {
      // Находим назначенную операцию для станка
      const assignedOperation = activeOperations?.find(
        (op: any) => op.machineId === parseInt(machine.id)
      );

      // ИСПРАВЛЕНО: Фильтруем смены только по ТЕКУЩЕЙ операции
      const operationShifts = machine.currentOperationDetails 
        ? getOperationShifts(machine.id, machine.currentOperationDetails, todayShifts || [])
        : [];

      console.log(`🔍 Станок ${machine.machineName}:`, {
        currentOperation: machine.currentOperationDetails?.orderDrawingNumber,
        totalShifts: todayShifts?.filter((s: any) => s.machineId === parseInt(machine.id)).length || 0,
        operationShifts: operationShifts.length,
        operationShiftsData: operationShifts
      });

      // Вычисляем производство только по ТЕКУЩЕЙ операции
      const currentOperationProduction = operationShifts.reduce((acc: any, shift: any) => {
        const dayQuantity = shift.dayShiftQuantity || 0;
        const nightQuantity = shift.nightShiftQuantity || 0;
        const dayTime = dayQuantity * (shift.dayShiftTimePerUnit || 0);
        const nightTime = nightQuantity * (shift.nightShiftTimePerUnit || 0);

        return {
          dayShift: {
            quantity: acc.dayShift.quantity + dayQuantity,
            operator: shift.dayShiftOperator || acc.dayShift.operator,
            efficiency: 0 // Будем вычислять ниже
          },
          nightShift: {
            quantity: acc.nightShift.quantity + nightQuantity,
            operator: shift.nightShiftOperator || acc.nightShift.operator,
            efficiency: 0 // Будем вычислять ниже
          },
          totalTime: acc.totalTime + dayTime + nightTime,
          operatorStats: [] // Будем заполнять ниже
        };
      }, {
        dayShift: { quantity: 0, operator: '-', efficiency: 0 },
        nightShift: { quantity: 0, operator: 'Аркадий', efficiency: 0 },
        totalTime: 0,
        operatorStats: []
      });

      // Вычисляем статистику операторов для текущей операции
      if (operationShifts.length > 0 && assignedOperation) {
        const uniqueOperators = new Set<string>();
        operationShifts.forEach((shift: any) => {
          if (shift.dayShiftOperator) uniqueOperators.add(shift.dayShiftOperator);
          if (shift.nightShiftOperator) uniqueOperators.add(shift.nightShiftOperator);
        });

        currentOperationProduction.operatorStats = Array.from(uniqueOperators)
          .map(operator => calculateOperatorEfficiency(operator, operationShifts, assignedOperation))
          .filter(stat => stat.productivity.partsPerHour > 0);

        // Обновляем эффективность смен
        const dayOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.dayShift.operator
        );
        const nightOperatorStats = currentOperationProduction.operatorStats.find(
          (s: OperatorEfficiency) => s.operatorName === currentOperationProduction.nightShift.operator
        );

        currentOperationProduction.dayShift.efficiency = dayOperatorStats?.utilization.efficiency || 0;
        currentOperationProduction.nightShift.efficiency = nightOperatorStats?.utilization.efficiency || 0;
      }

      // Создаем объект активного станка
      const machineData: ActiveMachine = {
        id: machine.id,
        machineName: machine.machineName,
        machineType: machine.machineType,
        isAvailable: machine.isAvailable,
        currentOperationId: machine.currentOperationId,
        lastFreedAt: machine.lastFreedAt ? 
          (typeof machine.lastFreedAt === 'string' ? 
            new Date(machine.lastFreedAt) : 
            machine.lastFreedAt) : 
          undefined,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
        status: assignedOperation ? 
          (!machine.isAvailable ? 'working' : 'setup') : 
          'idle',
        currentOperationProduction,
      };

      // Если есть детали операции из API, добавляем их с прогрессом
      if (machine.currentOperationDetails) {
        const totalProduced = operationShifts.reduce((sum: number, shift: any) => 
          sum + (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0), 0
        );

        machineData.currentOperationDetails = {
          ...machine.currentOperationDetails,
          progress: calculateProgress(assignedOperation, operationShifts),
          totalProduced,
          targetQuantity: (assignedOperation as any)?.orderId ? 100 : 100 // ИСПРАВЛЕНО: убрана ссылка на order.quantity
        };
      }

      return machineData;
    });
  }, [machines, activeOperations, todayShifts, calculateProgress, getOperationShifts, calculateOperatorEfficiency]);