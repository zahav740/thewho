/**
 * @file: ExcelUploaderSwitcher.tsx  
 * @description: Компонент-переключатель между старым и новым способом импорта Excel
 * @dependencies: antd, ExcelUploader, ExcelUploaderNew
 * @created: 2025-06-25
 */
import React, { useState } from 'react';
import { Card, Switch, Space, Typography, Alert, Divider, Button } from 'antd';
import { FileExcelOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { ExcelUploader } from './ExcelUploader';
import { ExcelUploaderNew } from './ExcelUploaderNew';

const { Title, Text, Paragraph } = Typography;

interface ExcelUploaderSwitcherProps {
  onSuccess: () => void;
}

export const ExcelUploaderSwitcher: React.FC<ExcelUploaderSwitcherProps> = ({ onSuccess }) => {
  const [useNewUploader, setUseNewUploader] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={4}>
              <FileExcelOutlined /> Импорт Excel файлов
            </Title>
            
            <Space align="center" style={{ marginBottom: 16 }}>
              <Text>Способ импорта:</Text>
              <Switch
                checked={useNewUploader}
                onChange={setUseNewUploader}
                checkedChildren={<SettingOutlined />}
                unCheckedChildren={<ThunderboltOutlined />}
              />
              <Text strong>
                {useNewUploader ? 'С выбором колонок' : 'Быстрый импорт'}
              </Text>
            </Space>

            {!useNewUploader && (
              <Alert
                message="Быстрый импорт"
                description="Использует фиксированную структуру колонок. Подходит для стандартных Excel файлов с предопределенной структурой."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {useNewUploader && (
              <Alert
                message="🆕 Импорт с выбором колонок"
                description="Позволяет настроить соответствие любых колонок полям заказа. Подходит для Excel файлов произвольной структуры."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </div>

          <Divider />

          {!useNewUploader && (
            <div>
              <Title level={5}>🚀 Быстрый импорт</Title>
              <Paragraph type="secondary">
                Ожидаемая структура: A=Номер чертежа, B=Количество, C=Срок, D=Приоритет, E=Тип работы, F-K=Операции
              </Paragraph>
              <ExcelUploader onSuccess={onSuccess} />
            </div>
          )}

          {useNewUploader && (
            <div>
              <Title level={5}>⚙️ Импорт с настройкой колонок</Title>
              <Paragraph type="secondary">
                Полностью настраиваемый импорт с возможностью выбора любых колонок и их соответствия полям заказа.
              </Paragraph>
              <ExcelUploaderNew onSuccess={onSuccess} />
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};
