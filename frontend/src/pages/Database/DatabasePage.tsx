/**
 * @file: DatabasePage.tsx
 * @description: Страница базы данных заказов
 * @dependencies: OrdersList, OrderForm, ExcelUploader
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { Button, Row, Col, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/ordersApi';
import { OrdersFilter } from '../../types/order.types';
import { OrdersList } from './components/OrdersList';
import { OrderForm } from './components/OrderForm';
import ExcelUploaderWithSettings from '../../components/ExcelUploader/ExcelUploaderWithSettings';

export const DatabasePage: React.FC = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | undefined>();
  const [filter, setFilter] = useState<OrdersFilter>({ page: 1, limit: 10 });
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => ordersApi.getAll(filter),
  });

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
      await ordersApi.delete(orderId);
      message.success('Заказ успешно удален');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error) {
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
    // Не обновляем planning, так как он независим
  };

  const handleExcelUpload = async (file: File, data?: any[], settings?: any) => {
    try {
      console.log('Начало импорта файла:', file.name);
      console.log('Настройки:', settings);
      
      // Проверяем, что backend доступен сначала простым запросом
      try {
        const healthCheck = await fetch('http://localhost:3001/api/orders', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!healthCheck.ok) {
          throw new Error(`Backend недоступен: ${healthCheck.status}`);
        }
      } catch (error) {
        console.error('Backend недоступен:', error);
        message.error(
          <div>
            <div>Backend сервер недоступен!</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Убедитесь, что сервер запущен на порту 3001
            </div>
          </div>,
          5
        );
        throw error;
      }
      
      // Отправляем файл напрямую через API
      const result = await ordersApi.importExcel(
        file, 
        settings?.colorFilters?.filter((f: any) => f.selected)?.map((f: any) => f.color) || []
      );
      
      console.log('Результат импорта:', result);
      
      // Обновляем список заказов
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      message.success(
        <div>
          <div>Импорт завершен успешно!</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Создано: {result.created || 0}, Обновлено: {result.updated || 0}
          </div>
        </div>,
        3
      );
      
      return result;
    } catch (error) {
      console.error('Ошибка импорта:', error);
      
      let errorMessage = 'Ошибка при импорте файла';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'API эндпоинт не найден - проверьте backend сервер';
        } else if (error.message.includes('500')) {
          errorMessage = 'Ошибка сервера при обработке файла';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Ошибка сети - проверьте подключение к серверу';
        }
      }
      
      message.error(errorMessage, 4);
      throw error;
    }
  };


  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="actions-bar">
            <div className="actions-bar-left">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateOrder}
              >
                Новый заказ
              </Button>
              <ExcelUploaderWithSettings 
                onUpload={handleExcelUpload}
                onPreview={(data) => console.log('Превью:', data)}
                title="Загрузка заказов из Excel"
                description="Перетащите Excel файл с заказами или нажмите для выбора"
                maxFileSize={10}
                acceptedFormats={['.xlsx', '.xls']}
                showPreview={true}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                Обновить
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
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
        </Col>
      </Row>

      <OrderForm
        visible={showOrderForm}
        orderId={editingOrderId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};
