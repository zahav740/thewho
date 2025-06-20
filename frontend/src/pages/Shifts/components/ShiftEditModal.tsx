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
import { useTranslation } from '../../../i18n';
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
  const { t } = useTranslation();
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
      message.success(t('shifts.shift_updated'));
      // Немедленно обновляем все связанные данные
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      onClose();
    },
    onError: (error) => {
      console.error('Ошибка обновления смены:', error);
      message.error(t('shifts.update_error'));
    }
  });

  // НОВОЕ: Мутация для создания новой смены с немедленным обновлением данных
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => shiftsApi.create(data),
    onSuccess: () => {
      message.success(t('shifts.shift_created'));
      // Немедленно обновляем все связанные данные
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['machines-availability'] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      onClose();
    },
    onError: (error) => {
      console.error('Ошибка создания смены:', error);
      message.error(t('shifts.create_error'));
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
      message.error(t('shifts.validation_error'));
    });
  };

  return (
    <Modal
      title={editingShift ? t('shifts.edit_shift') : t('shifts.create_shift')}
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      width={800}
      okText={t('shifts.save_button')}
      cancelText={t('shifts.cancel_button')}
      confirmLoading={updateShiftMutation.isPending || createShiftMutation.isPending}
      okButtonProps={{
        icon: <SaveOutlined />
      }}
    >
      <Spin spinning={operatorsLoading} tip={t('shifts.loading_operators')}>
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
                label={t('shifts.shift_date')}
                rules={[{ required: true, message: t('shifts.select_date') }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shiftType"
                label={t('shifts.shift_type')}
                rules={[{ required: true, message: t('shifts.select_shift_type') }]}
              >
                <Select>
                  <Select.Option value="DAY">{t('shifts.day_shift')}</Select.Option>
                  <Select.Option value="NIGHT">{t('shifts.night_shift')}</Select.Option>
                  <Select.Option value="BOTH">{t('shifts.both_shifts')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="drawingnumber" label={t('shifts.drawing_number')}>
                <Input placeholder={t('shifts.drawing_placeholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="setupTime" label={t('shifts.setup_time_minutes')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>{t('shifts.day_shift')}</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dayShiftQuantity" label={t('shifts.part_count')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dayShiftTimePerUnit" label={t('shifts.time_per_part')}>
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dayShiftOperator" label={t('form.operator')}>
                <Select 
                  allowClear 
                  placeholder={t('shifts.select_operator')}
                  loading={operatorsLoading}
                  notFoundContent={operatorsLoading ? <Spin size="small" /> : t('message.no_data')}
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

          <Divider>{t('shifts.night_shift')}</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nightShiftQuantity" label={t('shifts.part_count')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nightShiftTimePerUnit" label={t('shifts.time_per_part')}>
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nightShiftOperator" label={t('form.operator')}>
                <Select 
                  placeholder={t('shifts.select_operator')}
                  loading={operatorsLoading}
                  notFoundContent={operatorsLoading ? <Spin size="small" /> : t('message.no_data')}
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

          <Form.Item name="setupOperator" label={t('shifts.setup_operator')}>
            <Select 
              allowClear 
              placeholder={t('shifts.select_operator')}
              loading={operatorsLoading}
              notFoundContent={operatorsLoading ? <Spin size="small" /> : t('message.no_data')}
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