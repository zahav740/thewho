import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useProductionPlanning } from '../hooks/useProductionPlanning';

const PlanningDebugPage: React.FC = () => {
  const { orders, shifts } = useApp();
  const { planProduction, planningResults, isPlanning } = useProductionPlanning();
  const [logs, setLogs] = useState<string[]>([]);

  // Перехватываем console.log для отображения в интерфейсе
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Функция для запуска планирования с логированием
  const runPlanningWithLogs = async () => {
    const capturedLogs: string[] = [];
    
    // Перехватываем все виды логов
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      capturedLogs.push(`[LOG] ${message}`);
      originalLog(...args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      capturedLogs.push(`[WARN] ${message}`);
      originalWarn(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      capturedLogs.push(`[ERROR] ${message}`);
      originalError(...args);
    };

    try {
      await planProduction();
    } catch (error) {
      capturedLogs.push(`[ERROR] Планирование завершилось с ошибкой: ${error}`);
    }

    // Восстанавливаем оригинальные функции
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;

    setLogs(capturedLogs);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Отладка планирования</h1>
      
      {/* Информация о данных */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Заказы</h3>
          <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
          <p className="text-sm text-blue-700">
            {orders.filter(o => new Date(o.deadline) < new Date()).length} просрочено
          </p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Смены</h3>
          <p className="text-2xl font-bold text-green-900">{shifts.length}</p>
          <p className="text-sm text-green-700">
            {shifts.reduce((sum, shift) => sum + shift.operations.length, 0)} операций в сменах
          </p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Планирование</h3>
          <p className="text-2xl font-bold text-purple-900">{planningResults.length}</p>
          <p className="text-sm text-purple-700">запланированных операций</p>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={runPlanningWithLogs}
          disabled={isPlanning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPlanning ? 'Выполняется планирование...' : 'Запустить планирование с логами'}
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Очистить логи
        </button>
      </div>

      {/* Детальная информация по заказам */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Детали заказов</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дедлайн</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Приоритет</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Операций</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => {
                const deadline = new Date(order.deadline);
                const isOverdue = deadline < new Date();
                const operationsInShifts = shifts
                  .flatMap(shift => shift.operations)
                  .filter(shiftOp => order.operations.some(op => op.id === shiftOp.operationId));
                
                return (
                  <tr key={order.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{order.drawingNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                        {deadline.toLocaleDateString('ru-RU')}
                        {isOverdue && ' (просрочен)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.operations.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">
                        {operationsInShifts.length > 0 
                          ? `${operationsInShifts.length} операций в сменах`
                          : 'Нет данных в сменах'
                        }
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Логи планирования */}
      {logs.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Логи планирования</h2>
          <div className="max-h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  log.startsWith('[ERROR]') ? 'text-red-400' : 
                  log.startsWith('[WARN]') ? 'text-yellow-400' : 
                  'text-green-400'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningDebugPage;