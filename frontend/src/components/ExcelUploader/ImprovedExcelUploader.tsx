/**
 * @file: ImprovedExcelUploader.tsx
 * @description: React компонент для загрузки Excel файлов с дефолтными колонками (обновленная версия с пропсами)
 * @created: 2025-07-03
 */
import React, { useState, useCallback, useRef } from 'react';
import './ExcelUploader.css';

interface ColumnMapping {
  drawingNumber: string;
  quantity: string;
  deadline: string;
  priority: string;
}

interface UploadOptions {
  description?: string;
  startRow?: number;
  maxRows?: number;
  sheetIndex?: number;
  skipEmptyRows?: boolean;
  columnMapping?: Partial<ColumnMapping>;
}

interface ProcessedData {
  drawingNumber: string | null;
  quantity: number | null;
  deadline: string | Date | null;
  priority: string | number | null;
  rawData: Record<string, any>;
  rowIndex: number;
}

interface UploadResult {
  id: number;
  originalName: string;
  fileSize: number;
  processedRows: number;
  totalRows: number;
  status: string;
  message: string;
  preview: ProcessedData[];
  columnMapping: ColumnMapping;
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  isValid: boolean;
  fileInfo: {
    size: number;
    type: string;
    name: string;
  };
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
  }>;
  preview: {
    headers: string[];
    sampleRows: any[][];
  };
  columnMapping: {
    drawingNumber: { column: string; value: any };
    quantity: { column: string; value: any };
    deadline: { column: string; value: any };
    priority: { column: string; value: any };
  };
  warnings: string[];
  recommendations: string[];
}

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  drawingNumber: 'C',
  quantity: 'E', 
  deadline: 'G',
  priority: 'K'
};

interface ImprovedExcelUploaderProps {
  title?: string;
  description?: string;
  onUpload?: (file: File, data?: any[]) => Promise<{success: boolean; message: string; ordersCount?: number; readyForDownload?: number}>;
  onPreview?: (data: any[]) => void;
  onDownload?: (fileIndex: number) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  showPreview?: boolean;
  statusMapping?: Record<string, {color: string; text: string; canDownload?: boolean}>;
}

