import React, { useState, useEffect } from 'react';
import { useProductionPlanning } from '../hooks/useProductionPlanning';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, Send, Edit2, TestTube, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import EditPlanningModal from './EditPlanningModal';
import CalendarTestModal from './CalendarTestModal';
import ProductionCalendar from './ProductionCalendar';
import RescheduleLogModal from './RescheduleLogModal';
import RescheduleStatsCard from './RescheduleStatsCard';
import ShiftPlanningSync from './ShiftPlanningSyncSimple';
import { PlanningResult } from '../utils/productionPlanning';

const ProductionPlanningDashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    planningResults,
    alerts,
    isPlanning,
    planProduction,
    adaptivePlanning,
    sendPlanningToWebhook,
    analyzeMachineLoad,
    resolveAlert,
    getPlanningStats,
    updatePlanningResult,
    markSetupCompleted,
    clearPlanning
  } = useProductionPlanning();
  
  const { orders } = useApp(); // Получаем заказы для отображения номеров чертежей

  const [selectedTab, setSelectedTab] = useState<'planning' | 'calendar' | 'alerts' | 'analytics' | 'sync'>('planning');
  const [machineLoad, setMachineLoad] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<any>({});
  const [editingResult, setEditingResult] = useState<PlanningResult | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarTestOpen, setIsCalendarTestOpen] = useState(false);
  const [isRescheduleLogOpen, setIsRescheduleLogOpen] = useState(false);

  useEffect(() => {
    setMachineLoad(analyzeMachineLoad());
    setStats(getPlanningStats());
  }, [planningResults, analyzeMachineLoad, getPlanningStats]);

  const handlePlanProduction = async () => {
    // Предупреждаем о перезаписи существующего плана
    if (planningResults.length > 0) {
      const confirmed = window.confirm(
        `У вас уже есть ${planningResults.length} запланированных операций. \n\n` +
        `Новое планирование заменит все существующие данные. \n\n` +
        `Продолжить?`
      );
      if (!confirmed) {
        return;
      }
    }
    
    try {
      await planProduction();
    } catch (error) {
      console.error('Ошибка планирования:', error);
    }
  };

  const handleAdaptivePlanning = async () => {
    // Предупреждаем о перезаписи существующего плана
    if (planningResults.length > 0) {
      const confirmed = window.confirm(
        `У вас уже есть ${planningResults.length} запланированных операций. \n\n` +
        `Адаптивное планирование заменит все существующие данные. \n\n` +
        `Продолжить?`
      );
      if (!confirmed) {
        return;
      }
    }
    
    try {
      await adaptivePlanning();
    } catch (error) {
      console.error('Ошибка адаптивного планирования:', error);
    }
  };

  const handleSendToWebhook = async () => {
    try {
      await sendPlanningToWebhook();
      alert('Данные планирования отправлены в n8n!');
    } catch (error) {
      alert(`Ошибка отправки: ${error}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getLoadColor = (load: number) => {
    if (load > 1) return 'bg-red-500';
    if (load > 0.8) return 'bg-orange-500';
    if (load > 0.6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleEditOperation = (result: PlanningResult) => {
    setEditingResult(result);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingResult(null);
  };

  const handleClearPlanning = () => {
    if (window.confirm('Вы уверены, что хотите очистить все данные планирования? Это действие нельзя отменить.')) {
      clearPlanning();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'rescheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('production_planning_dashboard')}</h1>
        
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('total_orders')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('planned')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.plannedOrders || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('on_time')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.onTimeOrders || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('delayed')}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lateOrders || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Кнопки управления */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handlePlanProduction}
            disabled={isPlanning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {isPlanning ? t('planning') : t('basic_planning')}
          </button>
          
          <button
            onClick={handleAdaptivePlanning}
            disabled={isPlanning}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {isPlanning ? t('planning') : t('adaptive_planning')}
          </button>
          
          <button
            onClick={handleSendToWebhook}
            disabled={planningResults.length === 0}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="mr-2 h-4 w-4" />
            {t('send_to_n8n')}
          </button>
          
          <button
            onClick={() => setIsCalendarTestOpen(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            <TestTube className="mr-2 h-4 w-4" />
            {t('calendar_test')}
          </button>
          
          <button
            onClick={() => setIsRescheduleLogOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Clock className="mr-2 h-4 w-4" />
            Журнал перепланирований
          </button>
          
          {planningResults.length > 0 && (
            <button
              onClick={handleClearPlanning}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('clear_planning')}
            </button>
          )}
        </div>
      </div>
      
      {/* Вкладки */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['planning', 'calendar', 'alerts', 'analytics', 'sync'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'planning' && t('planning_results')}
              {tab === 'calendar' && t('production_calendar')}
              {tab === 'alerts' && `${t('notifications')} (${alerts.filter(a => a.status === 'new').length})`}
              {tab === 'analytics' && t('analytics')}
              {tab === 'sync' && 'Синхронизация'}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Содержимое вкладок */}
      {selectedTab === 'planning' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{t('planning_results')}</h3>
          </div>
          
          {planningResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('order')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('operation')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('machine')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('start')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('end')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('time_min')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {planningResults.map((result) => {
                    // Находим заказ по ID для получения номера чертежа
                    const order = orders.find(o => o.id === result.orderId);
                    const drawingNumber = order?.drawingNumber || result.orderId;
                    
                    // Находим операцию для получения номера операции
                    const operation = order?.operations.find(op => op.id === result.operationId);
                    const operationNumber = operation?.sequenceNumber || result.operationId;
                    
                    return (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drawingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {operationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.machine}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(result.plannedStartDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(result.plannedEndDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.expectedTimeMinutes + result.setupTimeMinutes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {getStatusText(result.status)}
                        </span>
                        {result.rescheduledReason && (
                          <p className="text-xs text-gray-500 mt-1" title={result.rescheduledReason}>
                            {result.rescheduledReason.length > 30 
                              ? `${result.rescheduledReason.substring(0, 30)}...` 
                              : result.rescheduledReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditOperation(result)}
                          className="flex items-center text-blue-600 hover:text-blue-900"
                          title={t('edit')}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          {t('change')}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_planning_results')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('run_planning_to_view_results')}
              </p>
            </div>
          )}
        </div>
      )}
      
      {selectedTab === 'calendar' && (
        <ProductionCalendar className="" />
      )}
      
      {selectedTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.filter(alert => alert.status === 'new').length > 0 ? (
            alerts.filter(alert => alert.status === 'new').map((alert) => (
              <div key={alert.id || uuidv4()} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium">{alert.title}</h4>
                    <p className="mt-1 text-sm">{alert.description}</p>
                    <p className="mt-2 text-xs">
                      Тип: {alert.type} | Серьезность: {alert.severity} | 
                      Создано: {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="ml-4 px-3 py-1 text-xs bg-white border border-current rounded hover:bg-gray-50"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_active_notifications')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('all_tasks_on_schedule')}</p>
            </div>
          )}
        </div>
      )}
      
      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {/* Статистика перепланирований */}
          <RescheduleStatsCard />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Загрузка станков */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('machine_load')}</h3>
              <div className="space-y-3">
                {Object.entries(machineLoad).map(([machine, load]) => (
                  <div key={machine}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{machine}</span>
                      <span className="text-gray-500">{(load * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getLoadColor(load)}`}
                        style={{ width: `${Math.min(load * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Общая статистика */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('general_statistics')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('planning_completion')}:</span>
                  <span className="font-semibold">{stats.planningCompletion?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('orders_on_time')}:</span>
                  <span className="font-semibold">{stats.onTimePercentage?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('total_operations')}:</span>
                  <span className="font-semibold">{stats.totalOperations || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('planned_operations')}:</span>
                  <span className="font-semibold">{stats.plannedOperations || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedTab === 'sync' && (
        <ShiftPlanningSync />
      )}
      
      {/* Модальное окно редактирования */}
      <EditPlanningModal
        planningResult={editingResult}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={updatePlanningResult}
        onMarkSetupCompleted={markSetupCompleted}
      />
      
      {/* Модальное окно тестирования календаря */}
      <CalendarTestModal
        isOpen={isCalendarTestOpen}
        onClose={() => setIsCalendarTestOpen(false)}
      />
      
      {/* Модальное окно журнала перепланирований */}
      <RescheduleLogModal
        isOpen={isRescheduleLogOpen}
        onClose={() => setIsRescheduleLogOpen(false)}
      />
    </div>
  );
};

export default ProductionPlanningDashboard;