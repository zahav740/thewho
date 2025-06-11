/**
 * @file: OperationHistory.tsx  
 * @description: Страница истории операций с фильтрами и экспортом (Ant Design)
 * @created: 2025-06-07
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Row,
  Col,
  Select,
  DatePicker,
  Tag,
  Statistic,
  Space,
  message,
  Tooltip
} from 'antd';
import { 
  FileExcelOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { 
  operationHistoryService, 
  OperationHistoryRecord, 
  DrawingInfo 
} from '../../services/operationHistory/operationHistoryService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Filters {
  drawingNumber: string;
  dateRange: [Dayjs, Dayjs] | null;
  machineName: string;
  operatorName: string;
  shiftType: string;
}

const OperationHistory: React.FC = () => {
  // State для данных
  const [records, setRecords] = useState<OperationHistoryRecord[]>([]);
  const [drawings, setDrawings] = useState<DrawingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State для фильтров
  const [filters, setFilters] = useState<Filters>({
    drawingNumber: '',
    dateRange: null,
    machineName: '',
    operatorName: '',
    shiftType: ''
  });

  // State для поиска
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка списка чертежей при монтировании
  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    try {
      setLoading(true);
      const data = await operationHistoryService.getAvailableDrawings();
      setDrawings(data);
    } catch (err) {
      console.error('Ошибка загрузки чертежей:', err);
      
      // Добавляем заглушку с тестовыми данными
      const testDrawings: DrawingInfo[] = [
        { drawingNumber: 'C6HP0021A', recordCount: 15, lastDate: new Date() },
        { drawingNumber: 'TEST-001', recordCount: 8, lastDate: new Date() },
        { drawingNumber: 'DEMO-002', recordCount: 12, lastDate: new Date() }
      ];
      setDrawings(testDrawings);
      
      message.warning('Не удалось загрузить чертежи с сервера. Показаны тестовые данные.');
    } finally {
      setLoading(false);
    }
  };

  const loadOperationHistory = useCallback(async () => {
    if (!filters.drawingNumber) return;

    try {
      setLoading(true);
      const dateFrom = filters.dateRange?.[0]?.toDate();
      const dateTo = filters.dateRange?.[1]?.toDate();
      
      const data = await operationHistoryService.getOperationHistory(
        filters.drawingNumber,
        dateFrom,
        dateTo
      );
      
      setRecords(data);
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
      
      // Добавляем заглушку с тестовыми данными
      const testRecords: OperationHistoryRecord[] = [
        {
          id: 1,
          drawingNumber: filters.drawingNumber,
          operationId: 1,
          operationNumber: 10,
          operationType: 'MILLING',
          machineId: 1,
          machineName: 'Doosan 3',
          operatorName: 'Kirill',
          shiftType: 'DAY',
          quantityProduced: 15,
          timePerUnit: 25,
          totalTime: 375,
          efficiencyRating: 85.5,
          dateCompleted: new Date('2025-06-08')
        },
        {
          id: 2,
          drawingNumber: filters.drawingNumber,
          operationId: 2,
          operationNumber: 10,
          operationType: 'MILLING',
          machineId: 1,
          machineName: 'Doosan 3',
          operatorName: 'Аркадий',
          shiftType: 'NIGHT',
          quantityProduced: 20,
          timePerUnit: 24,
          totalTime: 480,
          efficiencyRating: 90.2,
          dateCompleted: new Date('2025-06-08')
        },
        {
          id: 3,
          drawingNumber: filters.drawingNumber,
          operationId: 3,
          operationNumber: 20,
          operationType: 'TURNING',
          machineId: 2,
          machineName: 'Haas ST-10Y',
          operatorName: 'Denis',
          shiftType: 'DAY',
          quantityProduced: 12,
          timePerUnit: 30,
          totalTime: 360,
          efficiencyRating: 78.3,
          dateCompleted: new Date('2025-06-07')
        }
      ];
      setRecords(testRecords);
      
      message.warning('Не удалось загрузить историю с сервера. Показаны тестовые данные.');
    } finally {
      setLoading(false);
    }
  }, [filters.drawingNumber, filters.dateRange]);

  // Загрузка данных при изменении выбранного чертежа
  useEffect(() => {
    if (filters.drawingNumber) {
      loadOperationHistory();
    }
  }, [filters.drawingNumber, filters.dateRange, loadOperationHistory]);

  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExportExcel = async () => {
    if (!filters.drawingNumber) {
      message.warning('Выберите номер чертежа для экспорта');
      return;
    }

    try {
      setLoading(true);
      
      // Проверяем, есть ли данные для экспорта
      if (filteredRecords.length === 0) {
        message.warning('Нет данных для экспорта');
        return;
      }

      // Создаем CSV с данными истории операций
      const csvHeader = 'Дата,Операция_№,Тип_операции,Станок,Оператор,Смена,Количество,Время_на_деталь,Общее_время,Эффективность\n';
      
      const csvRows = filteredRecords.map(record => {
        const date = dayjs(record.dateCompleted).format('DD.MM.YYYY');
        const shiftType = record.shiftType === 'DAY' ? 'День' : 'Ночь';
        const operator = record.operatorName || '-';
        const timePerUnit = record.timePerUnit ? `${record.timePerUnit}` : '-';
        const totalTime = record.totalTime ? `${Math.round(record.totalTime / 60)}:${(record.totalTime % 60).toString().padStart(2, '0')}` : '-';
        const efficiency = record.efficiencyRating && typeof record.efficiencyRating === 'number' ? `${Number(record.efficiencyRating).toFixed(1)}%` : '-';
        
        return `${date},${record.operationNumber},${record.operationType},${record.machineName},${operator},${shiftType},${record.quantityProduced},${timePerUnit},${totalTime},${efficiency}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Скачиваем файл
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const dateFrom = filters.dateRange?.[0]?.format('DD-MM-YYYY') || 'все_даты';
      const dateTo = filters.dateRange?.[1]?.format('DD-MM-YYYY') || '';
      const dateRangeStr = dateTo ? `${dateFrom}_${dateTo}` : dateFrom;
      
      link.download = `operation_history_${filters.drawingNumber}_${dateRangeStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Файл истории операций успешно экспортирован');
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      message.error('Ошибка при экспорте данных');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация данных
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Применяем поиск
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.operatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.machineName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Применяем фильтры
    if (filters.machineName) {
      filtered = filtered.filter(record => 
        record.machineName.toLowerCase().includes(filters.machineName.toLowerCase())
      );
    }

    if (filters.operatorName) {
      filtered = filtered.filter(record => 
        record.operatorName?.toLowerCase().includes(filters.operatorName.toLowerCase())
      );
    }

    if (filters.shiftType) {
      filtered = filtered.filter(record => record.shiftType === filters.shiftType);
    }

    return filtered;
  }, [records, searchQuery, filters]);

  // Получаем уникальные значения для фильтров
  const uniqueMachines = [...new Set(records.map(r => r.machineName))];
  const uniqueOperators = [...new Set(records.map(r => r.operatorName).filter(Boolean))];

  // Конфигурация колонок таблицы
  const columns: ColumnsType<OperationHistoryRecord> = [
    {
      title: 'Дата',
      dataIndex: 'dateCompleted',
      key: 'dateCompleted',
      sorter: (a, b) => new Date(a.dateCompleted).getTime() - new Date(b.dateCompleted).getTime(),
      render: (date: Date) => dayjs(date).format('DD.MM.YYYY'),
      width: 110,
    },
    {
      title: 'Операция №',
      dataIndex: 'operationNumber',
      key: 'operationNumber',
      sorter: (a, b) => a.operationNumber - b.operationNumber,
      width: 100,
    },
    {
      title: 'Тип операции',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 150,
    },
    {
      title: 'Станок',
      dataIndex: 'machineName',
      key: 'machineName',
      sorter: (a, b) => a.machineName.localeCompare(b.machineName),
      width: 120,
    },
    {
      title: 'Оператор',
      dataIndex: 'operatorName',
      key: 'operatorName',
      render: (name: string) => name || '-',
      width: 120,
    },
    {
      title: 'Смена',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (shiftType: string) => (
        <Tag color={shiftType === 'DAY' ? 'blue' : 'purple'}>
          {shiftType === 'DAY' ? 'День' : 'Ночь'}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Количество',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      sorter: (a, b) => a.quantityProduced - b.quantityProduced,
      render: (quantity: number) => (
        <Text strong>{quantity} дет.</Text>
      ),
      align: 'right',
      width: 100,
    },
    {
      title: 'Время/дет',
      dataIndex: 'timePerUnit',
      key: 'timePerUnit',
      render: (time: number) => time ? `${time} мин` : '-',
      align: 'right',
      width: 100,
    },
    {
      title: 'Общее время',
      dataIndex: 'totalTime',
      key: 'totalTime',
      render: (time: number) => time ? `${Math.round(time / 60)} ч ${time % 60} м` : '-',
      align: 'right',
      width: 120,
    },
    {
      title: 'Эффективность',
      dataIndex: 'efficiencyRating',
      key: 'efficiencyRating',
      sorter: (a, b) => (a.efficiencyRating || 0) - (b.efficiencyRating || 0),
      render: (efficiency: number) => {
        if (!efficiency || typeof efficiency !== 'number') return '-';
        
        let color = 'default';
        if (efficiency >= 90) color = 'success';
        else if (efficiency >= 75) color = 'warning';
        else color = 'error';
        
        return (
          <Tag color={color}>
            {Number(efficiency).toFixed(1)}%
          </Tag>
        );
      },
      align: 'right',
      width: 110,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Заголовок */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>📚 История операций</Title>
        <Text type="secondary">
          Анализ выполненных операций с возможностью фильтрации и экспорта данных
        </Text>
      </div>

      {/* Фильтры */}
      <Card title={
        <Space>
          <FilterOutlined />
          <span>Фильтры поиска</span>
        </Space>
      } style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {/* Выбор чертежа */}
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text>Номер чертежа:</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Выберите чертеж"
                value={filters.drawingNumber || undefined}
                onChange={(value) => handleFilterChange('drawingNumber', value)}
                loading={loading}
              >
                <Option value="">Все чертежи</Option>
                {drawings.map(drawing => (
                  <Option key={drawing.drawingNumber} value={drawing.drawingNumber}>
                    {drawing.drawingNumber} ({drawing.recordCount} записей)
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Период дат */}
          <Col xs={24} sm={12} md={6}>
            <div>
              <Text>Период:</Text>
              <RangePicker
                style={{ width: '100%', marginTop: 4 }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                format="DD.MM.YYYY"
              />
            </div>
          </Col>

          {/* Станок */}
          <Col xs={24} sm={12} md={4}>
            <div>
              <Text>Станок:</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Все станки"
                value={filters.machineName || undefined}
                onChange={(value) => handleFilterChange('machineName', value)}
              >
                <Option value="">Все станки</Option>
                {uniqueMachines.map(machine => (
                  <Option key={machine} value={machine}>{machine}</Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Смена */}
          <Col xs={24} sm={12} md={3}>
            <div>
              <Text>Смена:</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Все"
                value={filters.shiftType || undefined}
                onChange={(value) => handleFilterChange('shiftType', value)}
              >
                <Option value="">Все</Option>
                <Option value="DAY">День</Option>
                <Option value="NIGHT">Ночь</Option>
              </Select>
            </div>
          </Col>

          {/* Кнопки действий */}
          <Col xs={24} sm={12} md={5}>
            <div>
              <Text>Действия:</Text>
              <div style={{ marginTop: 4 }}>
                <Space>
                  <Tooltip title="Обновить данные">
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={loadOperationHistory}
                      disabled={loading || !filters.drawingNumber}
                    />
                  </Tooltip>
                  
                  <Tooltip title="Экспорт в Excel">
                    <Button 
                      type="primary"
                      icon={<FileExcelOutlined />}
                      onClick={handleExportExcel}
                      disabled={loading || !filters.drawingNumber}
                    >
                      Excel
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        {/* Поиск */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Input
              placeholder="Поиск по номеру чертежа, оператору или станку..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Сводная информация */}
      {records.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Записей найдено"
                value={filteredRecords.length}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Деталей произведено"
                value={filteredRecords.reduce((sum, r) => sum + r.quantityProduced, 0)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Станков задействовано"
                value={uniqueMachines.length}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Операторов работало"
                value={uniqueOperators.length}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Таблица данных */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredRecords.length,
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} записей`,
          }}
          locale={{
            emptyText: filters.drawingNumber 
              ? 'Данные не найдены' 
              : 'Выберите номер чертежа для просмотра истории'
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default OperationHistory;
