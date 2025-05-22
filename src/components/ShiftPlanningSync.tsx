import React, { useState, useEffect } from 'react';
import { Sync, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { shiftPlanningSync } from '../services/shiftPlanningSync';
import { useTranslation } from 'react-i18next';
import SyncStatisticsCard from './SyncStatisticsCard';

interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  error?: string;
  stats?: {
    operationsUpdated: number;
    machineChanges: number;
    planningUpdates: number;
  };
}

const ShiftPlanningSync: React.FC = () => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('autoSyncEnabled') === 'true';
  });

  // Загружаем статус последней синхронизации
  useEffect(() => {
    const lastSync = localStorage.getItem('lastSyncTime');
    const lastSyncError = localStorage.getItem('lastSyncError');
    
    if (lastSync) {
      setSyncStatus(prev => ({ 
        ...prev, 
        lastSync,
        error: lastSyncError || undefined
      }));
    }
  }, []);

  // Сохраняем настройку автосинхронизации
  useEffect(() => {
    localStorage.setItem('autoSyncEnabled', autoSyncEnabled.toString());
  }, [autoSyncEnabled]);

  const handleManualSync = async () => {
    setSyncStatus(prev => ({ ...prev, isRunning: true, error: undefined }));
    
    try {
      console.log('🚀 Запуск ручной синхронизации...');
      await shiftPlanningSync.syncShiftsWithPlanning();
      
      const now = new Date().toISOString();
      localStorage.setItem('lastSyncTime', now);
      localStorage.removeItem('lastSyncError');
      
      setSyncStatus({
        isRunning: false,
        lastSync: now,
        stats: {
          operationsUpdated: 0, // Здесь можно добавить реальную статистику
          machineChanges: 0,
          planningUpdates: 0
        }
      });
      
      // Показать уведомление об успехе
      if (window.confirm) {
        alert('✅ Синхронизация завершена успешно!');
      }
      
      // Обновляем страницу для обновления статистики
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Ошибка ручной синхронизации:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      localStorage.setItem('lastSyncError', errorMessage);
      
      setSyncStatus(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage
      }));
      
      alert(`❌ Ошибка синхронизации: ${errorMessage}`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = () => {
    if (syncStatus.isRunning) {
      return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    if (syncStatus.error) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
    if (syncStatus.lastSync) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusText = () => {
    if (syncStatus.isRunning) {
      return 'Синхронизация выполняется...';
    }
    if (syncStatus.error) {
      return `Ошибка: ${syncStatus.error}`;
    }
    if (syncStatus.lastSync) {
      return `Последняя синхронизация: ${formatDate(syncStatus.lastSync)}`;
    }
    return 'Синхронизация не выполнялась';
  };

  const getStatusColor = () => {
    if (syncStatus.isRunning) return 'border-blue-300 bg-blue-50';
    if (syncStatus.error) return 'border-red-300 bg-red-50';
    if (syncStatus.lastSync) return 'border-green-300 bg-green-50';
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Статистика синхронизации */}
      <SyncStatisticsCard />
      
      {/* Основной компонент синхронизации */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sync className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Синхронизация планирования со сменами
            </h3>
          </div>
          
          <button
            onClick={handleManualSync}
            disabled={syncStatus.isRunning}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {syncStatus.isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sync className="h-4 w-4 mr-2" />
            )}
            {syncStatus.isRunning ? 'Синхронизация...' : 'Синхронизировать'}
          </button>
        </div>
        
        {/* Статус синхронизации */}
        <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
          </div>
          
          {syncStatus.stats && (
            <div className="mt-2 text-xs text-gray-600">
              Обновлено операций: {syncStatus.stats.operationsUpdated} | 
              Смен станков: {syncStatus.stats.machineChanges} | 
              Планирований: {syncStatus.stats.planningUpdates}
            </div>
          )}
        </div>
        
        {/* Настройки автосинхронизации */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Автоматическая синхронизация
              </h4>
              <p className="text-xs text-gray-600">
                Автоматически синхронизировать планирование при сохранении смен
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        {/* Информация о синхронизации */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Что делает синхронизация:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Обновляет статус операций на основе данных смен</li>
            <li>• Отслеживает смены станков и обновляет планирование</li>
            <li>• Автоматически запускает перепланирование при изменениях</li>
            <li>• Синхронизирует фактическое время выполнения операций</li>
            <li>• Обновляет данные о наладках</li>
          </ul>
        </div>
        
        {/* Предупреждение при отключенной автосинхронизации */}
        {!autoSyncEnabled && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Автосинхронизация отключена. Данные планирования могут не соответствовать фактическим сменам.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftPlanningSync;
