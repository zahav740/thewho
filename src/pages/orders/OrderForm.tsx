import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { v4 as uuidv4 } from 'uuid';
import { MACHINES, OPERATION_TYPES } from '../../types';

const OrderForm = ({ orderId = null }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState({
    drawingNumber: '',
    deadline: new Date().toISOString().split('T')[0],
    quantity: 1,
    priority: 2,
    pdfUrl: ''
  });
  
  const [operations, setOperations] = useState([{
    id: uuidv4(),
    sequenceNumber: 1,
    machine: '',
    operationType: '3-axis',
    estimatedTime: 60,
    status: 'pending'
  }]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      orderService.getOrderById(orderId)
        .then(data => {
          setOrder({
            drawingNumber: data.drawingNumber,
            deadline: data.deadline.split('T')[0],
            quantity: data.quantity,
            priority: data.priority,
            pdfUrl: data.pdfUrl || ''
          });
          
          if (data.operations && data.operations.length > 0) {
            setOperations(data.operations.map(op => ({
              id: op.id,
              sequenceNumber: op.sequenceNumber,
              machine: op.machine || '',
              operationType: op.operationType,
              estimatedTime: op.estimatedTime,
              status: op.status
            })));
          }
        })
        .catch(err => {
          console.error('Error loading order', err);
          setError('Ошибка загрузки заказа');
        })
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'priority' ? Number(value) : value
    }));
  };
  
  const handleOperationChange = (index, e) => {
    const { name, value } = e.target;
    const newOperations = [...operations];
    newOperations[index] = {
      ...newOperations[index],
      [name]: name === 'sequenceNumber' || name === 'estimatedTime' ? Number(value) : value
    };
    setOperations(newOperations);
  };
  
  const addOperation = () => {
    setOperations([
      ...operations,
      {
        id: uuidv4(),
        sequenceNumber: operations.length + 1,
        machine: '',
        operationType: '3-axis',
        estimatedTime: 60,
        status: 'pending'
      }
    ]);
  };
  
  const removeOperation = (index) => {
    if (operations.length > 1) {
      const newOperations = operations.filter((_, i) => i !== index);
      // Пересчитываем sequence_number
      const updatedOperations = newOperations.map((op, i) => ({
        ...op,
        sequenceNumber: i + 1
      }));
      setOperations(updatedOperations);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const orderData = {
        ...order,
        operations: operations.map(op => ({
          ...op,
          orderId: orderId || uuidv4()
        }))
      };
      
      if (orderId) {
        await orderService.updateOrder(orderId, orderData);
      } else {
        const newOrder = await orderService.createOrder({
          id: uuidv4(),
          ...orderData
        });
        orderId = newOrder.id;
      }
      
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error('Error saving order', err);
      setError('Ошибка сохранения заказа');
    } finally {
      setIsLoading(false);
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
      <h1 className="text-2xl font-bold mb-4">{orderId ? 'Редактировать заказ' : 'Создать заказ'}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Номер чертежа</label>
            <input
              type="text"
              name="drawingNumber"
              value={order.drawingNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Дедлайн</label>
            <input
              type="date"
              name="deadline"
              value={order.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Количество</label>
            <input
              type="number"
              name="quantity"
              value={order.quantity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Приоритет</label>
            <select
              name="priority"
              value={order.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="1">Высокий</option>
              <option value="2">Средний</option>
              <option value="3">Низкий</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL PDF чертежа</label>
            <input
              type="text"
              name="pdfUrl"
              value={order.pdfUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Операции</h2>
            <button
              type="button"
              onClick={addOperation}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Добавить операцию
            </button>
          </div>
          
          {operations.map((operation, index) => (
            <div key={operation.id || index} className="bg-gray-50 p-4 rounded-lg mb-4 border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Операция #{operation.sequenceNumber}</h3>
                <button
                  type="button"
                  onClick={() => removeOperation(index)}
                  disabled={operations.length === 1}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg disabled:bg-red-300"
                >
                  Удалить
                </button>
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Последовательность</label>
                <input
                  type="number"
                  name="sequenceNumber"
                  value={operation.sequenceNumber}
                  onChange={(e) => handleOperationChange(index, e)}
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Станок</label>
                <select
                  name="machine"
                  value={operation.machine}
                  onChange={(e) => handleOperationChange(index, e)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Выберите станок</option>
                  {MACHINES.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Тип операции</label>
                <select
                  name="operationType"
                  value={operation.operationType}
                  onChange={(e) => handleOperationChange(index, e)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {OPERATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 mb-2">Оценочное время (мин. на единицу)</label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={operation.estimatedTime}
                  onChange={(e) => handleOperationChange(index, e)}
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
