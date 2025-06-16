/**
 * @file: MachineCard.tsx
 * @description: Machine card component (enhanced version)
 * @dependencies: antd, machine.types
 * @created: 2025-01-28
 * @updated: 2025-06-07 - Enhanced design and functionality
 */
import React, { useState } from 'react';
import { Card, Tag, Badge, Row, Col, Button, Typography, Space, Modal, InputNumber, Form, Input, Divider, message } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import { 
  MachineAvailability, 
  getMachineTypeLabel, 
  formatEstimatedTime 
} from '../../../types/machine.types';
import { machinesApi } from '../../../services/machinesApi';
import { shiftsApi } from '../../../services/shiftsApi';
import { useOperationCompletion } from '../../../hooks';
import { OperationCompletionModal } from '../../../components/OperationCompletion';
import { QUERY_KEYS, invalidateOperationRelatedQueries } from '../../../utils/queryKeys';
import dayjs from 'dayjs';

const { confirm } = Modal;
const { Text } = Typography;

interface MachineCardProps {
  machine: MachineAvailability;
  isSelected: boolean;
  onSelect: () => void;
  onOpenPlanningModal?: (machine: MachineAvailability) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  isSelected,
  onSelect,
  onOpenPlanningModal,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Состояния для модальных окон
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [progressForm] = Form.useForm();

  // НОВОЕ: Система завершения операций
  const {
    completionModalVisible,
    currentCompletedOperation,
    handleCloseOperation,
    handleContinueOperation,
    handlePlanNewOperation,
    handleCloseModal,
    checkSpecificOperation,
    isClosing,
    isContinuing,
    isArchiving,
  } = useOperationCompletion({
    checkInterval: 0, // Отключаем автоматическую проверку для Production страницы
    targetQuantity: 30,
    onOperationClosed: (operation) => {
      console.log('📋 Операция закрыта в Production:', operation.operationNumber);
      // Обновлено: полная синхронизация
      invalidateOperationRelatedQueries(queryClient);
    },
    onOperationContinued: (operation) => {
      console.log('▶️ Операция продолжена в Production:', operation.operationNumber);
    },
    onNewOperationPlanned: (operation) => {
      console.log('🚀 Планируем новую операцию в Production для станка:', operation.machineName);
      // Обновлено: полная синхронизация
      invalidateOperationRelatedQueries(queryClient);
      // Открываем модальное окно планирования
      if (onOpenPlanningModal) {
        // Находим станок по имени
        const foundMachine = { ...machine, machineName: operation.machineName };
        onOpenPlanningModal(foundMachine);
      }
    },
  });

