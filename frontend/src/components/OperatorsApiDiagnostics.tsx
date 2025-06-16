/**
 * @file: OperatorsApiDiagnostics.tsx
 * @description: Диагностический компонент для тестирования API операторов
 * @created: 2025-06-16
 */
import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Tag, message, Spin } from 'antd';
import { BugOutlined, ApiOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { operatorsApi } from '../services/operatorsApi';
import CacheClearButton from './CacheClearButton';

const { Text, Title } = Typography;

export const OperatorsApiDiagnostics: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isManualTesting, setIsManualTesting] = useState(false);

  // Автоматические тесты
  const { data: allOperators, isLoading: allLoading, error: allError } = useQuery({
    queryKey: ['operators', 'test', 'all'],
    queryFn: () => operatorsApi.getAll(),
    retry: 1,
  });

  const { data: setupOperators, isLoading: setupLoading, error: setupError } = useQuery({
    queryKey: ['operators', 'test', 'setup'],
    queryFn: () => operatorsApi.getSetupOperators(),
    retry: 1,
  });

  const { data: productionOperators, isLoading: productionLoading, error: productionError } = useQuery({
    queryKey: ['operators', 'test', 'production'],
    queryFn: () => operatorsApi.getProductionOperators(),
    retry: 1,
  });

  const runManualTest = async () => {
    setIsManualTesting(true);
    try {
      console.log('🧪 Запуск ручного тестирования API операторов...');
      
      const results = {
        apiTest: await operatorsApi.test(),
        allOperators: await operatorsApi.getAll(),
        activeOperators: await operatorsApi.getAll(undefined, true),
        setupOperators: await operatorsApi.getSetupOperators(),
        productionOperators: await operatorsApi.getProductionOperators(),
      };

      setTestResults(results);
      message.success('Тестирование завершено успешно!');
    } catch (error: any) {
      console.error('Ошибка при тестировании:', error);
      message.error('Ошибка при тестировании API');
      setTestResults({ error: error?.message || 'Неизвестная ошибка' });
    } finally {
      setIsManualTesting(false);
    }
  };

  const renderOperatorsList = (operators: any[], title: string, loading: boolean, error: any) => (
    <Card size="small" title={title} style={{ marginBottom: 8 }}>
      {loading ? (
        <Spin size="small" />
      ) : error ? (
        <Text type="danger">❌ Ошибка: {error.message}</Text>
      ) : operators ? (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue">Количество: {operators.length}</Tag>
          </div>
          {operators.map((op: any) => (
            <Tag key={op.id} color={op.isActive ? 'green' : 'red'} style={{ marginBottom: 4 }}>
              {op.name} ({op.operatorType})
            </Tag>
          ))}
        </div>
      ) : (
        <Text type="secondary">Нет данных</Text>
      )}
    </Card>
  );

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          Диагностика API операторов
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <CacheClearButton />
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={runManualTest}
            loading={isManualTesting}
            size="small"
          >
            Запустить тест
          </Button>
        </Space>
      }
    >
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <Title level={5}>Автоматические тесты:</Title>
        
        {renderOperatorsList(allOperators || [], '👥 Все операторы', allLoading, allError)}
        {renderOperatorsList(setupOperators || [], '🔧 Операторы наладки', setupLoading, setupError)}
        {renderOperatorsList(productionOperators || [], '🏭 Операторы производства', productionLoading, productionError)}

        {testResults && (
          <>
            <Divider />
            <Title level={5}>Результаты ручного тестирования:</Title>
            <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
              <pre style={{ fontSize: '11px', maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </Card>
          </>
        )}

        <Divider />
        <div style={{ fontSize: '12px', color: '#666' }}>
          <Text>🔍 Этот компонент помогает диагностировать проблемы с API операторов</Text>
          <br />
          <Text>💡 Если видите ошибки, проверьте работу backend на порту 5100</Text>
        </div>
      </div>
    </Card>
  );
};

export default OperatorsApiDiagnostics;