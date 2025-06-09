/**
 * @file: DatabasePage.tsx
 * @description: Страница базы данных заказов (ОБНОВЛЕНО: добавлен стабильный CSV импорт)
 * @dependencies: OrdersList, OrderForm, CSVImportModal
 * @created: 2025-01-28
 * @updated: 2025-06-09 // Добавлен стабильный CSV импорт
 */
import React, { useState } from 'react';
import { Button, Row, Col, message, Space, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  ReloadOutlined, 
  ImportOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../services/ordersApi';
import { OrdersFilter } from '../../types/order.types';
import { OrdersList } from './components/OrdersList';
import { OrderForm } from './components/OrderForm.SIMPLE';
import { CSVImportModal } from './components/CSVImportModal';
import ExcelUploaderWithSettings from '../../components/ExcelUploader/ExcelUploaderWithSettings';
import { EnhancedExcelImporter } from '../../components/ExcelUploader/EnhancedExcelImporter';

export const DatabasePage: React.FC = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showEnhancedExcelImport, setShowEnhancedExcelImport] = useState(false);
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
  };

  const handleCSVImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    message.success('Данные успешно импортированы через CSV');
  };

  const handleEnhancedExcelImportSuccess = (result: any) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    message.success(
      `Улучшенный Excel импорт завершен! Создано: ${result.created}, Обновлено: ${result.updated}`,
      6
    );
  };

  const handleExcelUpload = async (file: File, data?: any[], settings?: any) => {
    try {
      console.log('🔶 ПОПЫТКА ЗАГРУЗКИ EXCEL (может быть нестабильно)');
      console.log('Файл:', file.name, 'Размер:', file.size);
      
      // Проверяем backend
      try {
        const healthCheck = await fetch('http://localhost:5100/api/orders', {
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
            <div><WarningOutlined /> Backend сервер недоступен!</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Попробуйте <strong>стабильный CSV импорт</strong> вместо Excel
            </div>
          </div>,
          6
        );
        throw error;
      }
      
      // Пытаемся загрузить Excel (нестабильно)
      const result = await ordersApi.importExcel(
        file, 
        settings?.colorFilters?.filter((f: any) => f.selected)?.map((f: any) => f.color) || []
      );
      
      console.log('✅ Excel импорт успешен:', result);
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      message.success(
        <div>
          <CheckCircleOutlined /> Excel импорт завершен!
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Создано: {result.created || 0}, Обновлено: {result.updated || 0}
          </div>
        </div>,
        4
      );
      
      return result;
      
    } catch (error) {
      console.error('❌ Ошибка Excel импорта:', error);
      
      // Предлагаем альтернативу
      message.error(
        <div>
          <div><WarningOutlined /> Ошибка загрузки Excel файла</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#1890ff' }}>
            💡 Попробуйте <strong>стабильный CSV импорт</strong> - он работает всегда!
          </div>
        </div>,
        8
      );
      
      // Автоматически открываем CSV импорт как альтернативу
      setTimeout(() => {
        setShowCSVImport(true);
      }, 2000);
      
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
              
              <Space.Compact>
                {/* Стабильный CSV импорт - рекомендуется */}
                <Tooltip title="100% надежный импорт данных через копипаст из Excel">
                  <Button
                    type="primary"
                    icon={<ImportOutlined />}
                    onClick={() => setShowCSVImport(true)}
                    style={{ 
                      background: '#52c41a',
                      borderColor: '#52c41a'
                    }}
                  >
                    CSV Импорт
                    <CheckCircleOutlined style={{ marginLeft: 4 }} />
                  </Button>
                </Tooltip>
                
                {/* 🆕 НОВЫЙ Улучшенный Excel импорт */}
                <Tooltip title="🆕 НОВЫЙ! Улучшенный Excel импорт с детальным анализом и выбором">
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={() => setShowEnhancedExcelImport(true)}
                    style={{ 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      border: 'none'
                    }}
                  >
                    Excel 2.0
                    <CheckCircleOutlined style={{ marginLeft: 4, color: '#52c41a' }} />
                  </Button>
                </Tooltip>
                
                {/* Старый Excel загрузчик - может быть нестабилен */}
                <Tooltip title="Старая загрузка Excel файлов (может быть нестабильна)">
                  <Button
                    type="default"
                    icon={<FileExcelOutlined />}
                    onClick={() => {
                      // Создаем input для выбора файла
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.xlsx,.xls';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleExcelUpload(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    Excel 1.0
                    <WarningOutlined style={{ marginLeft: 4, color: '#faad14' }} />
                  </Button>
                </Tooltip>
              </Space.Compact>
              
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

      {/* Форма создания/редактирования заказа */}
      <OrderForm
        visible={showOrderForm}
        orderId={editingOrderId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* НОВЫЙ: Стабильный CSV импорт */}
      <CSVImportModal
        visible={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={handleCSVImportSuccess}
      />

      {/* 🆕 НОВЫЙ: Улучшенный Excel импорт */}
      <EnhancedExcelImporter
        visible={showEnhancedExcelImport}
        onClose={() => setShowEnhancedExcelImport(false)}
        onSuccess={handleEnhancedExcelImportSuccess}
      />
    </div>
  );
};
