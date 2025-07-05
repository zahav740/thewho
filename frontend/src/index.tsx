// Import browser mode 
import './utils/browserMode.js'; 
/**
 * @file: index.tsx
 * @description: Точка входа React приложения с мобильной поддержкой
 * @dependencies: React, ReactDOM, App
 * @created: 2025-01-28
 * @updated: 2025-06-20 - Добавлена мобильная поддержка
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntdApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './index.css';
// Мобильные стили подключаются через CSS импорты в index.css
import App from './App';

// Настройка dayjs для русской локали
dayjs.locale('ru');

// Определение мобильного устройства для ранней инициализации
const isMobileDevice = window.innerWidth <= 768;
const isTabletDevice = window.innerWidth > 768 && window.innerWidth <= 1024;

console.log('📱 Device detected:', {
  isMobile: isMobileDevice,
  isTablet: isTabletDevice,
  width: window.innerWidth
});

// Глобальный обработчик SVG ошибок
(() => {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    // Подавляем SVG path ошибки от recharts/jQuery
    if (message.includes('attribute d: Expected number') || 
        (message.includes('path') && message.includes('Expected number'))) {
      return; // Не выводим эту ошибку
    }
    originalConsoleError.apply(console, args);
  };
})();

// Подавление ошибок JavaScript от некорректных SVG чисел
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('Expected number') && message.includes('path')) {
    event.preventDefault();
    return false;
  }
});

// Мобильные оптимизации
if (isMobileDevice) {
  // Предотвращение зума при двойном тапе
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Отключение контекстного меню на мобильных
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  }, { passive: false });

  // Улучшение производительности скроллинга
  document.addEventListener('touchstart', function() {}, { passive: true });
  document.addEventListener('touchmove', function() {}, { passive: true });
}

// Создание клиента React Query с исправленными настройками для новой версии
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: !isMobileDevice, // Отключаем на мобильных для экономии батареи
      retry: isMobileDevice ? 1 : 3, // Меньше попыток на мобильных
      staleTime: isMobileDevice ? 10 * 60 * 1000 : 5 * 60 * 1000, // Больше stale time на мобильных
      gcTime: isMobileDevice ? 15 * 60 * 1000 : 10 * 60 * 1000, // Заменили cacheTime на gcTime
    },
  },
});

// PWA регистрация для мобильных устройств
if (isMobileDevice && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider 
        locale={ruRU}
        theme={{
          token: {
            // Уменьшаем все размеры для компактности
            fontSize: 12, // Меньше шрифт
            borderRadius: 4,
            paddingLG: 12,
            marginLG: 12,
            controlHeight: 28, // Меньше высота элементов
          },
          components: {
            Button: {
              controlHeight: isMobileDevice ? 40 : 24, // Маленькие кнопки
              paddingInline: isMobileDevice ? 16 : 8,
              fontSize: isMobileDevice ? 14 : 12,
            },
            Input: {
              controlHeight: isMobileDevice ? 40 : 24, // Маленькие поля
              paddingInline: isMobileDevice ? 12 : 6,
              fontSize: isMobileDevice ? 14 : 12,
            },
            Card: {
              paddingLG: isMobileDevice ? 12 : 12, // Меньше паддинги
            },
            Table: {
              cellPaddingBlock: 6, // Меньше паддинг в таблице
              fontSize: 12,
            },
          },
        }}
      >
        <AntdApp>
          <App />
        </AntdApp>
        {!isMobileDevice && <ReactQueryDevtools initialIsOpen={false} />}
      </ConfigProvider>
    </QueryClientProvider>
  // </React.StrictMode>
);

// Удаление загрузочного экрана после инициализации React
setTimeout(() => {
  document.body.classList.add('app-loaded');
}, 100);
