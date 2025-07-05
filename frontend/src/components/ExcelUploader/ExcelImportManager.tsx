/**
 * @file: ExcelImportManager.tsx
 * @description: Компонент для управления импортом Excel файлов с сохранением в БД (исправлено)
 * @created: 2025-06-30
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../common/Tabs';
import { Badge } from '../common/Badge';
import { Progress } from '../common/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../common/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../common/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../common/Dialog';
import { Alert, AlertDescription } from '../common/Alert';
import { format, ru } from '../../utils/dateUtils';

interface ExcelImport {
  id: number;
  filename: string;
  original_filename: string;
  upload_date: string;
  processed_date?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  error_message?: string;
  headers_count?: number;
  rows_count?: number;
  sheets_count?: number;
  imported_to_orders: boolean;
  imported_to_operations: boolean;
}

interface ImportFilter {
  id: number;
  name: string;
  description: string;
  target_table: string;
  is_active: boolean;
}

interface ImportResult {
  id: number;
  filename: string;
  status: string;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; error: string }>;
  headers: string[];
  rowsCount: number;
  dataPreview: any[];
}

interface CellData {
  sheet_name: string;
  row_number: number;
  column_name: string;
  cell_value: string;
}

export const ExcelImportManager: React.FC = () => {
  const [imports, setImports] = useState<ExcelImport[]>([]);
  const [filters, setFilters] = useState<ImportFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<number | undefined>();
  const [targetTable, setTargetTable] = useState('orders');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadImports();
    loadFilters();
  }, [currentPage]);

  useEffect(() => {
    loadFilters();
  }, [targetTable]);

  const loadImports = async () => {
    try {
      const response = await fetch(`/api/excel-import-db/imports?page=${currentPage}&limit=20`);
      const data = await response.json();
      setImports(data.imports);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Ошибка загрузки импортов:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await fetch(`/api/excel-import-db/filters?targetTable=${targetTable}`);
      const data = await response.json();
      setFilters(data);
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const url = new URL('/api/excel-import-db/upload', window.location.origin);
      url.searchParams.append('targetTable', targetTable);
      if (selectedFilter) {
        url.searchParams.append('filterId', selectedFilter.toString());
      }

      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImportResult(result);
      setSelectedFile(null);
      loadImports(); // Обновляем список импортов

    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      alert(`Ошибка загрузки файла: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleShowDetails = async (importId: number) => {
    try {
      const response = await fetch(`/api/excel-import-db/imports/${importId}`);
      const data = await response.json();
      setDetailsData(data);
      setShowDetails(importId);
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
    }
  };

  const handleReImport = async (importId: number) => {
    if (!selectedFilter) {
      alert('Пожалуйста, выберите фильтр для повторного импорта');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/excel-import-db/imports/${importId}/re-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetTable,
          filterId: selectedFilter,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImportResult(result);
      loadImports();

    } catch (error: any) {
      console.error('Ошибка повторного импорта:', error);
      alert(`Ошибка повторного импорта: ${error?.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: string }> = {
      uploaded: { color: 'blue', text: 'Загружено', icon: '📤' },
      processing: { color: 'yellow', text: 'Обработка', icon: '⏳' },
      processed: { color: 'green', text: 'Обработано', icon: '✅' },
      error: { color: 'red', text: 'Ошибка', icon: '❌' },
    };

    const config = statusConfig[status] || { color: 'gray', text: status, icon: '📄' };
    
    return (
      <Badge 
        variant={config.color === 'green' ? 'default' : 'secondary'}
        className={`flex items-center gap-1 ${
          config.color === 'green' ? 'bg-green-100 text-green-800' :
          config.color === 'red' ? 'bg-red-100 text-red-800' :
          config.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}
      >
        <span>{config.icon}</span>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📄</span>
            Импорт Excel файлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Загрузка файла</TabsTrigger>
              <TabsTrigger value="history">История импортов</TabsTrigger>
            </TabsList>

            {/* Вкладка загрузки */}
            <TabsContent value="upload" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetTable">Целевая таблица</Label>
                  <Select value={targetTable} onValueChange={setTargetTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите таблицу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">Заказы</SelectItem>
                      <SelectItem value="operations">Операции</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter">Фильтр импорта</Label>
                  <Select 
                    value={selectedFilter?.toString() || ''} 
                    onValueChange={(value) => setSelectedFilter(value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите фильтр (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.map((filter) => (
                        <SelectItem key={filter.id} value={filter.id.toString()}>
                          {filter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Выберите Excel файл</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || loading}
                    className="min-w-32"
                  >
                    {loading ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📤</span>
                        Загрузить
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <Alert>
                  <span className="text-blue-600">📄</span>
                  <AlertDescription>
                    Выбран файл: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <Label>Прогресс загрузки</Label>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {importResult && (
                <Alert className="border-green-200 bg-green-50">
                  <span className="text-green-600">✅</span>
                  <AlertDescription className="text-green-800">
                    <div className="space-y-1">
                      <div className="font-semibold">Импорт завершен успешно!</div>
                      <div>Файл: {importResult.filename}</div>
                      <div>Создано: {importResult.created}, Обновлено: {importResult.updated}, Пропущено: {importResult.skipped}</div>
                      <div>Обработано строк: {importResult.rowsCount}</div>
                      {importResult.errors.length > 0 && (
                        <div className="text-red-600">
                          Ошибки: {importResult.errors.length}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Вкладка истории */}
            <TabsContent value="history" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Файл</TableHead>
                      <TableHead>Дата загрузки</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Строк</TableHead>
                      <TableHead>Импорт в</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((importItem) => (
                      <TableRow key={importItem.id}>
                        <TableCell className="font-medium">
                          {importItem.original_filename}
                        </TableCell>
                        <TableCell>
                          {format(new Date(importItem.upload_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(importItem.status)}
                        </TableCell>
                        <TableCell>
                          {importItem.rows_count || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {importItem.imported_to_orders && (
                              <Badge variant="outline" className="text-xs">Заказы</Badge>
                            )}
                            {importItem.imported_to_operations && (
                              <Badge variant="outline" className="text-xs">Операции</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowDetails(importItem.id)}
                            >
                              👁️
                            </Button>
                            {importItem.status === 'processed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReImport(importItem.id)}
                                disabled={loading}
                              >
                                🔄
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Предыдущая
                  </Button>
                  <span className="flex items-center px-4">
                    Страница {currentPage} из {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Следующая
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Модальное окно с деталями импорта */}
      <Dialog open={showDetails !== null} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали импорта #{showDetails}</DialogTitle>
          </DialogHeader>
          {detailsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Файл</Label>
                  <div className="text-sm text-gray-600">{detailsData.import.original_filename}</div>
                </div>
                <div>
                  <Label>Статус</Label>
                  <div>{getStatusBadge(detailsData.import.status)}</div>
                </div>
                <div>
                  <Label>Дата загрузки</Label>
                  <div className="text-sm text-gray-600">
                    {format(new Date(detailsData.import.upload_date), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </div>
                </div>
                <div>
                  <Label>Размер файла</Label>
                  <div className="text-sm text-gray-600">
                    {detailsData.import.file_size ? `${(detailsData.import.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </div>
                </div>
              </div>

              {detailsData.import.error_message && (
                <Alert className="border-red-200 bg-red-50">
                  <span className="text-red-600">❌</span>
                  <AlertDescription className="text-red-800">
                    {detailsData.import.error_message}
                  </AlertDescription>
                </Alert>
              )}

              {detailsData.dataPreview && detailsData.dataPreview.length > 0 && (
                <div>
                  <Label>Превью данных</Label>
                  <div className="mt-2 max-h-64 overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Лист</TableHead>
                          <TableHead>Строка</TableHead>
                          <TableHead>Колонка</TableHead>
                          <TableHead>Значение</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsData.dataPreview.slice(0, 50).map((cell: CellData, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{cell.sheet_name || 'Лист1'}</TableCell>
                            <TableCell>{cell.row_number}</TableCell>
                            <TableCell>{cell.column_name}</TableCell>
                            <TableCell className="max-w-48 truncate">
                              {cell.cell_value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {detailsData.dataPreview.length > 50 && (
                    <div className="text-sm text-gray-500 mt-2">
                      Показано первые 50 из {detailsData.dataPreview.length} ячеек
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExcelImportManager;
