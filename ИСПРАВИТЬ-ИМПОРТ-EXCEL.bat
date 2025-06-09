@echo off
setlocal enabledelayedexpansion

echo ====================================
echo ИСПРАВЛЕНИЕ ИМПОРТА EXCEL
echo ====================================
echo ПРОБЛЕМА: Файлы загружаются без buffer
echo РЕШЕНИЕ: Исправляем конфигурацию multer
echo.

echo 🔍 ПРОБЛЕМА В ЛОГАХ:
echo hasBuffer: false, bufferSize: undefined
echo ❌ Файл или buffer отсутствует
echo.

echo 🔧 ИСПРАВЛЯЕМ FILES.CONTROLLER.TS...

REM Создаем исправленную версию контроллера
(
echo /**
echo  * @file: files.controller.ts 
echo  * @description: ИСПРАВЛЕННЫЙ контроллер для работы с файлами
echo  * @dependencies: files.service
echo  * @created: 2025-01-28
echo  * @updated: 2025-06-09 // ИСПРАВЛЕНО: multer buffer конфигурация
echo  */
echo import {
echo   Controller,
echo   Get,
echo   Post,
echo   Delete,
echo   Param,
echo   Query,
echo   UseInterceptors,
echo   UploadedFile,
echo   Res,
echo   StreamableFile,
echo } from '@nestjs/common';
echo import { FileInterceptor } from '@nestjs/platform-express';
echo import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
echo import { Response } from 'express';
echo import { FilesService } from './files.service';
echo import type { Express } from 'express';
echo.
echo @ApiTags^('files'^)
echo @Controller^('files'^)
echo export class FilesController {
echo   constructor^(private readonly filesService: FilesService^) {}
echo.
echo   @Post^('upload'^)
echo   @ApiOperation^({ summary: 'Загрузить файл' }^)
echo   @ApiConsumes^('multipart/form-data'^)
echo   @UseInterceptors^(FileInterceptor^('file'^)^)
echo   async uploadFile^(
echo     @UploadedFile^(^) file: Express.Multer.File,
echo     @Query^('folder'^) folder?: string,
echo   ^) {
echo     const filename = await this.filesService.uploadFile^(file, folder^);
echo     return {
echo       filename,
echo       originalName: file.originalname,
echo       size: file.size,
echo       mimetype: file.mimetype,
echo     };
echo   }
echo.
echo   @Post^('excel/parse'^)
echo   @ApiOperation^({ summary: 'ИСПРАВЛЕНО: Парсинг Excel файла с buffer' }^)
echo   @ApiConsumes^('multipart/form-data'^)
echo   @UseInterceptors^(FileInterceptor^('file', {
echo     // ✅ ИСПРАВЛЕНО: НЕ указываем storage - используем MemoryStorage по умолчанию
echo     // ✅ ИСПРАВЛЕНО: Это заставляет multer сохранять файл в buffer вместо диска
echo     fileFilter: ^(req, file, cb^) =^> {
echo       console.log^('🔍 ИСПРАВЛЕННЫЙ FileInterceptor проверка:', {
echo         originalname: file.originalname,
echo         mimetype: file.mimetype,
echo         size: file.size,
echo         hasFieldname: !!file.fieldname
echo       }^);
echo       
echo       const allowedTypes = [
echo         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
echo         'application/vnd.ms-excel', // .xls
echo         'application/octet-stream' // некоторые браузеры отправляют этот MIME type
echo       ];
echo       
echo       const isValidType = allowedTypes.includes^(file.mimetype^) ^|^| file.originalname.match^(/\.^(xlsx?^|csv^)$/^);
echo       
echo       if ^(isValidType^) {
echo         console.log^('✅ ИСПРАВЛЕНО: Файл прошел проверку, будет сохранен в buffer'^);
echo         cb^(null, true^);
echo       } else {
echo         console.error^('❌ Недопустимый тип файла:', file.mimetype^);
echo         cb^(new Error^('Только Excel файлы ^(.xlsx, .xls^) разрешены'^), false^);
echo       }
echo     },
echo     limits: {
echo       fileSize: 50 * 1024 * 1024, // 50MB максимум
echo       fieldSize: 50 * 1024 * 1024, // ✅ ИСПРАВЛЕНО: Добавляем лимит поля
echo     },
echo   }^)^)
echo   async parseExcel^(@UploadedFile^(^) file: Express.Multer.File^) {
echo     console.log^('📁 ИСПРАВЛЕННЫЙ FILES CONTROLLER: Получен файл:', {
echo       originalname: file?.originalname,
echo       size: file?.size,
echo       mimetype: file?.mimetype,
echo       hasBuffer: !!file?.buffer,
echo       bufferSize: file?.buffer?.length,
echo       fieldname: file?.fieldname
echo     }^);
echo     
echo     // ✅ ИСПРАВЛЕНО: Более детальная проверка файла
echo     if ^(!file^) {
echo       console.error^('❌ ИСПРАВЛЕННЫЙ: Файл вообще не получен!'^);
echo       throw new Error^('Файл не получен контроллером'^);
echo     }
echo     
echo     if ^(!file.buffer^) {
echo       console.error^('❌ ИСПРАВЛЕННЫЙ: Файл получен, но buffer отсутствует!'^);
echo       console.error^('📊 Детали файла:', {
echo         originalname: file.originalname,
echo         size: file.size,
echo         mimetype: file.mimetype,
echo         fieldname: file.fieldname,
echo         encoding: file.encoding,
echo         hasPath: !!file.path,
echo         hasDestination: !!file.destination
echo       }^);
echo       throw new Error^('Файл получен без buffer - проблема конфигурации multer'^);
echo     }
echo     
echo     if ^(file.buffer.length === 0^) {
echo       console.error^('❌ ИСПРАВЛЕННЫЙ: Buffer пустой!'^);
echo       throw new Error^('Получен пустой файл'^);
echo     }
echo     
echo     console.log^('✅ ИСПРАВЛЕННЫЙ: Файл прошел все проверки, передаем в сервис'^);
echo     
echo     return this.filesService.parseExcel^(file^);
echo   }
echo.
echo   // Остальные методы остаются без изменений...
echo   @Get^(':filename'^)
echo   @ApiOperation^({ summary: 'Получить файл' }^)
echo   @ApiQuery^({ name: 'folder', required: false }^)
echo   async getFile^(
echo     @Param^('filename'^) filename: string,
echo     @Query^('folder'^) folder: string,
echo     @Res^({ passthrough: true }^) res: Response,
echo   ^): Promise^<StreamableFile^> {
echo     const buffer = await this.filesService.getFile^(filename, folder^);
echo     
echo     const extension = filename.split^('.'^).pop^(^)?.toLowerCase^(^);
echo     let contentType = 'application/octet-stream';
echo     
echo     switch ^(extension^) {
echo       case 'pdf':
echo         contentType = 'application/pdf';
echo         break;
echo       case 'xlsx':
echo       case 'xls':
echo         contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
echo         break;
echo       case 'jpg':
echo       case 'jpeg':
echo         contentType = 'image/jpeg';
echo         break;
echo       case 'png':
echo         contentType = 'image/png';
echo         break;
echo     }
echo     
echo     res.set^({
echo       'Content-Type': contentType,
echo       'Content-Disposition': `attachment; filename="${filename}"`,
echo     }^);
echo     
echo     return new StreamableFile^(buffer^);
echo   }
echo.
echo   @Delete^(':filename'^)
echo   @ApiOperation^({ summary: 'Удалить файл' }^)
echo   @ApiQuery^({ name: 'folder', required: false }^)
echo   async deleteFile^(
echo     @Param^('filename'^) filename: string,
echo     @Query^('folder'^) folder?: string,
echo   ^) {
echo     await this.filesService.deleteFile^(filename, folder^);
echo     return { message: 'Файл успешно удален' };
echo   }
echo.
echo   @Post^('pdf/preview'^)
echo   @ApiOperation^({ summary: 'Генерация превью PDF' }^)
echo   @ApiConsumes^('multipart/form-data'^)
echo   @UseInterceptors^(FileInterceptor^('file'^)^)
echo   async generatePdfPreview^(@UploadedFile^(^) file: Express.Multer.File^) {
echo     const preview = await this.filesService.generatePdfPreview^(file.buffer^);
echo     return { preview };
echo   }
echo.
echo   @Get^(^)
echo   @ApiOperation^({ summary: 'Список файлов' }^)
echo   @ApiQuery^({ name: 'folder', required: false }^)
echo   async listFiles^(@Query^('folder'^) folder?: string^) {
echo     return this.filesService.listFiles^(folder^);
echo   }
echo.
echo   @Get^(':filename/info'^)
echo   @ApiOperation^({ summary: 'Информация о файле' }^)
echo   @ApiQuery^({ name: 'folder', required: false }^)
echo   async getFileInfo^(
echo     @Param^('filename'^) filename: string,
echo     @Query^('folder'^) folder?: string,
echo   ^) {
echo     return this.filesService.getFileInfo^(filename, folder^);
echo   }
echo }
) > backend\src\modules\files\files.controller.FIXED.ts

echo ✅ Исправленный контроллер создан: files.controller.FIXED.ts
echo.

echo 🔄 Заменяем оригинальный файл исправленной версией...
copy backend\src\modules\files\files.controller.ts backend\src\modules\files\files.controller.BACKUP.ts
copy backend\src\modules\files\files.controller.FIXED.ts backend\src\modules\files\files.controller.ts

echo ✅ Файл заменен успешно!
echo.

echo 🛠️ КЛЮЧЕВЫЕ ИСПРАВЛЕНИЯ:
echo 1. ✅ Убрана кастомная storage конфигурация
echo 2. ✅ Multer теперь использует MemoryStorage по умолчанию
echo 3. ✅ Добавлена детальная диагностика файлов
echo 4. ✅ Добавлен лимит fieldSize для больших файлов
echo 5. ✅ Улучшена обработка ошибок
echo.

echo 🔄 СЛЕДУЮЩИЙ ШАГ: Перезапустите backend сервер
echo.
echo cd backend
echo npm run start
echo.
echo После перезапуска попробуйте загрузить Excel файл снова.
echo В логах вы должны увидеть:
echo ✅ hasBuffer: true
echo ✅ bufferSize: [размер файла]
echo.

pause
