import React, { useState } from 'react';
import { syncWithSupabase, loadFromSupabase } from '../utils/supabaseClient';
import { useApp } from '../context/AppContext';
import { Clock, Database, RefreshCw, Upload, Download, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProductionPlanning } from '../hooks/useProductionPlanning';

const SupabaseSync: React.FC = () => {
  const { t } = useTranslation();
  const { orders, updateOrders } = useApp();
  const { planningResults, clearPlanning, setPlanningResults } = useProductionPlanning();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loadResult, setLoadResult] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncWithSupabase(orders, planningResults, accessToken || undefined);
      setSyncResult(result);
      
      // Если синхронизация успешна и есть мигрированные данные, обновляем локальные данные
      if (result.success && result.migratedOrders && result.migratedPlanningResults) {
        // Обновляем заказы и результаты планирования с UUID
        updateOrders(result.migratedOrders);
        setPlanningResults(result.migratedPlanningResults);
      }
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      setSyncResult({ success: false, error });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoad = async () => {
    if (orders.length > 0) {
      const confirmed = window.confirm(
        t('confirm_replace_data', { count: orders.length })
      );
      if (!confirmed) {
        return;
      }
    }
    
    setIsLoading(true);
    setLoadResult(null);
    
    try {
      const result = await loadFromSupabase(accessToken || undefined);
      
      if (result.success) {
        // Очищаем текущие данные
        updateOrders(result.orders);
        clearPlanning();
        setPlanningResults(result.planningResults);
      }
      
      setLoadResult(result);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoadResult({ success: false, error });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTokenInput = () => {
    setShowTokenInput(!showTokenInput);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Database className="mr-2 h-5 w-5 text-blue-500" />
          {t('supabase_synchronization')}
        </h2>
        <button
          onClick={toggleTokenInput}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showTokenInput ? t('hide_token') : t('set_token')}
        </button>
      </div>
      
      {showTokenInput && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('access_token')}
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder={t('enter_token_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('token_description')}
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">{t('current_data')}</h3>
              <p className="text-sm text-gray-600">{orders.length} {t('orders')}</p>
              <p className="text-sm text-gray-600">{planningResults.length} {t('planning_operations')}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium text-blue-800">{t('supabase_storage')}</h3>
              <p className="text-sm text-blue-600">{t('remote_database')}</p>
              <p className="text-sm text-blue-600">{t('cloud_storage')}</p>
            </div>
            <Database className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('syncing')}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t('sync_to_supabase')}
            </>
          )}
        </button>
        
        <button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('loading')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t('load_from_supabase')}
            </>
          )}
        </button>
      </div>
      
      {syncResult && (
        <div className={`mt-4 p-4 rounded-lg ${syncResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-start">
            {syncResult.success ? (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-medium">
                {syncResult.success ? t('sync_success') : t('sync_error')}
              </h4>
              {syncResult.success ? (
                <div className="mt-1 text-sm">
                  <p>{t('synced_orders')}: {syncResult.ordersCount}</p>
                  <p>{t('synced_operations')}: {syncResult.operationsCount}</p>
                  <p>{t('synced_planning')}: {syncResult.planningCount}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm">
                  {syncResult.error?.message || t('unknown_error')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {loadResult && (
        <div className={`mt-4 p-4 rounded-lg ${loadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-start">
            {loadResult.success ? (
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-medium">
                {loadResult.success ? t('load_success') : t('load_error')}
              </h4>
              {loadResult.success ? (
                <div className="mt-1 text-sm">
                  <p>{t('loaded_orders')}: {loadResult.orders?.length || 0}</p>
                  <p>{t('loaded_planning')}: {loadResult.planningResults?.length || 0}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm">
                  {loadResult.error?.message || t('unknown_error')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseSync;
