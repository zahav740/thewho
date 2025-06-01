/**
 * @file: 1716812000000-CreateDrawingNumberColumnIfNotExists.ts
 * @description: Миграция для создания колонки drawing_number, если она не существует
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDrawingNumberColumnIfNotExists1716812000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли уже колонка drawing_number
    const hasColumn = await queryRunner.hasColumn('orders', 'drawing_number');
    
    if (!hasColumn) {
      // Если колонка не существует, создаем её с возможностью NULL значений
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN "drawing_number" character varying UNIQUE NULL
      `);
      
      console.log('Column "drawing_number" was created successfully');
    } else {
      console.log('Column "drawing_number" already exists, skipping creation');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Не удаляем колонку при откате, чтобы избежать потери данных
    // но логируем для понимания процесса
    console.log('Down migration for CreateDrawingNumberColumnIfNotExists does nothing to prevent data loss');
  }
}
