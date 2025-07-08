/**
 * @file: CreateExcelFilesTable1720007400000.ts
 * @description: Миграция для создания таблицы excel_files
 * @created: 2025-07-02
 */
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateExcelFilesTable1720007400000 implements MigrationInterface {
  name = 'CreateExcelFilesTable1720007400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'excel_files',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'originalName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'fileSize',
            type: 'bigint',
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'fileHash',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'fileData',
            type: 'bytea',
          },
          {
            name: 'headers',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'parsedData',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rowsCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'sheetsCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['uploading', 'parsed', 'error', 'processing'],
            default: "'uploading'",
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploadedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Создаем индексы для оптимизации запросов
    await queryRunner.query(
      `CREATE INDEX IDX_excel_files_originalName ON excel_files (originalName)`
    );

    await queryRunner.query(
      `CREATE INDEX IDX_excel_files_createdAt ON excel_files (createdAt)`
    );

    await queryRunner.query(
      `CREATE INDEX IDX_excel_files_status ON excel_files (status)`
    );

    await queryRunner.query(
      `CREATE INDEX IDX_excel_files_fileHash ON excel_files (fileHash)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('excel_files');
  }
}
