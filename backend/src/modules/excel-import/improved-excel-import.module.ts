/**
 * @file: improved-excel-import.module.ts
 * @description: Переделанный модуль для загрузки Excel с дефолтными колонками
 * @created: 2025-07-03
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelFile } from '../../database/entities/excel-file.entity';
import { ImprovedExcelImportService } from './improved-excel-import.service';
import { ImprovedExcelImportController } from './improved-excel-import.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExcelFile]),
  ],
  controllers: [
    ImprovedExcelImportController
  ],
  providers: [
    ImprovedExcelImportService
  ],
  exports: [
    ImprovedExcelImportService
  ],
})
export class ImprovedExcelImportModule {}
