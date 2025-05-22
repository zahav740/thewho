import React, { useState, useEffect } from 'react';
import { useProductionPlanning } from '../hooks/useProductionPlanning';
import { X, Settings, Clock, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
import { PlanningResult } from '../utils/productionPlanning';
import { Order } from '../types';

interface SetupCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  planningResult: PlanningResult | null;
  order: Order | undefined;
  onSetupCompleted: (resultId: string, setupData: { actualSetupTime: number; actualStartTime: string; newMachine?: string }) => Promise<any>;
}

const SetupCompletionModal: React.FC<SetupCompletionModalProps> = ({
  isOpen,
  onClose,
  planningResult,
  order,
  onSetupCompleted
}) => {
  const { getCompatibleMachines, getOperationById } = useProductionPlanning();

  const [actualSetupTime, setActualSetupTime] = useState('');
  const [actualStartTime, setActualStartTime] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [compatibleMachines, setCompatibleMachines] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  if (!isOpen || !planningResult || !order) return null;

  // Инициализация времени начала наладки и станка значениями по умолчанию
  useEffect(() => {
    if (planningResult && !actualStartTime) {
      const plannedStart = new Date(planningResult.plannedStartDate);
      const timeString = plannedStart.toTimeString().slice(0, 5);
      setActualStartTime(timeString);
    }
    
    // Получаем список совместимых станков
    if (planningResult && order) {
      const operation = order.operations.find(op => op.id === planningResult.operationId);
      if (operation) {
        const machines = getCompatibleMachines(operation);
        setCompatibleMachines(machines.map(m => m.name));
        setSelectedMachine(planningResult.machine); // По умолчанию текущий станок
      }
    }
  }, [planningResult, actualStartTime, order, getCompatibleMachines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const setupTimeNumber = parseInt(actualSetupTime);
    if (isNaN(setupTimeNumber) || setupTimeNumber <= 0) {
      setError('Пожалуйста, введите корректное время наладки');
      return;
    }

    // Проверяем время начала наладки
    if (!actualStartTime) {
      setError('Пожалуйста, укажите время начала наладки');
      return;
    }

    // Создаем объект комплексных данных о наладке
    const setupCompletionData = {
      actualSetupTime: setupTimeNumber,
      actualStartTime,
      newMachine: selectedMachine !== planningResult.machine ? selectedMachine : undefined
    };

    setIsSubmitting(true);
    try {
      const result = await onSetupCompleted(planningResult.id, setupCompletionData);
      console.log('Результат обновления наладки:', result);
      
      // Показываем информацию о результатах перепланирования
      if (result && result.replanningResults && result.replanningResults.length > 0) {
        const machineText = result.machineChanged 
          ? `станках (смена с ${planningResult.machine} на ${result.affectedMachine})` 
          : `станке ${result.affectedMachine}`;
        
        alert(`Наладка завершена!\n\nПерепланировано ${result.replanningResults.length} операций на ${machineText}.\n\nВсе последующие операции автоматически перенесены с учетом ${result.machineChanged ? 'смены станка и ' : ''}фактического времени наладки.`);
      } else {
        alert('Наладка завершена! Перепланирование не потребовалось.');
      }
      
      // Закрываем модальное окно после успешного завершения
      onClose();
      setActualSetupTime('');
      setActualStartTime('');
      setSelectedMachine('');
    } catch (error) {
      console.error('Ошибка при отметке наладки:', error);
      setError('Ошибка при обновлении данных наладки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActualSetupTime('');
    setActualStartTime('');
    setSelectedMachine('');
    setError('');
    setShowAdvancedInfo(false);
    onClose();
  };

  const operation = order.operations.find(op => op.id === planningResult.operationId);
  const timeDifference = parseInt(actualSetupTime) - planningResult.setupTimeMinutes;
  const showTimeDifference = actualSetupTime && !isNaN(parseInt(actualSetupTime));
  const machineChanged = selectedMachine !== planningResult.machine;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md m-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Завершение наладки
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6">
          {/* Информация об операции */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Информация об операции</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Чертеж:</span>
                <span className="font-medium">{order.drawingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Операция:</span>
                <span className="font-medium">№{operation?.sequenceNumber} ({operation?.operationType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Станок:</span>
                <span className="font-medium">{planningResult.machine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Плановое время начала:</span>
                <span className="font-medium">{new Date(planningResult.plannedStartDate).toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Плановое время наладки:</span>
                <span className="font-medium">{planningResult.setupTimeMinutes} мин</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время выполнения:</span>
                <span className="font-medium">{planningResult.expectedTimeMinutes} мин</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Количество:</span>
                <span className="font-medium">{order.quantity} шт</span>
              </div>
            </div>
          </div>

          {/* Форма ввода фактического времени */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Выбор станка наладки */}
            <div>
              <label htmlFor="selectedMachine" className="block text-sm font-medium text-gray-700 mb-2">
                Станок наладки
              </label>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="selectedMachine"
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {compatibleMachines.map(machine => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </select>
              </div>
              {machineChanged && (
                <p className="mt-1 text-xs text-orange-500">
                  ⚠️ Вы меняете станок с {planningResult.machine} на {selectedMachine}
                </p>
              )}
            </div>
            
            {/* Время начала наладки */}
            <div>
              <label htmlFor="actualStartTime" className="block text-sm font-medium text-gray-700 mb-2">
                Фактическое время начала наладки *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  id="actualStartTime"
                  value={actualStartTime}
                  onChange={(e) => setActualStartTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Плановое время начала: {new Date(planningResult.plannedStartDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
              </p>
            </div>
            
            {/* Время наладки */}
            <div>
              <label htmlFor="actualSetupTime" className="block text-sm font-medium text-gray-700 mb-2">
                Фактическое время наладки (минуты) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="actualSetupTime"
                  value={actualSetupTime}
                  onChange={(e) => setActualSetupTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите фактическое время"
                  min="1"
                  required
                />
              </div>
              {/* Показать разницу во времени */}
              {showTimeDifference && (
                <div className={`mt-2 p-2 rounded text-sm ${
                  timeDifference > 0 
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : timeDifference < 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {timeDifference > 0 && (
                    <span>⚠️ Увеличение на {timeDifference} мин (+{((timeDifference/planningResult.setupTimeMinutes)*100).toFixed(1)}%)</span>
                  )}
                  {timeDifference < 0 && (
                    <span>✅ Сокращение на {Math.abs(timeDifference)} мин ({((Math.abs(timeDifference)/planningResult.setupTimeMinutes)*100).toFixed(1)}%)</span>
                  )}
                  {timeDifference === 0 && (
                    <span>✓ Точно по плану</span>
                  )}
                </div>
              )}
            </div>

            {/* Кнопка для показа дополнительной информации */}
            <button
              type="button"
              onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <Info className="h-4 w-4 mr-1" />
              {showAdvancedInfo ? 'Скрыть' : 'Показать'} детали автоматического перепланирования
            </button>

            {/* Расширенная информация о перепланировании */}
            {showAdvancedInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Что произойдет при сохранении:
                    </p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                      <li>Время окончания текущей операции будет пересчитано</li>
                      {machineChanged ? (
                        <li>Операция будет перенесена на станок {selectedMachine}</li>
                      ) : null}
                      <li>Все последующие операции на {machineChanged ? 'обоих станках' : `станке ${planningResult.machine}`} будут автоматически перенесены</li>
                      <li>Будут учтены ограничения: максимум 2 операции в день, правило окончания до 14:00</li>
                      {!machineChanged && <li>Операции других станков не пострадают</li>}
                      <li>Статус операции изменится на "выполняется"</li>
                      <li>Будет создано уведомление о перепланировании</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Предупреждение о перепланировании */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Внимание: автоматическое перепланирование
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    После сохранения будет выполнено автоматическое перепланирование
                    всех последующих операций {machineChanged ? `на станках ${planningResult.machine} и ${selectedMachine}` : `на станке ${planningResult.machine}`}.
                    {machineChanged && (
                      <span className="block mt-1 font-medium">
                        🔄 Смена станка потребует перепланирования операций на обоих станках!
                      </span>
                    )}
                    {timeDifference > 30 && (
                      <span className="block mt-1 font-medium">
                        ⚠️ Увеличение времени более чем на 30 минут может значительно сдвинуть расписание!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !actualSetupTime || !actualStartTime}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Обработка...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Сохранить и перепланировать
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupCompletionModal;