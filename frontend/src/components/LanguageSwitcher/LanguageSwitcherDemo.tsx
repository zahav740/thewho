/**
 * @file: LanguageSwitcherDemo.tsx
 * @description: Демонстрация различных вариантов переключателя языков
 * @created: 2025-06-11
 */

import React from 'react';
import { Card, Space, Typography, Row, Col, Divider } from 'antd';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

const { Title, Text } = Typography;

export const LanguageSwitcherDemo: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🌐 Переключатели языков</Title>
      <Text type="secondary">
        Различные варианты современных переключателей языков без чекбоксов
      </Text>
      
      <Divider />
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12} lg={6}>
          <Card 
            title="🎯 Adaptive (адаптивный)" 
            size="small"
            hoverable
            style={{ borderColor: '#1890ff' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Автоматически подстраивается:</Text>
                <ul style={{ fontSize: '12px', marginTop: '8px' }}>
                  <li>📱 Мобильные → Compact</li>
                  <li>📱 Планшеты → Toggle</li>
                  <li>🖥️ Десктоп → Segmented</li>
                </ul>
              </div>
              <div>
                <Text strong>Текущий вариант:</Text>
                <br />
                <LanguageSwitcher variant="adaptive" size="middle" />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12} lg={6}>
          <Card 
            title="🎯 Segmented (рекомендуется)" 
            size="small"
            hoverable
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Размер: Small</Text>
                <br />
                <LanguageSwitcher variant="segmented" size="small" />
              </div>
              <div>
                <Text strong>Размер: Middle</Text>
                <br />
                <LanguageSwitcher variant="segmented" size="middle" />
              </div>
              <div>
                <Text strong>Размер: Large</Text>
                <br />
                <LanguageSwitcher variant="segmented" size="large" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card 
            title="⚡ Toggle" 
            size="small"
            hoverable
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Размер: Small</Text>
                <br />
                <LanguageSwitcher variant="toggle" size="small" />
              </div>
              <div>
                <Text strong>Размер: Middle</Text>
                <br />
                <LanguageSwitcher variant="toggle" size="middle" />
              </div>
              <div>
                <Text strong>Размер: Large</Text>
                <br />
                <LanguageSwitcher variant="toggle" size="large" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card 
            title="🔘 Compact" 
            size="small"
            hoverable
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Размер: Small</Text>
                <br />
                <LanguageSwitcher variant="compact" size="small" />
              </div>
              <div>
                <Text strong>Размер: Middle</Text>
                <br />
                <LanguageSwitcher variant="compact" size="middle" />
              </div>
              <div>
                <Text strong>Размер: Large</Text>
                <br />
                <LanguageSwitcher variant="compact" size="large" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={6}>
          <Card 
            title="📋 Dropdown" 
            size="small"
            hoverable
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Размер: Small</Text>
                <br />
                <LanguageSwitcher variant="dropdown" size="small" />
              </div>
              <div>
                <Text strong>Размер: Middle</Text>
                <br />
                <LanguageSwitcher variant="dropdown" size="middle" />
              </div>
              <div>
                <Text strong>Размер: Large</Text>
                <br />
                <LanguageSwitcher variant="dropdown" size="large" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="📝 Рекомендации по использованию">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div>
              <Text strong>🎯 Adaptive (лучший выбор)</Text>
              <ul>
                <li>Автоматическая адаптация к экрану</li>
                <li>Оптимальный UX на всех устройствах</li>
                <li>Не требует настройки</li>
                <li>Современный подход</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text strong>🎯 Segmented</Text>
              <ul>
                <li>Современный внешний вид</li>
                <li>Четко показывает текущий выбор</li>
                <li>Подходит для десктопа</li>
                <li>Интуитивно понятный</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text strong>🔘 Compact</Text>
              <ul>
                <li>Только флаги без текста</li>
                <li>Очень компактный</li>
                <li>Подходит для мобильных устройств</li>
                <li>Международно понятный</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text strong>📋 Dropdown</Text>
              <ul>
                <li>Классический подход</li>
                <li>Подходит для большого числа языков</li>
                <li>Знакомый пользователям</li>
                <li>Экономит место</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
