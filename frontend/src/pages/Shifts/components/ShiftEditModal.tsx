/**
 * @file: ShiftEditModal.tsx
 * @description: Модальное окно для редактирования смен с полной функциональностью и синхронизацией с БД
 * @dependencies: antd, dayjs, react-query, operatorsApi
 * @created: 2025-06-11
 * @updated: 2025-06-16 - добавлена синхронизация с БД для операторов
 */
import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Row,
  Col,
  InputNumber,
  Input,
  Select,
  DatePicker,
  Divider,
  message,
  Spin,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../../../services/shiftsApi';
import { operatorsApi } from '../../../services/operatorsApi';
import dayjs, { Dayjs } from 'dayjs';

// Типы для формы
interface ShiftFormValues {
  date: Dayjs;
  shiftType: string;
  drawingnumber: string;
  setupTime: number;
  dayShiftQuantity: number;
  dayShiftTimePerUnit: number;
  dayShiftOperator: string;
  nightShiftQuantity: number;
  nightShiftTimePerUnit: number;
  nightShiftOperator: string;
  setupOperator: string;
  operationId?: number;
}

interface ShiftEditModalProps {
  visible: boolean;
  editingShift: any;
  selectedMachineId: string | null;
  onClose: () => void;
  form: any;
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  visible,
  editingShift,
  selectedMachineId,
  onClose,
  form
}) => {
  const queryClient = useQueryClient();

  // НОВОЕ: Загружаем операторов из базы данных
  const { data: operators = [], isLoading: operatorsLoading } = useQuery({
    queryKey: ['operators', 'active'],
    queryFn: () => operatorsApi.getAll(undefined, true),
    enabled: visible, // Загружаем только когда модальное окно открыто
  });

  // НОВОЕ: Загружаем операторов наладки
  const { data: setupOperators = [] } = useQuery({
    queryKey: ['operators', 'setup'],
    queryFn: () => operatorsApi.getSetupOperators(),
    enabled: visible,
  });

  // НОВОЕ: Загружаем операторов производства
  const { data: productionOperators = [] } = useQuery({
    queryKey: ['operators', 'production'],
    queryFn: () => operatorsApi.getProductionOperators(),
    enabled: visible,
  });

  // Получаем уникальный список всех операторов для дневной смены
  const dayShiftOperators = React.useMemo(() => {
    const allOperators = [...operators];
    const uniqueOperators = allOperators.filter((operator, index, self) => 
      index === self.findIndex(o => o.id === operator.id)
    );
    return uniqueOperators.filter(op => 
      op.operatorType === 'PRODUCTION' || op.operatorType === 'BOTH'
    );
  }, [operators]);

  // Получаем уникальный список всех операторов для ночной смены  
  const nightShiftOperators = React.useMemo(() => {
    const allOperators = [...operators];
    const uniqueOperators = allOperators.filter((operator, index, self) => 
      index === self.findIndex(o => o.id === operator.id)
    );
    return uniqueOperators.filter(op => 
      op.operatorType === 'PRODUCTION' || op.operatorType === 'BOTH'
    );
  }, [operators]);

  // НОВОЕ: Мутация для обновления смены с немедленным обновлением данных
  const updateShiftMutation = useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: number; data: any }) =>
      shiftsApi.update(shiftId, data),
    onSuccess: () => {
      message.success('Данные смены обновлены успешно');
      // Немедленно обновляем все связанные данные
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      onClose();
    },
    onError: (error) => {
      console.error('Ошибка обновления смены:', error);
      message.error('Ошибка при обновлении данных смены');
    }
  });

  // НОВОЕ: Мутация для создания новой смены с немедленным обновлением данных
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => shiftsApi.create(data),
    onSuccess: () => {
      message.success('Смена создана успешно');
      // Немедленно обновляем все связанные данные
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      onClose();
    },
    onError: (error) => {
      console.error('Ошибка создания смены:', error);
      message.error('Ошибка при создании смены');
    }
  });

  const handleSave = () => {
    form.validateFields().then((values: ShiftFormValues) => {
      const formData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        machineId: parseInt(selectedMachineId!),
        operationId: values.operationId || null,
        drawingnumber: values.drawingnumber || ''
      };

      if (editingShift) {
        // Обновляем существующую смену
        updateShiftMutation.mutate({
          shiftId: editingShift.id,
          data: formData
        });
      } else {
        // Создаем новую смену
        createShiftMutation.mutate(formData);
      }
    }).catch((error: any) => {
      console.error('Ошибка валидации формы:', error);
    });
  };

  return (
    <Modal
      title={editingShift ? "Редактировать смену" : "Создать смену"}
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      width={800}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={updateShiftMutation.isPending || createShiftMutation.isPending}
      okButtonProps={{
        icon: <SaveOutlined />
      }}
    >
      <Spin spinning={operatorsLoading} tip="Загрузка операторов...">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            shiftType: 'DAY',
            nightShiftOperator: operators.find(op => op.name === 'Аркадий')?.name
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Дата смены"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shiftType"
                label="Тип смены"
                rules={[{ required: true, message: 'Выберите тип смены' }]}
              >
                <Select>
                  <Select.Option value="DAY">Дневная</Select.Option>
                  <Select.Option value="NIGHT">Ночная</Select.Option>
                  <Select.Option value="BOTH">Обе смены</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="drawingnumber" label="Номер чертежа">
                <Input placeholder="Например: C6HP0021A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="setupTime" label="Время наладки (мин)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Дневная смена</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dayShiftQuantity" label="Количество деталей">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dayShiftTimePerUnit" label="Время на деталь (мин)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dayShiftOperator" label="Оператор">
                <Select 
                  allowClear 
                  placeholder="Выберите оператора"
                  loading={operatorsLoading}
                  notFoundContent={operatorsLoading ? <Spin size="small" /> : 'Нет данных'}
                >
                  {dayShiftOperators.map(operator => (
                    <Select.Option key={operator.id} value={operator.name}>
                      {operator.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Ночная смена</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nightShiftQuantity" label="Количество деталей">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nightShiftTimePerUnit" label="Время на деталь (мин)">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nightShiftOperator" label="Оператор">
                <Select 
                  placeholder="Выберите оператора"
                  loading={operatorsLoading}
                  notFoundContent={operatorsLoading ? <Spin size="small" /> : 'Нет данных'}
                >
                  {nightShiftOperators.map(operator => (
                    <Select.Option key={operator.id} value={operator.name}>
                      {operator.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="setupOperator" label="Оператор наладки">
            <Select 
              allowClear 
              placeholder="Выберите оператора наладки"
              loading={operatorsLoading}
              notFoundContent={operatorsLoading ? <Spin size="small" /> : 'Нет данных'}
            >
              {setupOperators.map(operator => (
                <Select.Option key={operator.id} value={operator.name}>
                  {operator.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ShiftEditModal;