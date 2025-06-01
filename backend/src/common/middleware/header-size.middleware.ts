/**
 * @file: header-size.middleware.ts
 * @description: Middleware для ограничения размера заголовков
 * @dependencies: @nestjs/common
 * @created: 2025-01-28
 */
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HeaderSizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Проверяем размер заголовков
    const headersSize = JSON.stringify(req.headers).length;
    const maxHeaderSize = 8192; // 8KB максимальный размер заголовков

    if (headersSize > maxHeaderSize) {
      // Логируем проблемные заголовки для отладки
      console.error('Headers too large:', {
        size: headersSize,
        headers: Object.keys(req.headers).map(key => ({ 
          key, 
          length: String(req.headers[key]).length 
        })).sort((a, b) => b.length - a.length).slice(0, 5)
      });

      throw new HttpException(
        'Request header fields too large',
        431, // REQUEST_HEADER_FIELDS_TOO_LARGE
      );
    }

    // Очищаем ненужные заголовки
    const headersToRemove = ['cookie', 'referer', 'user-agent'];
    headersToRemove.forEach(header => {
      if (req.headers[header] && String(req.headers[header]).length > 1024) {
        delete req.headers[header];
      }
    });

    next();
  }
}
