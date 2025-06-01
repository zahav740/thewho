/**
 * @file: ImportSettingsModal.tsx
 * @description: Модальное окно дополнительных настроек импорта с цветовыми фильтрами и маппингом колонок
 * @dependencies: antd
 * @created: 2025-05-29
 */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  Typography,
  Checkbox,
  Button,
  Space,
  Alert,
  Row,
  Col,
  Select,
  Divider,
  Tag,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export interface ColorFilter {
  color: 'green' | 'yellow' | 'red' | 'blue';
  label: string;
  description: string;
  priority: number;
  selected: boolean;
}

export interface ColumnMapping {
  fieldName: string;
  excelColumn: string;
  description: string;
  required?: boolean;
}

interface ImportSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (settings: ImportSettings) => void;
  availableColumns: string[];
  currentSettings?: ImportSettings;
}

export interface ImportSettings {
  colorFilters: ColorFilter[];
  columnMapping: ColumnMapping[];
  importOnlySelected: boolean;
}

const ImportSettingsModal: React.FC<ImportSettingsModalProps> = ({
  visible,
  onClose,
  onApply,
  availableColumns,
  currentSettings,
}) => {
  // Инициализация цветовых фильтров с правильной логикой
  const [colorFilters, setColorFilters] = useState<ColorFilter[]>([
    {
      color: 'green',
      label: 'Зеленый (Готовые заказы)',
      description: 'Готовые заказы - можно скачать, а можно не скачивать',
      priority: 1,
      selected: currentSettings?.colorFilters.find(f => f.color === 'green')?.selected ?? true,
    },
    {
      color: 'yellow',
      label: 'Желтый (Обычные заказы)',
      description: 'Заказы в обычном режиме выполнения',
      priority: 2,
      selected: currentSettings?.colorFilters.find(f => f.color === 'yellow')?.selected ?? true,
    },
    {
      color: 'red',
      label: 'Красный (Критические)',
      description: 'Критичные заказы - требуют немедленного внимания',
      priority: 3,
      selected: currentSettings?.colorFilters.find(f => f.color === 'red')?.selected ?? true,
    },
    {
      color: 'blue',
      label: 'Синий (Плановые)',
      description: 'Плановые заказы - без срочности',
      priority: 4,
      selected: currentSettings?.colorFilters.find(f => f.color === 'blue')?.selected ?? true,
    },
  ]);

  // Инициализация маппинга колонок
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([
    {
      fieldName: 'Номер чертежа',
      excelColumn: currentSettings?.columnMapping.find(m => m.fieldName === 'Номер чертежа')?.excelColumn || 'Колонка C',
      description: 'Уникальный номер чертежа',
      required: true,
    },
    {
      fieldName: 'Ревизия',
      excelColumn: currentSettings?.columnMapping.find(m => m.fieldName === 'Ревизия')?.excelColumn || 'Колонка D',
      description: 'Версия чертежа',
    },
    {
      fieldName: 'Количество',
      excelColumn: currentSettings?.columnMapping.find(m => m.fieldName === 'Количество')?.excelColumn || 'Колонка E',
      description: 'Количество изделий',
      required: true,
    },
    {
      fieldName: 'Дедлайн',
      excelColumn: currentSettings?.columnMapping.find(m => m.fieldName === 'Дедлайн')?.excelColumn || 'Колонка H',
      description: 'Срок выполнения',
    },
    {
      fieldName: 'Приоритет',
      excelColumn: currentSettings?.columnMapping.find(m => m.fieldName === 'Приоритет')?.excelColumn || 'Колонка K',
      description: 'Приоритет заказа (1-3)',
    },
  ]);

  const handleColorFilterChange = useCallback((color: ColorFilter['color'], checked: boolean) => {
    setColorFilters(prev => prev.map(filter => 
      filter.color === color ? { ...filter, selected: checked } : filter
    ));
  }, []);

  const handleColumnMappingChange = useCallback((fieldName: string, excelColumn: string) => {
    setColumnMapping(prev => prev.map(mapping => 
      mapping.fieldName === fieldName ? { ...mapping, excelColumn } : mapping
    ));
  }, []);

  const handleApply = useCallback(() => {
    const settings: ImportSettings = {
      colorFilters,
      columnMapping,
      importOnlySelected: colorFilters.some(f => !f.selected),
    };
    onApply(settings);
    onClose();
  }, [colorFilters, columnMapping, onApply, onClose]);

  const getColorTag = (color: ColorFilter['color']) => {
    const colorMap = {
      green: { color: '#52c41a', bgColor: '#f6ffed', text: 'Готовые заказы' },
      yellow: { color: '#faad14', bgColor: '#fffbe6', text: 'Обычные заказы' },
      red: { color: '#ff4d4f', bgColor: '#fff2f0', text: 'Критичные заказы' },
      blue: { color: '#1890ff', bgColor: '#f0f5ff', text: 'Плановые заказы' },
    };
    
    const config = colorMap[color];
    return (
      <Tag 
        color={config.color}
        style={{ 
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}`,
          borderRadius: '4px',
          padding: '2px 8px',
        }}
      >
        {config.text}
      </Tag>
    );
  };

  const selectedFiltersCount = colorFilters.filter(f => f.selected).length;
  const totalFiltersCount = colorFilters.length;

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Дополнительные настройки импорта</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Закрыть
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          Применить настройки
        </Button>,
      ]}
      closeIcon={<CloseOutlined />}
    >
      <div style={{ marginBottom: 24 }}>
        {/* Фильтры по цветам строк */}
        <Title level={5}>Фильтры по цветам строк</Title>
        
        <Alert
          message="Фильтрация по цветам"
          description="Выберите какие цветные строки импортировать. Если ничего не выбрано - импортируются все строки."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          {colorFilters.map((filter) => (
            <Col span={12} key={filter.color}>
              <div style={{ 
                padding: 12, 
                border: '1px solid #f0f0f0', 
                borderRadius: 6,
                backgroundColor: filter.selected ? '#fafafa' : '#f5f5f5'
              }}>
                <Checkbox
                  checked={filter.selected}
                  onChange={(e) => handleColorFilterChange(filter.color, e.target.checked)}
                  style={{ marginBottom: 8 }}
                >
                  <Space>
                    {getColorTag(filter.color)}
                    <Text strong>{filter.label}</Text>
                  </Space>
                </Checkbox>
                <div style={{ marginLeft: 24 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {filter.description}
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <Text type="secondary">
            Выбрано: {selectedFiltersCount} из {totalFiltersCount} типов строк
          </Text>
        </div>

        <Divider />

        {/* Маппинг колонок Excel */}
        <Title level={5}>Маппинг колонок Excel</Title>
        
        <Alert
          message="Соответствие колонок"
          description="Настройка того, какие колонки Excel соответствуют полям заказов."
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 8]} style={{ marginBottom: 8, fontWeight: 'bold' }}>
          <Col span={6}>
            <Text strong>Поле заказа</Text>
          </Col>
          <Col span={6}>
            <Text strong>Колонка Excel</Text>
          </Col>
          <Col span={12}>
            <Text strong>Описание</Text>
          </Col>
        </Row>

        {columnMapping.map((mapping, index) => (
          <Row key={mapping.fieldName} gutter={[16, 8]} style={{ marginBottom: 8 }}>
            <Col span={6}>
              <Space>
                <Text>{mapping.fieldName}</Text>
                {mapping.required && (
                  <Tooltip title="Обязательное поле">
                    <Text type="danger">*</Text>
                  </Tooltip>
                )}
              </Space>
            </Col>
            <Col span={6}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Выпадающее меню для быстрого выбора */}
                <Select
                  value={mapping.excelColumn}
                  onChange={(value) => handleColumnMappingChange(mapping.fieldName, value)}
                  style={{ width: '100%' }}
                  size="small"
                  placeholder="Выберите колонку"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableColumns.map(column => (
                    <Option key={column} value={column}>
                      {column}
                    </Option>
                  ))}
                </Select>
                
                {/* Кликабельные кнопки для визуального выбора */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '100%' }}>
                  {availableColumns.slice(0, 10).map(column => (
                    <Button 
                      key={column}
                      type={mapping.excelColumn === column ? 'primary' : 'default'}
                      size="small" 
                      onClick={() => handleColumnMappingChange(mapping.fieldName, column)}
                      style={{ 
                        padding: '2px 6px',
                        height: '24px',
                        fontSize: '10px',
                        minWidth: '32px',
                        backgroundColor: mapping.excelColumn === column ? '#1890ff' : '#f5f5f5',
                        borderColor: mapping.excelColumn === column ? '#1890ff' : '#d9d9d9',
                        color: mapping.excelColumn === column ? '#fff' : '#595959',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {column.replace('Колонка ', '')}
                    </Button>
                  ))}
                  
                  {availableColumns.length > 10 && (
                    <Tooltip title="Используйте выпадающий список для выбора других колонок (K-Z)">
                      <Button 
                        size="small"
                        type="dashed"
                        style={{ 
                          padding: '2px 6px',
                          height: '24px',
                          fontSize: '10px',
                          minWidth: '32px'
                        }}
                      >
                        ...
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {mapping.description}
              </Text>
            </Col>
          </Row>
        ))}

        <Alert
          message={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text>
                <InfoCircleOutlined style={{ color: '#52c41a' }} /> <Text strong>Инструкции:</Text>
              </Text>
              <Text style={{ fontSize: '13px' }}>
                🟢 <Text strong>Зеленые строки</Text> = готовые заказы (можно скачать, а можно не скачивать)
              </Text>
              <Text style={{ fontSize: '13px' }}>
                🔘 Кнопки колонок теперь кликабельны - нажмите для выбора колонки
              </Text>
              <Text style={{ fontSize: '13px' }}>
                ⚙️ Доступны все колонки от A до Z, не только C, D, E, H, K
              </Text>
            </Space>
          }
          type="success"
          style={{ marginTop: 16 }}
        />
      </div>
    </Modal>
  );
};

export default ImportSettingsModal;