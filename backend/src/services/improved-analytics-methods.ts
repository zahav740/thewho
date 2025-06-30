  // Обновленный метод расчета с вашей логикой
  private calculateOperationAnalyticsImproved(operation: Operation, order: Order, shifts: ShiftRecord[]) {
    let totalProduced = 0;
    let totalSetupTime = 0;
    let totalDownTime = 0;
    let totalShiftTime = 0;
    let totalDefects = 0;

    const operatorStats = new Map();

    shifts.forEach(shift => {
      const dayQuantity = shift.dayShiftQuantity || 0;
      const nightQuantity = shift.nightShiftQuantity || 0;
      const shiftProduced = dayQuantity + nightQuantity;
      
      totalProduced += shiftProduced;
      totalSetupTime += shift.setupTime || 0;
      // В ваших данных нет простоев, но можно добавить поле downTime
      // totalDownTime += shift.downTime || 0;
      
      // Считаем время смены (обычно 480 мин = 8 часов)
      const shiftDuration = 480; // или получать из настроек
      totalShiftTime += shiftDuration;

      // Обновляем статистику операторов
      if (dayQuantity > 0) {
        this.updateOperatorStatsImproved(operatorStats, shift.dayShiftOperator, {
          shiftDuration,
          setupTime: shift.setupTime || 0,
          downTime: 0, // пока нет данных о простоях
          actualProduced: dayQuantity,
          defectParts: 0, // пока нет данных о браке
          plannedTimePerUnit: operation.estimatedTime || 30 // из операции или настроек
        });
      }
      
      if (nightQuantity > 0) {
        this.updateOperatorStatsImproved(operatorStats, shift.nightShiftOperator, {
          shiftDuration,
          setupTime: shift.setupTime || 0,
          downTime: 0,
          actualProduced: nightQuantity,
          defectParts: 0,
          plannedTimePerUnit: operation.estimatedTime || 30
        });
      }
    });

    // Общие расчеты по вашей логике
    const avgShiftDuration = totalShiftTime / shifts.length || 480;
    const avgSetupTime = totalSetupTime / shifts.length || 0;
    const availableTime = avgShiftDuration - avgSetupTime - totalDownTime;
    
    // Плановое время на деталь (из операции или настроек)
    const plannedTimePerUnit = operation.estimatedTime || 30;
    const plannedQuantity = Math.floor(availableTime / plannedTimePerUnit);
    
    // Производительность по вашей формуле
    const performance = plannedQuantity > 0 ? (totalProduced / plannedQuantity) * 100 : 0;
    
    // Качество (пока нет данных о браке)
    const quality = 100; // предполагаем, что брака нет
    
    // Доступность (наладка считается плановой)
    const availability = avgShiftDuration > 0 ? 
      ((avgShiftDuration - totalDownTime) / avgShiftDuration) * 100 : 100;
    
    // OEE
    const oee = (availability * performance * quality) / 10000;
    
    // Доля наладки
    const setupRatio = avgShiftDuration > 0 ? (avgSetupTime / avgShiftDuration) * 100 : 0;
    
    // KPI
    const kpi = oee * 0.5 + (100 - setupRatio) * 0.2 + quality * 0.15 + 90 * 0.15;

    // Прогресс выполнения заказа
    const progressPercent = order.quantity > 0 ? (totalProduced / order.quantity) * 100 : 0;
    const remaining = Math.max(0, order.quantity - totalProduced);

    return {
      // Ваши метрики
      efficiency: {
        oee: Math.round(oee * 10) / 10,
        kpi: Math.round(kpi * 10) / 10,
        availability: Math.round(availability * 10) / 10,
        performance: Math.round(performance * 10) / 10,
        quality: Math.round(quality * 10) / 10,
        setupRatio: Math.round(setupRatio * 10) / 10
      },
      
      // Детализация
      details: {
        totalShiftTime: Math.round(totalShiftTime),
        totalSetupTime: Math.round(totalSetupTime),
        availableTime: Math.round(availableTime),
        plannedQuantity,
        actualProduced: totalProduced,
        plannedTimePerUnit
      },
      
      // Прогресс заказа
      progress: {
        totalProduced,
        remaining,
        progressPercent: Math.round(progressPercent * 10) / 10,
        targetQuantity: order.quantity
      },
      
      // Статистика операторов с правильными расчетами
      operatorAnalytics: Array.from(operatorStats.values())
    };
  }

  private updateOperatorStatsImproved(operatorMap: Map<string, any>, operatorName: string, shiftData: any) {
    if (!operatorName || operatorName === 'Не указан') return;

    const {
      shiftDuration,
      setupTime,
      downTime,
      actualProduced,
      defectParts,
      plannedTimePerUnit
    } = shiftData;

    // Расчеты по вашей логике
    const availableTime = shiftDuration - setupTime - downTime;
    const plannedQuantity = Math.floor(availableTime / plannedTimePerUnit);
    const performance = plannedQuantity > 0 ? (actualProduced / plannedQuantity) * 100 : 0;
    const quality = actualProduced > 0 ? ((actualProduced - defectParts) / actualProduced) * 100 : 100;
    const availability = shiftDuration > 0 ? ((shiftDuration - downTime) / shiftDuration) * 100 : 100;
    const oee = (availability * performance * quality) / 10000;
    const setupRatio = shiftDuration > 0 ? (setupTime / shiftDuration) * 100 : 0;
    const kpi = oee * 0.5 + (100 - setupRatio) * 0.2 + quality * 0.15 + 90 * 0.15;

    if (!operatorMap.has(operatorName)) {
      operatorMap.set(operatorName, {
        operatorName,
        totalShifts: 0,
        totalQuantity: 0,
        totalSetupTime: 0,
        averagePerformance: 0,
        averageOEE: 0,
        averageKPI: 0,
        shifts: []
      });
    }

    const operator = operatorMap.get(operatorName);
    operator.totalShifts++;
    operator.totalQuantity += actualProduced;
    operator.totalSetupTime += setupTime;
    
    // Добавляем данные смены
    operator.shifts.push({
      shiftDuration,
      setupTime,
      availableTime,
      plannedQuantity,
      actualProduced,
      performance: Math.round(performance * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      oee: Math.round(oee * 10) / 10,
      kpi: Math.round(kpi * 10) / 10
    });
    
    // Пересчитываем средние значения
    const allShifts = operator.shifts;
    operator.averagePerformance = Math.round(
      (allShifts.reduce((sum: number, s: any) => sum + s.performance, 0) / allShifts.length) * 10
    ) / 10;
    operator.averageOEE = Math.round(
      (allShifts.reduce((sum: number, s: any) => sum + s.oee, 0) / allShifts.length) * 10
    ) / 10;
    operator.averageKPI = Math.round(
      (allShifts.reduce((sum: number, s: any) => sum + s.kpi, 0) / allShifts.length) * 10
    ) / 10;
  }
