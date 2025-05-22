import React, { useState, useEffect } from 'react';
import { PlanningResult } from '../utils/productionPlanning';
import { useProductionPlanning } from '../hooks/useProductionPlanning';
import { useApp } from '../context/AppContext';
import { Edit2, Calendar, Clock, Settings, X, Check } from 'lucide-react';
import SetupCompletionModal from './SetupCompletionModal';

interface EditPlanningModalProps {
  planningResult: PlanningResult | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (resultId: string, updates: Partial<PlanningResult>) => void;
  onMarkSetupCompleted: (resultId: string, setupData: { actualSetupTime: number; actualStartTime: string; newMachine?: string }) => Promise<any>;
}

const EditPlanningModal: React.FC<EditPlanningModalProps> = ({
  planningResult,
  isOpen,
  onClose,
  onUpdate,
  onMarkSetupCompleted
}) => {
  const { getCompatibleMachines, getOperationById } = useProductionPlanning();
  const { orders } = useApp();
  
  const [formData, setFormData] = useState({
    machine: '',
    plannedStartDate: '',
    plannedStartTime: '',
    expectedTimeMinutes: 0,
    setupTimeMinutes: 0,
    actualSetupTime: 0
  });

  const [availableMachines, setAvailableMachines] = useState<string[]>([]);
  const [showSetupCompletion, setShowSetupCompletion] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  useEffect(() => {
    if (planningResult && isOpen) {
      const operation = getOperationById(planningResult.operationId);
      
      if (operation) {
        const compatibleMachines = getCompatibleMachines(operation);
        setAvailableMachines(compatibleMachines.map(m => m.name));
      }

      const startDate = new Date(planningResult.plannedStartDate);
      setFormData({
        machine: planningResult.machine,
        plannedStartDate: startDate.toISOString().split('T')[0],
        plannedStartTime: startDate.toTimeString().slice(0, 5),
        expectedTimeMinutes: planningResult.expectedTimeMinutes,
        setupTimeMinutes: planningResult.setupTimeMinutes,
        actualSetupTime: planningResult.setupTimeMinutes
      });
      
      setShowSetupCompletion(planningResult.status === 'planned');
    }
  }, [planningResult, isOpen, getCompatibleMachines, getOperationById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planningResult) return;

    const startDate = new Date(`${formData.plannedStartDate}T${formData.plannedStartTime}`);
    
    const updates: Partial<PlanningResult> = {
      machine: formData.machine as any,
      plannedStartDate: startDate.toISOString(),
      expectedTimeMinutes: formData.expectedTimeMinutes,
      setupTimeMinutes: formData.setupTimeMinutes
    };

    onUpdate(planningResult.id, updates);
    onClose();
  };

  const handleSetupCompleted = () => {
    setIsSetupModalOpen(true);
    // Открываем модальное окно наладки, которое уже обновлено для поддержки смены станка
  };

  const handleSetupModalClose = () => {
    setIsSetupModalOpen(false);
    onClose(); // Закрываем и родительское модальное окно
  };

  if (!isOpen || !planningResult) return null;

  // Находим информацию о заказе и операции
  const order = orders.find(o => o.id === planningResult.orderId);
  const operation = order?.operations.find(op => op.id === planningResult.operationId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Редактирование планирования
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>Заказ: {order?.drawingNumber}</p>
            <p>Операция: {operation?.sequenceNumber}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Выбор станка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Settings className="inline h-4 w-4 mr-1" />
              Станок
            </label>
            <select
              value={formData.machine}
              onChange={(e) => setFormData(prev => ({ ...prev, machine: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Выберите станок</option>
              {availableMachines.map(machine => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Доступны только совместимые станки для типа операции: {operation?.operationType}
            </p>
          </div>

          {/* Дата и время начала */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Дата начала
              </label>
              <input
                type="date"
                value={formData.plannedStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedStartDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Время начала
              </label>
              <input
                type="time"
                value={formData.plannedStartTime}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedStartTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Время выполнения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Время выполнения (минуты)
            </label>
            <input
              type="number"
              min="1"
              value={formData.expectedTimeMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedTimeMinutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Время наладки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Плановое время наладки (минуты)
            </label>
            <input
              type="number"
              min="0"
              value={formData.setupTimeMinutes}
              onChange={(e) => setFormData(prev => ({ ...prev, setupTimeMinutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Текущий статус */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Текущий статус: 
              <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                planningResult.status === 'completed' ? 'bg-green-100 text-green-800' :
                planningResult.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                planningResult.status === 'rescheduled' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {planningResult.status}
              </span>
            </p>
            {planningResult.rescheduledReason && (
              <p className="text-xs text-gray-500 mt-1">
                Причина переноса: {planningResult.rescheduledReason}
              </p>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="border-t pt-4 space-y-4">
            {/* Кнопка завершения наладки */}
            {showSetupCompletion && planningResult.status === 'planned' && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSetupCompleted}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Отметить наладку как выполненную
                </button>
              </div>
            )}
            
            {/* Основные кнопки */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Сохранить
              </button>
            </div>
          </div>
        </form>
        
        {/* Модальное окно завершения наладки */}
        <SetupCompletionModal
          isOpen={isSetupModalOpen}
          onClose={handleSetupModalClose}
          planningResult={planningResult}
          order={order}
          onSetupCompleted={onMarkSetupCompleted}
        />
      </div>
    </div>
  );
};

export default EditPlanningModal;