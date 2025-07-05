/**
 * @file: DatabasePage.tsx
 * @description: Адаптивная страница базы данных заказов с поддержкой i18n
 * @dependencies: OrdersList, OrderForm, CSVImportModal, ResponsiveGrid
 * @created: 2025-01-28
 * @updated: 2025-06-30 - Добавлен новый Excel Import Manager с БД
 */
import React, { useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  FileExcelOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/ordersApi';
import { OrdersFilter } from '../../types/order.types';
import { OrdersList } from './components/OrdersList';
import { OrderForm } from './components/OrderForm.SIMPLE';
import { ExcelImportModal } from '../../pages/Orders/components/ExcelImportModal';
import { 
  ResponsiveContainer, 
  ResponsiveActions,
  ResponsiveTableWrapper 
} from '../../components/ResponsiveGrid';
import { useResponsive, responsiveUtils } from '../../hooks';
import './DatabasePage.css';

export const DatabasePage: React.FC = () => {

  const screenInfo = useResponsive();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const [editingOrderId, setEditingOrderId] = useState<number | undefined>();
  const [filter, setFilter] = useState<OrdersFilter>({ page: 1, limit: 10 });
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => ordersApi.getAll(filter),
  });

  // Глобальный callback для обновления списка заказов
  React.useEffect(() => {
    window.refreshOrdersList = async () => {
      console.log('🔄 Обновляем список заказов через React Query...');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      await refetch();
      message.success('✅ Список заказов обновлён!');
    };
    
    return () => {
      delete window.refreshOrdersList;
    };
  }, [queryClient, refetch]);

  const componentSize = responsiveUtils.getComponentSize(screenInfo);
  const cardSize: 'default' | 'small' = screenInfo.isMobile ? 'small' : 'default';

  const handleCreateOrder = () => {
    setEditingOrderId(undefined);
    setShowOrderForm(true);
  };

  const handleEditOrder = (orderId: number) => {
    setEditingOrderId(orderId);
    setShowOrderForm(true);
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      console.log('🗑️ Удаляем заказ с ID:', orderId);
      await ordersApi.delete(orderId);
      message.success('Заказ удален успешно');
      // Принудительно обновляем список заказов
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      await refetch(); // Принудительно перезагружаем данные
      console.log('✅ Заказ успешно удалён и список обновлён');
    } catch (error) {
      console.error('❌ Ошибка при удалении заказа:', error);
      message.error('Ошибка при удалении заказа');
    }
  };

  const handleFormClose = () => {
    setShowOrderForm(false);
    setEditingOrderId(undefined);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };



  const handleExcelImportSuccess = (result: any) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    message.success(
      <div>
        <CheckCircleOutlined /> Импорт завершен успешно!
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Создано: {result.created || 0} заказов
        </div>
      </div>
    );
  };



  return (
    <ResponsiveContainer className="database-page">
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
            Новый заказ
          </Button>
          
          {/* EXCEL ИМПОРТ - ПРОСТОЙ И РАБОЧИЙ */}
          <Tooltip title="Импорт заказов из Excel: колонка C-чертёж, E-количество, I-дедлайн, K-приоритет">
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => setShowExcelImport(true)}
              size={componentSize}
              style={{ 
                background: 'linear-gradient(45deg, #52c41a, #389e0d)',
                border: 'none',
                width: screenInfo.isMobile ? '100%' : 'auto',
                height: screenInfo.isMobile ? 44 : 'auto',
                marginBottom: screenInfo.isMobile ? 8 : 0
              }}
            >
              {screenInfo.isMobile ? 'Excel Импорт' : 'Excel Импорт'}
              <CheckCircleOutlined style={{ marginLeft: 4, color: 'white' }} />
            </Button>
          </Tooltip>

        </div>
      </ResponsiveActions>

      {/* Адаптивная таблица заказов */}
      <ResponsiveTableWrapper>
        <OrdersList
          data={data}
          loading={isLoading}
          error={error}
          filter={filter}
          onFilterChange={setFilter}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onRefresh={refetch}
        />
      </ResponsiveTableWrapper>

      {/* Order creation/editing form */}
      <OrderForm
        visible={showOrderForm}
        orderId={editingOrderId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* Excel Импорт - простой и рабочий */}
      <ExcelImportModal
        visible={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onSuccess={handleExcelImportSuccess}
      />
    </ResponsiveContainer>
  );
};
