/**
 * @file: excel-import.controller.ts
 * @description: Контроллер для загрузки и управления Excel файлами
 * @created: 2025-07-03
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelImportService, ColumnMapping, ExcelRowData } from './excel-import.service';

// DTO для запросов
export class UpdateColumnMappingDto {
  columnMapping: ColumnMapping;
}

export class UploadExcelDto {
  description?: string;
  uploadedBy?: string;
  columnMapping?: ColumnMapping;
}

@Controller('api/excel-import')
export class ExcelImportController {
  constructor(private readonly excelImportService: ExcelImportService) {}

  /**
   * Загрузка Excel файла
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadExcelDto,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    return await this.excelImportService.uploadExcelFile(
      file,
      uploadDto.description,
      uploadDto.uploadedBy,
      uploadDto.columnMapping,
    );
  }

  /**
   * Получение списка загруженных файлов
   */
  @Get('files')
  async getFilesList(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.excelImportService.getExcelFilesList(page, limit);
  }

  /**
   * Получение данных файла с возможностью изменения маппинга
   */
  @Get('files/:id/data')
  async getFileData(
    @Param('id', ParseIntPipe) fileId: number,
    @Query('columnMapping') columnMapping?: string,
  ) {
    let mapping: ColumnMapping | undefined;
    
    if (columnMapping) {
      try {
        mapping = JSON.parse(columnMapping);
      } catch {
        throw new BadRequestException('Неверный формат маппинга колонок');
      }
    }

    return await this.excelImportService.getFileDataWithMapping(fileId, mapping);
  }

  /**
   * Обновление маппинга колонок для файла
   */
  @Put('files/:id/mapping')
  async updateColumnMapping(
    @Param('id', ParseIntPipe) fileId: number,
    @Body() updateDto: UpdateColumnMappingDto,
  ): Promise<ExcelRowData[]> {
    return await this.excelImportService.updateColumnMapping(
      fileId,
      updateDto.columnMapping,
    );
  }

  /**
   * Удаление файла
   */
  @Delete('files/:id')
  async deleteFile(@Param('id', ParseIntPipe) fileId: number) {
    await this.excelImportService.deleteExcelFile(fileId);
    return { message: 'Файл успешно удален' };
  }

  /**
   * Получение статистики по файлам
   */
  @Get('statistics')
  async getStatistics() {
    return await this.excelImportService.getStatistics();
  }

  /**
   * Получение дефолтного маппинга колонок
   */
  @Get('default-mapping')
  getDefaultMapping() {
    return {
      mapping: {
        'C': 'drawingNumber',  // Номер чертежа
        'E': 'quantity',       // Количество
        'G': 'deadline',       // Дедлайн
        'K': 'priority'        // Приоритет
      },
      description: {
        'C': 'Номер чертежа',
        'E': 'Количество',
        'G': 'Срок выполнения',
        'K': 'Приоритет'
      }
    };
  }

  /**
   * Предварительный просмотр файла без сохранения
   */
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('columnMapping') columnMappingStr?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    let columnMapping: ColumnMapping | undefined;
    if (columnMappingStr) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch {
        throw new BadRequestException('Неверный формат маппинга колонок');
      }
    }

    // Временно загружаем файл для предварительного просмотра
    const result = await this.excelImportService.uploadExcelFile(
      file,
      'Preview file',
      'preview',
      columnMapping,
    );

    // Удаляем файл после предварительного просмотра
    await this.excelImportService.deleteExcelFile(result.id);

    return {
      preview: result.preview,
      headers: result.headers,
      rowsCount: result.rowsCount,
      columnMapping: result.columnMapping,
    };
  }
}
