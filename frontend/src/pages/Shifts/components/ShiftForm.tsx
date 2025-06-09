/**
 * @file: ShiftForm.tsx
 * @description: Форма создания/редактирования записи смены (ОБНОВЛЕНА - добавлен setupOperator)
 * @dependencies: antd, react-hook-form, shiftsApi
 * @created: 2025-01-28
 * @fixed: 2025-06-07 - Добавлено поле setupOperator
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Select,
  InputNumber,
  Input,
  Radio,
  Space,
  Divider,
  message,
  Spin,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { shiftsApi } from '../../../services/shiftsApi';
import { machinesApi } from '../../../services/machinesApi';
import { operationsApi } from '../../../services/operationsApi';
import { CreateShiftRecordDto, ShiftType } from '../../../types/shift.types';
import { OperationStatus } from '../../../types/operation.types';

const { Option } = Select;

interface ShiftFormProps {
  visible: boolean;
  shiftId?: number;
  selectedMachineId?: number; // Новое поле для предвыбора станка
  onClose: () => void;
  onSuccess: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  visible,
  shiftId,
  selectedMachineId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!shiftId;

  const { control, handleSubmit, reset, watch, setValue } = useForm<CreateShiftRecordDto>({
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      shiftType: ShiftType.DAY,
      nightShiftOperator: 'Аркадий',
    },
  });

  const currentMachineId = watch('machineId');
  const [assignedOperation, setAssignedOperation] = useState<any>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Загрузка данных
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: machinesApi.getAll,
  });

  // Преобразуем данные для обратной совместимости
  const machinesList = machines?.map((machine: any) => ({
    ...machine,
    // Обеспечиваем обратную совместимость
    code: machine.machineName || machine.code,
    type: machine.machineType || machine.type
  }));

  // Получаем операции с данными о заказах (для обратной совместимости)
  const { data: operations } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
    enabled: false, // Отключаем автоматический запрос
  });

  // Предзаполнение станка при открытии формы
  React.useEffect(() => {
    if (visible && selectedMachineId && !isEdit) {
      setValue('machineId', selectedMachineId);
      // Принудительно запускаем поиск операции для этого станка
      setOperationLoading(true);
      operationsApi.getAssignedToMachine(selectedMachineId)
        .then(response => {
          if (response.success && response.operation) {
            setAssignedOperation(response.operation);
            setValue('operationId', response.operation.id);
            setValue('drawingNumber', response.operation.orderDrawingNumber || '');
          } else {
            setAssignedOperation(null);
            setValue('operationId', undefined);
            setValue('drawingNumber', '');
          }
        })
        .catch(error => {
          console.error('Ошибка при получении операции для предвыбранного станка:', error);
          setAssignedOperation(null);
        })
        .finally(() => {
          setOperationLoading(false);
        });
    }
  }, [visible, selectedMachineId, isEdit, setValue]);

  // Получение назначенной операции при выборе станка
  React.useEffect(() => {
    if (currentMachineId) {
      setOperationLoading(true);
      operationsApi.getAssignedToMachine(currentMachineId)
        .then(response => {
          if (response.success && response.operation) {
            setAssignedOperation(response.operation);
            setValue('operationId', response.operation.id);
            setValue('drawingNumber', response.operation.orderDrawingNumber || '');
          } else {
            setAssignedOperation(null);
            setValue('operationId', undefined);
            setValue('drawingNumber', '');
            message.warning(response.message || 'На данный станок не назначено операций');
          }
        })
        .catch(error => {
          console.error('Ошибка при получении назначенной операции:', error);
          setAssignedOperation(null);
          message.error('Ошибка при получении информации о назначенной операции');
        })
        .finally(() => {
          setOperationLoading(false);
        });
    } else {
      // Очищаем данные об операции, если станок не выбран
      setAssignedOperation(null);
      setValue('operationId', undefined);
      setValue('drawingNumber', '');
    }
  }, [currentMachineId, setValue]);

  // Очищаем форму при закрытии
  React.useEffect(() => {
    if (!visible) {
      reset({
        date: dayjs().format('YYYY-MM-DD'),
        shiftType: ShiftType.DAY,
        nightShiftOperator: 'Аркадий',
      });
      setAssignedOperation(null);
    }
  }, [visible, reset]);

  const { data: shiftData } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: () => shiftsApi.getById(shiftId!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (shiftData) {
      reset({
        date: shiftData.date,
        shiftType: shiftData.shiftType,
        setupTime: shiftData.setupTime,
        setupOperator: shiftData.setupOperator,
        dayShiftQuantity: shiftData.dayShiftQuantity,
        dayShiftOperator: shiftData.dayShiftOperator,
        dayShiftTimePerUnit: shiftData.dayShiftTimePerUnit,
        nightShiftQuantity: shiftData.nightShiftQuantity,
        nightShiftOperator: shiftData.nightShiftOperator || 'Аркадий',
        nightShiftTimePerUnit: shiftData.nightShiftTimePerUnit,
        operationId: shiftData.operationId,
        machineId: shiftData.machineId,
        drawingNumber: shiftData.drawingNumber,
      });
      
      // При редактировании также загружаем информацию об операции
      if (shiftData.machineId) {
        setOperationLoading(true);
        operationsApi.getAssignedToMachine(shiftData.machineId)
          .then(response => {
            if (response.success && response.operation) {
              setAssignedOperation(response.operation);
            }
          })
          .catch(error => {
            console.error('Ошибка при загрузке операции для редактирования:', error);
          })
          .finally(() => {
            setOperationLoading(false);
          });
      }
    }
  }, [shiftData, reset]);

  // Мутации
  const createMutation = useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => {
      message.success('Запись смены создана');
      onSuccess();
    },
    onError: () => {
      message.error('Ошибка при создании записи');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      shiftsApi.update(id, data),
    onSuccess: () => {
      message.success('Запись смены обновлена');
      onSuccess();
    },
    onError: () => {
      message.error('Ошибка при обновлении записи');
    },
  });

  const onSubmit = async (data: CreateShiftRecordDto) => {
    // Для новых записей проверяем наличие станка
    if (!data.machineId && !isEdit) {
      message.error('Пожалуйста, выберите станок');
      return;
    }

    // Проверяем наличие данных смены (дневной или ночной)
    if (!data.dayShiftQuantity && !data.nightShiftQuantity) {
      message.error('Заполните данные хотя бы для одной смены');
      return;
    }

    console.log('📝 Отправляем данные:', data);
    
    setLoading(true);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: shiftId, data: data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Редактировать запись смены' : 'Новая запись смены'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      width={700}
      confirmLoading={loading}
      okText={isEdit ? 'Сохранить' : 'Создать'}
      cancelText="Отмена"
    >
      <Spin spinning={loading}>
        <Form layout="vertical">
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Дата" required>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    format="DD.MM.YYYY"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Тип смены" required>
              <Controller
                name="shiftType"
                control={control}
                render={({ field }) => (
                  <Radio.Group {...field}>
                    <Radio value={ShiftType.DAY}>Дневная</Radio>
                    <Radio value={ShiftType.NIGHT}>Ночная</Radio>
                  </Radio.Group>
                )}
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Станок" required style={{ width: 250 }}>
              <Controller
                name="machineId"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <Select {...field} placeholder="Выберите станок" showSearch optionFilterProp="children">
                    {machinesList?.map((machine) => {
                      const machineTypeLabel = machine.machineType === 'MILLING' || machine.machineType?.includes('milling') 
                        ? 'Фрезерный' 
                        : machine.machineType === 'TURNING' || machine.machineType?.includes('turning')
                        ? 'Токарный'
                        : 'Станок';
                      return (
                        <Option key={machine.id} value={machine.id}>
                          {machine.machineName} - {machineTypeLabel}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              />
            </Form.Item>
          </Space>

          {/* Информация о назначенной операции */}
          {currentMachineId && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: assignedOperation ? '#f6f9f6' : '#fff2f0', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: `1px solid ${assignedOperation ? '#b7eb8f' : '#ffccc7'}`
            }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        color: '#262626',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {assignedOperation ? '✅' : '⚠️'} Информация об операции:
      </h4>
              {operationLoading ? (
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <Spin size="small" /> Поиск операции...
                </div>
              ) : assignedOperation ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '24px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      <span style={{ color: '#1890ff' }}>Операция №:</span> 
                      <span style={{ color: '#262626', fontWeight: 'bold' }}>{assignedOperation.operationNumber}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      <span style={{ color: '#1890ff' }}>Чертёж:</span> 
                      <span style={{ color: '#262626', fontWeight: 'bold' }}>{assignedOperation.orderDrawingNumber || 'Не указан'}</span>
                    </div>
                  </div>
                  
                  {/* 🆕 Добавляем информацию о заказе */}
                  {(assignedOperation.orderQuantity || assignedOperation.orderPriority || assignedOperation.orderDeadline) && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#0050b3',
                        marginBottom: '8px'
                      }}>
                        📋 Информация о заказе:
                      </div>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px',
                        fontSize: '13px'
                      }}>
                        {assignedOperation.orderQuantity && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#1890ff', fontWeight: '500' }}>📦 Количество:</span>
                            <span style={{ color: '#262626', fontWeight: 'bold', fontSize: '14px' }}>
                              {assignedOperation.orderQuantity} шт.
                            </span>
                          </div>
                        )}
                        {assignedOperation.orderPriority && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#1890ff', fontWeight: '500' }}>🎯 Приоритет:</span>
                            <span style={{ 
                              color: assignedOperation.orderPriority === 1 ? '#ff4d4f' : 
                                     assignedOperation.orderPriority === 2 ? '#fa8c16' : '#52c41a',
                              fontWeight: 'bold'
                            }}>
                              {assignedOperation.orderPriority}
                            </span>
                          </div>
                        )}
                        {assignedOperation.orderDeadline && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#1890ff', fontWeight: '500' }}>📅 Дедлайн:</span>
                            <span style={{ color: '#262626' }}>
                              {new Date(assignedOperation.orderDeadline).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        )}
                        {assignedOperation.orderWorkType && assignedOperation.orderWorkType !== '' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#1890ff', fontWeight: '500' }}>🔧 Тип работы:</span>
                            <span style={{ color: '#262626' }}>
                              {assignedOperation.orderWorkType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px',
                    fontSize: '14px',
                    color: '#8c8c8c',
                    marginTop: '4px'
                  }}>
                    <span>Тип: {assignedOperation.operationType || 'Не указан'}</span>
                    <span>Время: {assignedOperation.estimatedTime || 0} мин</span>
                    <span>Статус: {assignedOperation.status}</span>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  color: '#ff4d4f'
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>⚠️ На данный станок не назначено операций</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Запись смены все равно можно создать</div>
                </div>
              )}
            </div>
          )}

          {/* Скрытые поля для операции */}
          {assignedOperation && (
            <>
              <Controller
                name="operationId"
                control={control}
                render={({ field }) => <input type="hidden" {...field} />}
              />
              <Controller
                name="drawingNumber"
                control={control}
                render={({ field }) => <input type="hidden" {...field} />}
              />
            </>
          )}

          <Divider orientation="left">Наладка</Divider>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Время наладки (мин)">
              <Controller
                name="setupTime"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} placeholder="0" />
                )}
              />
            </Form.Item>

            <Form.Item label="Оператор наладки">
              <Controller
                name="setupOperator"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Имя оператора" />}
              />
            </Form.Item>
          </Space>

          <Divider orientation="left">Дневная смена</Divider>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Количество деталей">
              <Controller
                name="dayShiftQuantity"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} placeholder="0" />
                )}
              />
            </Form.Item>

            <Form.Item label="Оператор">
              <Controller
                name="dayShiftOperator"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Имя оператора" />}
              />
            </Form.Item>

            <Form.Item label="Время на деталь (мин)">
              <Controller
                name="dayShiftTimePerUnit"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} step={0.1} placeholder="0.0" />
                )}
              />
            </Form.Item>
          </Space>

          <Divider orientation="left">Ночная смена</Divider>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Количество деталей">
              <Controller
                name="nightShiftQuantity"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} placeholder="0" />
                )}
              />
            </Form.Item>

            <Form.Item label="Оператор">
              <Controller
                name="nightShiftOperator"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Имя оператора" />
                )}
              />
            </Form.Item>

            <Form.Item label="Время на деталь (мин)">
              <Controller
                name="nightShiftTimePerUnit"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} step={0.1} placeholder="0.0" />
                )}
              />
            </Form.Item>
          </Space>
        </Form>
      </Spin>
    </Modal>
  );
};
