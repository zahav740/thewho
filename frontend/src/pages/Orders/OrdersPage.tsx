/**
 * @file: OrdersPage.tsx
 * @description: Улучшенная страница заказов с интеллектуальной системой приоритетов
 * @dependencies: OrdersList, OrderForm, ExcelImportModal, ResponsiveGrid
 * @created: 2025-07-03
 * @updated: 2025-07-03 - Создана улучшенная версия с исправленной загрузкой Excel
 */
import React, { useState, useCallback } from 'react';
import { Button, Row, Col, message, Space, Tooltip, Modal, Card, Typography, Statistic } from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined, 
  FileExcelOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  CalendarOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/ordersApi';
import { OrdersV2Filter } from '../../types/order-v2.types';
import { OrdersList } from './components/OrdersList';
import { OrderForm } from './components/OrderForm';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DeleteMenuButton } from './components/DeleteMenuButton';
import { useTranslation } from '../../i18n';
import { 
  ResponsiveContainer, 
  ResponsiveActions,
  ResponsiveTableWrapper 
} from '../../components/ResponsiveGrid';
import { useResponsive, responsiveUtils } from '../../hooks';
import './OrdersPage.css';

const { Title, Text } = Typography;

export const OrdersPage: React.FC = () => {
  const { t, tWithParams } = useTranslation();
  const screenInfo = useResponsive();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | undefined>();
  const [selectedOrderIds, setSelectedOrderIds] = useState<React.Key[]>([]); // НОВОЕ: правильный тип
  const handleSelectionChange = useCallback((keys: React.Key[]) => {
    setSelectedOrderIds(keys);
  }, []);
  const [filter, setFilter] = useState<OrdersV2Filter>({ page: 1, limit: 10 });
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders-v2', filter],
    queryFn: () => ordersApi.getAllV2(filter as any),
  });

  // Глобальный callback для обновления списка заказов
  React.useEffect(() => {
    // Обновляем API для использования правильного endpoint
window.refreshOrdersListV2 = async () => {
    console.log('🔄 Обновляем список заказов V2 через React Query...');
    queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
    await refetch();
  message.success('✅ Список заказов обновлён!');
};
    
    return () => {
      delete window.refreshOrdersListV2;
    };
  }, [queryClient, refetch]);

  const componentSize = responsiveUtils.getComponentSize(screenInfo);
  const cardSize: 'default' | 'small' = screenInfo.isMobile ? 'small' : 'default';

  const handleCreateOrder = useCallback(() => {
    setEditingOrderId(undefined);
    setShowOrderForm(true);
  }, []);

  const handleEditOrder = useCallback((orderId: number) => {
    setEditingOrderId(orderId);
    setShowOrderForm(true);
  }, []);

  const handleDeleteSuccess = useCallback(async () => {
    console.log('✅ Успешное удаление - обновляем список');
    setSelectedOrderIds([]); // Очищаем выбор
    
    // 🔧 АГРЕССИВНОЕ ОБНОВЛЕНИЕ КЭША
    queryClient.clear(); // Очищаем весь кэш
    queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
    
    // Принудительное обновление с первой страницы
    setFilter({ page: 1, limit: 10 });
    await refetch();
    
    console.log('📋 Кэш очищен, список обновлен');
  }, [queryClient, refetch, setFilter]);

  const handleDeleteOrder = useCallback(async (orderId: number) => {
    try {
      console.log('🗑️ Удаляем заказ с ID:', orderId);
      await ordersApi.deleteV2(orderId);
      message.success(t('message.success.deleted'));
      await handleDeleteSuccess();
      console.log('✅ Заказ успешно удалён и список обновлён');
    } catch (error) {
      console.error('❌ Ошибка при удалении заказа:', error);
      message.error(t('message.error.delete'));
    }
  }, [handleDeleteSuccess, t]);

  const handleFormClose = useCallback(() => {
    setShowOrderForm(false);
    setEditingOrderId(undefined);
  }, []);

  const handleFormSuccess = useCallback(() => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
  }, [handleFormClose, queryClient]);

  const handleExcelImportSuccess = useCallback(async (result: any) => {
    console.log('✅ Excel импорт успешно завершен:', result);
    
    // Обновляем кэш
    queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
    
    // Показываем детальное сообщение
    message.success(
      <div>
        <CheckCircleOutlined style={{ color: '#52c41a' }} /> Excel импорт завершен успешно!
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Создано: {result.created || 0}, Обновлено: {result.updated || 0}
          {result.prioritized && <div>🎯 Приоритеты автоматически распределены</div>}
        </div>
      </div>
    );
    
    // Принудительно обновляем данные
    await refetch();
  }, [queryClient, refetch]);

  const handleRefresh = useCallback(async () => {
    console.log('🔄 Принудительное обновление списка заказов...');
    queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
    await refetch();
    message.success('✅ Данные обновлены');
  }, [queryClient, refetch]);

  // Статистика заказов
  const stats = React.useMemo(() => {
    if (!data?.data) return { total: 0, highPriority: 0, overdue: 0, pending: 0 };
    
    const orders = data.data;
    const totalOrders = data.total || 0; // 🔧 ИСПРАВЛЕНО: используем общее количество
    const now = new Date();
    
    return {
      total: totalOrders, // 🔧 Общее количество из API, а не на странице
      highPriority: orders.filter((o: any) => String(o.priority) === 'HIGH').length,
      overdue: orders.filter((o: any) => new Date(o.deadline) < now).length,
      pending: orders.filter((o: any) => (o as any).status === 'pending').length
    };
  }, [data]);

  return (
    <ResponsiveContainer className="orders-page">
      {/* Заголовок и статистика */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 16 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          Заказы
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size={cardSize}>
              <Statistic
                title="Всего заказов"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DashboardOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size={cardSize}>
              <Statistic
                title="Высокий приоритет"
                value={stats.highPriority}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FlagOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size={cardSize}>
              <Statistic
                title="Просрочено"
                value={stats.overdue}
                valueStyle={{ color: '#faad14' }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size={cardSize}>
              <Statistic
                title="В ожидании"
                value={stats.pending}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Адаптивная панель действий */}
      <ResponsiveActions 
        direction="auto" 
        justify={screenInfo.isMobile ? 'center' : 'space-between'}
        className="actions-section"
        style={{ marginBottom: screenInfo.isMobile ? 16 : 24 }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: screenInfo.isMobile ? 'column' : 'row',
          gap: screenInfo.isMobile ? 8 : 12,
          width: screenInfo.isMobile ? '100%' : 'auto'
        }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateOrder}
            size={componentSize}
            style={{ 
              width: screenInfo.isMobile ? '100%' : 'auto',
              height: screenInfo.isMobile ? 44 : 'auto'
            }}
          >
            {t('database.new_order')}
          </Button>
          
          <Tooltip title="Импорт Excel с автоматическим распределением приоритетов">
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => setShowExcelImport(true)}
              size={componentSize}
              style={{ 
                background: '#52c41a',
                borderColor: '#52c41a',
                width: screenInfo.isMobile ? '100%' : 'auto',
                height: screenInfo.isMobile ? 44 : 'auto'
              }}
            >
              {screenInfo.isMobile ? 'Excel импорт' : 'Excel импорт'}
              <CheckCircleOutlined style={{ marginLeft: 4 }} />
            </Button>
          </Tooltip>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            size={componentSize}
            style={{ 
              width: screenInfo.isMobile ? '100%' : 'auto',
              height: screenInfo.isMobile ? 44 : 'auto'
            }}
          >
            {t('database.refresh')}
          </Button>
          
          {/* НОВОЕ: Кнопка с контекстным меню для удаления */}
          <DeleteMenuButton
            selectedIds={selectedOrderIds}
            onDeleteSuccess={handleDeleteSuccess}
            disabled={isLoading}
          />
        </div>
      </ResponsiveActions>

      {/* Адаптивная таблица заказов */}
      <ResponsiveTableWrapper>
        <OrdersList
          data={data as any}
          loading={isLoading}
          error={error}
          filter={filter}
          onFilterChange={setFilter}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onRefresh={handleRefresh}
          selectedRowKeys={selectedOrderIds} // НОВОЕ
          onSelectionChange={handleSelectionChange} // Используем правильный коллбэк
        />
      </ResponsiveTableWrapper>

      {/* Форма создания/редактирования заказа */}
      <OrderForm
        visible={showOrderForm}
        orderId={editingOrderId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Модальное окно Excel импорта */}
      <ExcelImportModal
        visible={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onSuccess={handleExcelImportSuccess}
      />
    </ResponsiveContainer>
  );
};
