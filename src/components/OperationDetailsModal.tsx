import React from 'react';
import { X, Settings, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlanningResult } from '../utils/productionPlanning';
import { getPriorityColor, getPriorityTextKey } from '../utils/priorityUtils';

interface OperationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: {
    id: string;
    drawingNumber: string;
    quantity: number;
    operationNumber: string;
    machine: string;
    startDate: Date;
    endDate: Date;
    planningResult: PlanningResult;
  } | null;
  order?: {
    id: string;
    drawingNumber: string;
    quantity: number;
    deadline: string;
    priority: string | number;
  };
}

const OperationDetailsModal: React.FC<OperationDetailsModalProps> = ({
  isOpen,
  onClose,
  operation,
  order
}) => {
  const { t } = useTranslation();
  if (!isOpen || !operation) return null;

  const formatDuration = (startDate: Date, endDate: Date) => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 24) {
      return `${Math.round(durationHours)} ${t('hours')}`;
    } else {
      const days = Math.floor(durationHours / 24);
      const hours = Math.round(durationHours % 24);
      return `${days} ${t('days')} ${hours} ${t('hours')}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rescheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return t('completed');
      case 'in-progress': return t('in_progress');
      case 'rescheduled': return t('rescheduled');
      case 'planned': return t('planned');
      default: return status;
    }
  };

  const getPriorityColorFromUtils = (priority: string | number) => {
    return getPriorityColor(priority);
  };

  const getPriorityTextFromUtils = (priority: string | number) => {
    const textKey = getPriorityTextKey(priority);
    return t(textKey);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        {/* Заголовок */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {t('operation_details')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Основная информация */}
        <div className="mt-6 space-y-6">
          {/* Информация о чертеже */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-blue-900 mb-3">{t('order_information')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-700">{t('drawing_number')}:</span>
                <p className="text-blue-900 font-semibold">{operation.drawingNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">{t('quantity')}:</span>
                <p className="text-blue-900 font-semibold">{operation.quantity} {t('pcs')}</p>
              </div>
              {order && (
                <>
                  <div>
                    <span className="text-sm font-medium text-blue-700">{t('deadline')}:</span>
                    <p className="text-blue-900">{new Date(order.deadline).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">{t('priority')}:</span>
                    <p className={`font-medium ${getPriorityColorFromUtils(order.priority)}`}>
                      {getPriorityTextFromUtils(order.priority)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Информация об операции */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-green-900 mb-3">Детали операции</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-green-700">Номер операции:</span>
                <p className="text-green-900 font-semibold">№{operation.operationNumber}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">Станок:</span>
                <p className="text-green-900 font-semibold">{operation.machine}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">Статус:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(operation.planningResult.status)}`}>
                  {getStatusText(operation.planningResult.status)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-green-700">Длительность:</span>
                <p className="text-green-900">{formatDuration(operation.startDate, operation.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Временные рамки */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-yellow-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Временные рамки
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-700">Начало:</span>
                <span className="text-yellow-900 font-semibold">
                  {operation.startDate.toLocaleString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-700">Окончание:</span>
                <span className="text-yellow-900 font-semibold">
                  {operation.endDate.toLocaleString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="border-t border-yellow-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-700">Общая длительность:</span>
                  <span className="text-yellow-900 font-semibold">
                    {formatDuration(operation.startDate, operation.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Техническая информация */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-purple-900 mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Техническая информация
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-purple-700">Время выполнения:</span>
                <span className="text-purple-900">{operation.planningResult.expectedTimeMinutes} мин</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-purple-700">Время наладки:</span>
                <span className="text-purple-900">{operation.planningResult.setupTimeMinutes} мин</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-purple-700">Общее время:</span>
                <span className="text-purple-900 font-semibold">
                  {operation.planningResult.expectedTimeMinutes + operation.planningResult.setupTimeMinutes} мин
                </span>
              </div>
              {operation.planningResult.rescheduledReason && (
                <div className="border-t border-purple-200 pt-3">
                  <span className="text-sm font-medium text-purple-700">Причина переноса:</span>
                  <p className="text-purple-900 mt-1 text-sm bg-purple-100 p-2 rounded">
                    {operation.planningResult.rescheduledReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationDetailsModal;