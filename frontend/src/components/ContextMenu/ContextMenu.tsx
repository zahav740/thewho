/**
 * @file: ContextMenu.tsx
 * @description: Универсальный компонент контекстного меню с ПКМ
 * @dependencies: antd
 * @created: 2025-05-28
 */
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Modal } from 'antd';
import {
  DeleteOutlined,
  SelectOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface ContextMenuProps {
  children: React.ReactNode;
  onDeleteSelected?: () => void;
  onDeleteAll?: () => void;
  onDeleteAllWithExclusions?: () => void; // Новая опция
  selectedCount?: number;
  totalCount?: number;
  entityName?: string; // 'заказы', 'операции', 'станки' и т.д.
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  onDeleteSelected,
  onDeleteAll,
  onDeleteAllWithExclusions, // Новый параметр
  selectedCount = 0,
  totalCount = 0,
  entityName = 'элементы',
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Получаем размеры окна и меню
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 250; // Увеличенная ширина для длинных текстов
    const menuHeight = 150; // Увеличенная высота для всех пунктов
    
    // Вычисляем позицию с учетом границ экрана
    let x = e.clientX;
    let y = e.clientY;
    
    // Если меню выходит за правую границу экрана
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    
    // Если меню выходит за нижнюю границу экрана
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }
    
    // Убеждаемся, что координаты не отрицательные
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenu({
      visible: true,
      x: x,
      y: y,
    });
  };

  const handleCloseMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      Modal.warning({
        title: 'Нет выбранных элементов',
        content: `Выберите ${entityName} для удаления`,
        icon: <ExclamationCircleOutlined />,
      });
      handleCloseMenu();      
      return;
    }

    Modal.confirm({
      title: 'Подтвердите удаление',
      content: `Вы уверены, что хотите удалить ${selectedCount} выбранных ${entityName}?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: () => {
        onDeleteSelected?.();
        handleCloseMenu();
      },
      onCancel: handleCloseMenu,
    });
  };

  const handleDeleteAll = () => {
    if (totalCount === 0) {
      Modal.info({
        title: 'Нет данных',
        content: `Нет ${entityName} для удаления`,
        icon: <ExclamationCircleOutlined />,
      });
      handleCloseMenu();
      return;
    }

    Modal.confirm({
      title: 'Подтвердите удаление всех данных',
      content: (
        <div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            ⚠️ ВНИМАНИЕ! Это действие нельзя отменить!
          </p>
          <p>
            Вы уверены, что хотите удалить ВСЕ {totalCount} {entityName}?
          </p>
        </div>
      ),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      okText: 'Удалить все',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: () => {
        // Двойное подтверждение для удаления всех данных
        Modal.confirm({
          title: 'Последнее предупреждение',
          content: `Это действительно удалит ВСЕ ${totalCount} ${entityName}. Продолжить?`,
          icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
          okText: 'ДА, УДАЛИТЬ ВСЕ',
          okType: 'danger',
          cancelText: 'Отмена',
          onOk: () => {
            onDeleteAll?.();
            handleCloseMenu();
          },
          onCancel: handleCloseMenu,
        });
      },
      onCancel: handleCloseMenu,
    });
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu.visible]);

  // Закрытие меню при нажатии Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contextMenu.visible]);

  const menuItems = [
    {
      key: 'delete-selected',
      icon: <SelectOutlined />,
      label: `Удалить выбранные (${selectedCount})`,
      onClick: handleDeleteSelected,
      disabled: !onDeleteSelected,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete-all-with-exclusions',
      icon: <SelectOutlined style={{ color: '#faad14' }} />,
      label: (
        <span style={{ color: '#faad14' }}>
          Удалить все с выбором ({totalCount})
        </span>
      ),
      onClick: () => {
        onDeleteAllWithExclusions?.();
        handleCloseMenu();
      },
      disabled: !onDeleteAllWithExclusions || totalCount === 0,
    },
    {
      key: 'delete-all',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      label: (
        <span style={{ color: '#ff4d4f' }}>
          Удалить все ({totalCount})
        </span>
      ),
      onClick: handleDeleteAll,
      disabled: !onDeleteAll,
    },
  ];

  return (
    <>
      <div onContextMenu={handleContextMenu} style={{ height: '100%', width: '100%' }}>
        {children}
      </div>

      {contextMenu.visible && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            padding: '4px 0',
            minWidth: '250px',
          }}
        >
          <Menu
            items={menuItems}
            style={{ border: 'none' }}
            onClick={() => handleCloseMenu()}
          />
        </div>
      )}
    </>
  );
};

export default ContextMenu;
