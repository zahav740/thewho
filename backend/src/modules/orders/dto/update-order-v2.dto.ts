/**
 * @file: update-order-v2.dto.ts
 * @description: DTO для обновления заказа V2 - ИСПРАВЛЕН для совместимости типов
 * @dependencies: class-validator
 * @created: 2025-07-05
 * @fixed: 2025-07-05 - убраны ручные переопределения полей
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderV2Dto } from './create-order-v2.dto';

// UpdateOrderV2Dto автоматически наследует все поля из CreateOrderV2Dto
// и делает их опциональными. Ничего больше писать не нужно.
export class UpdateOrderV2Dto extends PartialType(CreateOrderV2Dto) {}
