// Import browser mode 
import './utils/browserMode.js'; 
/**
 * @file: index.tsx
 * @description: Точка входа React приложения
 * @dependencies: React, ReactDOM, App
 * @created: 2025-01-28
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './index.css';
import App from './App';

// Настройка dayjs для русской локали
dayjs.locale('ru');

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

// Создание клиента React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ruRU}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
