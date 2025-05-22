import React, { useState, useEffect } from 'react';
import { useProductionPlanning } from '../hooks/useProductionPlanning';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { PlanningResult } from '../utils/productionPlanning';
import { useTranslation } from 'react-i18next';
import OperationDetailsModal from './OperationDetailsModal';
import ExcelExportModal from './ExcelExportModal';
import { exportCalendarToExcel } from '../utils/excelExport';


interface ProductionCalendarProps {
  className?: string;
}

interface CalendarOperation {
  id: string;
  drawingNumber: string;
  quantity: number;
  operationNumber: string;
  machine: string;
  startDate: Date;
  endDate: Date;
  planningResult: PlanningResult;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  operations: CalendarOperation[];
}

const ProductionCalendar: React.FC<ProductionCalendarProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { planningResults } = useProductionPlanning();
  const { orders } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedOperation, setSelectedOperation] = useState<CalendarOperation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, planningResults, orders, viewMode, filterMachine, filterStatus]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'month') {
      // Месячный вид
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      
      // Добавляем дни предыдущего месяца для заполнения первой недели
      const firstDayWeekday = startDate.getDay();
      startDate = new Date(year, month, 1 - firstDayWeekday);
      
      // Добавляем дни следующего месяца для заполнения последней недели
      const lastDayWeekday = endDate.getDay();
      endDate = new Date(year, month + 1, 6 - lastDayWeekday);
    } else {
      // Недельный вид
      const currentWeekDay = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentWeekDay);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }

    const days: CalendarDay[] = [];
    const currentDateForLoop = new Date(startDate);

    while (currentDateForLoop <= endDate) {
      const day: CalendarDay = {
        date: new Date(currentDateForLoop),
        isCurrentMonth: currentDateForLoop.getMonth() === month,
        isToday: isSameDay(currentDateForLoop, new Date()),
        operations: []
      };

      // Найти все операции для этого дня
      day.operations = getOperationsForDate(currentDateForLoop);

      days.push(day);
      currentDateForLoop.setDate(currentDateForLoop.getDate() + 1);
    }

    setCalendarDays(days);
  };

  const getOperationsForDate = (date: Date): CalendarOperation[] => {
    const operations: CalendarOperation[] = [];

    planningResults.forEach(result => {
      const startDate = new Date(result.plannedStartDate);
      const endDate = new Date(result.plannedEndDate);

      // Проверяем, попадает ли операция в этот день
      if (
        (isSameDay(date, startDate)) ||
        (isSameDay(date, endDate)) ||
        (date > startDate && date < endDate)
      ) {
        // Находим заказ для получения номера чертежа и количества
        const order = orders.find(o => o.id === result.orderId);
        const operation = order?.operations.find(op => op.id === result.operationId);

        if (order && operation) {
          // Применяем фильтры
          const machineMatch = filterMachine === 'all' || result.machine === filterMachine;
          const statusMatch = filterStatus === 'all' || result.status === filterStatus;
          
          if (machineMatch && statusMatch) {
            operations.push({
              id: result.id,
              drawingNumber: order.drawingNumber,
              quantity: order.quantity,
              operationNumber: operation.sequenceNumber.toString(),
              machine: result.machine,
              startDate,
              endDate,
              planningResult: result
            });
          }
        }
      }
    });

    return operations.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      }
      return newDate;
    });
  };

  const getOperationColor = (index: number) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
    ];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'rescheduled': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (startDate: Date, endDate: Date) => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours < 24) {
      return `${Math.round(durationHours)}ч`;
    } else {
      const days = Math.floor(durationHours / 24);
      const hours = Math.round(durationHours % 24);
      return `${days}д ${hours}ч`;
    }
  };

  const handleOperationClick = (operation: CalendarOperation) => {
    setSelectedOperation(operation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOperation(null);
  };

  const handleExportRequest = (options: any) => {
    exportCalendarToExcel(calendarDays, options);
  };

  // Получаем список уникальных станков
  const uniqueMachines = Array.from(new Set(planningResults.map(r => r.machine)));
  
  // Получаем список уникальных статусов
  const uniqueStatuses = Array.from(new Set(planningResults.map(r => r.status)));

  const weekDays = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('production_calendar')}
            </h2>
          </div>
          
          {/* Переключатель вида и кнопка экспорта */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center px-3 py-1 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
              title={`Экспорт ${viewMode === 'month' ? 'месяца' : 'недели'} в Excel`}
            >
              <Download className="h-4 w-4 mr-1" />
              {t('export')}
            </button>
            
            <div className="border-l border-gray-300 h-6 mx-2"></div>
            
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'month' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('month')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'week' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('week')}
            </button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Неделя ${Math.ceil(currentDate.getDate() / 7)}, ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            }
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Фильтры */}
        <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">{t('machine')}:</label>
            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all_machines')}</option>
              {uniqueMachines.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Статус:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'completed' ? 'Завершено' :
                   status === 'in-progress' ? 'В работе' :
                   status === 'rescheduled' ? 'Перенесено' :
                   status === 'planned' ? 'Запланировано' : status}
                </option>
              ))}
            </select>
          </div>
          
          {(filterMachine !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterMachine('all');
                setFilterStatus('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Очистить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Календарная сетка */}
      <div className="p-4">
        {/* Заголовки дней недели */}
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-1 mb-4`}>
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Дни календаря */}
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-1`}>
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 p-2 border rounded-lg ${
                day.isCurrentMonth 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-50 border-gray-100'
              } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Номер дня */}
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${
                  day.isCurrentMonth 
                    ? day.isToday 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.date.getDate()}
                </span>
                
                {/* Индикатор количества операций */}
                {day.operations.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {day.operations.length}
                  </span>
                )}
              </div>

              {/* Операции */}
              <div className="space-y-1">
                {day.operations.slice(0, 3).map((operation, opIndex) => (
                  <div
                    key={operation.id}
                    className={`p-1.5 rounded border text-xs cursor-pointer hover:shadow-md transition-shadow ${getOperationColor(opIndex)}`}
                    title={`Чертеж: ${operation.drawingNumber}, Кол-во: ${operation.quantity}, Операция: ${operation.operationNumber}, Станок: ${operation.machine}, Длительность: ${formatDuration(operation.startDate, operation.endDate)}`}
                    onClick={() => handleOperationClick(operation)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {operation.drawingNumber}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(operation.planningResult.status)}`}></div>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs">
                        №{operation.operationNumber}
                      </span>
                      <span className="text-xs">
                        {operation.quantity}шт
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs truncate">
                        {operation.machine}
                      </span>
                      <span className="text-xs">
                        {formatDuration(operation.startDate, operation.endDate)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Показать больше */}
                {day.operations.length > 3 && (
                  <div className="text-xs text-gray-500 text-center p-1">
                    +{day.operations.length - 3} еще
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Легенда:</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Завершено</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>В работе</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>Перенесено</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
            <span>Запланировано</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <strong>Формат операции:</strong> Чертеж | №Операции | Количество | Станок | Длительность
        </div>
      </div>

      {/* Модальное окно с деталями операции */}
      <OperationDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        operation={selectedOperation}
        order={selectedOperation ? orders.find(o => o.id === selectedOperation.planningResult.orderId) : undefined}
      />

      {/* Модальное окно экспорта Excel */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        calendarData={calendarDays}
        currentDate={currentDate}
        viewMode={viewMode}
        onExport={handleExportRequest}
      />
    </div>
  );
};

export default ProductionCalendar;