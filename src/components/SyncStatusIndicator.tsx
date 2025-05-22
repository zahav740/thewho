import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { 
  Cloud, 
  CloudOff, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  RotateCw, 
  Download,
  Upload,
  Settings,
  Clock,
  Database
} from 'lucide-react';

const SyncStatusIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { 
    isSyncing, 
    lastSync, 
    syncError, 
    syncEnabled, 
    setSyncEnabled,
    forceSyncAll,
    loadFromRemote 
  } = useApp();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return t('never');
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return t('just_now');
    if (minutes < 60) return t('minutes_ago', { count: minutes });
    if (hours < 24) return t('hours_ago', { count: hours });
    
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = () => {
    if (syncError) return 'text-red-500';
    if (isSyncing || isManualSyncing || isLoading) return 'text-blue-500';
    if (!syncEnabled) return 'text-gray-400';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (syncError) return <AlertCircle className="h-4 w-4" />;
    if (isSyncing || isManualSyncing || isLoading) return <RotateCw className="h-4 w-4 animate-spin" />;
    if (!syncEnabled) return <CloudOff className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getNetworkIcon = () => {
    if (syncError) return <WifiOff className="h-4 w-4" />;
    if (!syncEnabled) return <CloudOff className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  const handleManualSync = async () => {
    try {
      setIsManualSyncing(true);
      await forceSyncAll();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleLoadData = async () => {
    try {
      setIsLoading(true);
      await loadFromRemote();
    } catch (error) {
      console.error('Load data failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    if (syncError) return t('sync_error_short');
    if (isSyncing) return t('syncing');
    if (isManualSyncing) return t('manual_sync');
    if (isLoading) return t('loading_data');
    if (!syncEnabled) return t('sync_disabled');
    return t('sync_active');
  };

  return (
    <div className="relative">
      {/* Основной индикатор */}
      <div className="flex items-center space-x-2">
        {/* Статус синхронизации */}
        <div 
          className={`flex items-center space-x-1 ${getStatusColor()} cursor-pointer hover:opacity-75 transition-opacity`}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title={getStatusText()}
        >
          {getNetworkIcon()}
          {getStatusIcon()}
          <span className="text-xs font-medium hidden sm:inline">
            {getStatusText()}
          </span>
        </div>

        {/* Время последней синхронизации */}
        {lastSync && !isSyncing && (
          <div className="flex items-center space-x-1 text-gray-500 text-xs">
            <Clock className="h-3 w-3" />
            <span className="hidden md:inline">
              {formatLastSync(lastSync)}
            </span>
          </div>
        )}
      </div>

      {/* Выпадающее меню настроек */}
      {isSettingsOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Database className="h-5 w-5 mr-2" />
                {t('supabase_synchronization')}
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Переключатель автосинхронизации */}
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                {t('auto_sync')}
              </label>
              <button
                onClick={() => setSyncEnabled(!syncEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    syncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Статус */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('status')}
                </span>
                <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="text-xs">{getStatusText()}</span>
                </div>
              </div>
              
              {lastSync && (
                <div className="text-xs text-gray-500">
                  {t('last_sync')}: {formatLastSync(lastSync)}
                </div>
              )}
              
              {syncError && (
                <div className="text-xs text-red-600 mt-1">
                  {t('error')}: {syncError}
                </div>
              )}
            </div>

            {/* Кнопки управления */}
            <div className="space-y-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing || isManualSyncing}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isManualSyncing ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isManualSyncing ? t('syncing') : t('sync_now')}</span>
              </button>

              <button
                onClick={handleLoadData}
                disabled={isSyncing || isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isLoading ? t('loading') : t('load_from_remote')}</span>
              </button>
            </div>

            {/* Информация */}
            <div className="mt-4 text-xs text-gray-500">
              <p>{t('auto_sync_description')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
