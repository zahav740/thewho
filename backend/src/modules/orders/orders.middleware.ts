/**
 * @file: orders.middleware.ts
 * @description: Промежуточное ПО для обработки и преобразования данных заказов
 * @created: 2025-05-31
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OrdersDataMiddleware implements NestMiddleware {
  private readonly logger = new Logger('OrdersDataMiddleware');

  use(req: Request, res: Response, next: NextFunction) {
    // Проверяем только PUT и POST запросы к /orders
    if ((req.method === 'POST' || req.method === 'PUT') && 
        (req.originalUrl.includes('/orders') && !req.originalUrl.includes('/upload'))) {
      
      this.logger.log(`Обработка ${req.method} запроса к ${req.originalUrl}`);
      this.logger.debug('Оригинальное тело запроса:', req.body);
      
      // Преобразуем тело запроса
      if (req.body) {
        // Преобразуем приоритет
        if (req.body.priority !== undefined) {
          // Сохраняем оригинальное значение для отладки
          const originalPriority = req.body.priority;
          
          // Преобразуем в число
          req.body.priority = typeof req.body.priority === 'string'
            ? parseInt(req.body.priority, 10)
            : req.body.priority;
            
          this.logger.log(`Priority: ${originalPriority} -> ${req.body.priority}`);
        }
        
        // Преобразуем операции
        if (req.body.operations && Array.isArray(req.body.operations)) {
          this.logger.log(`Преобразование ${req.body.operations.length} операций`);
          
          req.body.operations = req.body.operations.map((op: any, index: number) => {
            const updatedOp = { ...op };
            
            // Преобразуем operationNumber в число
            if (updatedOp.operationNumber !== undefined) {
              const original = updatedOp.operationNumber;
              updatedOp.operationNumber = typeof updatedOp.operationNumber === 'string'
                ? parseInt(updatedOp.operationNumber, 10)
                : updatedOp.operationNumber;
              this.logger.debug(`[Op ${index}] operationNumber: ${original} -> ${updatedOp.operationNumber}`);
            }
            
            // Преобразуем machineAxes в строку формата "N-axis"
            if (updatedOp.machineAxes !== undefined) {
              const original = updatedOp.machineAxes;
              
              // Если это число или строка без "-axis", добавляем суффикс
              if (typeof updatedOp.machineAxes === 'number' || 
                  (typeof updatedOp.machineAxes === 'string' && !updatedOp.machineAxes.includes('-axis'))) {
                updatedOp.machineAxes = `${updatedOp.machineAxes}-axis`;
              }
              
              this.logger.debug(`[Op ${index}] machineAxes: ${original} -> ${updatedOp.machineAxes}`);
            }
            
            // Преобразуем estimatedTime в число
            if (updatedOp.estimatedTime !== undefined) {
              const original = updatedOp.estimatedTime;
              updatedOp.estimatedTime = typeof updatedOp.estimatedTime === 'string'
                ? parseInt(updatedOp.estimatedTime, 10)
                : updatedOp.estimatedTime;
              this.logger.debug(`[Op ${index}] estimatedTime: ${original} -> ${updatedOp.estimatedTime}`);
            }
            
            return updatedOp;
          });
          
          this.logger.debug('Преобразованные операции:', req.body.operations);
        }
      }
      
      this.logger.debug('Преобразованное тело запроса:', req.body);
    }
    
    next();
  }
}
