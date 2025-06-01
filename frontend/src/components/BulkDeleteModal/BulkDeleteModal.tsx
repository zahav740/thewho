/**
 * @file: BulkDeleteModal.tsx
 * @description: Модальное окно для массового удаления с возможностью исключения
 * @dependencies: antd, ordersApi
 * @created: 2025-05-30
 */
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Table, 
  Checkbox, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Tag,
  Input,
  message,
  Alert 
} from 'antd';
import { 
  DeleteOutlined, 
  ExclamationCircleOutlined, 
  SearchOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { Order } from '../../types/order.types';

const { Title, Text } = Typography;

interface BulkDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orders: Order[];
  onDeleteBatch: (idsToDelete: string[]) => Promise<{ deleted: number; }>;
  totalOrdersCount?: number; // Общее количество заказов в базе
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  visible,
  onClose,
  onSuccess,
  orders,
  onDeleteBatch,
  totalOrdersCount,
}) => {
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Сброс состояния при открытии модального окна
  useEffect(() => {
    if (visible) {
      setExcludedIds([]);
      setSearchText('');
    }
  }, [visible]);

  // Фильтрация заказов по поисковому запросу
  const filteredOrders = orders.filter(order => 
    order.drawingNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
    order.workType?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Подсчеты
  const totalOrders = totalOrdersCount || orders.length; // Используем общее количество из БД
  const loadedOrders = orders.length; // Количество загруженных заказов
  const excludedCount = excludedIds.length;
  const toDeleteCount = totalOrders - excludedCount;

  // Обработка чекбокса "исключить из удаления"
  const handleExcludeToggle = (orderId: string, exclude: boolean) => {
    if (exclude) {
      setExcludedIds(prev => [...prev, orderId]);
    } else {
      setExcludedIds(prev => prev.filter(id => id !== orderId));
    }
  };

  // Исключить ВСЕ заказы (не только видимые)
  const handleExcludeAll = () => {
    const allIds = orders.map(order => order.id.toString());
    setExcludedIds(allIds);
  };

  // Включить ВСЕ заказы (не только видимые) 
  const handleIncludeAll = () => {
    setExcludedIds([]);
  };

  // Исключить все видимые (для работы с фильтром)
  const handleExcludeAllVisible = () => {
    const visibleIds = filteredOrders.map(order => order.id.toString());
    const uniqueIds = Array.from(new Set([...excludedIds, ...visibleIds]));
    setExcludedIds(uniqueIds);
  };

  // Включить все видимые (для работы с фильтром)
  const handleIncludeAllVisible = () => {
    const visibleIds = filteredOrders.map(order => order.id.toString());
    setExcludedIds(prev => prev.filter(id => !visibleIds.includes(id)));
  };

  // Выполнение удаления
  const handleConfirmDelete = async () => {
    if (toDeleteCount === 0) {
      message.warning('Нет заказов для удаления');
      return;
    }

    Modal.confirm({
      title: 'Подтвердите массовое удаление',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p><strong>Будет удалено: {toDeleteCount} заказов</strong></p>
          <p><strong>Будет сохранено: {excludedCount} заказов</strong></p>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            ⚠️ Это действие нельзя отменить!
          </p>
        </div>
      ),
      okText: `Удалить ${toDeleteCount} заказов`,
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        setLoading(true);
        try {
          // Получаем ID заказов для удаления (все кроме исключенных)
          const idsToDelete = orders
            .filter(order => !excludedIds.includes(order.id.toString()))
            .map(order => order.id.toString());

          const result = await onDeleteBatch(idsToDelete);
          
          message.success(`Успешно удалено ${result.deleted} заказов`);
          onSuccess();
          onClose();
        } catch (error) {
          message.error('Ошибка при удалении заказов');
          console.error('Bulk delete error:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={excludedIds.length === filteredOrders.length && filteredOrders.length > 0}
          indeterminate={excludedIds.length > 0 && excludedIds.length < filteredOrders.length}
          onChange={(e) => {
            if (e.target.checked) {
              handleExcludeAllVisible();
            } else {
              handleIncludeAllVisible();
            }
          }}
        >
          Действие
        </Checkbox>
      ),
      key: 'action',
      width: 150,
      render: (_: any, record: Order) => {
        const isExcluded = excludedIds.includes(record.id.toString());
        return (
          <Checkbox
            checked={isExcluded}
            onChange={(e) => handleExcludeToggle(record.id.toString(), e.target.checked)}
          >
            {isExcluded ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Сохранить
              </Tag>
            ) : (
              <Tag color="red" icon={<DeleteOutlined />}>
                Удалить
              </Tag>
            )}
          </Checkbox>
        );
      },
    },
    {
      title: 'Номер чертежа',
      dataIndex: 'drawingNumber',
      key: 'drawingNumber',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: 'Тип работы',
      dataIndex: 'workType',
      key: 'workType',
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => {
        const colors = ['', 'red', 'orange', 'blue', 'green'];
        const labels = ['', 'Критический', 'Высокий', 'Средний', 'Низкий'];
        return <Tag color={colors[priority]}>{labels[priority] || priority}</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DeleteOutlined style={{ color: '#ff4d4f' }} />
          <span>Массовое удаление заказов</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          loading={loading}
          disabled={toDeleteCount === 0}
          onClick={handleConfirmDelete}
          icon={<DeleteOutlined />}
        >
          Удалить {toDeleteCount} заказов
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>
          Выберите заказы для сохранения (остальные будут удалены)
        </Title>
        {totalOrdersCount && totalOrdersCount !== loadedOrders && (
          <Alert
            message="Внимание!"
            description={`Загружено ${loadedOrders} из ${totalOrdersCount} заказов. Все ${totalOrdersCount} заказов будут обработаны при удалении.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Space wrap style={{ marginBottom: 16 }}>
          <Tag color="blue">Всего заказов: {totalOrders}</Tag>
          <Tag color="green">К сохранению: {excludedCount}</Tag>
          <Tag color="red">К удалению: {toDeleteCount}</Tag>
        </Space>

        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="Поиск по номеру чертежа или типу работы"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
            {searchText && (
              <Text type="secondary">
                Найдено: {filteredOrders.length} из {orders.length}
              </Text>
            )}
          </Space>
          
          <Space wrap>
            <Text strong>Быстрые действия:</Text>
            
            {/* Предустановленные варианты */}
            <Button 
              onClick={() => {
                setExcludedIds([]);
                message.info('Все заказы будут удалены');
              }}
              icon={<DeleteOutlined />}
              danger
            >
              Отметить все для удаления
            </Button>
            
            <Button 
              onClick={() => {
                const allIds = orders.map(order => order.id.toString());
                setExcludedIds(allIds);
                message.info('Все заказы будут сохранены');
              }}
              icon={<CheckCircleOutlined />}
              type="primary"
              ghost
            >
              Отметить все для сохранения
            </Button>
            
            <Divider type="vertical" />
            
            {/* Работа с видимыми */}
            {filteredOrders.length !== orders.length && (
              <>
                <Button 
                  onClick={handleExcludeAllVisible} 
                  size="small"
                  ghost
                >
                  Сохранить видимые ({filteredOrders.length})
                </Button>
                <Button 
                  onClick={handleIncludeAllVisible} 
                  size="small"
                  danger
                  ghost
                >
                  Удалить видимые ({filteredOrders.length})
                </Button>
              </>
            )}
          </Space>
        </Space>

        <Divider />

        <Alert
          message="Как это работает"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Отметьте чекбоксами заказы, которые нужно <strong style={{color: '#52c41a'}}>сохранить</strong></li>
              <li>Неотмеченные заказы будут <strong style={{color: '#ff4d4f'}}>удалены</strong></li>
              <li>Используйте чекбокс в заголовке таблицы для выбора всех видимых заказов</li>
              <li>Кнопки быстрых действий помогут быстро отметить все заказы</li>
            </ul>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} из ${total} заказов`,
        }}
        scroll={{ y: 400 }}
        size="small"
      />
    </Modal>
  );
};

export default BulkDeleteModal;
