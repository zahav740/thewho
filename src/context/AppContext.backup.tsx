import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Order, Shift, Setup, DEFAULT_OPERATORS } from '../types';

interface AppContextType {
  orders: Order[];
  shifts: Shift[];
  operators: string[];
  setups: Setup[];
  addOrder: (order: Order) => boolean;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => void;
  updateOrders: (newOrders: Order[]) => void;
  deleteOrder: (orderId: string) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shiftId: string, updatedShift: Partial<Shift>) => void;
  addOperator: (name: string) => void;
  removeOperator: (name: string) => void;
  addSetup: (setup: Setup) => void;
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
          // Filter and convert to strings
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

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    // Ensure we only save strings
    const stringOperators = operators.filter(op => typeof op === 'string');
    localStorage.setItem('operators', JSON.stringify(stringOperators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('setups', JSON.stringify(setups));
  }, [setups]);

  const addOrder = useCallback((order: Order) => {
    // Проверяем, нет ли уже заказа с таким номером чертежа
    const existingOrder = orders.find(existingOrder => 
      existingOrder.drawingNumber === order.drawingNumber
    );
    
    if (existingOrder) {
      console.warn(`⚠️ Заказ с номером чертежа "${order.drawingNumber}" уже существует. Дубликат не будет добавлен.`);
      return false; // Возвращаем false чтобы сигнализировать о неудаче
    }
    
    setOrders(prev => [...prev, order]);
    console.log(`✅ Заказ с номером чертежа "${order.drawingNumber}" успешно добавлен.`);
    return true; // Возвращаем true при успешном добавлении
  }, [orders]);

  const updateOrder = useCallback((orderId: string, updatedOrder: Partial<Order>) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, ...updatedOrder } : order
      )
    );
  }, []);

  const updateOrders = useCallback((newOrders: Order[]) => {
    setOrders(newOrders);
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  const addShift = (shift: Shift) => {
    setShifts(prev => [...prev, shift]);
  };

  const updateShift = (shiftId: string, updatedShift: Partial<Shift>) => {
    setShifts(prev => 
      prev.map(shift => 
        shift.id === shiftId ? { ...shift, ...updatedShift } : shift
      )
    );
  };

  const addOperator = (name: string) => {
    const operatorName = String(name).trim();
    if (operatorName && !operators.includes(operatorName)) {
      setOperators(prev => [...prev, operatorName]);
    }
  };

  const removeOperator = (name: string) => {
    setOperators(prev => prev.filter(op => op !== name));
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  const getOrderByDrawingNumber = useCallback((drawingNumber: string) => {
    return orders.find(order => order.drawingNumber === drawingNumber);
  }, [orders]);

  const getShiftsByMachine = (machine: string) => {
    return shifts.filter(shift => shift.machine === machine);
  };
  
  const addSetup = (setup: Setup) => {
    setSetups(prev => [...prev, setup]);
  };
  
  const getAllDrawingNumbers = useCallback(() => {
    return orders.map(order => order.drawingNumber);
  }, [orders]);
  
  const hasOrderWithDrawingNumber = useCallback((drawingNumber: string) => {
    return orders.some(order => order.drawingNumber === drawingNumber);
  }, [orders]);
  
  const getDuplicateDrawingNumbers = useCallback(() => {
    const duplicates: { [key: string]: Order[] } = {};
    const drawingNumberCounts: { [key: string]: Order[] } = {};
    
    // Группируем заказы по номерам чертежей
    orders.forEach(order => {
      const drawingNumber = order.drawingNumber;
      if (!drawingNumberCounts[drawingNumber]) {
        drawingNumberCounts[drawingNumber] = [];
      }
      drawingNumberCounts[drawingNumber].push(order);
    });
    
    // Находим дубликаты (более одного заказа с одним номером)
    Object.entries(drawingNumberCounts).forEach(([drawingNumber, orders]) => {
      if (orders.length > 1) {
        duplicates[drawingNumber] = orders;
      }
    });
    
    return duplicates;
  }, [orders]);

  const value = {
    orders,
    shifts,
    operators,
    setups,
    addOrder,
    updateOrder,
    updateOrders,
    deleteOrder,
    addShift,
    updateShift,
    addOperator,
    removeOperator,
    addSetup,
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