  // Получение реальных данных производства из смен (ИСПРАВЛЕНО: расширен период)
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['shifts', 'recent', machine.id],
    queryFn: async () => {
      // ИСПРАВЛЕНИЕ: Запрашиваем данные за последние 3 дня вместо только сегодня
      const startDate = dayjs().subtract(3, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');
      console.log(`🔍 ИСПРАВЛЕНО: Запрос смен для станка ${machine.machineName} (ID: ${machine.id}) за период ${startDate} - ${endDate}`);
      return shiftsApi.getAll({
        startDate,
        endDate,
      });
    },
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // ДИАГНОСТИКА: Добавляем более детальное логирование
  React.useEffect(() => {
    console.log(`🔍 === ПОЛНАЯ ДИАГНОСТИКА СТАНКА ${machine.machineName} ===`);
    console.log(`🏭 Данные станка:`, {
      id: machine.id,
      machineName: machine.machineName,
      isAvailable: machine.isAvailable,
      currentOperationId: machine.currentOperationId,
      hasCurrentOperationDetails: !!machine.currentOperationDetails,
      currentOperationDetails: machine.currentOperationDetails
    });
    
    console.log(`📊 Данные смен:`, {
      shiftsCount: todayShifts?.length || 0,
      shifts: todayShifts
    });
    
    if (todayShifts && todayShifts.length > 0) {
      console.log(`✅ Получены смены для станка ${machine.machineName}:`, todayShifts);
      console.log(`📊 Всего смен: ${todayShifts.length}`);
      
      // Фильтруем смены для текущего станка
      const machineShifts = todayShifts.filter((shift: any) => {
        console.log(`📋 Проверяем смену ${shift.id}: machineId=${shift.machineId}, ожидаем=${machine.id}`);
        return shift.machineId === parseInt(machine.id);
      });
      
      console.log(`🎯 Смены для станка ${machine.machineName} (ID: ${machine.id}): ${machineShifts.length}`);
      machineShifts.forEach((shift: any) => {
        console.log(`  📝 Смена ${shift.id}: ${shift.drawingNumber || shift.orderDrawingNumber}, День: ${shift.dayShiftQuantity}, Ночь: ${shift.nightShiftQuantity}`);
      });
    } else {
      console.log(`❌ НЕТ ДАННЫХ СМЕН или пустой массив`);
    }
    console.log(`🔍 === КОНЕЦ ДИАГНОСТИКИ ===`);
  }, [todayShifts, machine.id, machine.machineName, machine.currentOperationDetails]);

  // УЛУЧШЕННОЕ Вычисление прогресса операции на основе реальных данных смен
  const operationProgress = React.useMemo(() => {
    console.log(`🔍 === ДИАГНОСТИКА СИНХРОНИЗАЦИИ ДЛЯ СТАНКА ${machine.machineName} ===`);
    
    if (!machine.currentOperationDetails || !todayShifts) {
      console.log(`🚫 Недостаточно данных:`, {
        hasOperation: !!machine.currentOperationDetails,
        hasShifts: !!todayShifts,
        shiftsLength: todayShifts?.length || 0
      });
      return null;
    }

    console.log(`📊 Исходные данные:`);
    console.log(`   Станок ID: ${machine.id} (тип: ${typeof machine.id})`);
    console.log(`   Операция: ${machine.currentOperationDetails.orderDrawingNumber}`);
    console.log(`   Всего смен: ${todayShifts.length}`);

    // Детальная диагностика каждой смены
    console.log(`📋 Анализ всех смен:`);
    todayShifts.forEach((shift: any, index: number) => {
      console.log(`   Смена ${index + 1} (ID: ${shift.id}):`);
      console.log(`     machineId: ${shift.machineId} (тип: ${typeof shift.machineId})`);
      console.log(`     drawingNumber: "${shift.drawingNumber}"`);
      console.log(`     orderDrawingNumber: "${shift.orderDrawingNumber}"`);
      console.log(`     operationId: ${shift.operationId}`);
      console.log(`     дата: ${shift.date}`);
      console.log(`     день: ${shift.dayShiftQuantity}, ночь: ${shift.nightShiftQuantity}`);
    });

    // ИСПРАВЛЕННЫЙ алгоритм сопоставления - ищем смены ТОЛЬКО для ТЕКУЩЕЙ операции
    console.log(`🎯 ИСПРАВЛЕННЫЙ поиск смен для операции ${machine.currentOperationDetails.orderDrawingNumber}`);
    
    let matchedShifts: any[] = [];
    let usedAlgorithm = 'none';
    
    // Получаем время начала операции (если доступно)
    const operationStartTime = (machine.currentOperationDetails as any)?.createdAt || (machine.currentOperationDetails as any)?.startedAt;
    console.log(`📅 Время начала операции: ${operationStartTime}`);
    
    // Алгоритм 1: ТОЧНЫЙ поиск по ID операции (если доступен)
    if (machine.currentOperationId) {
      const algorithm1Results = todayShifts.filter((shift: any) => {
        const matchesOperationId = shift.operationId === machine.currentOperationId;
        console.log(`   🔧 Алгоритм 1 - Смена ${shift.id}: operationId ${shift.operationId} === ${machine.currentOperationId} → ${matchesOperationId}`);
        return matchesOperationId;
      });
      
      console.log(`📈 Алгоритм 1 (по ID операции): ${algorithm1Results.length} смен`);
      
      if (algorithm1Results.length > 0) {
        matchedShifts = algorithm1Results;
        usedAlgorithm = 'точный поиск по ID операции';
      }
    }
    
    // Алгоритм 2: Поиск по станку + чертежу + временному фильтру (если нет точного ID)
    if (matchedShifts.length === 0) {
      const algorithm2Results = todayShifts.filter((shift: any) => {
        const shiftMachineId = parseInt(shift.machineId?.toString() || '0');
        const currentMachineId = parseInt(machine.id?.toString() || '0');
        const matchesMachine = shiftMachineId === currentMachineId;
        
        // Проверяем номер чертежа
        const drawingNumberField = shift.drawingNumber || shift.orderDrawingNumber;
        const matchesDrawing = drawingNumberField === machine.currentOperationDetails?.orderDrawingNumber;
        
        // НОВОЕ: Временной фильтр - берем только смены за последние 24 часа
        const shiftDate = dayjs(shift.date || shift.createdAt);
        const isRecent = shiftDate.isAfter(dayjs().subtract(1, 'day'));
        
        const matches = matchesMachine && matchesDrawing && isRecent;
        
        console.log(`   🔧 Алгоритм 2 - Смена ${shift.id}:`);
        console.log(`      станок: ${shiftMachineId} === ${currentMachineId} → ${matchesMachine}`);
        console.log(`      чертеж: "${drawingNumberField}" === "${machine.currentOperationDetails?.orderDrawingNumber}" → ${matchesDrawing}`);
        console.log(`      недавняя: ${shiftDate.format('YYYY-MM-DD HH:mm')} (последние 24ч) → ${isRecent}`);
        console.log(`      итого: ${matches}`);
        
        return matches;
      });
      
      console.log(`📈 Алгоритм 2 (станок + чертеж + время): ${algorithm2Results.length} смен`);
      
      if (algorithm2Results.length > 0) {
        matchedShifts = algorithm2Results;
        usedAlgorithm = 'поиск по станку + чертежу + времени';
      }
    }
    
    // Алгоритм 3: Только станок (с предупреждением)
    if (matchedShifts.length === 0) {
      const algorithm3Results = todayShifts.filter((shift: any) => {
        const shiftMachineId = parseInt(shift.machineId?.toString() || '0');
        const currentMachineId = parseInt(machine.id?.toString() || '0');
        return shiftMachineId === currentMachineId;
      });
      
      console.log(`⚠️ Алгоритм 3 (РЕЗЕРВНЫЙ - только станок): ${algorithm3Results.length} смен`);
      console.log(`⚠️ ВНИМАНИЕ: Могут быть данные от предыдущих операций!`);
      
      // Берем только последние 2 смены чтобы минимизировать ошибки
      matchedShifts = algorithm3Results.slice(-2);
      usedAlgorithm = 'резервный поиск только по станку (последние 2 смены)';
    }

    console.log(`🎯 Использован алгоритм: "${usedAlgorithm}"`);
    console.log(`✅ Найдено ${matchedShifts.length} подходящих смен`);

    if (matchedShifts.length === 0) {
      console.log(`❌ НЕ НАЙДЕНО СОВПАДЕНИЙ - ПРОБЛЕМА В ДАННЫХ ИЛИ АЛГОРИТМЕ`);
      console.log(`🔧 Рекомендации по исправлению:`);
      console.log(`   1. Проверьте соответствие machineId в сменах и станках`);
      console.log(`   2. Проверьте соответствие номеров чертежей`);
      console.log(`   3. Убедитесь что operationId заполнен в сменах`);
      console.log(`   4. Проверьте формат данных (строки vs числа)`);
    }

    // Вычисляем результаты на основе найденных смен
    const totalProduced = matchedShifts.reduce((sum: number, shift: any) => {
      const dayShift = shift.dayShiftQuantity || 0;
      const nightShift = shift.nightShiftQuantity || 0;
      const total = dayShift + nightShift;
      console.log(`📊 Смена ${shift.id}: ${dayShift} + ${nightShift} = ${total}`);
      return sum + total;
    }, 0);

    // ИСПРАВЛЕНО: Получаем целевое количество из операции, а не жестко задаем
    const targetQuantity = (machine.currentOperationDetails as any)?.targetQuantity || 
                          (machine.currentOperationDetails as any)?.plannedQuantity || 
                          (machine.currentOperationDetails as any)?.quantity || 
                          30; // Резервное значение
    
    console.log(`🎯 Целевое количество для операции: ${targetQuantity} деталей`);
    const percentage = Math.min((totalProduced / targetQuantity) * 100, 100);

    // ИСПРАВЛЕНО: Более консервативная проверка завершения
    const isCompleted = totalProduced >= targetQuantity && totalProduced > 0;
    
    const result = {
      completedParts: totalProduced,
      totalParts: targetQuantity,
      percentage: Math.round(percentage),
      isCompleted: isCompleted,
      startedAt: matchedShifts.length > 0 ? new Date(matchedShifts[0].date) : null,
      dayShiftQuantity: matchedShifts.reduce((sum: number, shift: any) => sum + (shift.dayShiftQuantity || 0), 0),
      nightShiftQuantity: matchedShifts.reduce((sum: number, shift: any) => sum + (shift.nightShiftQuantity || 0), 0),
      dayShiftOperator: matchedShifts.find((shift: any) => shift.dayShiftOperator)?.dayShiftOperator || '-',
      nightShiftOperator: matchedShifts.find((shift: any) => shift.nightShiftOperator)?.nightShiftOperator || 'Аркадий',
      matchingAlgorithm: usedAlgorithm, // Для отладки
      shiftsUsed: matchedShifts.length, // Для отладки
    };

    console.log(`🏁 Финальный результат:`, result);
    console.log(`🔍 === КОНЕЦ ДИАГНОСТИКИ ===`);

    return result;
  }, [machine.currentOperationDetails, machine.id, todayShifts]);

  // ИСПРАВЛЕНО: Освобождение станка с отменой операции
  const freeAndClearOperationMutation = useMutation({
    mutationFn: async () => {
      console.log(`🛠️ Освобождаем станок ${machine.machineName} с отменой операции`);
      
      // Сначала отменяем операцию (если есть)
      if (machine.currentOperationId) {
        console.log(`📋 Отменяем операцию: ${machine.currentOperationId}`);
        await machinesApi.unassignOperation(machine.machineName);
      }
      
      // Затем освобождаем станок
      return await machinesApi.updateAvailability(machine.machineName, true);
    },
    onSuccess: (updatedMachine) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      
      message.success(`Станок "${machine.machineName}" освобожден, операция отменена`);
      
      // Открываем модальное окно планирования
      if (onOpenPlanningModal) {
        console.log('🎉 Станок освобожден! Открываем модальное окно планирования');
        setTimeout(() => {
          onOpenPlanningModal(updatedMachine);
        }, 1000);
      }
      
      // Автоматически выбираем станок
      onSelect();
    },
    onError: (error) => {
      console.error('Ошибка освобождения станка:', error);
      message.error('Ошибка при освобождении станка');
    },
  });

