import React from 'react';
import { Sync, AlertTriangle } from 'lucide-react';

const ShiftPlanningSync: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <Sync className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Синхронизация планирования со сменами
        </h3>
      </div>
      
      <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">
            Компонент синхронизации временно отключен для устранения ошибок.
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Функционал синхронизации:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Автоматическое обновление статусов операций</li>
          <li>• Отслеживание смен станков</li>
          <li>• Синхронизация с фактическими данными смен</li>
        </ul>
      </div>
    </div>
  );
};

export default ShiftPlanningSync;
