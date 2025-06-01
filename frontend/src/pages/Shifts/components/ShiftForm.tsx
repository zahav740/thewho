/**
 * @file: ShiftForm.tsx
 * @description: Форма создания/редактирования записи смены
 * @dependencies: antd, react-hook-form, shiftsApi
 * @created: 2025-01-28
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
  onClose: () => void;
  onSuccess: () => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  visible,
  shiftId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!shiftId;

  const { control, handleSubmit, reset } = useForm<CreateShiftRecordDto>({
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      shiftType: ShiftType.DAY,
      nightShiftOperator: 'Аркадий',
    },
  });

  // const shiftType = watch('shiftType'); // unused

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

  const { data: operations } = useQuery({
    queryKey: ['operations', 'in-progress'],
    queryFn: () => operationsApi.getAll(OperationStatus.IN_PROGRESS),
  });

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
        setupStartDate: shiftData.setupStartDate,
        setupOperator: shiftData.setupOperator,
        setupType: shiftData.setupType,
        setupTime: shiftData.setupTime,
        dayShiftQuantity: shiftData.dayShiftQuantity,
        dayShiftOperator: shiftData.dayShiftOperator,
        dayShiftTimePerUnit: shiftData.dayShiftTimePerUnit,
        nightShiftQuantity: shiftData.nightShiftQuantity,
        nightShiftOperator: shiftData.nightShiftOperator || 'Аркадий',
        nightShiftTimePerUnit: shiftData.nightShiftTimePerUnit,
        operationId: shiftData.operationId,
        machineId: shiftData.machineId,
      });
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
    setLoading(true);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: shiftId, data });
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
            <Form.Item label="Станок" required style={{ width: 200 }}>
              <Controller
                name="machineId"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <Select {...field} placeholder="Выберите станок">
                    {machinesList?.map((machine) => (
                      <Option key={machine.id} value={machine.id}>
                        {machine.code} ({machine.type === 'MILLING' || machine.type?.includes('milling') ? 'Фрез.' : 'Ток.'})
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item label="Операция" required style={{ width: 200 }}>
              <Controller
                name="operationId"
                control={control}
                rules={{ required: 'Обязательное поле' }}
                render={({ field }) => (
                  <Select {...field} placeholder="Выберите операцию">
                    {operations?.map((operation) => (
                      <Option key={operation.id} value={operation.id}>
                        Операция {operation.operationNumber}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
          </Space>

          <Divider orientation="left">Наладка</Divider>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Дата начала наладки">
              <Controller
                name="setupStartDate"
                control={control}
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

            <Form.Item label="Оператор наладки">
              <Controller
                name="setupOperator"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Имя оператора" />}
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item label="Тип наладки">
              <Controller
                name="setupType"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Выберите тип" style={{ width: 200 }}>
                    <Option value="Первичная">Первичная</Option>
                    <Option value="Повторная">Повторная</Option>
                    <Option value="Корректировка">Корректировка</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item label="Время наладки (мин)">
              <Controller
                name="setupTime"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} placeholder="0" />
                )}
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
