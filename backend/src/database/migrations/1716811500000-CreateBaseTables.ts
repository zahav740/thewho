/**
 * @file: 1716811500000-CreateBaseTables.ts
 * @description: Миграция для создания базовых таблиц, если они не существуют
 * @dependencies: typeorm
 * @created: 2025-05-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { MachineType } from '../entities/machine.entity';
import { OperationStatus, OperationType } from '../entities/operation.entity';
import { Priority } from '../entities/order.entity';
import { ShiftType } from '../entities/shift-record.entity';

export class CreateBaseTables1716811500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверяем, существует ли таблица machines
    const machinesExists = await this.tableExists(queryRunner, 'machines');
    if (!machinesExists) {
      console.log('Creating machines table...');
      
      // Создаем enum для типа машины, если он не существует
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'machines_type_enum') THEN
            CREATE TYPE "machines_type_enum" AS ENUM('MILLING', 'TURNING');
          END IF;
        END
        $$;
      `);
      
      // Создаем таблицу machines
      await queryRunner.query(`
        CREATE TABLE "machines" (
          "id" SERIAL NOT NULL, 
          "code" character varying NOT NULL,
          "type" "machines_type_enum" NOT NULL,
          "axes" integer NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "isOccupied" boolean NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "UQ_dafffa18dcdfbab2fb17ea2bd86" UNIQUE ("code"),
          CONSTRAINT "PK_7b0817c674bb984650c5274e713" PRIMARY KEY ("id")
        )
      `);
      
      console.log('machines table created successfully');
    } else {
      console.log('machines table already exists, skipping creation');
    }
    
    // Проверяем, существует ли таблица orders
    const ordersExists = await this.tableExists(queryRunner, 'orders');
    if (!ordersExists) {
      console.log('Creating orders table...');
      
      // Создаем enum для приоритета, если он не существует
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orders_priority_enum') THEN
            CREATE TYPE "orders_priority_enum" AS ENUM('1', '2', '3', '4');
          END IF;
        END
        $$;
      `);
      
      // Создаем таблицу orders
      await queryRunner.query(`
        CREATE TABLE "orders" (
          "id" SERIAL NOT NULL,
          "drawing_number" character varying UNIQUE,
          "quantity" integer NOT NULL,
          "deadline" date NOT NULL,
          "priority" "orders_priority_enum" NOT NULL,
          "workType" character varying,
          "pdfPath" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_orders" PRIMARY KEY ("id")
        )
      `);
      
      console.log('orders table created successfully');
    } else {
      console.log('orders table already exists, skipping creation');
    }
    
    // Проверяем, существует ли таблица operations
    const operationsExists = await this.tableExists(queryRunner, 'operations');
    if (!operationsExists) {
      console.log('Creating operations table...');
      
      // Создаем enum для типа операции, если он не существует
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operations_operationtype_enum') THEN
            CREATE TYPE "operations_operationtype_enum" AS ENUM('MILLING', 'TURNING');
          END IF;
        END
        $$;
      `);
      
      // Создаем enum для статуса операции, если он не существует
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operations_status_enum') THEN
            CREATE TYPE "operations_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED');
          END IF;
        END
        $$;
      `);
      
      // Создаем таблицу operations
      await queryRunner.query(`
        CREATE TABLE "operations" (
          "id" SERIAL NOT NULL,
          "operationNumber" integer NOT NULL,
          "operationType" "operations_operationtype_enum" NOT NULL,
          "machineAxes" integer NOT NULL,
          "estimatedTime" integer NOT NULL,
          "status" "operations_status_enum" NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "orderId" integer,
          "machineId" integer,
          CONSTRAINT "PK_operations" PRIMARY KEY ("id"),
          CONSTRAINT "FK_operations_order" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE,
          CONSTRAINT "FK_operations_machine" FOREIGN KEY ("machineId") REFERENCES "machines" ("id")
        )
      `);
      
      console.log('operations table created successfully');
    } else {
      console.log('operations table already exists, skipping creation');
    }
    
    // Проверяем, существует ли таблица shift_records
    const shiftRecordsExists = await this.tableExists(queryRunner, 'shift_records');
    if (!shiftRecordsExists) {
      console.log('Creating shift_records table...');
      
      // Создаем enum для типа смены, если он не существует
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_records_shifttype_enum') THEN
            CREATE TYPE "shift_records_shifttype_enum" AS ENUM('DAY', 'NIGHT');
          END IF;
        END
        $$;
      `);
      
      // Создаем таблицу shift_records
      await queryRunner.query(`
        CREATE TABLE "shift_records" (
          "id" SERIAL NOT NULL,
          "date" date NOT NULL,
          "shiftType" "shift_records_shifttype_enum" NOT NULL,
          "setupStartDate" date,
          "setupOperator" character varying,
          "setupType" character varying,
          "setupTime" integer,
          "dayShiftQuantity" integer,
          "dayShiftOperator" character varying,
          "dayShiftTimePerUnit" numeric(10,2),
          "nightShiftQuantity" integer,
          "nightShiftOperator" character varying NOT NULL DEFAULT 'Аркадий',
          "nightShiftTimePerUnit" numeric(10,2),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "operationId" integer,
          "machineId" integer,
          CONSTRAINT "PK_shift_records" PRIMARY KEY ("id"),
          CONSTRAINT "FK_shift_records_operation" FOREIGN KEY ("operationId") REFERENCES "operations" ("id"),
          CONSTRAINT "FK_shift_records_machine" FOREIGN KEY ("machineId") REFERENCES "machines" ("id")
        )
      `);
      
      console.log('shift_records table created successfully');
    } else {
      console.log('shift_records table already exists, skipping creation');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем таблицы в обратном порядке из-за внешних ключей
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "machines"`);
    
    // Удаляем enum типы
    await queryRunner.query(`DROP TYPE IF EXISTS "shift_records_shifttype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "operations_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "operations_operationtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "orders_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "machines_type_enum"`);
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
