/**
 * @file: TranslationTestPage.tsx
 * @description: Страница для демонстрации работы переводов
 * @created: 2025-01-28
 */

import React from 'react';
import { Card, Row, Col, Button, Space, Tag, Typography } from 'antd';
import { useTranslation } from '../../i18n';

const { Title, Text } = Typography;

export const TranslationTestPage: React.FC = () => {
  const { t, currentLanguage, setLanguage } = useTranslation();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>🌐 {t('translations.title')}</Title>
        <Text type="secondary">{t('translations.description')}</Text>
        
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card title="Кнопки и действия" size="small">
              <Space wrap>
                <Button type="primary">{t('button.save')}</Button>
                <Button>{t('button.cancel')}</Button>
                <Button type="primary" danger>{t('button.delete')}</Button>
                <Button>{t('button.edit')}</Button>
                <Button>{t('button.add')}</Button>
                <Button>{t('button.refresh')}</Button>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Статусы" size="small">
              <Space direction="vertical">
                <Tag color="green">{t('status.active')}</Tag>
                <Tag color="red">{t('status.inactive')}</Tag>
                <Tag color="blue">{t('status.in_progress')}</Tag>
                <Tag color="orange">{t('status.pending')}</Tag>
                <Tag color="purple">{t('status.completed')}</Tag>
                <Tag color="gray">{t('status.cancelled')}</Tag>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Поля форм" size="small">
              <Space direction="vertical">
                <Text strong>{t('form.name')}</Text>
                <Text strong>{t('form.description')}</Text>
                <Text strong>{t('form.date')}</Text>
                <Text strong>{t('form.time')}</Text>
                <Text strong>{t('form.status')}</Text>
                <Text strong>{t('form.machine')}</Text>
                <Text strong>{t('form.operator')}</Text>
              </Space>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="Страницы" size="small">
              <Space wrap>
                <Tag color="blue">{t('page.production.title')}</Tag>
                <Tag color="green">{t('page.operations.title')}</Tag>
                <Tag color="orange">{t('page.database.title')}</Tag>
                <Tag color="purple">{t('page.shifts.title')}</Tag>
                <Tag color="cyan">{t('page.operators.title')}</Tag>
                <Tag color="geekblue">{t('page.planning.title')}</Tag>
                <Tag color="lime">{t('page.calendar.title')}</Tag>
              </Space>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="Производство" size="small">
              <Space wrap>
                <Button>{t('production.machines')}</Button>
                <Button>{t('production.current_operations')}</Button>
                <Button>{t('production.queue')}</Button>
                <Button>{t('production.efficiency')}</Button>
              </Space>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="Переключение языка" size="small">
              <Space>
                <Text>Текущий язык: <Tag color="blue">{currentLanguage.toUpperCase()}</Tag></Text>
                <Button 
                  type={currentLanguage === 'ru' ? 'primary' : 'default'}
                  onClick={() => setLanguage('ru')}
                >
                  🇷🇺 Русский
                </Button>
                <Button 
                  type={currentLanguage === 'en' ? 'primary' : 'default'}
                  onClick={() => setLanguage('en')}
                >
                  🇺🇸 English
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
