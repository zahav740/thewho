import React, { useState, useEffect } from 'react';
import { useProductionPlanning } from '../hooks/useProductionPlanning';
import { Clock, TrendingUp, History, AlertTriangle, Info } from 'lucide-react';

interface RescheduleLogEntry {
  id: string;
  timestamp: string;
  triggerOperation: {
    orderId: string;
    operationId: string;
    drawingNumber: string;
    operationNumber: number;
    machine: string;
  };
  setupTimeChange: {
    planned: number;
    actual: number;
    difference: number;
    percentageChange: number;
  };
  affectedOperations: Array<{
    orderId: string;
    operationId: string;
    drawingNumber: string;
    operationNumber: number;
    oldStartDate: string;
    newStartDate: string;
    delayMinutes: number;
  }>;
  summary: {
    totalAffectedOperations: number;
    maxDelayMinutes: number;
    affectedMachine: string;
  };
}

const RescheduleLogModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { } = useProductionPlanning();
  const [rescheduleLog, setRescheduleLog] = useState<RescheduleLogEntry[]>([]);

  useEffect(() => {
    // Загружаем журнал из localStorage
    const saved = localStorage.getItem('rescheduleLog');
    if (saved) {
      setRescheduleLog(JSON.parse(saved));
    }
  }, []);

  // Если функция addRescheduleEntry понадобится в будущем, раскомментируйте:
  // const addRescheduleEntry = (entry: RescheduleLogEntry) => {
  //   setRescheduleLog(prev => {
  //     const updated = [entry, ...prev];
  //     localStorage.setItem('rescheduleLog', JSON.stringify(updated));
  //     return updated;
  //   });
  // };

  const clearLog = () => {
    setRescheduleLog([]);
    localStorage.removeItem('rescheduleLog');
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDelayColor = (delayMinutes: number) => {
    if (delayMinutes === 0) return 'text-green-600';
    if (delayMinutes < 60) return 'text-yellow-600';
    if (delayMinutes < 240) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <History className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Журнал автоматических перепланирований
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {rescheduleLog.length > 0 && (
                <button
                  onClick={clearLog}
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                >
                  Очистить журнал
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            История автоматических перепланирований после ввода фактического времени наладки
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {rescheduleLog.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Журнал перепланирований пуст
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Записи появятся после первого автоматического перепланирования
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rescheduleLog.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Заголовок записи */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        Перепланирование операции {entry.triggerOperation.operationNumber}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Чертеж: {entry.triggerOperation.drawingNumber} | 
                        Станок: {entry.triggerOperation.machine} | 
                        Время: {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {entry.id.split('-').pop()}
                    </div>
                  </div>

                  {/* Изменение времени наладки */}
                  <div className="bg-gray-50 rounded-md p-3 mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Изменение времени наладки
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Планового:</span>
                        <div className="font-medium">{entry.setupTimeChange.planned} мин</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Фактическое:</span>
                        <div className="font-medium">{entry.setupTimeChange.actual} мин</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Разница:</span>
                        <div className={`font-medium ${
                          entry.setupTimeChange.difference > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {entry.setupTimeChange.difference > 0 ? '+' : ''}{entry.setupTimeChange.difference} мин
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Изменение:</span>
                        <div className={`font-medium ${
                          entry.setupTimeChange.percentageChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {entry.setupTimeChange.percentageChange > 0 ? '+' : ''}{entry.setupTimeChange.percentageChange.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Сводка воздействия */}
                  <div className="bg-blue-50 rounded-md p-3 mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      <TrendingUp className="inline h-4 w-4 mr-1" />
                      Сводка воздействия
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Затронуто операций:</span>
                        <div className="font-medium text-blue-600">
                          {entry.summary.totalAffectedOperations}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Максимальная задержка:</span>
                        <div className={`font-medium ${getDelayColor(entry.summary.maxDelayMinutes)}`}>
                          {entry.summary.maxDelayMinutes} мин
                          {entry.summary.maxDelayMinutes >= 60 && (
                            <span className="text-xs ml-1">
                              ({Math.floor(entry.summary.maxDelayMinutes / 60)}ч {entry.summary.maxDelayMinutes % 60}м)
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Станок:</span>
                        <div className="font-medium">{entry.summary.affectedMachine}</div>
                      </div>
                    </div>
                  </div>

                  {/* Список затронутых операций */}
                  {entry.affectedOperations.length > 0 && (
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        <AlertTriangle className="inline h-4 w-4 mr-1" />
                        Перенесенные операции ({entry.affectedOperations.length})
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {entry.affectedOperations.map((op, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">
                                  {op.drawingNumber} - Операция {op.operationNumber}
                                </span>
                              </div>
                              <div className={`text-xs font-medium ${getDelayColor(op.delayMinutes)}`}>
                                +{op.delayMinutes} мин
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <div>Было: {formatDateTime(op.oldStartDate)}</div>
                              <div>Стало: {formatDateTime(op.newStartDate)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Info className="h-4 w-4 mr-1" />
              Всего записей: {rescheduleLog.length}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleLogModal;