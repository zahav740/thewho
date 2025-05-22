import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { orderService } from '../../services/orderService';

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders', err);
      setError('Ошибка загрузки заказов');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      try {
        await orderService.deleteOrder(id);
        await loadOrders();
      } catch (err) {
        console.error('Error deleting order', err);
        setError('Ошибка удаления заказа');
      }
    }
  };
  
  const filteredOrders = () => {
    switch (filter) {
      case 'active':
        return orders.filter(order => order.status !== 'completed');
      case 'completed':
        return orders.filter(order => order.status === 'completed');
      case 'urgent':
        return orders.filter(order => order.priority === 1);
      case 'delayed':
        return orders.filter(order => !order.is_on_schedule);
      default:
        return orders;
    }
  };
  
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Список заказов</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={() => navigate('/orders/new')}
        >
          Создать заказ
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('active')}
        >
          Активные
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('completed')}
        >
          Завершенные
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${filter === 'urgent' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('urgent')}
        >
          Срочные
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${filter === 'delayed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setFilter('delayed')}
        >
          С задержкой
        </button>
      </div>
      
      {filteredOrders().length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-700">Заказы не найдены</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Чертеж</th>
                <th className="px-4 py-3 text-left">Дедлайн</th>
                <th className="px-4 py-3 text-left">Количество</th>
                <th className="px-4 py-3 text-left">Приоритет</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Прогресс</th>
                <th className="px-4 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders().map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span>{order.drawingNumber}</span>
                      {!order.is_on_schedule && (
                        <span className="ml-2 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatDate(order.deadline)}</td>
                  <td className="px-4 py-3">{order.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-white ${getPriorityClass(order.priority)}`}>
                      {order.priority === 1 ? 'Высокий' : 
                       order.priority === 2 ? 'Средний' : 'Низкий'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-white ${getStatusClass(order.status)}`}>
                      {order.status === 'completed' ? 'Завершен' : 
                       order.status === 'in-progress' ? 'В процессе' : 'Запланирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${order.is_on_schedule ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        style={{ width: `${order.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {Math.round(order.completion_percentage || 0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        title="Просмотр"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        className="text-green-500 hover:text-green-700"
                        onClick={() => navigate(`/planning/${order.id}`)}
                        title="Планирование"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        className="text-yellow-500 hover:text-yellow-700"
                        onClick={() => navigate(`/orders/${order.id}/edit`)}
                        title="Редактировать"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(order.id)}
                        title="Удалить"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
