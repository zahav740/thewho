import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAutoJsonBackup } from '../hooks/useAutoJsonBackup';
import { Download, Upload, FileText, Check, AlertCircle, RotateCcw, Copy, Send, Globe } from 'lucide-react';
import { Order } from '../types';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JsonExportModal({ isOpen, onClose }: JsonExportModalProps) {
  const { orders, shifts, setups, operators, addOrder } = useApp();
  const { hasBackup, downloadBackup, clearOldBackups } = useAutoJsonBackup({ enabled: isOpen });
  const [exportType, setExportType] = useState<'orders' | 'all'>('orders');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('webhookUrl') || '');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [autoWebhook, setAutoWebhook] = useState(() => localStorage.getItem('autoWebhook') === 'true');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateJsonData = () => {
    if (exportType === 'orders') {
      return {
        orders,
        exportDate: new Date().toISOString(),
        version: '1.0',
        type: 'orders_only'
      };
    } else {
      return {
        orders,
        shifts,
        setups,
        operators,
        exportDate: new Date().toISOString(),
        version: '1.0',
        type: 'full_backup'
      };
    }
  };

  const downloadJson = () => {
    const data = generateJsonData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:]/g, '-');
    link.download = `thewho-${exportType}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Показываем уведомление
    setImportStatus('success');
    setImportMessage(`JSON файл "${exportType}" успешно скачан!`);
    setTimeout(() => setImportStatus('idle'), 3000);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Валидация структуры JSON
        if (!jsonData.orders || !Array.isArray(jsonData.orders)) {
          throw new Error('Неверная структура JSON файла');
        }

        // Импорт заказов
        let importedCount = 0;
        let skippedCount = 0;
        let duplicateCount = 0;
        
        jsonData.orders.forEach((orderData: any) => {
          // Проверяем, есть ли уже такой заказ
          const existingOrder = orders.find(order => order.id === orderData.id || order.drawingNumber === orderData.drawingNumber);
          
          if (importMode === 'merge' && existingOrder) {
            skippedCount++;
            return;
          }
          
          // Создаем новый заказ с валидацией
          const newOrder: Order = {
            id: orderData.id || `imported-${Date.now()}-${Math.random()}`,
            drawingNumber: orderData.drawingNumber || '',
            deadline: orderData.deadline || new Date().toISOString(),
            quantity: Number(orderData.quantity) || 0,
            priority: Number(orderData.priority) || 0,
            operations: Array.isArray(orderData.operations) ? orderData.operations : [],
            pdfUrl: orderData.pdfUrl
          };
          
          // Пытаемся добавить заказ
          const wasAdded = addOrder(newOrder);
          
          if (wasAdded) {
            importedCount++;
          } else {
            // Не удалось добавить из-за дубликата номера чертежа
            duplicateCount++;
          }
        });
        
        setImportStatus('success');
        if (skippedCount > 0 || duplicateCount > 0) {
          const messages = [];
          if (importedCount > 0) messages.push(`импортировано: ${importedCount}`);
          if (skippedCount > 0) messages.push(`пропущено: ${skippedCount}`);
          if (duplicateCount > 0) messages.push(`дубликатов: ${duplicateCount}`);
          setImportMessage(`${messages.join(', ')} (из ${jsonData.orders.length})`);
        } else {
          setImportMessage(`Успешно импортировано ${importedCount} заказов!`);
        }
        
        // Очищаем input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Ошибка импорта JSON:', error);
        setImportStatus('error');
        setImportMessage('Ошибка при чтении JSON файла. Проверьте формат файла.');
      } finally {
        // Сбрасываем статус через 5 секунд
        setTimeout(() => setImportStatus('idle'), 5000);
      }
    };
    
    reader.readAsText(file);
  };

  const sendWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookStatus('error');
      setWebhookMessage('Пожалуйста, введите URL webhook');
      setTimeout(() => setWebhookStatus('idle'), 3000);
      return;
    }

    setWebhookStatus('sending');
    setWebhookMessage('Отправка данных...');

    try {
      const data = generateJsonData();
      
      // Для только заказов отправляем в формате data_sync
      const payload = exportType === 'orders' 
        ? {
            eventType: 'data_sync',
            timestamp: new Date().toISOString(),
            source: 'TheWho App',
            environment: window.location.hostname,
            data: {
              orders,
              totalOrders: orders.length,
              lastUpdated: new Date().toISOString()
            }
          }
        : {
            ...data,
            timestamp: new Date().toISOString(),
            source: 'TheWho App',
            environment: window.location.hostname
          };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setWebhookStatus('success');
      setWebhookMessage(`Данные успешно отправлены!`);
      
      // Сохраняем URL webhook для следующего использования
      localStorage.setItem('webhookUrl', webhookUrl);
    } catch (error) {
      console.error('Ошибка отправки webhook:', error);
      setWebhookStatus('error');
      setWebhookMessage(`Ошибка отправки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }

    setTimeout(() => setWebhookStatus('idle'), 5000);
  };

  const saveWebhookUrl = () => {
    localStorage.setItem('webhookUrl', webhookUrl);
    localStorage.setItem('autoWebhook', autoWebhook.toString());
    setImportStatus('success');
    setImportMessage('Настройки webhook сохранены!');
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  const copyToClipboard = async () => {
    try {
      const data = generateJsonData();
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      setImportStatus('success');
      setImportMessage('JSON скопирован в буфер обмена!');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
      setImportStatus('error');
      setImportMessage('Ошибка при копировании в буфер обмена');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  if (!isOpen) return null;

  const data = generateJsonData();
  const dataSize = (JSON.stringify(data).length / 1024).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FileText className="mr-2" size={24} />
          Экспорт/Импорт JSON
        </h2>

        {/* Статус уведомления */}
        {(importStatus !== 'idle' || webhookStatus !== 'idle') && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            (importStatus === 'success' || webhookStatus === 'success')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : webhookStatus === 'sending'
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {(importStatus === 'success' || webhookStatus === 'success') ? (
              <Check className="mr-2" size={16} />
            ) : webhookStatus === 'sending' ? (
              <Send className="mr-2 animate-pulse" size={16} />
            ) : (
              <AlertCircle className="mr-2" size={16} />
            )}
            {webhookStatus !== 'idle' ? webhookMessage : importMessage}
          </div>
        )}

        {/* Тип экспорта */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Что экспортировать:
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="orders"
                checked={exportType === 'orders'}
                onChange={(e) => setExportType(e.target.value as 'orders' | 'all')}
                className="mr-2"
              />
              <span>Только заказы ({orders.length} шт.)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === 'all'}
                onChange={(e) => setExportType(e.target.value as 'orders' | 'all')}
                className="mr-2"
              />
              <span>Все данные (заказы, смены, наладки, операторы)</span>
            </label>
          </div>
        </div>

        {/* Автобэкап */}
        {hasBackup && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">🔄 Автоматический бэкап</h3>
            <div className="flex space-x-2 text-sm flex-wrap gap-2">
              <button
                onClick={downloadBackup}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="mr-1" size={14} />
                Скачать
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Это очистит все старые данные из localStorage. Продолжить?')) {
                    clearOldBackups();
                    setImportStatus('success');
                    setImportMessage('localStorage очищен от старых данных!');
                    setTimeout(() => setImportStatus('idle'), 3000);
                  }
                }}
                className="flex items-center px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                <RotateCcw className="mr-1" size={14} />
                Очистить кэш
              </button>
              <span className="text-blue-700 text-xs mt-1">
                Автоматическое сохранение каждые 5 минут
              </span>
            </div>
          </div>
        )}

        {/* Информация о размере */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div>📦 Размер JSON: <span className="font-medium">{dataSize} KB</span></div>
            <div>📅 Дата: <span className="font-medium">{new Date().toLocaleString()}</span></div>
            <div>🔢 Заказов: <span className="font-medium">{orders.length}</span></div>
          </div>
        </div>

        {/* Действия с экспортом */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">📤 Экспорт</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadJson}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="mr-2" size={16} />
              Скачать JSON
            </button>
            <button
              onClick={copyToClipboard}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Copy className="mr-2" size={16} />
              Копировать
            </button>
            <button
              onClick={sendWebhook}
              disabled={webhookStatus === 'sending'}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                webhookStatus === 'sending'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Send className={`mr-2 ${webhookStatus === 'sending' ? 'animate-pulse' : ''}`} size={16} />
              {webhookStatus === 'sending' ? 'Отправка...' : 'Отправить Webhook'}
            </button>
          </div>
        </div>

        {/* Настройка Webhook */}
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-medium mb-3 flex items-center text-purple-800">
            <Globe className="mr-2" size={20} />
            🔗 Настройка Webhook (n8n)
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                URL webhook:
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                  className="flex-1 px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={saveWebhookUrl}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  Сохранить
                </button>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Пример: https://n8n.yourserver.com/webhook/thewho-orders
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoWebhook}
                  onChange={(e) => setAutoWebhook(e.target.checked)}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-purple-700">
                  🤖 Автоматически отправлять webhook при изменении заказов
                </span>
              </label>
              <p className="text-xs text-purple-600 mt-1 ml-6">
                (добавление, обновление, удаление заказов)
              </p>
            </div>
            
            <div className="text-sm text-purple-700">
              <div className="mb-2">
                <strong>Формат отправляемых данных:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Тип запроса: POST</li>
                <li>Content-Type: application/json</li>
                <li>Дополнительные поля: timestamp, source, environment</li>
                <li>Содержимое: выбранные данные (заказы или все данные)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Действия с импортом */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">📥 Импорт</h3>
          
          {/* Режим импорта */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Режим импорта:
            </label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="mr-2"
                />
                <span>🔄 Объединить (пропустить существующие)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="mr-2"
                />
                <span>🔁 Заменить (перезаписать существующие)</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="json-import"
            />
            <label
              htmlFor="json-import"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Upload className="mr-2" size={16} />
              Загрузить JSON
            </label>
            <span className="text-sm text-gray-500">
              (.json файлы)
            </span>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}