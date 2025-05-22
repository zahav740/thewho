import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
// import { useTranslation } from 'react-i18next';


interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarData: any[];
  currentDate: Date;
  viewMode: 'month' | 'week';
  onExport: (options: ExportOptions) => void;
}

interface ExportOptions {
  period: 'current' | 'custom' | 'full';
  dateFrom?: Date;
  dateTo?: Date;
  includeMachines: string[];
  includeStatuses: string[];
  format: 'summary' | 'detailed';
}

const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  calendarData,
  currentDate,
  viewMode,
  onExport
}) => {

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    period: 'current',
    includeMachines: [],
    includeStatuses: [],
    format: 'summary'
  });

  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Получаем уникальные станки и статусы
  const uniqueMachines = Array.from(new Set(
    calendarData.flatMap(day => day.operations?.map((op: any) => op.machine) || [])
  ));
  
  const uniqueStatuses = Array.from(new Set(
    calendarData.flatMap(day => day.operations?.map((op: any) => op.planningResult.status) || [])
  ));

  const handleMachineToggle = (machine: string) => {
    setExportOptions(prev => ({
      ...prev,
      includeMachines: prev.includeMachines.includes(machine)
        ? prev.includeMachines.filter(m => m !== machine)
        : [...prev.includeMachines, machine]
    }));
  };

  const handleStatusToggle = (status: string) => {
    setExportOptions(prev => ({
      ...prev,
      includeStatuses: prev.includeStatuses.includes(status)
        ? prev.includeStatuses.filter(s => s !== status)
        : [...prev.includeStatuses, status]
    }));
  };

  const handleExport = () => {
    const options = {
      ...exportOptions,
      dateFrom: exportOptions.period === 'custom' ? new Date(customDateFrom) : undefined,
      dateTo: exportOptions.period === 'custom' ? new Date(customDateTo) : undefined
    };
    onExport(options);
    onClose();
  };

  const getPeriodDescription = () => {
    if (exportOptions.period === 'current') {
      return viewMode === 'month' 
        ? `Текущий месяц (${currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })})`
        : `Текущая неделя (${currentDate.toLocaleDateString('ru-RU')})`;
    } else if (exportOptions.period === 'custom') {
      return 'Выбранный период';
    } else {
      return 'Весь календарь';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md m-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Экспорт в Excel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 space-y-6">
          {/* Выбор периода */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Период экспорта
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="period"
                  value="current"
                  checked={exportOptions.period === 'current'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, period: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-sm">
                  {viewMode === 'month' ? 'Текущий месяц' : 'Текущая неделя'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="period"
                  value="custom"
                  checked={exportOptions.period === 'custom'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, period: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-sm">Выбрать период</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="period"
                  value="full"
                  checked={exportOptions.period === 'full'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, period: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-sm">Весь календарь</span>
              </label>
            </div>
          </div>

          {/* Выбор дат для кастомного периода */}
          {exportOptions.period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  С даты
                </label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  По дату
                </label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Формат экспорта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Формат экспорта
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="summary"
                  checked={exportOptions.format === 'summary'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-sm">Сводный отчет</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="detailed"
                  checked={exportOptions.format === 'detailed'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-sm">Детальный отчет</span>
              </label>
            </div>
          </div>

          {/* Фильтр по станкам */}
          {uniqueMachines.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Станки для экспорта
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMachines.length === 0}
                    onChange={() => setExportOptions(prev => ({ ...prev, includeMachines: [] }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Все станки</span>
                </label>
                {uniqueMachines.map(machine => (
                  <label key={machine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMachines.includes(machine)}
                      onChange={() => handleMachineToggle(machine)}
                      className="mr-2"
                    />
                    <span className="text-sm">{machine}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Фильтр по статусам */}
          {uniqueStatuses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Статусы для экспорта
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeStatuses.length === 0}
                    onChange={() => setExportOptions(prev => ({ ...prev, includeStatuses: [] }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Все статусы</span>
                </label>
                {uniqueStatuses.map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {status === 'completed' ? 'Завершено' :
                       status === 'in-progress' ? 'В работе' :
                       status === 'rescheduled' ? 'Перенесено' :
                       status === 'planned' ? 'Запланировано' : status}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Информация о экспорте */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Будет экспортировано:
                </p>
                <p className="text-sm text-blue-700">
                  {getPeriodDescription()}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Формат: {exportOptions.format === 'summary' ? 'Сводный' : 'Детальный'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            disabled={exportOptions.period === 'custom' && (!customDateFrom || !customDateTo)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Экспортировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelExportModal;