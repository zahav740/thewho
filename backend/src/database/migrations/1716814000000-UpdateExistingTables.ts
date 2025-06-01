/**
 * @file: 1716814000000-UpdateExistingTables.ts
 * @description: Миграция для обновления существующих таблиц
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExistingTables1716814000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Обновление существующих таблиц...');
    
    // Проверяем и обновляем таблицу operations
    const operationsExists = await this.tableExists(queryRunner, 'operations');
    if (operationsExists) {
      console.log('Таблица operations существует, проверяем колонки...');
      
      // Проверяем наличие колонки orderId
      const orderIdExists = await this.columnExists(queryRunner, 'operations', 'orderId');
      if (!orderIdExists) {
        console.log('Добавляем колонку orderId в таблицу operations...');
        await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "orderId" integer`);
        await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_order" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE`);
      }
      
      // Проверяем наличие колонки machineId
      const machineIdExists = await this.columnExists(queryRunner, 'operations', 'machineId');
      if (!machineIdExists) {
        console.log('Добавляем колонку machineId в таблицу operations...');
        await queryRunner.query(`ALTER TABLE "operations" ADD COLUMN "machineId" integer`);
        await queryRunner.query(`ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_machine" FOREIGN KEY ("machineId") REFERENCES "machines" ("id")`);
      }
    }
    
    // Проверяем и обновляем таблицу shifts (если существует shift_records под другим именем)
    const shiftsExists = await this.tableExists(queryRunner, 'shifts');
    const shiftRecordsExists = await this.tableExists(queryRunner, 'shift_records');
    
    if (shiftsExists && !shiftRecordsExists) {
      console.log('Переименовываем таблицу shifts в shift_records...');
      await queryRunner.query(`ALTER TABLE "shifts" RENAME TO "shift_records"`);
    }
    
    // Добавляем недостающие индексы для производительности
    console.log('Добавляем индексы для оптимизации...');
    
    try {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_machines_type" ON "machines" ("type")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_machines_active" ON "machines" ("isActive")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_priority" ON "orders" ("priority")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_deadline" ON "orders" ("deadline")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operations_status" ON "operations" ("status")`);
    } catch (error) {
      console.log('Некоторые индексы уже существуют, пропускаем...');
    }
    
    console.log('Обновление таблиц завершено успешно');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат изменений
    console.log('Откат обновлений таблиц...');
    
    // Удаляем добавленные колонки
    const orderIdExists = await this.columnExists(queryRunner, 'operations', 'orderId');
    if (orderIdExists) {
      await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_order"`);
      await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "orderId"`);
    }
    
    const machineIdExists = await this.columnExists(queryRunner, 'operations', 'machineId');
    if (machineIdExists) {
      await queryRunner.query(`ALTER TABLE "operations" DROP CONSTRAINT IF EXISTS "FK_operations_machine"`);
      await queryRunner.query(`ALTER TABLE "operations" DROP COLUMN IF EXISTS "machineId"`);
    }
    
    // Удаляем индексы
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_machines_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_machines_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_deadline"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operations_status"`);
  }
  
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      )
    `);
    return result[0].exists;
  }
  
  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        AND column_name = '${columnName}'
      )
    `);
    return result[0].exists;
  }
}
