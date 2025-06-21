/**
 * @file: static-files.middleware.ts
 * @description: Middleware для раздачи статических PDF файлов
 * @created: 2025-06-21
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StaticFilesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Обрабатываем только запросы к PDF файлам
    if (req.path.startsWith('/api/orders/pdf/')) {
      const filename = req.path.split('/').pop();
      
      if (!filename) {
        return res.status(400).json({ message: 'Не указано имя файла' });
      }

      console.log(`📄 StaticFiles: Запрос на PDF файл: ${filename}`);

      // Пути для поиска файла
      const searchPaths = [
        path.join(process.cwd(), 'backend', 'uploads', 'pdf', filename),
        path.join(process.cwd(), 'uploads', 'pdf', filename),
        path.join(__dirname, '../../../uploads/pdf', filename),
        path.resolve('./backend/uploads/pdf', filename),
        path.resolve('./uploads/pdf', filename)
      ];

      console.log('🔍 Поиск файла в путях:');
      
      let foundPath = null;
      for (let i = 0; i < searchPaths.length; i++) {
        const searchPath = searchPaths[i];
        const exists = fs.existsSync(searchPath);
        console.log(`   ${i + 1}. ${searchPath} -> ${exists ? '✅' : '❌'}`);
        
        if (exists && !foundPath) {
          foundPath = searchPath;
        }
      }

      if (!foundPath) {
        console.error(`❌ PDF файл не найден: ${filename}`);
        return res.status(404).json({ 
          message: 'PDF файл не найден',
          filename,
          searchedPaths: searchPaths
        });
      }

      try {
        const stats = fs.statSync(foundPath);
        console.log(`✅ PDF файл найден: ${foundPath} (${stats.size} байт)`);

        // Устанавливаем правильные заголовки для PDF
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Frame-Options': 'SAMEORIGIN',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        });

        // Отправляем файл
        return res.sendFile(foundPath);
      } catch (error) {
        console.error(`❌ Ошибка при отправке PDF файла ${filename}:`, error);
        return res.status(500).json({ 
          message: 'Ошибка сервера при получении PDF', 
          error: error.message 
        });
      }
    }

    // Передаем управление дальше для остальных запросов
    next();
  }
}
