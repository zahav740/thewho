/**
 * @file: index.ts
 * @description: Экспорт всех entities (исправлено)
 * @dependencies: все entity файлы
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
// Экспортируем старые сущности без MachineType чтобы избежать конфликта
export { Machine } from './machine.entity';
export * from './order.entity';
export * from './operation.entity';
export * from './shift-record.entity';

// Экспортируем новые сущности
export * from './machine-availability.entity';
export * from './operation-progress.entity';
export * from './pdf-file.entity';
