import { useState } from 'react';
import { Check, CircleAlert, Clock, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ResultsPage() {
  const { orders, shifts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<string | null>(null);

  const filteredOrders = searchQuery
    ? orders.filter(order => order.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getOrderProgress = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const totalUnits = order.quantity;
    const orderOperations = order.operations;
    
    return orderOperations.map(operation => {
      // Find all shift operations for this operation
      const relatedShiftOperations = shifts
        .flatMap(shift => shift.operations)
        .filter(shiftOp => shiftOp.operationId === operation.id);
      
      // Calculate total completed units
      const completedUnits = relatedShiftOperations.reduce(
        (sum, shiftOp) => sum + shiftOp.completedUnits, 0
      );
      
      // Calculate total time spent
      const timeSpent = relatedShiftOperations.reduce(
      (sum, shiftOp) => sum + Number(shiftOp.timeSpent || 0), 0
      );
      
      let status = "pending";
      if (completedUnits >= totalUnits) {
        status = "completed";
      } else if (completedUnits > 0) {
        status = "in-progress";
      }
      
      return {
        ...operation,
        completedUnits,
        remainingUnits: totalUnits - completedUnits,
        timeSpent,
        status,
      };
    });
  };

  const handleViewOrder = (orderId: string) => {
    setActiveOrder(orderId === activeOrder ? null : orderId);
  };

  const getPriorityText = (priority: number) => {
    switch(priority) {
      case 1: return "Высокий";
      case 2: return "Средний";
      case 3: return "Низкий";
      default: return "Не указан";
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>Результаты выполнения</h1>
      
      <div className="mb-6">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск по номеру чертежа"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {searchQuery && filteredOrders.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Заказы не найдены</p>
        </div>
      )}
      
      {searchQuery && filteredOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => handleViewOrder(order.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{order.drawingNumber}</h3>
                      <p className="text-sm text-gray-500">
                        Дедлайн: {new Date(order.deadline).toLocaleDateString()} | Количество: {order.quantity} | 
                        Приоритет: <span className={
                          order.priority === 1 ? "text-red-600 font-medium" : 
                          order.priority === 2 ? "text-yellow-600 font-medium" : 
                          "text-green-600 font-medium"
                        }>
                          {getPriorityText(order.priority)}
                        </span>
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {activeOrder === order.id ? '▲' : '▼'}
                    </div>
                  </div>
                </button>
                
                {activeOrder === order.id && (
                  <div className="px-6 py-4 bg-gray-50">
                    <h4 className="text-md font-medium mb-3">Статус операций</h4>
                    <div className="space-y-4">
                      {getOrderProgress(order.id)?.map((operation, index) => (
                        <div key={index} className="bg-white p-4 rounded-md border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {operation.status === 'completed' && (
                                <Check className="h-5 w-5 text-green-500 mr-2" />
                              )}
                              {operation.status === 'in-progress' && (
                                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                              )}
                              {operation.status === 'pending' && (
                                <CircleAlert className="h-5 w-5 text-gray-400 mr-2" />
                              )}
                              <span className="font-medium">
                                Операция #{operation.sequenceNumber}
                                {operation.machine && ` - ${operation.machine}`}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {operation.status === 'completed' && (
                                <span className="text-green-600">Завершено</span>
                              )}
                              {operation.status === 'in-progress' && (
                                <span className="text-yellow-600">В процессе</span>
                              )}
                              {operation.status === 'pending' && (
                                <span className="text-gray-500">Не начато</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Выполнено единиц:</span>
                              <span className="text-gray-900 font-medium">{operation.completedUnits}/{order.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Осталось единиц:</span>
                              <span className="text-gray-900 font-medium">{operation.remainingUnits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Затраченное время:</span>
                              <span className="text-gray-900 font-medium">{Number(operation.timeSpent || 0)} мин.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Расчетное время:</span>
                              <span className="text-gray-900 font-medium">{Number(operation.estimatedTime || 0)} мин.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Прогресс:</span>
                              <span className="text-gray-900 font-medium">
                                {Math.min(100, Math.round((operation.completedUnits / order.quantity) * 100))}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, Math.round((operation.completedUnits / order.quantity) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
