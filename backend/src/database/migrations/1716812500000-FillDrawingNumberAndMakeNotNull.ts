/**
 * @file: 1716812500000-FillDrawingNumberAndMakeNotNull.ts
 * @description: Миграция для заполнения пустых значений drawingNumber и изменения колонки на NOT NULL
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FillDrawingNumberAndMakeNotNull1716812500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Сначала обновляем все NULL значения временными значениями
    await queryRunner.query(`
      UPDATE orders 
      SET "drawing_number" = 'TEMP-' || id::text 
      WHERE "drawing_number" IS NULL
    `);

    // 2. Теперь можно изменить колонку на NOT NULL
    await queryRunner.query(`
      ALTER TABLE orders 
      ALTER COLUMN "drawing_number" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откатываем изменения, делая колонку снова nullable
    await queryRunner.query(`
      ALTER TABLE orders 
      ALTER COLUMN "drawing_number" DROP NOT NULL
    `);
  }
}
