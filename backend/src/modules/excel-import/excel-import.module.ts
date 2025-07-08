/**
 * @file: excel-import.module.ts
 * @description: Модуль для импорта Excel файлов
 * @created: 2025-07-03
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ExcelImportController } from './excel-import.controller';
import { ExcelImportService } from './excel-import.service';
import { ExcelFile } from '../../database/entities/excel-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExcelFile]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [ExcelImportController],
  providers: [ExcelImportService],
  exports: [ExcelImportService],
})
export class ExcelImportModule {}
