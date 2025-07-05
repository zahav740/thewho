import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';

// Расширяем Express интерфейсы для добавления наших типов
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      [key: string]: any;
    }
    
    interface Response {
      [key: string]: any;
    }
  }
}

// Переэкспортируем типы для удобства
export type Request = ExpressRequest;
export type Response = ExpressResponse;

// Мультер типы с stream для совместимости
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  stream?: Readable; // Добавляем stream для совместимости с File типом
}

// Функция для создания совместимого Excel файла
export function createExcelFile(multerFile: MulterFile): MulterFile & { stream: Readable } {
  const readable = new Readable({
    read() {
      this.push(multerFile.buffer);
      this.push(null);
    }
  });
  
  return {
    ...multerFile,
    stream: readable
  };
}

export default {
  Request: ExpressRequest,
  Response: ExpressResponse,
};
