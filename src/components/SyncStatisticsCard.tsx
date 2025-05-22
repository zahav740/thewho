import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useProductionPlanning } from '../hooks/useProductionPlanning';

interface SyncStats {
  totalOperations: number;
  syncedOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  rescheduledOperations: number;
  machineChanges: number;
  syncPercentage: number;
  lastSyncTime?: string;
}

const SyncStatisticsCard: React.FC = () => {
  const { orders, shifts } = useApp();
  const { planningResults } = useProductionPlanning();
  const [stats, setStats] = useState<SyncStats>({
    totalOperations: 0,
    syncedOperations: 0,
    completedOperations: 0,
    inProgressOperations: 0,
    rescheduledOperations: 0,
    machineChanges: 0,
    syncPercentage: 0
  });

  useEffect(() => {
    calculateStats();
  }, [orders, shifts, planningResults]);

  const calculateStats = () => {
    const totalOperations = orders.reduce((sum, order) => sum + order.operations.length, 0);
    
    // Операции, которые есть в планировании
    const syncedOperations = planningResults.length;
    
    // Операции с разными статусами
    const completedOperations = planningResults.filter(pr => pr.status === 'completed').length;
    const inProgressOperations = planningResults.filter(pr => pr.status === 'in-progress').length;
    const rescheduledOperations = planningResults.filter(pr => pr.status === 'rescheduled').length;
    
    // Операции со сменой станков (ищем в reason)
    const machineChanges = planningResults.filter(pr => 
      pr.rescheduledReason && pr.rescheduledReason.includes('перенесена')
    ).length;
    
    const syncPercentage = totalOperations > 0 ? (syncedOperations / totalOperations) * 100 : 0;
    
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    
    setStats({
      totalOperations,
      syncedOperations,
      completedOperations,
      inProgressOperations,
      rescheduledOperations,
      machineChanges,
      syncPercentage,
      lastSyncTime: lastSyncTime || undefined
    });
  };

  const getStatusColor = (value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Никогда';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Статистика синхронизации
        </h3>
      </div>
      
      {/* Основные метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalOperations}</div>
          <div className="text-sm text-gray-600">Всего операций</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className={`text-2xl font-bold ${getStatusColor(stats.syncedOperations, stats.totalOperations)}`}>
            {stats.syncedOperations}
          </div>
          <div className="text-sm text-gray-600">Синхронизированы</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.rescheduledOperations}</div>
          <div className="text-sm text-gray-600">Перепланированы</div>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.machineChanges}</div>
          <div className="text-sm text-gray-600">Смены станков</div>
        </div>
      </div>
      
      {/* Процент синхронизации */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Покрытие синхронизацией</span>
          <span className={`text-sm font-semibold ${getStatusColor(stats.syncedOperations, stats.totalOperations)}`}>
            {stats.syncPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(stats.syncPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Статусы операций */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-700">Завершено</span>
          </div>
          <span className="font-semibold text-green-600">{stats.completedOperations}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">В процессе</span>
          </div>
          <span className="font-semibold text-blue-600">{stats.inProgressOperations}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center">
            <ArrowRightLeft className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm text-gray-700">Перенесено</span>
          </div>
          <span className="font-semibold text-orange-600">{stats.rescheduledOperations}</span>
        </div>
      </div>
      
      {/* Последняя синхронизация */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Последняя синхронизация:
          </span>
          <span className="text-sm font-medium text-gray-900">
            {stats.lastSyncTime ? formatDate(stats.lastSyncTime) : 'Не выполнялась'}
          </span>
        </div>
      </div>
      
      {/* Предупреждения */}
      {stats.syncPercentage < 80 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Низкий процент синхронизации. Рекомендуется запустить синхронизацию.
            </span>
          </div>
        </div>
      )}
      
      {stats.machineChanges > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
          <div className="flex items-center">
            <ArrowRightLeft className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              Обнаружено {stats.machineChanges} смен станков. Планирование автоматически обновлено.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatisticsCard;
