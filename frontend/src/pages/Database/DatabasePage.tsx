/**
 * @file: DatabasePage.tsx
 * @description: Адаптивная страница базы данных заказов с поддержкой i18n
 * @dependencies: OrdersList, OrderForm, CSVImportModal, ResponsiveGrid
 * @created: 2025-01-28
 * @updated: 2025-06-18 - Добавлена полная адаптивность для всех устройств
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
import { EnhancedExcelImporter } from '../../components/ExcelUploader/EnhancedExcelImporter';
import { useTranslation } from '../../i18n';
import { 
  ResponsiveContainer, 
  ResponsiveActions,
  ResponsiveTableWrapper 
} from '../../components/ResponsiveGrid';
import { useResponsive, responsiveUtils } from '../../hooks';
import './DatabasePage.css';

export const DatabasePage: React.FC = () => {
  const { t, tWithParams } = useTranslation();
  const screenInfo = useResponsive();
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
      await ordersApi.delete(orderId);
      message.success(t('message.success.deleted'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error) {
      message.error(t('message.error.delete'));
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
    message.success(t('message.success.csv_imported'));
  };

  const handleEnhancedExcelImportSuccess = (result: any) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    message.success(
      tWithParams('message.success.excel_imported', { created: result.created, updated: result.updated })
    );
  };

  const handleExcelUpload = async (file: File, data?: any[], settings?: any) => {
    try {
      console.log('🔶 Excel upload attempt (may be unstable)');
      console.log('File:', file.name, 'Size:', file.size);
      
      // Check backend
      try {
        const healthCheck = await fetch('http://localhost:5100/api/orders', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!healthCheck.ok) {
          throw new Error(`Backend unavailable: ${healthCheck.status}`);
        }
      } catch (error) {
        console.error('Backend unavailable:', error);
        message.error(
          <div>
            <div><WarningOutlined /> {t('message.error.backend_unavailable')}</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {t('message.try_csv_instead')}
            </div>
          </div>
        );
        throw error;
      }
      
      // Try Excel upload (unstable)
      const result = await ordersApi.importExcel(
        file, 
        settings?.colorFilters?.filter((f: any) => f.selected)?.map((f: any) => f.color) || []
      );
      
      console.log('✅ Excel import successful:', result);
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      message.success(
        <div>
          <CheckCircleOutlined /> {t('message.success.excel_completed')}
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {tWithParams('message.created_updated', { created: result.created || 0, updated: result.updated || 0 })}
          </div>
        </div>
      );
      
      return result;
      
    } catch (error) {
      console.error('❌ Excel import error:', error);
      
      // Suggest alternative
      message.error(
        <div>
          <div><WarningOutlined /> {t('message.error.excel_upload')}</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#1890ff' }}>
            💡 {t('message.try_csv_stable')}
          </div>
        </div>
      );
      
      // Auto-open CSV import as alternative
      setTimeout(() => {
        setShowCSVImport(true);
      }, 2000);
      
      throw error;
    }
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
            {t('database.new_order')}
          </Button>
          
          {/* Импорт кнопки в адаптивном контейнере */}
          <Space.Compact 
            style={{ 
              width: screenInfo.isMobile ? '100%' : 'auto',
              display: 'flex',
              flexDirection: screenInfo.isMobile ? 'column' : 'row'
            }}
          >
            {/* Stable CSV import - recommended */}
            <Tooltip title={t('tooltip.csv_reliable')}>
              <Button
                type="primary"
                icon={<ImportOutlined />}
                onClick={() => setShowCSVImport(true)}
                size={componentSize}
                style={{ 
                  background: '#52c41a',
                  borderColor: '#52c41a',
                  width: screenInfo.isMobile ? '100%' : 'auto',
                  height: screenInfo.isMobile ? 44 : 'auto',
                  marginBottom: screenInfo.isMobile ? 8 : 0
                }}
              >
                {screenInfo.isMobile ? t('database.csv_import') : t('database.csv_import')}
                <CheckCircleOutlined style={{ marginLeft: 4 }} />
              </Button>
            </Tooltip>
            
            {/* Enhanced Excel import */}
            <Tooltip title={t('tooltip.excel_2_enhanced')}>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={() => setShowEnhancedExcelImport(true)}
                size={componentSize}
                style={{ 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  border: 'none',
                  width: screenInfo.isMobile ? '100%' : 'auto',
                  height: screenInfo.isMobile ? 44 : 'auto',
                  marginBottom: screenInfo.isMobile ? 8 : 0
                }}
              >
                {screenInfo.isMobile ? t('database.excel_2_0') : t('database.excel_2_0')}
                <CheckCircleOutlined style={{ marginLeft: 4, color: '#52c41a' }} />
              </Button>
            </Tooltip>
            
            {/* Old Excel uploader - may be unstable */}
            {!screenInfo.isMobile && (
              <Tooltip title={t('tooltip.excel_1_unstable')}>
                <Button
                  type="default"
                  icon={<FileExcelOutlined />}
                  onClick={() => {
                    // Create input for file selection
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
                  size={componentSize}
                >
                  {t('database.excel_1_0')}
                  <WarningOutlined style={{ marginLeft: 4, color: '#faad14' }} />
                </Button>
              </Tooltip>
            )}
          </Space.Compact>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            size={componentSize}
            style={{ 
              width: screenInfo.isMobile ? '100%' : 'auto',
              height: screenInfo.isMobile ? 44 : 'auto'
            }}
          >
            {t('database.refresh')}
          </Button>
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

      {/* Stable CSV import */}
      <CSVImportModal
        visible={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={handleCSVImportSuccess}
      />

      {/* Enhanced Excel import */}
      <EnhancedExcelImporter
        visible={showEnhancedExcelImport}
        onClose={() => setShowEnhancedExcelImport(false)}
        onSuccess={handleEnhancedExcelImportSuccess}
      />
    </ResponsiveContainer>
  );
};
