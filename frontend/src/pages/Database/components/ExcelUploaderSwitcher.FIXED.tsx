/**
 * @file: ExcelUploaderSwitcher.FIXED.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
 * @description: Компонент-переключатель с добавлением исправленной версии импорта
 * @dependencies: antd, ExcelUploader, ExcelUploaderNew, ExcelUploaderFixed
 * @created: 2025-06-25
 * @updated: 2025-07-08 - Добавлена исправленная версия
 */
import React, { useState } from 'react';
import { Card, Radio, Space, Typography, Alert, Divider, Button } from 'antd';
import { 
  FileExcelOutlined, 
  SettingOutlined, 
  ThunderboltOutlined,
  BugOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ExcelUploader } from './ExcelUploader';
import { ExcelUploaderNew } from './ExcelUploaderNew';
import { ExcelUploaderFixed } from './ExcelUploader.FIXED';

const { Title, Text, Paragraph } = Typography;

interface ExcelUploaderSwitcherProps {
  onSuccess: () => void;
}

type UploaderType = 'fast' | 'configurable' | 'fixed';

export const ExcelUploaderSwitcherFixed: React.FC<ExcelUploaderSwitcherProps> = ({ onSuccess }) => {
  const [uploaderType, setUploaderType] = useState<UploaderType>('fixed'); // По умолчанию исправленная версия

  const uploaderOptions = [
    {
      value: 'fixed' as UploaderType,
      label: '🔧 Исправленная версия',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      description: 'Корректные цветовые фильтры + проверка дубликатов',
      component: <ExcelUploaderFixed onSuccess={onSuccess} />
    },
    {
      value: 'fast' as UploaderType,
      label: '🚀 Быстрый импорт',
      icon: <ThunderboltOutlined style={{ color: '#1890ff' }} />,
      description: 'Фиксированная структура колонок (СТАРАЯ ВЕРСИЯ)',
      component: <ExcelUploader onSuccess={onSuccess} />
    },
    {
      value: 'configurable' as UploaderType,
      label: '⚙️ С выбором колонок',
      icon: <SettingOutlined style={{ color: '#faad14' }} />,
      description: 'Настраиваемое соответствие колонок',
      component: <ExcelUploaderNew onSuccess={onSuccess} />
    }
  ];

  const currentUploader = uploaderOptions.find(opt => opt.value === uploaderType);

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>
              <FileExcelOutlined /> Импорт Excel файлов
            </Title>
            
            <Alert
              message="🆕 Доступна исправленная версия импорта!"
              description={
                <div>
                  <p>В исправленной версии устранены следующие проблемы:</p>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>🎨 <strong>Фильтр зеленого цвета теперь работает корректно</strong></li>
                    <li>🔄 <strong>Добавлена проверка дубликатов с выбором действия</strong></li>
                    <li>💾 <strong>Безопасное обновление существующих заказов</strong></li>
                    <li>📊 <strong>Подробная диагностика цветов в файле</strong></li>
                  </ul>
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Text>Выберите способ импорта:</Text>
            <Radio.Group
              value={uploaderType}
              onChange={(e) => setUploaderType(e.target.value)}
              style={{ marginTop: 8, width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {uploaderOptions.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      <div>
                        <div>
                          <Text strong>{option.label}</Text>
                          {option.value === 'fixed' && (
                            <span style={{ 
                              marginLeft: 8, 
                              backgroundColor: '#f6ffed', 
                              color: '#52c41a',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              РЕКОМЕНДУЕТСЯ
                            </span>
                          )}
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {option.description}
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <Divider />

          {/* Показываем выбранный компонент */}
          <div>
            <Title level={5}>
              {currentUploader?.icon} {currentUploader?.label}
            </Title>
            <Paragraph type="secondary">
              {currentUploader?.description}
            </Paragraph>
            
            {uploaderType === 'fixed' && (
              <Alert
                message="Исправления в этой версии"
                description={
                  <div>
                    <p><strong>🎨 Цветовые фильтры:</strong></p>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      <li>Исправлена проверка цветов ячеек Excel</li>
                      <li>Добавлены стандартные цвета Excel</li>
                      <li>Диагностика цветов в загруженном файле</li>
                    </ul>
                    <p><strong>🔄 Проверка дубликатов:</strong></p>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      <li>Обнаружение заказов с одинаковыми номерами чертежей</li>
                      <li>Выбор действия: обновить, пропустить или спросить</li>
                      <li>Безопасное обновление (сохранение операций для заказов в работе)</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {uploaderType === 'fast' && (
              <Alert
                message="⚠️ Старая версия с известными проблемами"
                description="Эта версия имеет проблемы с цветовыми фильтрами и не проверяет дубликаты. Рекомендуется использовать исправленную версию."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            {currentUploader?.component}
          </div>
        </Space>
      </Card>
    </div>
  );
};
