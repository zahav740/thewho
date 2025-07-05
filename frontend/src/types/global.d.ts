// Глобальные типы для window объекта
declare global {
  interface Window {
    refreshOrdersList?: () => Promise<void>;
    refreshOrdersListV2?: () => Promise<void>; // Добавлен для Orders V2
  }
}

export {};
