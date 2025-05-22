import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Order, Shift, Setup, DEFAULT_OPERATORS } from '../types';
import { indexedDBStorage } from '../utils/indexedDBStorage';

interface AppContextType {
  orders: Order[];
  shifts: Shift[];
  operators: string[];
  setups: Setup[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => void;
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
  getDatabaseInfo: () => Promise<{ size: number; available: number }>;
  migrationStatus: 'pending' | 'migrating' | 'completed' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [operators, setOperators] = useState<string[]>(DEFAULT_OPERATORS);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'migrating' | 'completed' | 'error'>('pending');
  const [dbInitialized, setDbInitialized] = useState(false);

  // Инициализация IndexedDB и миграция данных
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setMigrationStatus('migrating');
        
        // Инициализируем IndexedDB
        await indexedDBStorage.init();
        setDbInitialized(true);

        // Проверяем наличие данных в localStorage для миграции
        const localStorageOrders = localStorage.getItem('orders');
        const localStorageShifts = localStorage.getItem('shifts');
        const localStorageOperators = localStorage.getItem('operators');
        const localStorageSetups = localStorage.getItem('setups');

        // Загружаем данные из IndexedDB
        const [dbOrders, dbShifts, dbOperators, dbSetups] = await Promise.all([
          indexedDBStorage.get('orders'),
          indexedDBStorage.get('shifts'),
          indexedDBStorage.get('operators'),
          indexedDBStorage.get('setups')
        ]);

        // Если в IndexedDB есть данные, используем их
        if (dbOrders.length > 0 || dbShifts.length > 0 || dbOperators.length > 0 || dbSetups.length > 0) {
          setOrders(dbOrders);
          setShifts(dbShifts);
          setOperators(dbOperators.map(op => op.name) || DEFAULT_OPERATORS);
          setSetups(dbSetups);
        } 
        // Иначе мигрируем из localStorage
        else if (localStorageOrders || localStorageShifts || localStorageOperators || localStorageSetups) {
          const ordersToMigrate = localStorageOrders ? JSON.parse(localStorageOrders) : [];
          const shiftsToMigrate = localStorageShifts ? JSON.parse(localStorageShifts) : [];
          const operatorsToMigrate = localStorageOperators ? JSON.parse(localStorageOperators) : DEFAULT_OPERATORS;
          const setupsToMigrate = localStorageSetups ? JSON.parse(localStorageSetups) : [];

          // Сохраняем в IndexedDB
          if (ordersToMigrate.length > 0) {
            await indexedDBStorage.set('orders', ordersToMigrate);
            setOrders(ordersToMigrate);
          }
          if (shiftsToMigrate.length > 0) {
            await indexedDBStorage.set('shifts', shiftsToMigrate);
            setShifts(shiftsToMigrate);
          }
          if (operatorsToMigrate.length > 0) {
            const operatorObjects = operatorsToMigrate.map((name: string) => ({ name }));
            await indexedDBStorage.set('operators', operatorObjects);
            setOperators(operatorsToMigrate);
          }
          if (setupsToMigrate.length > 0) {
            await indexedDBStorage.set('setups', setupsToMigrate);
            setSetups(setupsToMigrate);
          }

          // Очищаем localStorage после миграции
          localStorage.removeItem('orders');
          localStorage.removeItem('shifts');
          localStorage.removeItem('operators');
          localStorage.removeItem('setups');
          
          console.log('✅ Данные успешно мигрированы из localStorage в IndexedDB');
        }

        setMigrationStatus('completed');
      } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error);
        setMigrationStatus('error');
        
        // Fallback к localStorage
        const savedOrders = localStorage.getItem('orders');
        const savedShifts = localStorage.getItem('shifts');
        const savedOperators = localStorage.getItem('operators');
        const savedSetups = localStorage.getItem('setups');
        
        setOrders(savedOrders ? JSON.parse(savedOrders) : []);
        setShifts(savedShifts ? JSON.parse(savedShifts) : []);
        setOperators(savedOperators ? JSON.parse(savedOperators) : DEFAULT_OPERATORS);
        setSetups(savedSetups ? JSON.parse(savedSetups) : []);
      }
    };

    initDatabase();
  }, []);

  // Сохранение в IndexedDB
  const saveToIndexedDB = useCallback(async (storeName: string, data: any) => {
    if (!dbInitialized || migrationStatus !== 'completed') return;
    
    try {
      await indexedDBStorage.set(storeName, data);
    } catch (error) {
      console.error(`❌ Ошибка сохранения в ${storeName}:`, error);
      // Fallback к localStorage
      localStorage.setItem(storeName, JSON.stringify(data));
    }
  }, [dbInitialized, migrationStatus]);

  // Автосохранение заказов
  useEffect(() => {
    if (migrationStatus === 'completed') {
      saveToIndexedDB('orders', orders);
    }
  }, [orders, saveToIndexedDB, migrationStatus]);

  // Автосохранение смен  
  useEffect(() => {
    if (migrationStatus === 'completed') {
      saveToIndexedDB('shifts', shifts);
    }
  }, [shifts, saveToIndexedDB, migrationStatus]);

  // Автосохранение операторов
  useEffect(() => {
    if (migrationStatus === 'completed') {
      const operatorObjects = operators.map(name => ({ name }));
      saveToIndexedDB('operators', operatorObjects);
    }
  }, [operators, saveToIndexedDB, migrationStatus]);

  // Автосохранение наладок
  useEffect(() => {
    if (migrationStatus === 'completed') {
      saveToIndexedDB('setups', setups);
    }
  }, [setups, saveToIndexedDB, migrationStatus]);

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrder = (orderId: string, updatedOrder: Partial<Order>) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, ...updatedOrder } : order
      )
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

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

  const getDatabaseInfo = useCallback(async () => {
    if (!dbInitialized) {
      return { size: 0, available: 0 };
    }
    
    try {
      const [size, available] = await Promise.all([
        indexedDBStorage.getDatabaseSize(),
        indexedDBStorage.getAvailableSpace()
      ]);
      return { size, available };
    } catch (error) {
      console.error('❌ Ошибка получения информации о базе данных:', error);
      return { size: 0, available: 0 };
    }
  }, [dbInitialized]);

  const value = {
    orders,
    shifts,
    operators,
    setups,
    addOrder,
    updateOrder,
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
    getDatabaseInfo,
    migrationStatus,
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