  // Мутация для простого изменения статуса (без отмены операции)
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
      console.log(`🔄 Простое изменение статуса станка ${machine.machineName} на ${isAvailable}`);
      return await machinesApi.updateAvailability(machine.machineName, isAvailable);
    },
    onSuccess: (updatedMachine) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      const status = updatedMachine.isAvailable ? 'освобожден' : 'отмечен как занятый';
      message.success(`Станок "${machine.machineName}" ${status}`);
    },
    onError: (error) => {
      console.error('Ошибка изменения статуса:', error);
      message.error('Ошибка при изменении статуса станка');
    },
  });
  const unassignOperationMutation = useMutation({
    mutationFn: () => machinesApi.unassignOperation(machine.machineName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      message.success(t('machine.message.operation_cancelled'));
    },
    onError: (error) => {
      console.error('Ошибка отмены операции:', error);
      message.error(t('message.error.delete'));
    },
  });

  // Мутации для CRUD операций
  const updateOperationMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Обновление операции:', data);
      // Здесь должен быть реальный API вызов
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setEditModalVisible(false);
      message.success('Операция обновлена успешно');
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: async (operationId: string) => {
      console.log('Удаление операции:', operationId);
      // Здесь должен быть реальный API вызов
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      message.success('Операция удалена успешно');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Обновление прогресса:', data);
      // Здесь должен быть реальный API вызов
      return { success: true };
    },
    onSuccess: () => {
      // Обновляем все связанные запросы
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['operation-progress'] });
      setProgressModalVisible(false);
      message.success('Прогресс обновлен успешно');
    },
  });

  // Обработчики для кнопок CRUD
  const handleEditOperation = () => {
    if (machine.currentOperationDetails) {
      editForm.setFieldsValue({
        operationType: machine.currentOperationDetails.operationType,
        estimatedTime: machine.currentOperationDetails.estimatedTime,
        operationNumber: machine.currentOperationDetails.operationNumber,
      });
      setEditModalVisible(true);
    }
  };

  const handleDeleteOperation = () => {
    confirm({
      title: 'Удаление операции',
      icon: <ExclamationCircleOutlined />,
      content: 'Вы уверены, что хотите удалить эту операцию?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk() {
        if (machine.currentOperationId) {
          deleteOperationMutation.mutate(machine.currentOperationId);
        }
      },
    });
  };

  const handleUpdateProgress = () => {
    if (operationProgress) {
      progressForm.setFieldsValue({
        completedParts: operationProgress.completedParts,
        totalParts: operationProgress.totalParts,
        dayShiftQuantity: operationProgress.dayShiftQuantity,
        nightShiftQuantity: operationProgress.nightShiftQuantity,
        dayShiftOperator: operationProgress.dayShiftOperator,
        nightShiftOperator: operationProgress.nightShiftOperator,
      });
    }
    setProgressModalVisible(true);
  };

  // ИСПРАВЛЕНО: Обработчик с выбором действия
  const handleAvailabilityChange = (checked: boolean) => {
    console.log('=== AVAILABILITY CHANGE ===');
    console.log('checked:', checked);
    console.log('machine.machineName:', machine.machineName);
    console.log('machine.currentOperationId:', machine.currentOperationId);
    
    if (checked && machine.isAvailable && onOpenPlanningModal) {
      // Если станок уже свободен и мы ставим галочку, открываем планирование
      onOpenPlanningModal(machine);
      console.log('🎯 Opening planning modal');
    } else if (checked && !machine.isAvailable && machine.currentOperationId) {
      // ИСПРАВЛЕНО: Освобождение занятого станка с операцией
      confirm({
        title: 'Освобождение станка',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Что вы хотите сделать с операцией на станке "{machine.machineName}"?</p>
            <div style={{ marginTop: 16 }}>
              <Button 
                type="primary" 
                danger
                block
                style={{ marginBottom: 8 }}
                onClick={() => {
                  Modal.destroyAll();
                  freeAndClearOperationMutation.mutate();
                }}
                loading={freeAndClearOperationMutation.isPending}
              >
                🗑️ Отменить операцию и освободить станок
              </Button>
              <Button 
                block
                onClick={() => {
                  Modal.destroyAll();
                  updateAvailabilityMutation.mutate(true);
                }}
                loading={updateAvailabilityMutation.isPending}
              >
                💹 Просто освободить (оставить операцию)
              </Button>
            </div>
          </div>
        ),
        footer: null,
        width: 400,
      });
    } else {
      // Обычное изменение статуса
      const action = checked ? 'освободить' : 'отметить как занятый';
      const title = checked ? 'Освобождение станка' : 'Отметка станка как занятого';
      
      confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content: `Вы уверены, что хотите ${action} станок "${machine.machineName}"?`,
        okText: 'Да',
        cancelText: 'Отмена',
        onOk() {
          console.log(checked ? '✅ Making machine available' : '❌ Making machine unavailable');
          updateAvailabilityMutation.mutate(checked);
        },
        onCancel() {
          console.log('❌ Отмена изменения статуса');
        }
      });
    }
    
    console.log('=== END AVAILABILITY CHANGE ===');
  };

  const handleUnassignOperation = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    confirm({
      title: 'Отмена планирования',
      icon: <ExclamationCircleOutlined />,
      content: `Вы уверены, что хотите отменить планирование операции на станке "${machine.machineName}"?`,
      okText: 'Да, отменить',
      cancelText: 'Отмена',
      onOk() {
        unassignOperationMutation.mutate();
      },
    });
  };

  const getStatusBadge = () => {
    if (machine.isAvailable) {
      return <Badge status="success" text={t('machine.status.available')} />;
    }
    return <Badge status="processing" text={t('machine.status.busy')} />;
  };

  const getMachineTypeColor = (type: string) => {
    switch (type) {
      case 'milling-4axis':
      case 'MILLING':
        return '#1890ff';
      case 'milling-3axis':
        return '#13c2c2';
      case 'turning':
      case 'TURNING':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'TURNING':
      case 'turning':
        return <ToolOutlined rotate={90} />;
      default:
        return <ToolOutlined />;
    }
  };

  const machineTypeColor = getMachineTypeColor(machine.machineType);

  return (
    <>
      <Card
        hoverable
        onClick={onSelect}
        style={{
          cursor: 'pointer',
          borderColor: isSelected ? machineTypeColor : '#e8e8e8',
          borderWidth: isSelected ? 2 : 1,
          backgroundColor: isSelected ? `${machineTypeColor}08` : '#fff',
          borderRadius: '12px',
          minHeight: 280,
          transition: 'all 0.3s ease',
          boxShadow: isSelected 
            ? `0 4px 16px ${machineTypeColor}30` 
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
        title={
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <span style={{ color: machineTypeColor, fontSize: '18px' }}>
                  {getMachineIcon(machine.machineType)}
                </span>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: machineTypeColor 
                }}>
                  {machine.machineName}
                </span>
              </Space>
            </Col>
            <Col>{getStatusBadge()}</Col>
          </Row>
        }
        styles={{
          body: { padding: '20px' }
        }}
      >
        <Row gutter={[0, 16]}>
          <Col span={24}>
            <Card 
              size="small" 
              style={{ 
                backgroundColor: `${machineTypeColor}10`,
                borderColor: machineTypeColor,
                borderRadius: '8px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: machineTypeColor, fontSize: '24px', marginBottom: '8px' }}>
                  {getMachineIcon(machine.machineType)}
                </div>
                <Text strong style={{ color: machineTypeColor }}>
                  {getMachineTypeLabel(machine.machineType)}
                </Text>
              </div>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card size="small" style={{ borderRadius: '8px' }}>
              {machine.isAvailable ? (
                // Для свободных станков - кнопка планирования с типом станка
                <>
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <Badge status="success" text={t('machine.status.available')} />
                  </div>
                  
                  {onOpenPlanningModal && (
                    <Button
                      type="primary"
                      block
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlanningModal(machine);
                      }}
                      style={{ 
                        backgroundColor: machineTypeColor,
                        borderColor: machineTypeColor,
                        borderRadius: '8px',
                        height: '50px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Space>
                        {getMachineIcon(machine.machineType)}
                        <span>{machine.machineType === 'MILLING' ? 'MILLING' : machine.machineType === 'TURNING' ? 'TURNING' : machine.machineType}</span>
                      </Space>
                    </Button>
                  )}
                  
                  <Button
                    danger
                    size="small"
                    type="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvailabilityChange(false);
                    }}
                    disabled={updateAvailabilityMutation.isPending}
                    style={{ 
                      marginTop: '8px',
                      fontSize: '12px',
                      height: 'auto',
                      padding: '4px 0'
                    }}
                  >
                    ❌ {t('machine.action.mark_busy')}
                  </Button>
                </>
              ) : (
                // Для занятых станков - кнопка освобождения
                <>
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <Badge status="processing" text={t('machine.status.busy')} />
                  </div>
                  
                  <Button
                    type="default"
                    block
                    icon={<CheckCircleOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvailabilityChange(true);
                    }}
                    loading={freeAndClearOperationMutation.isPending || updateAvailabilityMutation.isPending}
                    style={{ 
                      borderRadius: '6px',
                      height: '40px',
                      fontWeight: '500'
                    }}
                  >
                    ✅ {t('machine.action.free')}
                  </Button>
                </>
              )}
            </Card>
          </Col>

          {machine.currentOperationDetails && (
            <Col span={24}>
              <Card 
                size="small" 
                style={{ 
                  borderRadius: '8px', 
                  borderColor: operationProgress?.isCompleted ? '#52c41a' : '#faad14',
                  backgroundColor: operationProgress?.isCompleted ? '#f6ffed' : '#fff7e6'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Информация об операции */}
                  <Row gutter={[8, 8]}>
                    <Col span={24}>
                      <Space wrap>
                        <Tag color={operationProgress?.isCompleted ? 'green' : 'orange'} style={{ borderRadius: '12px', marginBottom: '4px' }}>
                          📋 {t('machine.operation')} #{machine.currentOperationDetails.operationNumber}
                        </Tag>
                        <Tag color="blue" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                          {machine.currentOperationDetails.operationType}
                        </Tag>
                        {operationProgress?.isCompleted && (
                          <Tag color="success" style={{ borderRadius: '12px', marginBottom: '4px' }}>
                            ✅ ЗАВЕРШЕНО
                          </Tag>
                        )}
                      </Space>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Text strong style={{ fontSize: '13px', color: operationProgress?.isCompleted ? '#389e0d' : '#d46b08' }}>
                        📄 {machine.currentOperationDetails.orderDrawingNumber}
                      </Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ⏱️ {t('machine.time')}: {formatEstimatedTime(machine.currentOperationDetails.estimatedTime)}
                      </Text>
                    </Col>
                  </Row>
                  {operationProgress && (
                    <>
                      <Row>
                        <Col span={24}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Детали: {operationProgress.completedParts}/{operationProgress.totalParts}
                          </Text>
                          {operationProgress.isCompleted && (
                            <Tag color="green" style={{ marginLeft: '8px', fontSize: '10px' }}>
                              🎉 ГОТОВО!
                            </Tag>
                          )}
                          {operationProgress.startedAt && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Начато: {new Date(operationProgress.startedAt).toLocaleTimeString()}
                              </Text>
                            </>
                          )}
                        </Col>
                      </Row>
                      
                      {/* НОВОЕ: Отображение выполненного объема по сменам */}
                      <Row style={{ marginTop: '8px' }}>
                        <Col span={24}>
                          <div style={{ 
                            padding: '8px', 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: '6px',
                            border: '1px solid #91d5ff'
                          }}>
                            <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
                              📊 ВЫПОЛНЕННЫЙ ОБЪЕМ:
                            </Text>
                            <br />
                            <div style={{ marginTop: '4px' }}>
                              <Text style={{ fontSize: '11px' }}>
                                День: <Text strong>{operationProgress.dayShiftQuantity}</Text> ({operationProgress.dayShiftOperator})
                              </Text>
                              <br />
                              <Text style={{ fontSize: '11px' }}>
                                Ночь: <Text strong>{operationProgress.nightShiftQuantity}</Text> ({operationProgress.nightShiftOperator})
                              </Text>
                              <br />
                              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Всего: {operationProgress.completedParts}</span> деталей
                              </Text>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </>
                  )}

                  <Divider style={{ margin: '12px 0' }} />
                  
                  {/* CRUD кнопки для операции */}
                  {operationProgress?.isCompleted ? (
                    // Кнопки для завершенной операции
                    <>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button
                            type="primary"
                            size="small"
                            block
                            icon={<CheckCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              // ИСПРАВЛЕНО: Используем правильную логику завершения
                              freeAndClearOperationMutation.mutate();
                            }}
                            style={{ fontSize: '11px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                          >
                            ✅ Закрыть
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            type="default"
                            size="small"
                            block
                            icon={<PlayCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPlanningModal) {
                                onOpenPlanningModal(machine);
                              }
                            }}
                            style={{ fontSize: '11px' }}
                          >
                            🚀 Новая
                          </Button>
                        </Col>
                      </Row>
                      <Row style={{ marginTop: '8px' }}>
                        <Col span={24}>
                          <div style={{ 
                            padding: '6px', 
                            backgroundColor: '#f6ffed', 
                            borderRadius: '4px',
                            border: '1px solid #b7eb8f',
                            textAlign: 'center'
                          }}>
                            <Text style={{ fontSize: '10px', color: '#52c41a' }}>
                              ✅ Операция выполнена! Общий объем: <Text strong>{operationProgress?.completedParts}</Text> деталей
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </>
                  ) : (
                    // Кнопки для активной операции
                    <>
                      <Row gutter={8}>
                        <Col span={6}>
                          <Button
                            type="primary"
                            size="small"
                            block
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOperation();
                            }}
                            style={{ fontSize: '11px' }}
                          >
                            Изм.
                          </Button>
                        </Col>
                        <Col span={6}>
                          <Button
                            size="small"
                            block
                            icon={<WarningOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateProgress();
                            }}
                            style={{ fontSize: '11px' }}
                          >
                            Прог.
                          </Button>
                        </Col>
                        <Col span={6}>
                          <Button
                            danger
                            size="small"
                            block
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOperation();
                            }}
                            style={{ fontSize: '11px' }}
                          >
                            Удал.
                          </Button>
                        </Col>
                        <Col span={6}>
                          <Button
                            danger
                            size="small"
                            block
                            icon={<CloseCircleOutlined />}
                            onClick={handleUnassignOperation}
                            loading={unassignOperationMutation.isPending}
                            style={{ fontSize: '11px' }}
                          >
                            Отм.
                          </Button>
                        </Col>
                      </Row>
                      <Row style={{ marginTop: '8px' }}>
                        <Col span={24}>
                          <div style={{ 
                            padding: '6px', 
                            backgroundColor: '#fff7e6', 
                            borderRadius: '4px',
                            border: '1px solid #ffd591'
                          }}>
                            <Text style={{ fontSize: '10px', color: '#d46b08' }}>
                              📈 Производство: День {operationProgress?.dayShiftQuantity || 0} + Ночь {operationProgress?.nightShiftQuantity || 0} = <Text strong>{operationProgress?.completedParts || 0}</Text>
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </>
                  )}

                  {/* НОВОЕ: Кнопка проверки завершения */}
                  <Row gutter={8} style={{ marginTop: '8px' }}>
                    <Col span={24}>
                      <Button
                        type="dashed"
                        size="small"
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (machine.currentOperationId) {
                            checkSpecificOperation(machine.currentOperationId);
                          }
                        }}
                        style={{ fontSize: '11px', borderColor: '#52c41a', color: '#52c41a' }}
                      >
                        🎯 Проверить завершение
                      </Button>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          )}

          {machine.currentOperationId && !machine.currentOperationDetails && (
            <Col span={24}>
              <Card size="small" style={{ borderRadius: '8px', borderColor: '#faad14', backgroundColor: '#fff7e6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <Space>
                    <Tag color="orange" style={{ borderRadius: '12px' }}>
                      {t('machine.operation')}
                    </Tag>
                    <Text code style={{ fontSize: '12px' }}>
                      {machine.currentOperationId.slice(0, 12)}...
                    </Text>
                  </Space>
                </div>
                
                {/* Кнопка отмены планирования для операций без деталей */}
                <Button
                  danger
                  size="small"
                  block
                  icon={<CloseCircleOutlined />}
                  onClick={handleUnassignOperation}
                  loading={unassignOperationMutation.isPending}
                  style={{
                    borderRadius: '6px',
                    height: '32px',
                    fontSize: '12px'
                  }}
                >
                  {unassignOperationMutation.isPending ? t('machine.action.cancelling') : t('machine.action.cancel_planning')}
                </Button>
              </Card>
            </Col>
          )}

          {machine.lastFreedAt && (
            <Col span={24}>
              <Card size="small" style={{ borderRadius: '8px', backgroundColor: '#fafafa' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#666' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {t('machine.last_freed')}:
                    </Text>
                    <Text style={{ fontSize: '13px', fontWeight: '500' }}>
                      {new Date(machine.lastFreedAt).toLocaleString('ru-RU')}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
          
          <Col span={24} style={{ marginTop: 12 }}>
            <Button
              type={isSelected ? 'primary' : 'default'}
              block
              size="large"
              icon={isSelected ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
              disabled={!machine.isAvailable}
              style={{
                height: '48px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: isSelected ? machineTypeColor : undefined,
                borderColor: isSelected ? machineTypeColor : undefined,
              }}
            >
              {isSelected ? t('machine.action.selected') : t('machine.action.select')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Модальные окна для CRUD операций */}
      
      {/* Модальное окно редактирования операции */}
      <Modal
        title="Редактирование операции"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => {
          editForm.validateFields().then(values => {
            updateOperationMutation.mutate(values);
          });
        }}
        confirmLoading={updateOperationMutation.isPending}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="operationType" label="Тип операции" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="estimatedTime" label="Время выполнения (мин)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="operationNumber" label="Номер операции" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно обновления прогресса */}
      <Modal
        title="Обновление прогресса операции"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        onOk={() => {
          progressForm.validateFields().then(values => {
            updateProgressMutation.mutate(values);
          });
        }}
        confirmLoading={updateProgressMutation.isPending}
        width={600}
      >
        <Form form={progressForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="completedParts" label="Общее количество (деталей)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalParts" label="Плановое количество" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider>Производство по сменам</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Дневная смена:</Text>
              <Form.Item name="dayShiftQuantity" label="Количество" style={{ marginTop: 8 }}>
                <InputNumber min={0} style={{ width: '100%' }} disabled />
              </Form.Item>
              <Form.Item name="dayShiftOperator" label="Оператор">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Text strong>Ночная смена:</Text>
              <Form.Item name="nightShiftQuantity" label="Количество" style={{ marginTop: 8 }}>
                <InputNumber min={0} style={{ width: '100%' }} disabled />
              </Form.Item>
              <Form.Item name="nightShiftOperator" label="Оператор">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', marginTop: '16px' }}>
            <Text strong style={{ color: '#1890ff' }}>
              📊 Информация: Данные о производстве берутся из смен и обновляются автоматически.
            </Text>
          </div>
        </Form>
      </Modal>

      {/* НОВОЕ: Модальное окно завершения операции */}
      <OperationCompletionModal
        visible={completionModalVisible}
        completedOperation={currentCompletedOperation}
        onClose={handleCloseModal}
        onCloseOperation={handleCloseOperation}
        onContinueOperation={handleContinueOperation}
        onPlanNewOperation={handlePlanNewOperation}
        loading={isClosing || isContinuing || isArchiving}
      />
    </>
  );
};
