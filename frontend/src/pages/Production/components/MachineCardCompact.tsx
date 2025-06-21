/**
 * @file: MachineCardCompact.tsx
 * @description: Компактная карточка станка с минимальной информацией
 * @dependencies: antd, machine.types
 * @created: 2025-06-21
 * @updated: 2025-06-21 - Компактный дизайн без лишней информации
 */
import React, { useState } from 'react';
import { Card, Tag, Badge, Button, Typography, Space, Modal, message } from 'antd';
import { 
  ToolOutlined, 
  CheckCircleOutlined, 
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import { 
  MachineAvailability, 
  getMachineTypeLabel 
} from '../../../types/machine.types';
import { machinesApi } from '../../../services/machinesApi';
import { MachineDetailsModal } from './MachineDetailsModal';

const { confirm } = Modal;
const { Text } = Typography;

interface MachineCardCompactProps {
  machine: MachineAvailability;
  isSelected: boolean;
  onSelect: () => void;
  onOpenPlanningModal?: (machine: MachineAvailability) => void;
}

export const MachineCardCompact: React.FC<MachineCardCompactProps> = ({
  machine,
  isSelected,
  onSelect,
  onOpenPlanningModal,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Мутация для освобождения станка с отменой операции
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
      
      message.success(`Станок "${machine.machineName}" освобожден`);
      
      // Открываем модальное окно планирования
      if (onOpenPlanningModal) {
        setTimeout(() => {
          onOpenPlanningModal(updatedMachine);
        }, 1000);
      }
      
      onSelect();
    },
    onError: (error) => {
      console.error('Ошибка освобождения станка:', error);
      message.error('Ошибка при освобождении станка');
    },
  });

  // Мутация для простого изменения статуса
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (isAvailable: boolean) => {
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

  const handleAvailabilityChange = (checked: boolean) => {
    if (checked && machine.isAvailable && onOpenPlanningModal) {
      // Если станок уже свободен и мы ставим галочку, открываем планирование
      onOpenPlanningModal(machine);
    } else if (checked && !machine.isAvailable && machine.currentOperationId) {
      // Освобождение занятого станка с операцией
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
          updateAvailabilityMutation.mutate(checked);
        },
      });
    }
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

  // Определяем есть ли активная операция
  const hasActiveOperation = machine.currentOperationDetails || machine.currentOperationId;

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
          minHeight: 180, // Уменьшенная высота
          transition: 'all 0.3s ease',
          boxShadow: isSelected 
            ? `0 4px 16px ${machineTypeColor}30` 
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
        styles={{
          body: { padding: '16px' } // Уменьшенный padding
        }}
      >
        {/* Заголовок карточки */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
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
          <Badge 
            status={machine.isAvailable ? "success" : "processing"} 
            text={machine.isAvailable ? t('machine.status.available') : t('machine.status.busy')} 
          />
        </div>

        {/* Тип станка */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Tag 
            color={machineTypeColor}
            style={{ 
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {getMachineIcon(machine.machineType)} {getMachineTypeLabel(machine.machineType)}
          </Tag>
        </div>

        {/* Индикатор активной операции (если есть) */}
        {hasActiveOperation && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#fff7e6',
            borderRadius: '6px',
            border: '1px solid #ffd591'
          }}>
            <Text strong style={{ fontSize: '12px', color: '#d46b08' }}>
              📋 Активная операция
            </Text>
            {machine.currentOperationDetails && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {machine.currentOperationDetails.orderDrawingNumber}
              </div>
            )}
          </div>
        )}

        {/* Основные кнопки */}
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {machine.isAvailable ? (
            // Для свободных станков - кнопка планирования
            onOpenPlanningModal && (
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
                  height: '40px',
                  fontWeight: 'bold'
                }}
              >
                <Space>
                  {getMachineIcon(machine.machineType)}
                  <span>MILLING</span>
                </Space>
              </Button>
            )
          ) : (
            // Для занятых станков - кнопка освобождения
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
              ✅ Освободить
            </Button>
          )}

          {/* Кнопки действий */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setDetailsModalVisible(true);
              }}
              style={{ flex: 1, fontSize: '12px' }}
            >
              Подробно
            </Button>
            
            <Button
              type={isSelected ? 'primary' : 'default'}
              size="small"
              icon={isSelected ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
              style={{ 
                flex: 1, 
                fontSize: '12px',
                backgroundColor: isSelected ? machineTypeColor : undefined,
                borderColor: isSelected ? machineTypeColor : undefined,
              }}
            >
              {isSelected ? 'Выбран' : 'Выбрать'}
            </Button>
          </div>
        </Space>
      </Card>

      {/* Модальное окно с подробной информацией */}
      <MachineDetailsModal
        visible={detailsModalVisible}
        machine={machine}
        onClose={() => setDetailsModalVisible(false)}
        onOpenPlanningModal={onOpenPlanningModal}
        onFreeAndClear={() => freeAndClearOperationMutation.mutate()}
        onUpdateAvailability={(isAvailable) => updateAvailabilityMutation.mutate(isAvailable)}
        loading={freeAndClearOperationMutation.isPending || updateAvailabilityMutation.isPending}
      />
    </>
  );
};
