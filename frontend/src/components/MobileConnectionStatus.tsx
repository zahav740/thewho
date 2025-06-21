/**
 * @file: MobileConnectionStatus.tsx
 * @description: Компонент для отображения статуса подключения на мобильных устройствах
 * @created: 2025-06-21
 */
import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { WifiOutlined, DisconnectOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCurrentApiUrl, isApiHealthy, ensureApiConnection } from '../services/api';
import { isMobileDevice } from '../utils/network.utils';

const { Text } = Typography;

export const MobileConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setApiUrl(getCurrentApiUrl());
    checkConnection();

    // Проверяем соединение каждые 30 секунд
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const healthy = await isApiHealthy();
      setIsConnected(healthy);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleReconnect = async () => {
    setIsChecking(true);
    try {
      const connected = await ensureApiConnection();
      setIsConnected(connected);
      setApiUrl(getCurrentApiUrl());
    } catch (error) {
      console.error('Ошибка переподключения:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Показываем только на мобильных или при проблемах с подключением
  if (!isMobile && isConnected) {
    return null;
  }

  return (
    <Card 
      size="small" 
      style={{ 
        margin: '8px',
        borderColor: isConnected ? '#52c41a' : '#ff4d4f',
        backgroundColor: isConnected ? '#f6ffed' : '#fff2f0'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            {isConnected ? (
              <WifiOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            ) : (
              <DisconnectOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
            )}
            <Text strong style={{ 
              color: isConnected ? '#52c41a' : '#ff4d4f',
              fontSize: '14px'
            }}>
              {isConnected ? '🟢 Подключено' : '🔴 Нет соединения'}
            </Text>
          </Space>
          
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReconnect}
            loading={isChecking}
            style={{ fontSize: '12px' }}
          >
            {isChecking ? 'Проверка...' : 'Обновить'}
          </Button>
        </div>

        {!isConnected && (
          <Alert
            message="Проблема с подключением"
            description={
              <div style={{ fontSize: '12px' }}>
                <div>API: {apiUrl || 'не определен'}</div>
                <div style={{ marginTop: '4px' }}>
                  Проверьте что backend запущен и доступен
                </div>
              </div>
            }
            type="error"
            showIcon
            style={{ fontSize: '12px' }}
          />
        )}

        {isMobile && isConnected && (
          <div style={{ fontSize: '11px', color: '#666' }}>
            📱 Мобильный режим | API: {apiUrl.replace('/api', '')}
          </div>
        )}
      </Space>
    </Card>
  );
};
