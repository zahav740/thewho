import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CirclePlus, User, X, Webhook, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import i18n from '../i18n';

interface OperatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OperatorsModal({ isOpen, onClose }: OperatorsModalProps) {
  const { t } = useTranslation();
  const { operators, addOperator, removeOperator } = useApp();
  const [newOperatorName, setNewOperatorName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'operators' | 'webhook'>('operators');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoWebhook, setAutoWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');

  // Функция для перевода имени оператора
  const translateOperatorName = (name: string): string => {
    // Используем i18n для определения текущего языка
    const currentLanguage = (i18n?.language || 'ru').toLowerCase();

    // Если язык русский, возвращаем русские имена
    if (currentLanguage === 'ru') {
      // Для русского языка - возвращаем русские версии имен
      if (name.toLowerCase().includes('daniel')) return 'Даниэль';
      if (name.toLowerCase().includes('slava')) return 'Слава';
      if (name.toLowerCase().includes('andrey')) return 'Андрей';
      if (name.toLowerCase().includes('denis')) return 'Денис';
      if (name.toLowerCase().includes('kirill')) return 'Кирилл';
      if (name.toLowerCase().includes('arkady')) return 'Аркадий';
      
      // Если имя уже на русском, оставляем как есть
      return name;
    }
    
    // Для английского языка - переводим на английский
    // Прямое сравнение для полных совпадений
    if (name === "Даниель" || name === "Даниэль") return "Daniel";
    if (name === "Слава" || name === "Славик") return "Slava";
    if (name === "Андрей") return "Andrey";
    if (name === "Денис") return "Denis";
    if (name === "Кирилл") return "Kirill";
    if (name === "Аркадий") return "Arkady";

    // Для частичных совпадений проверяем нижний регистр
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('дани') || lowercaseName.includes('дэниэл')) return "Daniel";
    if (lowercaseName.includes('слав')) return "Slava";
    if (lowercaseName.includes('андрей')) return "Andrey";
    if (lowercaseName.includes('денис')) return "Denis";
    if (lowercaseName.includes('кирилл')) return "Kirill";
    if (lowercaseName.includes('аркадий')) return "Arkady";
    
    // Для английских имен - вернуть как есть
    return name;
  };

  const handleSaveWebhook = () => {
    localStorage.setItem('webhookUrl', webhookUrl);
    localStorage.setItem('autoWebhook', autoWebhook.toString());
    setWebhookMessage('Настройки webhook сохранены');
    setWebhookStatus('success');
    setTimeout(() => {
      setWebhookMessage('');
      setWebhookStatus('idle');
    }, 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    
    setWebhookStatus('testing');
    setWebhookMessage('Отправка тестового сообщения...');
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          message: 'Тестовое сообщение от TheWho App',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setWebhookStatus('success');
        setWebhookMessage('Webhook работает корректно!');
      } else {
        setWebhookStatus('error');
        setWebhookMessage(`Ошибка: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setWebhookStatus('error');
      setWebhookMessage(`Ошибка соединения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
    
    setTimeout(() => {
      setWebhookMessage('');
      setWebhookStatus('idle');
    }, 5000);
  };

  useEffect(() => {
    if (isOpen) {
      // Загружаем настройки webhook при открытии модального окна
      const savedUrl = localStorage.getItem('webhookUrl') || '';
      const savedAuto = localStorage.getItem('autoWebhook') === 'true';
      setWebhookUrl(savedUrl);
      setAutoWebhook(savedAuto);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddOperator = () => {
    if (newOperatorName.trim()) {
      addOperator(newOperatorName.trim());
      setNewOperatorName('');
    }
  };

  const handleRemoveOperator = (name: string) => {
    removeOperator(name);
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            <Settings className="inline-block mr-2" size={24} />
            {t('settings')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Вкладки */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('operators')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'operators'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline-block mr-1" size={16} />
              {t('manage_operators')}
            </button>
            <button
              onClick={() => setActiveTab('webhook')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'webhook'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Webhook className="inline-block mr-1" size={16} />
              Webhook & n8n
            </button>
          </nav>
        </div>
        
        {/* Содержимое вкладок */}
        {activeTab === 'operators' && (
          <div>
            <div className="mb-6">
              <div className="flex">
                <input
                  type="text"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOperator()}
                  placeholder={t('operator_name')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddOperator}
                  disabled={!newOperatorName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <CirclePlus size={18} className="mr-2" />
                  {t('add')}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">{t('operators')}</h3>
              
              {operators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{t('no_operators')}</p>
                  <p className="text-sm">{t('add_operators_to_work')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-lg">
                  {operators.map((operator, index) => {
                    const operatorName = typeof operator === 'string' ? operator : (operator as any)?.name || 'Unknown';
                    return (
                      <li key={`operator-${index}-${operatorName}`} className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div className="flex items-center">
                          <User size={20} className="text-gray-400 mr-3" />
                          <span className="font-medium">{translateOperatorName(String(operatorName))}</span>
                        </div>
                        
                        {confirmDelete === operatorName ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{t('confirm_delete')}</span>
                            <button
                              onClick={() => handleRemoveOperator(operatorName)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              {t('yes')}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(operatorName)}
                            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                            title={t('delete_operator')}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'webhook' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Webhook className="mr-2" size={20} />
                Настройки интеграции с n8n
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Настройте webhook для автоматической отправки данных планирования в n8n workflow.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL webhook n8n
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-domain.com/webhook/thewho-orders"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Скопируйте URL webhook из вашего n8n workflow
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoWebhook"
                  checked={autoWebhook}
                  onChange={(e) => setAutoWebhook(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoWebhook" className="text-sm text-gray-700">
                  Автоматически отправлять данные при изменении заказов
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveWebhook}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Settings className="mr-2" size={16} />
                  Сохранить настройки
                </button>
                
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookStatus === 'testing' || !webhookUrl}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Webhook className="mr-2" size={16} />
                  {webhookStatus === 'testing' ? 'Тестирование...' : 'Тестировать webhook'}
                </button>
              </div>
              
              {webhookMessage && (
                <div className={`p-3 rounded-md ${
                  webhookStatus === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                  webhookStatus === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {webhookMessage}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Инструкции по настройке</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Создайте workflow в n8n с webhook trigger</li>
                <li>Скопируйте URL webhook и вставьте его выше</li>
                <li>Проверьте соединение кнопкой "Тестировать webhook"</li>
                <li>Включите автоматическую отправку при необходимости</li>
                <li>В планировании используйте кнопку "Отправить в n8n"</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
