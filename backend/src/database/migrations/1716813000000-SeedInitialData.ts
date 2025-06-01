/**
 * @file: 1716813000000-SeedInitialData.ts
 * @description: Миграция для добавления начальных данных
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1716813000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Добавление начальных данных...');
    
    // Проверяем, есть ли уже данные в таблице machines
    const machinesCount = await queryRunner.query('SELECT COUNT(*) FROM machines');
    const count = parseInt(machinesCount[0].count);
    
    if (count === 0) {
      console.log('Добавление тестовых станков...');
      
      // Добавляем тестовые станки
      await queryRunner.query(`
        INSERT INTO "machines" ("code", "type", "axes", "isActive", "isOccupied") VALUES
        ('M001', 'MILLING', 3, true, false),
        ('M002', 'MILLING', 4, true, false),
        ('T001', 'TURNING', 3, true, false),
        ('T002', 'TURNING', 4, true, false),
        ('M003', 'MILLING', 3, false, false)
      `);
      
      console.log('Тестовые станки добавлены успешно');
    } else {
      console.log('Станки уже существуют, пропускаем добавление');
    }
    
    // Проверяем, есть ли уже данные в таблице orders
    const ordersCount = await queryRunner.query('SELECT COUNT(*) FROM orders');
    const ordersCountValue = parseInt(ordersCount[0].count);
    
    if (ordersCountValue === 0) {
      console.log('Добавление тестовых заказов...');
      
      // Добавляем тестовые заказы
      await queryRunner.query(`
        INSERT INTO "orders" ("drawing_number", "quantity", "deadline", "priority", "workType") VALUES
        ('DWG-001', 10, '2025-06-15', '1', 'Фрезерная обработка'),
        ('DWG-002', 5, '2025-06-20', '2', 'Токарная обработка'),
        ('DWG-003', 15, '2025-07-01', '3', 'Комплексная обработка')
      `);
      
      console.log('Тестовые заказы добавлены успешно');
    } else {
      console.log('Заказы уже существуют, пропускаем добавление');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем тестовые данные
    await queryRunner.query(`DELETE FROM "orders" WHERE "drawing_number" IN ('DWG-001', 'DWG-002', 'DWG-003')`);
    await queryRunner.query(`DELETE FROM "machines" WHERE "code" IN ('M001', 'M002', 'T001', 'T002', 'M003')`);
  }
}
