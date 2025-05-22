import React from 'react';
import { TrendingUp, Clock, AlertTriangle, Info } from 'lucide-react';

interface RescheduleStatsProps {
  className?: string;
}

const RescheduleStatsCard: React.FC<RescheduleStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = React.useState({
    totalReschedules: 0,
    totalAffectedOperations: 0,
    averageDelayMinutes: 0,
    maxDelayMinutes: 0,
    setupTimeVariance: 0,
    mostAffectedMachine: '',
    recentRescheduleCount: 0
  });

  React.useEffect(() => {
    const calculateStats = () => {
      const rescheduleLog = JSON.parse(localStorage.getItem('rescheduleLog') || '[]');
      
      if (rescheduleLog.length === 0) {
        setStats({
          totalReschedules: 0,
          totalAffectedOperations: 0,
          averageDelayMinutes: 0,
          maxDelayMinutes: 0,
          setupTimeVariance: 0,
          mostAffectedMachine: '',
          recentRescheduleCount: 0
        });
        return;
      }

      const totalReschedules = rescheduleLog.length;
      let totalAffectedOperations = 0;
      let totalDelayMinutes = 0;
      let delayCount = 0;
      let maxDelayMinutes = 0;
      let setupVariances: number[] = [];
      const machineCount: Record<string, number> = {};

      // Последние 7 дней
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      let recentRescheduleCount = 0;

      for (const entry of rescheduleLog) {
        totalAffectedOperations += entry.summary.totalAffectedOperations;
        
        if (entry.summary.maxDelayMinutes > maxDelayMinutes) {
          maxDelayMinutes = entry.summary.maxDelayMinutes;
        }

        // Считаем средние задержки
        for (const operation of entry.affectedOperations) {
          totalDelayMinutes += operation.delayMinutes;
          delayCount++;
        }

        // Отклонения времени наладки
        setupVariances.push(Math.abs(entry.setupTimeChange.percentageChange));

        // Подсчет по станкам
        const machine = entry.summary.affectedMachine;
        machineCount[machine] = (machineCount[machine] || 0) + 1;

        // Подсчет недавних перепланирований
        if (new Date(entry.timestamp) >= weekAgo) {
          recentRescheduleCount++;
        }
      }

      const averageDelayMinutes = delayCount > 0 ? Math.round(totalDelayMinutes / delayCount) : 0;
      const setupTimeVariance = setupVariances.length > 0 
        ? Math.round((setupVariances.reduce((a, b) => a + b, 0) / setupVariances.length) * 10) / 10 
        : 0;

      const mostAffectedMachine = Object.entries(machineCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setStats({
        totalReschedules,
        totalAffectedOperations,
        averageDelayMinutes,
        maxDelayMinutes,
        setupTimeVariance,
        mostAffectedMachine,
        recentRescheduleCount
      });
    };

    calculateStats();

    // Обновляем при изменениях в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rescheduleLog') {
        calculateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <TrendingUp className="h-6 w-6 text-indigo-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Статистика перепланирований
        </h3>
      </div>

      {stats.totalReschedules === 0 ? (
        <div className="text-center py-6">
          <Info className="mx-auto h-8 w-8 text-gray-400" />
          <p className="text-gray-500 text-sm mt-2">
            Данные о перепланированиях отсутствуют
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Общее количество перепланирований */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  Всего перепланирований
                </p>
                <p className="text-lg font-semibold text-blue-900">
                  {stats.totalReschedules}
                </p>
              </div>
            </div>
          </div>

          {/* Затронутые операции */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
                  Затронуто операций
                </p>
                <p className="text-lg font-semibold text-yellow-900">
                  {stats.totalAffectedOperations}
                </p>
              </div>
            </div>
          </div>

          {/* Средняя задержка */}
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                  Средняя задержка
                </p>
                <p className="text-lg font-semibold text-orange-900">
                  {formatTime(stats.averageDelayMinutes)}
                </p>
              </div>
            </div>
          </div>

          {/* Максимальная задержка */}
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                  Макс. задержка
                </p>
                <p className="text-lg font-semibold text-red-900">
                  {formatTime(stats.maxDelayMinutes)}
                </p>
              </div>
            </div>
          </div>

          {/* Отклонение времени наладки */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                  Откл. наладки
                </p>
                <p className="text-lg font-semibold text-purple-900">
                  {stats.setupTimeVariance}%
                </p>
              </div>
            </div>
          </div>

          {/* Самый затронутый станок */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                  Чаще всего
                </p>
                <p className="text-sm font-semibold text-green-900">
                  {stats.mostAffectedMachine || 'Н/Д'}
                </p>
              </div>
            </div>
          </div>

          {/* Недавние перепланирования (за неделю) */}
          <div className="bg-indigo-50 rounded-lg p-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-indigo-600">
                  Перепланирований за неделю:
                </span>
              </div>
              <span className="text-lg font-semibold text-indigo-900">
                {stats.recentRescheduleCount}
              </span>
            </div>
            {stats.recentRescheduleCount > 0 && (
              <div className="mt-2">
                <div className={`w-full rounded-full h-2 ${
                  stats.recentRescheduleCount <= 2 ? 'bg-green-200' :
                  stats.recentRescheduleCount <= 5 ? 'bg-yellow-200' : 'bg-red-200'
                }`}>
                  <div 
                    className={`rounded-full h-2 ${
                      stats.recentRescheduleCount <= 2 ? 'bg-green-600' :
                      stats.recentRescheduleCount <= 5 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ 
                      width: `${Math.min((stats.recentRescheduleCount / 10) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.recentRescheduleCount <= 2 ? 'Низкая активность' :
                   stats.recentRescheduleCount <= 5 ? 'Умеренная активность' : 'Высокая активность'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RescheduleStatsCard;