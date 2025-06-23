/**
 * @file: ActiveOperationsDiagnostic.tsx
 * @description: Диагностика получения данных для активных операций
 * @created: 2025-06-23
 */
import React, { useState } from 'react';
import { Card, Button, Collapse, Typography, Space, Alert, Spin } from 'antd';
import { BugOutlined, DatabaseOutlined, ApiOutlined } from '@ant-design/icons';
import { machinesApi, operationsApi } from '../../services/machinesApi';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export const ActiveOperationsDiagnostic: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>({});

  const runDiagnostic = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. Проверяем API машин (старый)
      console.log('🔍 Проверка старого API машин...');
      try {
        const machines = await machinesApi.getAll();
        results.machinesOld = {
          success: true,
          data: machines,
          count: machines?.length || 0
        };
        console.log('✅ Старый API машин работает:', machines);
      } catch (error) {
        results.machinesOld = {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
        console.error('❌ Ошибка старого API машин:', error);
      }

      // 1.5. Проверяем новый API машин с реальным статусом
      console.log('🔍 Проверка нового API машин с реальным статусом...');
      try {
        const machinesWithStatus = await machinesApi.getAllWithStatus();
        results.machines = {
          success: true,
          data: machinesWithStatus,
          count: machinesWithStatus?.length || 0
        };
        console.log('✅ Новый API машин работает:', machinesWithStatus);
      } catch (error) {
        results.machines = {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
        console.error('❌ Ошибка нового API машин:', error);
      }

      // 2. Проверяем API активных операций
      console.log('🔍 Проверка API активных операций...');
      try {
        const activeOps = await operationsApi.getActiveOperations();
        results.activeOperations = {
          success: true,
          data: activeOps,
          count: activeOps?.length || 0
        };
        console.log('✅ API активных операций работает:', activeOps);
      } catch (error) {
        results.activeOperations = {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
        console.error('❌ Ошибка API активных операций:', error);
      }

      // 2.5. Проверяем только станки с активными операциями
      console.log('🔍 Проверка API станков с активными операциями...');
      try {
        const activeOnlyResponse = await api.get('/machines-enhanced/active-operations');
        results.activeOnly = {
          success: true,
          data: activeOnlyResponse.data,
          count: activeOnlyResponse.data?.length || 0
        };
        console.log('✅ API станков с активными операциями работает:', activeOnlyResponse.data);
      } catch (error) {
        results.activeOnly = {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
        console.error('❌ Ошибка API станков с активными операциями:', error);
      }

      // 2.7. Проверяем диагностику backend
      console.log('🔍 Проверка диагностики backend...');
      try {
        const diagnosticResponse = await api.get('/machines-enhanced/diagnostic/status');
        results.backendDiagnostic = {
          success: true,
          data: diagnosticResponse.data
        };
        console.log('✅ Диагностика backend работает:', diagnosticResponse.data);
      } catch (error) {
        results.backendDiagnostic = {
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        };
        console.error('❌ Ошибка диагностики backend:', error);
      }

      // 4. Анализируем данные
      if (results.machines?.success) {
        const machines = results.machines.data;
        const withOperations = machines?.filter((m: any) => 
          m.currentOperationDetails || m.currentOperationId
        ) || [];
        const occupied = machines?.filter((m: any) => !m.isAvailable) || [];
        
        results.analysis = {
          totalMachines: machines?.length || 0,
          withOperations: withOperations.length,
          occupied: occupied.length,
          available: (machines?.length || 0) - occupied.length,
          machinesData: machines?.map((m: any) => ({
            name: m.machineName,
            id: m.id,
            isAvailable: m.isAvailable,
            hasOperationId: !!m.currentOperationId,
            hasOperationDetails: !!m.currentOperationDetails,
            operationId: m.currentOperationId,
            operationDetails: m.currentOperationDetails
          }))
        };
      }

      setDiagnosticData(results);
      
    } catch (error) {
      console.error('❌ Общая ошибка диагностики:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined style={{ color: '#ff4d4f' }} />
          <Title level={4} style={{ margin: 0 }}>Диагностика активных операций</Title>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<DatabaseOutlined />}
          onClick={runDiagnostic}
          loading={loading}
        >
          Запустить диагностику
        </Button>
      }
      style={{ margin: '20px' }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '16px' }}>Проверка API и данных...</Paragraph>
        </div>
      )}

      {!loading && Object.keys(diagnosticData).length > 0 && (
        <Collapse>
          {/* Старый API Машин */}
          <Panel 
            header={
              <Space>
                <ApiOutlined style={{ color: diagnosticData.machinesOld?.success ? '#52c41a' : '#ff4d4f' }} />
                <Text>API Машин (старый)</Text>
                <Text type="secondary">
                  ({diagnosticData.machinesOld?.success ? 'Работает' : 'Ошибка'})
                </Text>
              </Space>
            } 
            key="machinesOld"
          >
            {diagnosticData.machinesOld?.success ? (
              <div>
                <Alert
                  message="✅ Старый API машин работает корректно"
                  description={`Получено ${diagnosticData.machinesOld.count} записей`}
                  type="success"
                  style={{ marginBottom: '16px' }}
                />
                <Text strong>Пример данных:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(diagnosticData.machinesOld.data?.[0] || {}, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert
                message="❌ Ошибка старого API машин"
                description={diagnosticData.machinesOld?.error}
                type="error"
              />
            )}
          </Panel>

          {/* Новый API Машин */}
          <Panel 
            header={
              <Space>
                <ApiOutlined style={{ color: diagnosticData.machines?.success ? '#52c41a' : '#ff4d4f' }} />
                <Text>API Машин (новый)</Text>
                <Text type="secondary">
                  ({diagnosticData.machines?.success ? 'Работает' : 'Ошибка'})
                </Text>
              </Space>
            } 
            key="machines"
          >
            {diagnosticData.machines?.success ? (
              <div>
                <Alert
                  message="✅ Новый API машин работает корректно"
                  description={`Получено ${diagnosticData.machines.count} записей`}
                  type="success"
                  style={{ marginBottom: '16px' }}
                />
                <Text strong>Пример данных:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(diagnosticData.machines.data?.[0] || {}, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert
                message="❌ Ошибка нового API машин"
                description={diagnosticData.machines?.error}
                type="error"
              />
            )}
          </Panel>

          {/* API Активных операций */}
          <Panel 
            header={
              <Space>
                <ApiOutlined style={{ color: diagnosticData.activeOperations?.success ? '#52c41a' : '#ff4d4f' }} />
                <Text>API Активных операций</Text>
                <Text type="secondary">
                  ({diagnosticData.activeOperations?.success ? 'Работает' : 'Ошибка'})
                </Text>
              </Space>
            } 
            key="activeOperations"
          >
            {diagnosticData.activeOperations?.success ? (
              <div>
                <Alert
                  message="✅ API активных операций работает"
                  description={`Получено ${diagnosticData.activeOperations.count} записей`}
                  type="success"
                  style={{ marginBottom: '16px' }}
                />
                <Text strong>Данные:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(diagnosticData.activeOperations.data || [], null, 2)}
                </pre>
              </div>
            ) : (
              <Alert
                message="❌ Ошибка API активных операций"
                description={diagnosticData.activeOperations?.error}
                type="error"
              />
            )}
          </Panel>

          {/* Станки с активными операциями */}
          {diagnosticData.activeOnly && (
            <Panel 
              header={
                <Space>
                  <ApiOutlined style={{ color: diagnosticData.activeOnly?.success ? '#52c41a' : '#ff4d4f' }} />
                  <Text>Станки с активными операциями</Text>
                  <Text type="secondary">
                    ({diagnosticData.activeOnly?.success ? 'Работает' : 'Ошибка'})
                  </Text>
                </Space>
              } 
              key="activeOnly"
            >
              {diagnosticData.activeOnly?.success ? (
                <div>
                  <Alert
                    message="✅ API станков с активными операциями работает"
                    description={`Найдено ${diagnosticData.activeOnly.count} станков с активными операциями`}
                    type="success"
                    style={{ marginBottom: '16px' }}
                  />
                  <Text strong>Данные:</Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(diagnosticData.activeOnly.data || [], null, 2)}
                  </pre>
                </div>
              ) : (
                <Alert
                  message="❌ Ошибка API станков с активными операциями"
                  description={diagnosticData.activeOnly?.error}
                  type="error"
                />
              )}
            </Panel>
          )}

          {/* Диагностика Backend */}
          {diagnosticData.backendDiagnostic && (
            <Panel 
              header={
                <Space>
                  <DatabaseOutlined style={{ color: diagnosticData.backendDiagnostic?.success ? '#52c41a' : '#ff4d4f' }} />
                  <Text>Диагностика Backend</Text>
                  <Text type="secondary">
                    ({diagnosticData.backendDiagnostic?.success ? 'Работает' : 'Ошибка'})
                  </Text>
                </Space>
              } 
              key="backendDiagnostic"
            >
              {diagnosticData.backendDiagnostic?.success ? (
                <div>
                  <Alert
                    message="✅ Диагностика backend работает"
                    description="Получена детальная статистика состояния БД"
                    type="success"
                    style={{ marginBottom: '16px' }}
                  />
                  <Text strong>Статистика БД:</Text>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}>
                    <p><strong>Всего станков:</strong> {diagnosticData.backendDiagnostic.data?.summary?.total_machines}</p>
                    <p><strong>Активных операций:</strong> {diagnosticData.backendDiagnostic.data?.summary?.active_operations}</p>
                    <p><strong>Состояние данных:</strong> {diagnosticData.backendDiagnostic.data?.summary?.data_consistency}</p>
                  </div>
                  <details style={{ marginTop: '12px' }}>
                    <summary>Полная диагностика</summary>
                    <pre style={{ 
                      background: '#f8f8f8', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      marginTop: '8px'
                    }}>
                      {JSON.stringify(diagnosticData.backendDiagnostic.data || {}, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <Alert
                  message="❌ Ошибка диагностики backend"
                  description={diagnosticData.backendDiagnostic?.error}
                  type="error"
                />
              )}
            </Panel>
          )}

          {/* Анализ данных */}
          {diagnosticData.analysis && (
            <Panel 
              header={
                <Space>
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <Text>Анализ данных</Text>
                </Space>
              } 
              key="analysis"
            >
              <div>
                <Alert
                  message="📊 Статистика данных"
                  description={
                    <div>
                      <p><strong>Всего станков:</strong> {diagnosticData.analysis.totalMachines}</p>
                      <p><strong>С операциями:</strong> {diagnosticData.analysis.withOperations}</p>
                      <p><strong>Занятых:</strong> {diagnosticData.analysis.occupied}</p>
                      <p><strong>Свободных:</strong> {diagnosticData.analysis.available}</p>
                    </div>
                  }
                  type="info"
                  style={{ marginBottom: '16px' }}
                />
                
                <Text strong>Детали по станкам:</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  marginTop: '8px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {diagnosticData.analysis.machinesData?.map((machine: any, index: number) => (
                    <div key={index} style={{ 
                      marginBottom: '8px', 
                      padding: '8px',
                      background: machine.hasOperationDetails || machine.hasOperationId ? '#e6f7ff' : '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }}>
                      <Text strong>{machine.name}</Text>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <div>ID: {machine.id}</div>
                        <div>Доступен: {machine.isAvailable ? 'Да' : 'Нет'}</div>
                        <div>Есть ID операции: {machine.hasOperationId ? 'Да' : 'Нет'}</div>
                        <div>Есть детали операции: {machine.hasOperationDetails ? 'Да' : 'Нет'}</div>
                        {machine.operationId && <div>ID операции: {machine.operationId}</div>}
                        {machine.operationDetails && (
                          <div>Операция: {machine.operationDetails.operationNumber || 'N/A'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </Collapse>
      )}

      {!loading && Object.keys(diagnosticData).length === 0 && (
        <Alert
          message="Диагностика не запущена"
          description="Нажмите кнопку 'Запустить диагностику' для проверки API и данных"
          type="info"
        />
      )}
    </Card>
  );
};