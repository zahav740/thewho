import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { orderService } from '../../services/orderService';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);
  
  const loadOrder = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order', err);
      setError('Ошибка загрузки заказа');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await orderService.deleteOrder(orderId);
        navigate('/orders');
      } catch (err) {
        console.error('Error deleting order', err);
        setError('Ошибка удаления заказа');
      }
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (err) {
      return dateString;
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Заказ #{order.drawingNumber}</h1>
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            onClick={() => navigate(`/planning/${order.id}`)}
          >
            Планирование
          </button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
            onClick={() => navigate(`/orders/${order.id}/edit`)}
          >
            Редактировать
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
            onClick={handleDelete}
          >
            Удалить
          </button>
        </div>
      </div>
      
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
            <p><strong>Дедлайн:</strong> {formatDate(order.deadline)}</p>
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
        
        {order.pdfUrl && (
          <div className="mt-4">
            <p><strong>PDF чертежа:</strong></p>
            <a 
              href={order.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Открыть чертеж
            </a>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Операции</h2>
        
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
      
      <div className="flex justify-between">
        <button
          className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          onClick={() => navigate('/orders')}
        >
          Вернуться к списку заказов
        </button>
        
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
            onClick={() => navigate(`/planning/${order.id}`)}
          >
            Перейти к планированию
          </button>
          <button
            className="bg-green-500 text-white px-6 py-2 rounded-lg"
            onClick={() => navigate(`/shifts/new?machine=${order.operations[0]?.machine || ''}`)}
          >
            Внести данные о смене
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
