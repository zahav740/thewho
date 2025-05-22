import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { shiftService } from '../../services/shiftService';
import { orderService } from '../../services/orderService';
import { planningService } from '../../services/planningService';
import { MACHINES, DEFAULT_OPERATORS, NIGHT_OPERATOR } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const ShiftForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedMachine = queryParams.get('machine') || '';
  
  const [shift, setShift] = useState({
    date: new Date().toISOString().split('T')[0],
    machine: preselectedMachine,
    isNight: false,
    operators: []
  });
  
  const [operations, setOperations] = useState([]);
  const [setups, setSetups] = useState([]);
  const [operatorName, setOperatorName] = useState('');
  const [availableOperations, setAvailableOperations] = useState([]);
  const [availableOperators, setAvailableOperators] = useState(DEFAULT_OPERATORS);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Default operator list based on shift type
    if (shift.isNight) {
      if (!availableOperators.includes(NIGHT_OPERATOR)) {
        setAvailableOperators([...DEFAULT_OPERATORS, NIGHT_OPERATOR]);
      }
    } else {
      setAvailableOperators(DEFAULT_OPERATORS);
    }
    
    // Reset operators when shift type changes
    setShift(prev => ({
      ...prev,
      operators: []
    }));
  }, [shift.isNight]);
  
  useEffect(() => {
    // Загружаем доступные операции при изменении станка
    if (shift.machine) {
      loadAvailableOperations();
    }
  }, [shift.machine]);
  
  const loadAvailableOperations = async () => {
    try {
      setIsLoading(true);
      
      // Получаем все заказы со статусом "in-progress" или "planned"
      const orders = await orderService.getOrders();
      const activeOrders = orders.filter(o => o.status !== 'completed');
      
      // Для каждого заказа получаем операции
      const allOperations = [];
      
      for (const order of activeOrders) {
        // Фильтруем операции по станку и статусу
        const matchingOperations = order.operations
          .filter(op => op.machine === shift.machine && op.status !== 'completed')
          .map(op => ({
            id: op.id,
            order_id: order.id,
            drawing_number: order.drawingNumber,
            sequence_number: op.sequenceNumber,
            operation_type: op.operationType,
            estimated_time: op.estimatedTime,
            remaining_quantity: order.quantity - (op.completedUnits || 0)
          }));
        
        allOperations.push(...matchingOperations);
      }
      
      setAvailableOperations(allOperations);
    } catch (err) {
      console.error('Error loading operations', err);
      setError('Ошибка загрузки доступных операций');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShiftChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShift(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const addOperator = () => {
    if (operatorName.trim() && !shift.operators.includes(operatorName.trim())) {
      setShift(prev => ({
        ...prev,
        operators: [...prev.operators, operatorName.trim()]
      }));
      setOperatorName('');
    }
  };
  
  const selectOperator = (operator) => {
    if (!shift.operators.includes(operator)) {
      setShift(prev => ({
        ...prev,
        operators: [...prev.operators, operator]
      }));
    }
  };
  
  const removeOperator = (operator) => {
    setShift(prev => ({
      ...prev,
      operators: prev.operators.filter(op => op !== operator)
    }));
  };
  
  const addOperation = () => {
    setOperations([
      ...operations,
      {
        operation_id: '',
        drawing_number: '',
        completed_units: 0,
        time_spent: 0,
        operators: [...shift.operators]
      }
    ]);
  };
  
  const removeOperation = (index) => {
    setOperations(operations.filter((_, i) => i !== index));
  };
  
  const handleOperationChange = (index, e) => {
    const { name, value } = e.target;
    
    if (name === 'operation_id' && value) {
      const selectedOperation = availableOperations.find(op => op.id === value);
      
      const updatedOperations = [...operations];
      updatedOperations[index] = {
        ...updatedOperations[index],
        operation_id: value,
        drawing_number: selectedOperation ? selectedOperation.drawing_number : ''
      };
      
      setOperations(updatedOperations);
    } else {
      const updatedOperations = [...operations];
      updatedOperations[index] = {
        ...updatedOperations[index],
        [name]: name === 'completed_units' || name === 'time_spent' ? Number(value) : value,
        operators: updatedOperations[index].operators || [...shift.operators]
      };
      
      setOperations(updatedOperations);
    }
  };
  
  const updateOperationOperators = (index, operators) => {
    const updatedOperations = [...operations];
    updatedOperations[index] = {
      ...updatedOperations[index],
      operators
    };
    setOperations(updatedOperations);
  };
  
  const addSetup = () => {
    setSetups([
      ...setups,
      {
        drawing_number: '',
        setup_type: '',
        operation_number: 1,
        time_spent: 0,
        operator: shift.operators.length > 0 ? shift.operators[0] : '',
        start_time: shift.isNight ? '16:00' : '08:00',
        date: shift.date,
        machine: shift.machine
      }
    ]);
  };
  
  const removeSetup = (index) => {
    setSetups(setups.filter((_, i) => i !== index));
  };
  
  const handleSetupChange = (index, e) => {
    const { name, value } = e.target;
    
    const updatedSetups = [...setups];
    updatedSetups[index] = {
      ...updatedSetups[index],
      [name]: name === 'time_spent' || name === 'operation_number' ? Number(value) : value,
      date: shift.date,
      machine: shift.machine
    };
    
    setSetups(updatedSetups);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (shift.operators.length === 0) {
      setError('Добавьте хотя бы одного оператора');
      return;
    }
    
    if (operations.length === 0 && setups.length === 0) {
      setError('Добавьте хотя бы одну операцию или наладку');
      return;
    }
    
    // Валидация операций
    for (const operation of operations) {
      if (!operation.operation_id) {
        setError('Выберите операцию для всех строк');
        return;
      }
      
      if (operation.completed_units <= 0) {
        setError('Количество выполненных единиц должно быть больше 0');
        return;
      }
      
      if (operation.time_spent <= 0) {
        setError('Затраченное время должно быть больше 0');
        return;
      }
      
      if (!operation.operators || operation.operators.length === 0) {
        setError('Каждая операция должна иметь хотя бы одного оператора');
        return;
      }
    }
    
    // Валидация наладок
    for (const setup of setups) {
      if (!setup.drawing_number) {
        setError('Укажите номер чертежа для всех наладок');
        return;
      }
      
      if (!setup.setup_type) {
        setError('Укажите тип наладки для всех наладок');
        return;
      }
      
      if (setup.time_spent <= 0) {
        setError('Затраченное время должно быть больше 0');
        return;
      }
      
      if (!setup.operator) {
        setError('Укажите оператора для всех наладок');
        return;
      }
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const shiftData = {
        id: uuidv4(),
        date: shift.date,
        machine: shift.machine,
        isNight: shift.isNight,
        operators: shift.operators,
        operations: operations,
        setups: setups
      };
      
      await shiftService.saveShift(shiftData);
      
      // Запускаем адаптивное перепланирование для затронутых заказов
      const affectedOrderIds = new Set();
      
      // Получаем информацию об операциях для обновления заказов
      for (const operation of operations) {
        if (operation.operation_id) {
          try {
            // Получаем операцию, чтобы найти ID заказа
            const { data: opData } = await supabase
              .from('operations')
              .select('order_id')
              .eq('id', operation.operation_id)
              .single();
            
            if (opData?.order_id) {
              affectedOrderIds.add(opData.order_id);
            }
          } catch (err) {
            console.error('Error getting operation order ID', err);
          }
        }
      }
      
      // Перепланируем каждый затронутый заказ
      for (const orderId of affectedOrderIds) {
        try {
          await planningService.runAdaptivePlanning(orderId);
        } catch (err) {
          console.error(`Error replanning order ${orderId}`, err);
        }
      }
      
      navigate('/shifts');
    } catch (err) {
      console.error('Error saving shift', err);
      setError('Ошибка сохранения данных о смене: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && availableOperations.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ввод данных о смене</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Дата</label>
              <input
                type="date"
                name="date"
                value={shift.date}
                onChange={handleShiftChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Станок</label>
              <select
                name="machine"
                value={shift.machine}
                onChange={handleShiftChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Выберите станок</option>
                {MACHINES.map(machine => (
                  <option key={machine} value={machine}>{machine}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isNight"
                name="isNight"
                checked={shift.isNight}
                onChange={handleShiftChange}
                className="mr-2"
              />
              <label htmlFor="isNight" className="text-gray-700">
                Ночная смена (16:00-8:00)
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Операторы</label>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {availableOperators.map(operator => (
                  <button
                    key={operator}
                    type="button"
                    onClick={() => selectOperator(operator)}
                    className={`px-3 py-1 rounded-lg border ${
                      shift.operators.includes(operator) 
                        ? 'bg-blue-500 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {operator}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Другой оператор"
                  className="flex-grow px-3 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={addOperator}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Добавить
                </button>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-gray-700 mb-2">Выбранные операторы:</p>
              <div className="flex flex-wrap gap-2">
                {shift.operators.map((operator, idx) => (
                  <span key={idx} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                    {operator}
                    <button
                      type="button"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      onClick={() => removeOperator(operator)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {shift.operators.length === 0 && (
                  <span className="text-gray-500 italic">Нет выбранных операторов</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Выполненные операции</h2>
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              onClick={addOperation}
              disabled={!shift.machine || shift.operators.length === 0}
            >
              Добавить операцию
            </button>
          </div>
          
          {operations.length === 0 ? (
            <p className="text-gray-500">Нет выполненных операций</p>
          ) : (
            operations.map((operation, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Операция #{index + 1}</h3>
                  <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => removeOperation(index)}
                  >
                    Удалить
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Выберите операцию</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    name="operation_id"
                    value={operation.operation_id}
                    onChange={(e) => handleOperationChange(index, e)}
                    required
                  >
                    <option value="">Выберите операцию</option>
                    {availableOperations.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.drawing_number} - Операция #{op.sequence_number} ({op.operation_type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Номер чертежа</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    value={operation.drawing_number}
                    readOnly
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Выполнено единиц</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      name="completed_units"
                      value={operation.completed_units}
                      onChange={(e) => handleOperationChange(index, e)}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Затраченное время (минуты)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      name="time_spent"
                      value={operation.time_spent}
                      onChange={(e) => handleOperationChange(index, e)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Операторы операции</label>
                  <div className="flex flex-wrap gap-2">
                    {availableOperators.map(operator => (
                      <button
                        key={operator}
                        type="button"
                        onClick={() => {
                          const currentOperators = operation.operators || [];
                          if (currentOperators.includes(operator)) {
                            updateOperationOperators(
                              index,
                              currentOperators.filter(op => op !== operator)
                            );
                          } else {
                            updateOperationOperators(
                              index,
                              [...currentOperators, operator]
                            );
                          }
                        }}
                        className={`px-3 py-1 rounded-lg border ${
                          operation.operators?.includes(operator) 
                            ? 'bg-blue-500 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {operator}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Наладки</h2>
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              onClick={addSetup}
              disabled={!shift.machine || shift.operators.length === 0}
            >
              Добавить наладку
            </button>
          </div>
          
          {setups.length === 0 ? (
            <p className="text-gray-500">Нет выполненных наладок</p>
          ) : (
            setups.map((setup, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Наладка #{index + 1}</h3>
                  <button
                    type="button"
                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                    onClick={() => removeSetup(index)}
                  >
                    Удалить
                  </button>
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Номер чертежа</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                    name="drawing_number"
                    value={setup.drawing_number}
                    onChange={(e) => handleSetupChange(index, e)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-gray-700 mb-2">Тип наладки</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    name="setup_type"
                    value={setup.setup_type}
                    onChange={(e) => handleSetupChange(index, e)}
                    required
                  >
                    <option value="">Выберите тип наладки</option>
                    <option value="3-axis-setup">3-axis наладка</option>
                    <option value="4-axis-setup">4-axis наладка</option>
                    <option value="turning-setup">Токарная наладка</option>
                    <option value="milling-setup">Фрезерная наладка</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Номер операции</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      name="operation_number"
                      value={setup.operation_number}
                      onChange={(e) => handleSetupChange(index, e)}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Затраченное время (минуты)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg"
                      name="time_spent"
                      value={setup.time_spent}
                      onChange={(e) => handleSetupChange(index, e)}
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Оператор</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      name="operator"
                      value={setup.operator}
                      onChange={(e) => handleSetupChange(index, e)}
                      required
                    >
                      <option value="">Выберите оператора</option>
                      {shift.operators.map((operator, idx) => (
                        <option key={idx} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">Время начала (HH:MM)</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg"
                      name="start_time"
                      value={setup.start_time}
                      onChange={(e) => handleSetupChange(index, e)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/shifts')}
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

export default ShiftForm;
