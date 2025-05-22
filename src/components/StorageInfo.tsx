import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface StorageInfo {
  size: number;
  available: number;
  quota: number;
  usage: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function StorageInfo() {
  const { orders, shifts, operators, setups } = useApp();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    size: 0,
    available: 0,
    quota: 0,
    usage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateStorageInfo = async () => {
      try {
        // Рассчитываем размер данных в localStorage
        const ordersSize = JSON.stringify(orders).length;
        const shiftsSize = JSON.stringify(shifts).length;
        const operatorsSize = JSON.stringify(operators).length;
        const setupsSize = JSON.stringify(setups).length;
        const totalSize = (ordersSize + shiftsSize + operatorsSize + setupsSize) * 2; // Примерно 2 байта на символ в UTF-16
        
        // Получаем общую информацию о квоте браузера
        let browserInfo = { quota: 0, usage: 0 };
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          browserInfo = {
            quota: estimate.quota || 0,
            usage: estimate.usage || 0
          };
        }

        setStorageInfo({
          size: totalSize,
          available: Math.max(0, browserInfo.quota - browserInfo.usage),
          quota: browserInfo.quota,
          usage: browserInfo.usage
        });
      } catch (error) {
        console.error('❌ Ошибка получения информации о хранилище:', error);
      } finally {
        setLoading(false);
      }
    };

    updateStorageInfo();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(updateStorageInfo, 30000);
    return () => clearInterval(interval);
  }, [orders, shifts, operators, setups]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">
            Загрузка информации о хранилище...
          </span>
        </div>
      </div>
    );
  }

  const usagePercentage = storageInfo.quota > 0 ? (storageInfo.usage / storageInfo.quota) * 100 : 0;

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        💾 Информация о хранилище
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          LocalStorage
        </span>
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Размер базы данных:</span>
          <span className="font-medium">{formatBytes(storageInfo.size)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Доступное место:</span>
          <span className="font-medium text-green-600">{formatBytes(storageInfo.available)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Общая квота:</span>
          <span className="font-medium">{formatBytes(storageInfo.quota)}</span>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Использовано</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 Данные сохраняются в localStorage браузера (ограничение ~5-10MB)
        </div>
      </div>
    </div>
  );
}