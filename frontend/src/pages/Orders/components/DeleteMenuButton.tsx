/**
 * @file: DeleteMenuButton.tsx
 * @description: Кнопка с контекстным меню для удаления заказов
 * @dependencies: antd, ordersApi
 * @created: 2025-07-05
 */
import React from 'react';
import { Button, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ordersApi } from '../../../services/ordersApi';

interface DeleteMenuButtonProps {
  orderId?: number;
  selectedIds?: React.Key[];
  onDeleteSuccess?: () => void;
  disabled?: boolean;
}

export const DeleteMenuButton: React.FC<DeleteMenuButtonProps> = ({
  orderId,
  selectedIds = [],
  onDeleteSuccess,
  disabled = false
}) => {

  // Функция подтверждения удаления
  const showDeleteConfirm = (onOk: () => void, title: string, content: string) => {
    Modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText: 'Да, удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk,
    });
  };

  // Обработчик удаления одного заказа (для ЛКМ)
  const handleDeleteSingle = async () => {
    if (!orderId) return;
    
    try {
      await ordersApi.deleteV2(orderId);
      message.success(`Заказ #${orderId} удален успешно`);
      onDeleteSuccess?.();
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      message.error('Ошибка при удалении заказа');
    }
  };
  
  // Обработчик для "Удалить все"
  const handleDeleteAll = async () => {
    try {
      const result = await ordersApi.deleteAllV2();
      message.success(`Все заказы удалены: ${result.deleted} шт.`);
      onDeleteSuccess?.();
    } catch (error) {
      console.error('Ошибка удаления всех заказов:', error);
      message.error('Ошибка при удалении всех заказов');
    }
  };
  
  // Обработчик для "Удалить выбранные"
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      message.warning('Выберите заказы для удаления');
      return;
    }
    
    try {
      // Конвертируем React.Key[] в number[] для API
      const idsToDelete = selectedIds.map(id => Number(id));
      const result = await ordersApi.deleteSelectedV2(idsToDelete);
      message.success(`Удалено заказов: ${result.deleted} из ${result.total}`);
      onDeleteSuccess?.();
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      message.error('Ошибка при удалении выбранных заказов');
    }
  };
  
  // Определение элементов меню для Dropdown
  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Удалить все',
      onClick: () => showDeleteConfirm(
        handleDeleteAll,
        'Удалить все заказы?',
        'Вы уверены, что хотите удалить все заказы? Это действие нельзя будет отменить.'
      ),
    },
    {
      key: '2', 
      label: `Удалить выбранные (${selectedIds.length})`,
      disabled: selectedIds.length === 0,
      onClick: () => showDeleteConfirm(
        handleDeleteSelected,
        `Удалить ${selectedIds.length} заказов?`,
        'Это действие нельзя будет отменить.'
      ),
    },
  ];

  // Если передан orderId, используем кнопку для одного заказа
  if (orderId) {
    return (
      <Dropdown 
        menu={{ items: menuItems }} 
        trigger={['contextMenu']}
        disabled={disabled}
      >
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            showDeleteConfirm(
              handleDeleteSingle,
              `Удалить заказ #${orderId}?`,
              'Это действие нельзя будет отменить.'
            );
          }}
        />
      </Dropdown>
    );
  }

  // Если orderId не передан, используем только контекстное меню
  return (
    <Dropdown 
      menu={{ items: menuItems }} 
      trigger={['click']}
      disabled={disabled}
    >
      <Button
        type="primary"
        danger
        icon={<DeleteOutlined />}
        disabled={disabled}
      >
        Удалить
      </Button>
    </Dropdown>
  );
};

export default DeleteMenuButton;
