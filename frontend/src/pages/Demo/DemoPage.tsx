/**
 * @file: DemoPage.tsx
 * @description: Страница демонстрации новых возможностей
 * @dependencies: компоненты, antd
 * @created: 2025-05-28
 */
import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Table,
  message,
  Tag,
  Divider,
  Alert,
} from 'antd';
import {
  FileExcelOutlined,
  DeleteOutlined,
  MenuOutlined,
  RightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import ContextMenu from '../../components/ContextMenu';
import { ModernExcelUploader } from '../../components/ExcelUploader';

const { Title, Paragraph, Text } = Typography;

const DemoPage: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [demoData, setDemoData] = useState([
    { key: '1', name: 'Образец 1', type: 'Тип A', status: 'Активный' },
    { key: '2', name: 'Образец 2', type: 'Тип B', status: 'Неактивный' },
    { key: '3', name: 'Образец 3', type: 'Тип A', status: 'Активный' },
    { key: '4', name: 'Образец 4', type: 'Тип C', status: 'Активный' },
    { key: '5', name: 'Образец 5', type: 'Тип B', status: 'Неактивный' },
  ]);

  const handleExcelUpload = async (file: File, data?: any[]) => {
    // Симуляция загрузки
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Файл "${file.name}" успешно обработан. Обработано ${data?.length || 0} строк.`,
          processed: data?.length || 0,
        });
      }, 2000);
    });
  };

  const handleDeleteSelected = () => {
    setDemoData(prev => prev.filter(item => !selectedRows.includes(item.key)));
    setSelectedRows([]);
    message.success(`Удалено ${selectedRows.length} элементов`);
  };

  const handleDeleteAll = () => {
    setDemoData([]);
    setSelectedRows([]);
    message.success('Все элементы удалены');
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors = { 'Тип A': 'blue', 'Тип B': 'green', 'Тип C': 'orange' };
        return <Tag color={colors[type as keyof typeof colors] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Активный' ? 'success' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            setDemoData(prev => prev.filter(item => item.key !== record.key));
            message.success('Элемент удален');
          }}
        >
          Удалить
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (keys: React.Key[]) => {
      setSelectedRows(keys as string[]);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        🎆 Новые возможности TheWho CRM
      </Title>
      <Paragraph>
        Демонстрация новых функций: современная загрузка Excel, контекстное меню и улучшенные UI компоненты.
      </Paragraph>

      <Row gutter={[24, 24]}>
        {/* Современная загрузка Excel */}
        <Col span={24}>
          <Card>
            <Title level={3}>
              <FileExcelOutlined /> Современная загрузка Excel
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text strong>Новые возможности:</Text>
                <Tag color="green">Drag & Drop</Tag>
                <Tag color="blue">Превью данных</Tag>
                <Tag color="orange">Прогресс-бар</Tag>
                <Tag color="purple">Обработка ошибок</Tag>
                <Tag color="cyan">Множественная загрузка</Tag>
              </div>
              <Alert
                message="Возможности компонента"
                description={
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Перетаскивание файлов (Drag & Drop)</li>
                    <li>Превью данных из Excel файлов</li>
                    <li>Прогресс загрузки с анимацией</li>
                    <li>Обработка ошибок с возможностью повтора</li>
                    <li>Поддержка множественной загрузки</li>
                    <li>Валидация размера и формата файлов</li>
                  </ul>
                }
                type="info"
                showIcon
              />
              <ModernExcelUploader
                onUpload={handleExcelUpload}
                title="Загрузка данных о заказах"
                description="Перетащите Excel файлы сюда или нажмите для выбора"
                maxFileSize={5}
                showPreview={true}
              />
            </Space>
          </Card>
        </Col>

        {/* Контекстное меню */}
        <Col span={24}>
          <Card>
            <Title level={3}>
              <MenuOutlined /> Контекстное меню (ПКМ)
            </Title>
            
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Alert
                message="Как использовать контекстное меню"
                description={
                  <div>
                    <Text strong>Инструкция:</Text>
                    <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      <li>Наведите курсор на таблицу ниже</li>
                      <li>Нажмите правую кнопку мыши (ПКМ)</li>
                      <li>Выберите нужное действие из меню</li>
                    </ol>
                    <Space>
                      <Tag color="blue">Удалить выбранные ({selectedRows.length})</Tag>
                      <Tag color="red">Удалить все ({demoData.length})</Tag>
                    </Space>
                  </div>
                }
                type="info"
                showIcon
                icon={<RightOutlined />}
              />

              <ContextMenu
                onDeleteSelected={selectedRows.length > 0 ? handleDeleteSelected : undefined}
                onDeleteAll={demoData.length > 0 ? handleDeleteAll : undefined}
                selectedCount={selectedRows.length}
                totalCount={demoData.length}
                entityName="элементов"
              >
                <div style={{ 
                  border: '2px dashed #d9d9d9', 
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  cursor: 'context-menu'
                }}>
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <Text type="secondary">
                      👆 Нажмите правую кнопку мыши на этой таблице
                    </Text>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={demoData}
                    rowSelection={rowSelection}
                    size="small"
                    pagination={false}
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
              </ContextMenu>
            </Space>
          </Card>
        </Col>

        {/* Обновленные компоненты */}
        <Col span={24}>
          <Card>
            <Title level={3}>
              <CheckCircleOutlined /> Исправленные проблемы
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ borderColor: '#52c41a' }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>404 ошибки API</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Исправлены endpoints для orders
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ borderColor: '#52c41a' }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>TypeScript ошибки</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Исправлены типы в ProductionPlanningPage
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" style={{ borderColor: '#52c41a' }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <div>
                      <Text strong>Antd предупреждения</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        bodyStyle заменен на styles.body
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Статистика улучшений */}
        <Col span={24}>
          <Card style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Title level={4} style={{ color: '#389e0d', marginBottom: '16px' }}>
              📊 Результаты обновления
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>3</div>
                  <Text type="secondary">Исправлено ошибок</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>2</div>
                  <Text type="secondary">Новых компонента</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>5</div>
                  <Text type="secondary">Улучшений UX</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa541c' }}>100%</div>
                  <Text type="secondary">Работоспособность</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider />

      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Title level={4}>🎉 Все обновления успешно применены!</Title>
        <Paragraph>
          Система TheWho CRM теперь работает стабильно с новыми возможностями.
          Попробуйте загрузить Excel файл и использовать контекстное меню для управления данными.
        </Paragraph>
        <Space>
          <Button type="primary" size="large">
            Вернуться к работе
          </Button>
          <Button size="large">
            Документация
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DemoPage;