const ImprovedExcelUploader: React.FC<ImprovedExcelUploaderProps> = ({
  title = 'Загрузка Excel файлов',
  description = 'Загрузите Excel файл для автоматического извлечения данных из колонок:\nC - Номер чертежа, E - Количество, G - Дедлайн, K - Приоритет',
  onUpload,
  onPreview,
  onDownload,
  maxFileSize = 50,
  acceptedFormats = ['.xlsx', '.xls'],
  showPreview = true,
  statusMapping
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    description: '',
    startRow: 2,
    maxRows: 10000,
    sheetIndex: 0,
    skipEmptyRows: true,
    columnMapping: {}
  });
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка выбора файла
  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const isValidType = allowedTypes.includes(file.type) || acceptedFormats.some(format => file.name.toLowerCase().endsWith(format.toLowerCase()));

    if (!isValidType) {
      setError(`Поддерживаются только файлы ${acceptedFormats.join(', ')}`);
      return;
    }

    // Проверка размера файла
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`Размер файла не должен превышать ${maxFileSize}MB`);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setValidationResult(null);
    setUploadResult(null);
  }, [acceptedFormats, maxFileSize]);

  // Drag & Drop обработчики
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Обработка клика по области загрузки
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Валидация файла
  const validateFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/excel-import/v2/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка валидации файла');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);

      // Вызываем onPreview если он передан
      if (onPreview && result.preview.sampleRows.length > 0) {
        onPreview(result.preview.sampleRows);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка валидации файла');
    } finally {
      setIsValidating(false);
    }
  }, [selectedFile, onPreview]);

  // Загрузка файла
  const uploadFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Если передан кастомный обработчик загрузки, используем его
      if (onUpload) {
        const processedData = validationResult?.preview.sampleRows || [];
        const result = await onUpload(selectedFile, processedData);
        
        setUploadResult({
          id: Date.now(),
          originalName: selectedFile.name,
          fileSize: selectedFile.size,
          processedRows: result.ordersCount || 0,
          totalRows: result.ordersCount || 0,
          status: result.success ? 'success' : 'error',
          message: result.message,
          preview: [],
          columnMapping: DEFAULT_COLUMN_MAPPING,
          errors: [],
          warnings: []
        });
        
        setSelectedFile(null);
        setValidationResult(null);
        return;
      }

      // Дефолтная загрузка через API
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Добавляем опции
      if (uploadOptions.description) formData.append('description', uploadOptions.description);
      if (uploadOptions.startRow) formData.append('startRow', uploadOptions.startRow.toString());
      if (uploadOptions.maxRows) formData.append('maxRows', uploadOptions.maxRows.toString());
      if (uploadOptions.sheetIndex) formData.append('sheetIndex', uploadOptions.sheetIndex.toString());
      formData.append('skipEmptyRows', uploadOptions.skipEmptyRows ? 'true' : 'false');

      // Добавляем настраиваемый маппинг колонок
      if (uploadOptions.columnMapping?.drawingNumber) {
        formData.append('drawingNumberColumn', uploadOptions.columnMapping.drawingNumber);
      }
      if (uploadOptions.columnMapping?.quantity) {
        formData.append('quantityColumn', uploadOptions.columnMapping.quantity);
      }
      if (uploadOptions.columnMapping?.deadline) {
        formData.append('deadlineColumn', uploadOptions.columnMapping.deadline);
      }
      if (uploadOptions.columnMapping?.priority) {
        formData.append('priorityColumn', uploadOptions.columnMapping.priority);
      }

      const response = await fetch('/api/excel-import/v2/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка загрузки файла');
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);
      setSelectedFile(null);
      setValidationResult(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, uploadOptions, onUpload, validationResult]);

  // Сброс формы
  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setValidationResult(null);
    setUploadResult(null);
    setError(null);
    setUploadOptions({
      description: '',
      startRow: 2,
      maxRows: 10000,
      sheetIndex: 0,
      skipEmptyRows: true,
      columnMapping: {}
    });
  }, []);

  // Обновление настроек колонок
  const updateColumnMapping = useCallback((field: keyof ColumnMapping, value: string) => {
    setUploadOptions(prev => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [field]: value.toUpperCase()
      }
    }));
  }, []);

  return (
    <div className="excel-uploader">
      <div className="uploader-header">
        <h2>{title}</h2>
        <p className="uploader-description">
          {description.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < description.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      </div>

      {/* Область загрузки файла */}
      {!selectedFile && (
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <p>Перетащите Excel файл сюда или нажмите для выбора</p>
              <p className="upload-hint">Поддерживаются файлы {acceptedFormats.join(', ')} до {maxFileSize}MB</p>
            </div>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept={acceptedFormats.join(',')}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Информация о выбранном файле */}
      {selectedFile && (
        <div className="file-info">
          <div className="file-details">
            <h3>Выбранный файл</h3>
            <p><strong>Название:</strong> {selectedFile.name}</p>
            <p><strong>Размер:</strong> {Math.round(selectedFile.size / 1024)} KB</p>
            <p><strong>Тип:</strong> {selectedFile.type}</p>
          </div>
          
          <div className="file-actions">
            <button 
              onClick={validateFile} 
              disabled={isValidating}
              className="btn btn-secondary"
            >
              {isValidating ? 'Проверка...' : 'Проверить файл'}
            </button>
            <button 
              onClick={resetForm}
              className="btn btn-outline"
            >
              Выбрать другой файл
            </button>
          </div>
        </div>
      )}

      {/* Настройки загрузки */}
      {selectedFile && !onUpload && (
        <div className="upload-settings">
          <div className="settings-header">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn btn-link"
            >
              {showAdvanced ? '▼' : '▶'} Дополнительные настройки
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-settings">
              <div className="settings-grid">
                <div className="setting-group">
                  <label>Описание файла:</label>
                  <input
                    type="text"
                    value={uploadOptions.description || ''}
                    onChange={(e) => setUploadOptions(prev => ({...prev, description: e.target.value}))}
                    placeholder="Описание загружаемого файла"
                  />
                </div>

                <div className="setting-group">
                  <label>Начальная строка данных:</label>
                  <input
                    type="number"
                    value={uploadOptions.startRow || 2}
                    onChange={(e) => setUploadOptions(prev => ({...prev, startRow: parseInt(e.target.value) || 2}))}
                    min="1"
                  />
                </div>

                <div className="setting-group">
                  <label>Максимум строк:</label>
                  <input
                    type="number"
                    value={uploadOptions.maxRows || 10000}
                    onChange={(e) => setUploadOptions(prev => ({...prev, maxRows: parseInt(e.target.value) || 10000}))}
                    min="1"
                    max="50000"
                  />
                </div>

                <div className="setting-group">
                  <label>Индекс листа:</label>
                  <input
                    type="number"
                    value={uploadOptions.sheetIndex || 0}
                    onChange={(e) => setUploadOptions(prev => ({...prev, sheetIndex: parseInt(e.target.value) || 0}))}
                    min="0"
                  />
                </div>

                <div className="setting-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={uploadOptions.skipEmptyRows !== false}
                      onChange={(e) => setUploadOptions(prev => ({...prev, skipEmptyRows: e.target.checked}))}
                    />
                    Пропускать пустые строки
                  </label>
                </div>
              </div>

              {/* Настройка маппинга колонок */}
              <div className="column-mapping">
                <h4>Настройка колонок</h4>
                <div className="mapping-grid">
                  <div className="mapping-item">
                    <label>Номер чертежа:</label>
                    <input
                      type="text"
                      value={uploadOptions.columnMapping?.drawingNumber || DEFAULT_COLUMN_MAPPING.drawingNumber}
                      onChange={(e) => updateColumnMapping('drawingNumber', e.target.value)}
                      placeholder="C"
                      maxLength={3}
                    />
                  </div>

                  <div className="mapping-item">
                    <label>Количество:</label>
                    <input
                      type="text"
                      value={uploadOptions.columnMapping?.quantity || DEFAULT_COLUMN_MAPPING.quantity}
                      onChange={(e) => updateColumnMapping('quantity', e.target.value)}
                      placeholder="E"
                      maxLength={3}
                    />
                  </div>

                  <div className="mapping-item">
                    <label>Дедлайн:</label>
                    <input
                      type="text"
                      value={uploadOptions.columnMapping?.deadline || DEFAULT_COLUMN_MAPPING.deadline}
                      onChange={(e) => updateColumnMapping('deadline', e.target.value)}
                      placeholder="G"
                      maxLength={3}
                    />
                  </div>

                  <div className="mapping-item">
                    <label>Приоритет:</label>
                    <input
                      type="text"
                      value={uploadOptions.columnMapping?.priority || DEFAULT_COLUMN_MAPPING.priority}
                      onChange={(e) => updateColumnMapping('priority', e.target.value)}
                      placeholder="K"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Результат валидации */}
      {validationResult && showPreview && (
        <div className="validation-result">
          <h3>Результат проверки файла</h3>
          
          <div className="validation-info">
            <div className="file-stats">
              <p><strong>Листов:</strong> {validationResult.sheets.length}</p>
              <p><strong>Строк:</strong> {validationResult.sheets[0]?.rowCount || 0}</p>
              <p><strong>Колонок:</strong> {validationResult.sheets[0]?.columnCount || 0}</p>
            </div>

            {/* Предпросмотр данных */}
            <div className="preview-section">
              <h4>Предпросмотр данных</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {validationResult.preview.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Маппинг колонок */}
            <div className="mapping-preview">
              <h4>Значения из дефолтных колонок</h4>
              <div className="mapping-values">
                <div className="mapping-value">
                  <span className="label">Номер чертежа (C):</span>
                  <span className="value">{validationResult.columnMapping.drawingNumber.value || 'Нет данных'}</span>
                </div>
                <div className="mapping-value">
                  <span className="label">Количество (E):</span>
                  <span className="value">{validationResult.columnMapping.quantity.value || 'Нет данных'}</span>
                </div>
                <div className="mapping-value">
                  <span className="label">Дедлайн (G):</span>
                  <span className="value">{validationResult.columnMapping.deadline.value || 'Нет данных'}</span>
                </div>
                <div className="mapping-value">
                  <span className="label">Приоритет (K):</span>
                  <span className="value">{validationResult.columnMapping.priority.value || 'Нет данных'}</span>
                </div>
              </div>
            </div>

            {/* Предупреждения */}
            {validationResult.warnings.length > 0 && (
              <div className="warnings">
                <h4>Предупреждения</h4>
                <ul>
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="warning">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Рекомендации */}
            {validationResult.recommendations.length > 0 && (
              <div className="recommendations">
                <h4>Рекомендации</h4>
                <ul>
                  {validationResult.recommendations.map((rec, index) => (
                    <li key={index} className="recommendation">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="validation-actions">
            <button 
              onClick={uploadFile} 
              disabled={isUploading}
              className="btn btn-primary"
            >
              {isUploading ? 'Загрузка...' : 'Загрузить файл'}
            </button>
            {onDownload && (
              <button 
                onClick={() => onDownload(uploadResult?.id || 0)}
                className="btn btn-secondary"
              >
                Скачать результат
              </button>
            )}
          </div>
        </div>
      )}

      {/* Результат загрузки */}
      {uploadResult && (
        <div className="upload-result">
          <h3>Результат загрузки</h3>
          
          <div className="result-summary">
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">{uploadResult.processedRows}</span>
                <span className="stat-label">Обработано строк</span>
              </div>
              <div className="stat">
                <span className="stat-value">{uploadResult.totalRows}</span>
                <span className="stat-label">Всего строк</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Math.round(uploadResult.fileSize / 1024)} KB</span>
                <span className="stat-label">Размер файла</span>
              </div>
            </div>

            <p className="result-message">{uploadResult.message}</p>
          </div>

          {/* Предпросмотр обработанных данных */}
          {uploadResult.preview.length > 0 && showPreview && (
            <div className="processed-preview">
              <h4>Предпросмотр обработанных данных</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Строка</th>
                      <th>Номер чертежа</th>
                      <th>Количество</th>
                      <th>Дедлайн</th>
                      <th>Приоритет</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.preview.map((row, index) => (
                      <tr key={index}>
                        <td>{row.rowIndex}</td>
                        <td>{row.drawingNumber || '-'}</td>
                        <td>{row.quantity || '-'}</td>
                        <td>{row.deadline ? (typeof row.deadline === 'string' ? row.deadline : new Date(row.deadline).toLocaleDateString()) : '-'}</td>
                        <td>{row.priority || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ошибки и предупреждения */}
          {uploadResult.errors.length > 0 && (
            <div className="upload-errors">
              <h4>Ошибки</h4>
              <ul>
                {uploadResult.errors.map((error, index) => (
                  <li key={index} className="error">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadResult.warnings.length > 0 && (
            <div className="upload-warnings">
              <h4>Предупреждения</h4>
              <ul>
                {uploadResult.warnings.map((warning, index) => (
                  <li key={index} className="warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-actions">
            <button 
              onClick={resetForm}
              className="btn btn-primary"
            >
              Загрузить еще файл
            </button>
            {onDownload && (
              <button 
                onClick={() => onDownload(uploadResult.id)}
                className="btn btn-secondary"
              >
                Скачать обработанный файл
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ошибки */}
      {error && (
        <div className="error-message">
          <h4>Ошибка</h4>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-outline">
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};

export default ImprovedExcelUploader;
