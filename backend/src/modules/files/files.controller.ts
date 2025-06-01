/**
 * @file: files.controller.ts
 * @description: Контроллер для работы с файлами
 * @dependencies: files.service
 * @created: 2025-01-28
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import type { Express } from 'express';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить файл' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    const filename = await this.filesService.uploadFile(file, folder);
    return {
      filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Получить файл' })
  @ApiQuery({ name: 'folder', required: false })
  async getFile(
    @Param('filename') filename: string,
    @Query('folder') folder: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.filesService.getFile(filename, folder);
    
    // Определяем MIME-тип по расширению
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'xlsx':
      case 'xls':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
    }
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    return new StreamableFile(buffer);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Удалить файл' })
  @ApiQuery({ name: 'folder', required: false })
  async deleteFile(
    @Param('filename') filename: string,
    @Query('folder') folder?: string,
  ) {
    await this.filesService.deleteFile(filename, folder);
    return { message: 'Файл успешно удален' };
  }

  @Post('excel/parse')
  @ApiOperation({ summary: 'Парсинг Excel файла' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async parseExcel(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.parseExcel(file);
  }

  @Post('pdf/preview')
  @ApiOperation({ summary: 'Генерация превью PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async generatePdfPreview(@UploadedFile() file: Express.Multer.File) {
    const preview = await this.filesService.generatePdfPreview(file.buffer);
    return { preview };
  }

  @Get()
  @ApiOperation({ summary: 'Список файлов' })
  @ApiQuery({ name: 'folder', required: false })
  async listFiles(@Query('folder') folder?: string) {
    return this.filesService.listFiles(folder);
  }

  @Get(':filename/info')
  @ApiOperation({ summary: 'Информация о файле' })
  @ApiQuery({ name: 'folder', required: false })
  async getFileInfo(
    @Param('filename') filename: string,
    @Query('folder') folder?: string,
  ) {
    return this.filesService.getFileInfo(filename, folder);
  }
}
