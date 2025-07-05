/**
 * @file: files.controller.ts 
 * @description: ИСПРАВЛЕННЫЙ контроллер для работы с файлами
 * @dependencies: files.service
 * @created: 2025-01-28
 * @updated: 2025-06-09 // ИСПРАВЛЕНО: multer buffer конфигурация
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
import { Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';


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

  @Post('excel/parse')
  @ApiOperation({ summary: 'ИСПРАВЛЕНО: Парсинг Excel файла с buffer' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    // ✅ ИСПРАВЛЕНО: НЕ указываем storage - используем MemoryStorage по умолчанию
    // ✅ ИСПРАВЛЕНО: Это заставляет multer сохранять файл в buffer вместо диска
    fileFilter: (req, file, cb) => {
      console.log('🔍 ИСПРАВЛЕННЫЙ FileInterceptor проверка:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasFieldname: !!file.fieldname
      });
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/octet-stream' // некоторые браузеры отправляют этот MIME type
      ];
      
      const isValidType = allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/);
      
      if (isValidType) {
        console.log('✅ ИСПРАВЛЕНО: Файл прошел проверку, будет сохранен в buffer');
        cb(null, true);
      } else {
        console.error('❌ Недопустимый тип файла:', file.mimetype);
        cb(new Error('Только Excel файлы (.xlsx, .xls) разрешены'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB максимум
      fieldSize: 50 * 1024 * 1024, // ✅ ИСПРАВЛЕНО: Добавляем лимит поля
    },
  }))
  async parseExcel(@UploadedFile() file: Express.Multer.File) {
    console.log('📁 ИСПРАВЛЕННЫЙ FILES CONTROLLER: Получен файл:', {
      originalname: file?.originalname,
      size: file?.size,
      mimetype: file?.mimetype,
      hasBuffer: !!file?.buffer,
      bufferSize: file?.buffer?.length,
      fieldname: file?.fieldname
    });
    
    // ✅ ИСПРАВЛЕНО: Более детальная проверка файла
    if (!file) {
      console.error('❌ ИСПРАВЛЕННЫЙ: Файл вообще не получен!');
      throw new Error('Файл не получен контроллером');
    }
    
    if (!file.buffer) {
      console.error('❌ ИСПРАВЛЕННЫЙ: Файл получен, но buffer отсутствует!');
      console.error('📊 Детали файла:', {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        encoding: file.encoding,
        hasPath: !!file.path,
        hasDestination: !!file.destination
      });
      throw new Error('Файл получен без buffer - проблема конфигурации multer');
    }
    
    if (file.buffer.length === 0) {
      console.error('❌ ИСПРАВЛЕННЫЙ: Buffer пустой!');
      throw new Error('Получен пустой файл');
    }
    
    console.log('✅ ИСПРАВЛЕННЫЙ: Файл прошел все проверки, передаем в сервис');
    
    return this.filesService.parseExcel(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Получить файл' })
  @ApiQuery({ name: 'folder', required: false })
  async getFile(
    @Param('filename') filename: string,
    @Query('folder') folder: string,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const buffer = await this.filesService.getFile(filename, folder);
    
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
