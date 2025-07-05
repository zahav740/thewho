/**
 * @file: global.d.ts
 * @description: Глобальные типы для Orders V2
 * @created: 2025-07-03
 */

declare global {
  interface Window {
    refreshOrdersList?: () => Promise<void>;
    refreshOrdersListV2?: () => Promise<void>;
  }
}

export {};
