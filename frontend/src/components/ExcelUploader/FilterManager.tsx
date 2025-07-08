/**
 * @file: FilterManager.tsx
 * @description: Компонент для управления фильтрами импорта (исправлено)
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Alert,
  AlertDescription,
} from '../common';

interface ImportFilter {
  id: number;
  name: string;
  description: string;
  target_table: string;
  filter_config: any;
  column_mapping: any;
  is_active: boolean;
}

export const FilterManager: React.FC = () => {
  const [filters, setFilters] = useState<ImportFilter[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<number | null>(null);
  const [editingFilter, setEditingFilter] = useState<ImportFilter | null>(null);
  const [loading, setLoading] = useState(false);

  // Форма
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_table: 'orders',
    filter_config: '{}',
    column_mapping: '{}',
    is_active: true,
  });

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const response = await fetch('/api/excel-import-db/filters');
      const data = await response.json();
      setFilters(data);
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
    }
  };

  const handleCreate = () => {
    setEditingFilter(null);
    setFormData({
      name: '',
      description: '',
      target_table: 'orders',
      filter_config: JSON.stringify({
        required_columns: [],
        optional_columns: [],
        data_validation: {},
        skip_empty_rows: true,
        header_row: 1
      }, null, 2),
      column_mapping: JSON.stringify({}, null, 2),
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (filter: ImportFilter) => {
    setEditingFilter(filter);
    setFormData({
      name: filter.name,
      description: filter.description || '',
      target_table: filter.target_table,
      filter_config: JSON.stringify(filter.filter_config, null, 2),
      column_mapping: JSON.stringify(filter.column_mapping, null, 2),
      is_active: filter.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let filterConfig, columnMapping;
      
      try {
        filterConfig = JSON.parse(formData.filter_config);
        columnMapping = JSON.parse(formData.column_mapping);
      } catch (error) {
        alert('Ошибка в JSON формате конфигурации');
        return;
      }

      const payload = {
        ...formData,
        filter_config: filterConfig,
        column_mapping: columnMapping,
      };

      const url = editingFilter 
        ? `/api/excel-import-db/filters/${editingFilter.id}`
        : '/api/excel-import-db/filters';
      
      const method = editingFilter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setShowDialog(false);
      loadFilters();
    } catch (error: any) {
      console.error('Ошибка сохранения фильтра:', error);
      alert(`Ошибка сохранения: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (filterId: number) => {
    setFilterToDelete(filterId);
    setShowConfirmDialog(true);
  };

  const handleDelete = async () => {
    if (!filterToDelete) return;

    try {
      const response = await fetch(`/api/excel-import-db/filters/${filterToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      loadFilters();
      setShowConfirmDialog(false);
      setFilterToDelete(null);
    } catch (error: any) {
      console.error('Ошибка удаления фильтра:', error);
      alert(`Ошибка удаления: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleToggleActive = async (filter: ImportFilter) => {
    try {
      const response = await fetch(`/api/excel-import-db/filters/${filter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filter,
          is_active: !filter.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      loadFilters();
    } catch (error: any) {
      console.error('Ошибка обновления статуса фильтра:', error);
      alert(`Ошибка обновления: ${error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const getTableBadge = (targetTable: string) => {
    const colors: Record<string, string> = {
      orders: 'bg-blue-100 text-blue-800',
      operations: 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={colors[targetTable] || 'bg-gray-100 text-gray-800'}>
        {targetTable === 'orders' ? 'Заказы' : targetTable === 'operations' ? 'Операции' : targetTable}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span>
              Управление фильтрами импорта
            </CardTitle>
            <Button onClick={handleCreate}>
              <span className="mr-2">➕</span>
              Создать фильтр
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Целевая таблица</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filters.map((filter) => (
                  <TableRow key={filter.id}>
                    <TableCell className="font-medium">{filter.name}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {filter.description || '-'}
                    </TableCell>
                    <TableCell>{getTableBadge(filter.target_table)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(filter)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          filter.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {filter.is_active ? 'Активен' : 'Неактивен'}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(filter)}
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDelete(filter.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingFilter ? 'Редактировать фильтр' : 'Создать новый фильтр'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название фильтра"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_table">Целевая таблица</Label>
                <Select
                  value={formData.target_table}
                  onValueChange={(value: string) => setFormData({ ...formData, target_table: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders">Заказы</SelectItem>
                    <SelectItem value="operations">Операции</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание фильтра"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter_config">Конфигурация фильтра (JSON)</Label>
              <textarea
                id="filter_config"
                className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm"
                value={formData.filter_config}
                onChange={(e) => setFormData({ ...formData, filter_config: e.target.value })}
                placeholder="JSON конфигурация фильтра"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="column_mapping">Маппинг колонок (JSON)</Label>
              <textarea
                id="column_mapping"
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
                value={formData.column_mapping}
                onChange={(e) => setFormData({ ...formData, column_mapping: e.target.value })}
                placeholder="JSON маппинг колонок"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_active">Активен</Label>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Пример конфигурации фильтра:</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  "required_columns": ["drawing_number", "quantity", "deadline"],
  "optional_columns": ["priority", "workType"],
  "data_validation": {
    "drawing_number": {"type": "string", "required": true},
    "quantity": {"type": "integer", "min": 1, "required": true}
  },
  "skip_empty_rows": true,
  "header_row": 1
}`}
                </pre>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Вы уверены, что хотите удалить этот фильтр?</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
              >
                Отмена
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
              >
                Удалить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilterManager;
