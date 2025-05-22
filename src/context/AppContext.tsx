import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Order, Shift, Setup, DEFAULT_OPERATORS } from '../types';

// Временно упрощенный интерфейс без проблемных зависимостей
interface AppContextType {
  orders: Order[];
  shifts: Shift[];
  operators: string[];
  setups: Setup[];
  // Базовые операции с данными
  addOrder: (order: Order) => boolean;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => void;
  updateOrders: (newOrders: Order[]) => void;
  deleteOrder: (orderId: string) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shiftId: string, updatedShift: Partial<Shift>) => void;
  addOperator: (name: string) => void;
  removeOperator: (name: string) => void;
  addSetup: (setup: Setup) => void;
  // Вспомогательные функции
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByDrawingNumber: (drawingNumber: string) => Order | undefined;
  getShiftsByMachine: (machine: string) => Shift[];
  getAllDrawingNumbers: () => string[];
  hasOrderWithDrawingNumber: (drawingNumber: string) => boolean;
  getDuplicateDrawingNumbers: () => { [key: string]: Order[] };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const savedShifts = localStorage.getItem('shifts');
    return savedShifts ? JSON.parse(savedShifts) : [];
  });

  const [operators, setOperators] = useState<string[]>(() => {
    const savedOperators = localStorage.getItem('operators');
    if (savedOperators) {
      try {
        const parsed = JSON.parse(savedOperators);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(op => op && (typeof op === 'string' || op.name))
            .map(op => typeof op === 'string' ? op : op.name || 'Unknown');
        }
      } catch (e) {
        console.warn('Failed to parse operators from localStorage:', e);
      }
    }
    return DEFAULT_OPERATORS;
  });
  
  const [setups, setSetups] = useState<Setup[]>(() => {
    const savedSetups = localStorage.getItem('setups');
    return savedSetups ? JSON.parse(savedSetups) : [];
  });

  // Сохранение в localStorage при изменении данных
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    const stringOperators = operators.filter(op => typeof op === 'string');
    localStorage.setItem('operators', JSON.stringify(stringOperators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('setups', JSON.stringify(setups));
  }, [setups]);

  // Функции для работы с заказами
  const addOrder = useCallback((order: Order) => {
    const existingOrder = orders.find(existingOrder => 
      existingOrder.drawingNumber === order.drawingNumber
    );
    
    if (existingOrder) {
      console.warn(`Order with drawing number "${order.drawingNumber}" already exists.`);
      return false;
    }
    
    setOrders(prev => {
      const newOrders = [...prev, order];
      console.log(`Order "${order.drawingNumber}" added`);
      return newOrders;
    });
    
    return true;
  }, [orders]);

  const updateOrder = useCallback((orderId: string, updatedOrder: Partial<Order>) => {
    setOrders(prev => {
      const newOrders = prev.map(order => 
        order.id === orderId ? { ...order, ...updatedOrder } : order
      );
      console.log(`Order ${orderId} updated`);
      return newOrders;
    });
  }, []);

  const updateOrders = useCallback((newOrders: Order[]) => {
    setOrders(newOrders);
    console.log(`Updated ${newOrders.length} orders`);
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => {
      const newOrders = prev.filter(order => order.id !== orderId);
      console.log(`Order ${orderId} deleted`);
      return newOrders;
    });
  }, []);

  // Функции для работы со сменами
  const addShift = useCallback((shift: Shift) => {
    setShifts(prev => [...prev, shift]);
    console.log('Shift added');
  }, []);

  const updateShift = useCallback((shiftId: string, updatedShift: Partial<Shift>) => {
    setShifts(prev => 
      prev.map(shift => 
        shift.id === shiftId ? { ...shift, ...updatedShift } : shift
      )
    );
    console.log(`Shift ${shiftId} updated`);
  }, []);

  // Функции для работы с операторами
  const addOperator = useCallback((name: string) => {
    const operatorName = String(name).trim();
    if (operatorName && !operators.includes(operatorName)) {
      setOperators(prev => [...prev, operatorName]);
      console.log(`Operator "${operatorName}" added`);
    }
  }, [operators]);

  const removeOperator = useCallback((name: string) => {
    setOperators(prev => prev.filter(op => op !== name));
    console.log(`Operator "${name}" removed`);
  }, []);

  // Функции для работы с наладками
  const addSetup = useCallback((setup: Setup) => {
    setSetups(prev => [...prev, setup]);
    console.log('Setup added');
  }, []);

  // Вспомогательные функции
  const getOrderById = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  const getOrderByDrawingNumber = useCallback((drawingNumber: string) => {
    return orders.find(order => order.drawingNumber === drawingNumber);
  }, [orders]);

  const getShiftsByMachine = useCallback((machine: string) => {
    return shifts.filter(shift => shift.machine === machine);
  }, [shifts]);
  
  const getAllDrawingNumbers = useCallback(() => {
    return orders.map(order => order.drawingNumber);
  }, [orders]);
  
  const hasOrderWithDrawingNumber = useCallback((drawingNumber: string) => {
    return orders.some(order => order.drawingNumber === drawingNumber);
  }, [orders]);
  
  const getDuplicateDrawingNumbers = useCallback(() => {
    const duplicates: { [key: string]: Order[] } = {};
    const drawingNumberCounts: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const drawingNumber = order.drawingNumber;
      if (!drawingNumberCounts[drawingNumber]) {
        drawingNumberCounts[drawingNumber] = [];
      }
      drawingNumberCounts[drawingNumber].push(order);
    });
    
    Object.entries(drawingNumberCounts).forEach(([drawingNumber, orders]) => {
      if (orders.length > 1) {
        duplicates[drawingNumber] = orders;
      }
    });
    
    return duplicates;
  }, [orders]);

  const value = {
    // Данные
    orders,
    shifts,
    operators,
    setups,
    // Базовые операции
    addOrder,
    updateOrder,
    updateOrders,
    deleteOrder,
    addShift,
    updateShift,
    addOperator,
    removeOperator,
    addSetup,
    // Вспомогательные функции
    getOrderById,
    getOrderByDrawingNumber,
    getShiftsByMachine,
    getAllDrawingNumbers,
    hasOrderWithDrawingNumber,
    getDuplicateDrawingNumbers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
