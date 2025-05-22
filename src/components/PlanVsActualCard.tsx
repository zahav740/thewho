import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Clock, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { PlanningResult, ShiftPlanningUtils } from '../hooks/useShiftPlanningSync';

interface PlanVsActualCardProps {
  planningResult: PlanningResult;
  orderDrawingNumber?: string;
  operationSequence?: number;
  onViewDetails?: () => void;
}

const PlanVsActualCard: React.FC<PlanVsActualCardProps> = ({
  planningResult,
  orderDrawingNumber,
  operationSequence,
  onViewDetails
}) => {
  const { t } = useTranslation();

  if (!planningResult.actualData) {
    // Если нет фактических данных, показываем только план
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">⏳</span>
            <span className="font-medium text-gray-700">
              {orderDrawingNumber} - {t('operation')} #{operationSequence}
            </span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {t('planned')}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('machine')}:</span>
            <span className="ml-1 font-medium">{planningResult.machine}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('time_min')}:</span>
            <span className="ml-1 font-medium">{planningResult.expectedTimeMinutes}</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          {t('no_actual_data')}
        </div>
      </div>
    );
  }

  const actualData = planningResult.actualData;
  const hasDifferences = ShiftPlanningUtils.hasPlanActualDifferences(planningResult);
  const timeDeviation = ShiftPlanningUtils.getTimeDeviation(planningResult);
  const statusColor = ShiftPlanningUtils.getStatusColor(planningResult);
  const statusIcon = ShiftPlanningUtils.getStatusIcon(planningResult);

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${
      hasDifferences ? 'bg-orange-50 border-orange-200' : 
      planningResult.status === 'completed' ? 'bg-green-50 border-green-200' :
      planningResult.status === 'in-progress' ? 'bg-blue-50 border-blue-200' :
      'bg-white border-gray-200'
    }`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{statusIcon}</span>
          <span className="font-medium text-gray-800">
            {orderDrawingNumber} - {t('operation')} #{operationSequence}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {actualData.completionPercentage && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {actualData.completionPercentage.toFixed(0)}%
            </span>
          )}
          {hasDifferences && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
          <span className={`text-xs px-2 py-1 rounded ${
            statusColor === 'green' ? 'bg-green-100 text-green-800' :
            statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
            statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {planningResult.status === 'completed' ? t('completed') :
             planningResult.status === 'in-progress' ? t('in_progress') :
             planningResult.status === 'rescheduled' ? t('rescheduled') :
             t('planned')}
          </span>
        </div>
      </div>

      {/* Сравнение план vs факт */}
      <div className="space-y-3">
        {/* Станок */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('planned')}</div>
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{planningResult.machine}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('actual')}</div>
            <div className="flex items-center space-x-2">
              <Settings className={`h-4 w-4 ${actualData.machineChanged ? 'text-orange-500' : 'text-green-500'}`} />
              <span className={`font-medium ${actualData.machineChanged ? 'text-orange-700' : 'text-gray-700'}`}>
                {actualData.actualMachine}
              </span>
              {actualData.machineChanged && (
                <span className="text-xs text-orange-600 bg-orange-100 px-1 rounded">
                  {t('changed')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Время */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('planned_time')}</div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{planningResult.expectedTimeMinutes} {t('min')}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('actual_time')}</div>
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${Math.abs(timeDeviation) > 30 ? 'text-orange-500' : 'text-green-500'}`} />
              <span className="font-medium">{actualData.actualTimeSpent || 0} {t('min')}</span>
              {Math.abs(timeDeviation) > 30 && (
                <div className="flex items-center space-x-1">
                  {timeDeviation > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${timeDeviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {timeDeviation > 0 ? '+' : ''}{timeDeviation} {t('min')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Выполнение */}
        {actualData.actualUnitsCompleted !== undefined && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('planned_quantity')}</div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{planningResult.quantityAssigned} {t('pcs')}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('completed_quantity')}</div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${actualData.completionPercentage === 100 ? 'text-green-700' : 'text-blue-700'}`}>
                  {actualData.actualUnitsCompleted} {t('pcs')}
                </span>
                {actualData.completionPercentage && actualData.completionPercentage < 100 && (
                  <span className="text-xs text-blue-600">
                    ({actualData.completionPercentage.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Операторы */}
        {actualData.actualOperators && actualData.actualOperators.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{t('operators')}</div>
            <div className="flex flex-wrap gap-1">
              {actualData.actualOperators.map((operator, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {operator}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Даты */}
        {actualData.actualStartDate && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('planned_date')}</div>
              <div className="text-sm">
                {new Date(planningResult.plannedStartDate).toLocaleDateString()}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('actual_date')}</div>
              <div className="text-sm text-blue-700">
                {new Date(actualData.actualStartDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Кнопка просмотра деталей */}
      {onViewDetails && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onViewDetails}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('view_details')} →
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanVsActualCard;

// Компонент для отображения сводки различий
export const PlanVsActualSummary: React.FC<{
  planningResults: PlanningResult[];
}> = ({ planningResults }) => {
  const { t } = useTranslation();

  const stats = {
    total: planningResults.length,
    withActualData: planningResults.filter(pr => pr.actualData).length,
    completed: planningResults.filter(pr => pr.status === 'completed').length,
    inProgress: planningResults.filter(pr => pr.status === 'in-progress').length,
    machineChanges: planningResults.filter(pr => pr.actualData?.machineChanged).length,
    timeDeviations: planningResults.filter(pr => 
      pr.actualData && Math.abs(ShiftPlanningUtils.getTimeDeviation(pr)) > 30
    ).length
  };

  const syncPercentage = stats.total > 0 ? (stats.withActualData / stats.total) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
        {t('plan_vs_actual_summary')}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">{t('total_operations')}</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.withActualData}</div>
          <div className="text-xs text-gray-500">{t('with_actual_data')}</div>
          <div className="text-xs text-blue-600">({syncPercentage.toFixed(0)}%)</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-gray-500">{t('completed')}</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.machineChanges}</div>
          <div className="text-xs text-gray-500">{t('machine_changes')}</div>
        </div>
      </div>

      {stats.timeDeviations > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {stats.timeDeviations} {t('operations_with_time_deviations')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
