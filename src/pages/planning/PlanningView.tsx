import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { orderService } from '../../services/orderService';
import { planningService } from '../../services/planningService';

const PlanningView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [planningResults, setPlanningResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanningInProgress, setIsPlanningInProgress] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (orderId) {
      loadOrderAndPlanningData();
    }
  }, [orderId]);
  
  const loadOrderAndPlanningData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
      
      // Загружаем результаты планирования
      const results = await planningService.getPlanningResults(orderId);
      setPlanningResults(results);
    } catch (err) {
      console.error('Error loading data', err);
      setError('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };
  
  const runInitialPlanning = async () => {
    try {
      setIsPlanningInProgress(true);
      setError('');
      
      await planningService.createInitialPlan(orderId);
      await loadOrderAndPlanningData();
    } catch (err) {
      console.error('Error in planning', err);
      setError('Ошибка планирования: ' + err.message);
    } finally {
      setIsPlanningInProgress(false);
    }
  };
  
  const runAdaptivePlanning = async () => {
    try {
      setIsPlanningInProgress(true);
      setError('');
      
      await planningService.runAdaptivePlanning(orderId);
      await loadOrderAndPlanningData();
    } catch (err) {
      console.error('Error in replanning', err);
      setError('Ошибка перепланирования: ' + err.message);
    } finally {
      setIsPlanningInProgress(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Заказ не найден
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={() => navigate('/orders')}
        >
          Вернуться к списку заказов
        </button>
      </div>
    );
  }
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Планирование заказа #{order.drawingNumber}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Информация о заказе</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Номер чертежа:</strong> {order.drawingNumber}</p>
            <p><strong>Дедлайн:</strong> {formatDate(order.deadline).split(' ')[0]}</p>
            <p><strong>Количество:</strong> {order.quantity}</p>
            <p>
              <strong>Приоритет:</strong> {
                order.priority === 1 ? 'Высокий' : 
                order.priority === 2 ? 'Средний' : 'Низкий'
              }
            </p>
          </div>
          <div>
            <p>
              <strong>Статус:</strong>{' '}
              <span className={`inline-block px-2 py-1 rounded text-white ${
                order.status === 'completed' ? 'bg-green-500' :
                order.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                {
                  order.status === 'completed' ? 'Завершен' :
                  order.status === 'in-progress' ? 'В процессе' : 'Запланирован'
                }
              </span>
            </p>
            <p><strong>Прогресс выполнения:</strong> {order.completion_percentage?.toFixed(2) || 0}%</p>
            {order.forecasted_completion_date && (
              <p>
                <strong>Прогнозируемая дата завершения:</strong>{' '}
                {formatDate(order.forecasted_completion_date)}
              </p>
            )}
            <p>
              <strong>Соответствие графику:</strong>{' '}
              <span className={`inline-block px-2 py-1 rounded text-white ${order.is_on_schedule ? 'bg-green-500' : 'bg-red-500'}`}>
                {order.is_on_schedule ? 'В срок' : 'Задержка'}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Операции</h2>
          <div>
            {planningResults.length > 0 ? (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                onClick={runAdaptivePlanning}
                disabled={isPlanningInProgress}
              >
                {isPlanningInProgress ? 'Выполняется...' : 'Перепланировать'}
              </button>
            ) : (
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={runInitialPlanning}
                disabled={isPlanningInProgress}
              >
                {isPlanningInProgress ? 'Выполняется...' : 'Запланировать'}
              </button>
            )}
          </div>
        </div>
        
        {order.operations.length === 0 ? (
          <p className="text-gray-500">Нет операций для этого заказа</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Тип операции</th>
                  <th className="px-4 py-2 text-left">Станок</th>
                  <th className="px-4 py-2 text-left">Время (мин)</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                  <th className="px-4 py-2 text-left">Выполнено</th>
                </tr>
              </thead>
              <tbody>
                {order.operations
                  .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                  .map(operation => (
                    <tr key={operation.id} className="border-b">
                      <td className="px-4 py-2">{operation.sequenceNumber}</td>
                      <td className="px-4 py-2">{operation.operationType}</td>
                      <td className="px-4 py-2">{operation.machine}</td>
                      <td className="px-4 py-2">{operation.estimatedTime}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-white ${
                          operation.status === 'completed' ? 'bg-green-500' :
                          operation.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {
                            operation.status === 'completed' ? 'Завершена' :
                            operation.status === 'in-progress' ? 'В процессе' : 'Ожидает'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-2">{operation.completedUnits || 0} / {order.quantity}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Результаты планирования</h2>
        
        {planningResults.length === 0 ? (
          <p className="text-gray-500">Нет результатов планирования. Нажмите кнопку "Запланировать" для создания плана.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Операция</th>
                  <th className="px-4 py-2 text-left">Станок</th>
                  <th className="px-4 py-2 text-left">Начало</th>
                  <th className="px-4 py-2 text-left">Окончание</th>
                  <th className="px-4 py-2 text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {planningResults
                  .sort((a, b) => new Date(a.planned_start_date) - new Date(b.planned_start_date))
                  .map(result => {
                    const operation = order.operations.find(op => op.id === result.operation_id);
                    
                    return (
                      <tr key={result.id} className="border-b">
                        <td className="px-4 py-2">Операция #{operation?.sequenceNumber || '?'}</td>
                        <td className="px-4 py-2">{result.machine}</td>
                        <td className="px-4 py-2">{formatDate(result.planned_start_date)}</td>
                        <td className="px-4 py-2">{formatDate(result.planned_end_date)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-1 rounded text-white ${
                            result.status === 'completed' ? 'bg-green-500' :
                            result.status === 'in-progress' ? 'bg-blue-500' :
                            result.status === 'rescheduled' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}>
                            {
                              result.status === 'completed' ? 'Завершено' :
                              result.status === 'in-progress' ? 'В процессе' :
                              result.status === 'rescheduled' ? 'Перепланировано' : 'Запланировано'
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          onClick={() => navigate('/orders')}
        >
          Вернуться к списку заказов
        </button>
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          onClick={() => navigate(`/shifts/new?machine=${order.operations[0]?.machine || ''}`)}
        >
          Внести данные о смене
        </button>
      </div>
    </div>
  );
};

export default PlanningView;
