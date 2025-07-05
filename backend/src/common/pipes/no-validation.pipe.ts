/**
 * @file: no-validation.pipe.ts
 * @description: Пустой пайп для отключения валидации на конкретных эндпоинтах
 * @created: 2025-07-05
 */
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NoValidationPipe implements PipeTransform {
  /**
   * Простой "пустой" пайп, который не выполняет валидацию
   * Используется для обхода глобального ValidationPipe в случаях,
   * когда валидация не нужна (например, DELETE запросы без тела)
   */
  transform(value: any) {
    return value; // Просто возвращаем значение как есть
  }
}
