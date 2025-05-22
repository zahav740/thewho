import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface AutoJsonBackupOptions {
  enabled?: boolean;
  intervalMinutes?: number;
  includeAllData?: boolean;
  storageKey?: string;
}

const defaultOptions: AutoJsonBackupOptions = {
  enabled: true,
  intervalMinutes: 5,
  includeAllData: false,
  storageKey: 'thewho_auto_backup'
};

export const useAutoJsonBackup = (options: AutoJsonBackupOptions = {}) => {
  const { orders, shifts, setups, operators } = useApp();
  const opts = { ...defaultOptions, ...options };
  const lastBackupRef = useRef<string>('');
  const lastLogTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const createBackup = () => {
    if (!opts.enabled) return;
    
    try {
      const backupData = opts.includeAllData 
        ? { orders, shifts, setups, operators }
        : { orders };

      // Проверяем размер данных перед сохранением
      const jsonString = JSON.stringify({
        ...backupData,
        backupDate: new Date().toISOString(),
        version: '1.0',
        type: opts.includeAllData ? 'full_auto_backup' : 'orders_auto_backup'
      }, null, 2);

      // Проверяем размер (ограничиваем 5MB)
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      if (sizeInMB > 5) {
        console.warn(`⚠️ Автобэкап слишком большой (${sizeInMB.toFixed(2)}MB). Пропускаем.`);
        return;
      }

      // Проверяем, изменились ли данные с последнего бэкапа
      if (jsonString !== lastBackupRef.current) {
        try {
          // Проверяем доступное место в localStorage
          const testKey = 'localStorage_test';
          const testValue = 'test';
          
          try {
            localStorage.setItem(testKey, testValue);
            localStorage.removeItem(testKey);
          } catch (storageError) {
            // localStorage заполнен - очищаем старые бэкапы
            console.warn('⚠️ localStorage заполнен. Очищаем старые данные...');
            clearOldBackups();
          }
          
          // Сохраняем в localStorage как резервную копию
          localStorage.setItem(opts.storageKey!, jsonString);
          lastBackupRef.current = jsonString;
          
          // Логируем не чаще чем раз в 30 секунд
          const now = Date.now();
          if (now - lastLogTimeRef.current > 30000) {
            console.log('✅ Автобэкап JSON создан:', new Date().toLocaleString(), `(${sizeInMB.toFixed(2)}MB)`);
            lastLogTimeRef.current = now;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.warn('⚠️ Квота localStorage превышена. Очищаем и пробуем снова...');
            clearOldBackups();
            
            // Пробуем еще раз после очистки
            try {
              localStorage.setItem(opts.storageKey!, jsonString);
              lastBackupRef.current = jsonString;
              console.log('✅ Автобэкап создан после очистки');
            } catch (secondError) {
              console.error('❌ Не удалось создать автобэкап даже после очистки:', secondError);
            }
          } else {
            console.error('❌ Ошибка создания автобэкапа:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Ошибка в процессе создания автобэкапа:', error);
    }
  };
  
  // Метод для очистки старых данных из localStorage
  const clearOldBackups = () => {
    try {
      const keysToCheck = [
        'thewho_auto_backup',
        'orders',
        'shifts', 
        'setups',
        'operators',
        'planningResults',
        'planningAlerts'
      ];
      
      // Удаляем все ключи кроме текущего автобэкапа
      Object.keys(localStorage).forEach(key => {
        if (key !== opts.storageKey && (
            key.startsWith('thewho_') ||
            key.startsWith('backup_') ||
            keysToCheck.includes(key)
        )) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('🧹 Очищены старые данные из localStorage');
    } catch (error) {
      console.error('❌ Ошибка очистки localStorage:', error);
    }
  };

  // Настраиваем интервал при инициализации
  useEffect(() => {
    if (!opts.enabled) return;

    createBackup(); // Первый бэкап
    intervalRef.current = setInterval(createBackup, opts.intervalMinutes! * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [opts.enabled, opts.intervalMinutes]);

  // Создаем бэкап при изменении данных (с дебаунсом)
  useEffect(() => {
    const timeout = setTimeout(createBackup, 2000); // 2 секунды задержки
    return () => clearTimeout(timeout);
  }, [orders, shifts, setups, operators]);

  // Функция для получения последнего автобэкапа
  const getLastBackup = (): string | null => {
    try {
      return localStorage.getItem(opts.storageKey!) || null;
    } catch (error) {
      console.error('❌ Ошибка получения автобэкапа:', error);
      return null;
    }
  };

  // Функция для восстановления из автобэкапа
  const restoreFromBackup = (): any | null => {
    try {
      const backup = getLastBackup();
      return backup ? JSON.parse(backup) : null;
    } catch (error) {
      console.error('❌ Ошибка восстановления из автобэкапа:', error);
      return null;
    }
  };

  // Функция для скачивания автобэкапа
  const downloadBackup = () => {
    try {
      const backup = getLastBackup();
      if (!backup) {
        alert('Нет доступных автобэкапов');
        return;
      }

      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:]/g, '-');
      link.download = `thewho-auto-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Ошибка скачивания автобэкапа:', error);
      alert('Ошибка скачивания автобэкапа');
    }
  };

  return {
    getLastBackup,
    restoreFromBackup,
    downloadBackup,
    clearOldBackups,
    hasBackup: !!getLastBackup()
  };
};