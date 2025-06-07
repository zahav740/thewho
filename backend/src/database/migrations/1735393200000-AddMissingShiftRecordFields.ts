import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingShiftRecordFields1735393200000 implements MigrationInterface {
  name = 'AddMissingShiftRecordFields1735393200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем недостающие поля в таблицу shift_records
    
    // Проверяем и добавляем setupStartDate
    const hasSetupStartDate = await queryRunner.hasColumn('shift_records', 'setupStartDate');
    if (!hasSetupStartDate) {
      await queryRunner.addColumn(
        'shift_records',
        new TableColumn({
          name: 'setupStartDate',
          type: 'date',
          isNullable: true,
        }),
      );
    }

    // Проверяем и добавляем setupOperator
    const hasSetupOperator = await queryRunner.hasColumn('shift_records', 'setupOperator');
    if (!hasSetupOperator) {
      await queryRunner.addColumn(
        'shift_records',
        new TableColumn({
          name: 'setupOperator',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    // Проверяем и добавляем setupType
    const hasSetupType = await queryRunner.hasColumn('shift_records', 'setupType');
    if (!hasSetupType) {
      await queryRunner.addColumn(
        'shift_records',
        new TableColumn({
          name: 'setupType',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }

    // Проверяем и добавляем operationId
    const hasOperationId = await queryRunner.hasColumn('shift_records', 'operationId');
    if (!hasOperationId) {
      await queryRunner.addColumn(
        'shift_records',
        new TableColumn({
          name: 'operationId',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Проверяем и добавляем machineId
    const hasMachineId = await queryRunner.hasColumn('shift_records', 'machineId');
    if (!hasMachineId) {
      await queryRunner.addColumn(
        'shift_records',
        new TableColumn({
          name: 'machineId',
          type: 'int',
          isNullable: false,
        }),
      );
    }

    console.log('✅ Миграция AddMissingShiftRecordFields завершена');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем добавленные поля
    const columns = ['setupStartDate', 'setupOperator', 'setupType', 'operationId', 'machineId'];
    
    for (const columnName of columns) {
      const hasColumn = await queryRunner.hasColumn('shift_records', columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('shift_records', columnName);
      }
    }

    console.log('✅ Откат миграции AddMissingShiftRecordFields завершен');
  }
}
