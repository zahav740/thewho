/**
 * @file: excel-import-duplicates.module.ts
 * @description: Модуль для импорта Excel с проверкой дубликатов
 * @created: 2025-07-08
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { ExcelImportDuplicatesController } from './excel-import-duplicates.controller';
import { ExcelImportWithDuplicatesService } from '../orders/excel-import-with-duplicates.service';
import { OrdersService } from '../orders/orders.service';
import { FileHash } from '../../database/entities/file-hash.entity';
import { PdfRevision } from '../../database/entities/pdf-revision.entity';
import { OrderFileSystemService } from '../orders/order-filesystem.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Operation, FileHash, PdfRevision]),
  ],
  controllers: [
    ExcelImportDuplicatesController,
  ],
  providers: [
    ExcelImportWithDuplicatesService,
    OrdersService,
    OrderFileSystemService,
  ],
  exports: [
    ExcelImportWithDuplicatesService,
  ],
})
export class ExcelImportDuplicatesModule {}
