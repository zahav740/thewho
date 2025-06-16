/**
 * @file: operation-management.controller.ts
 * @description: Контроллер для ручного управления операциями с исправленной логикой версионирования
 * @dependencies: OperationAnalyticsService
 * @created: 2025-06-11
 * @updated: 2025-06-11 - Исправлена логика: один чертеж = много заказов по ID
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OperationAnalyticsService } from './operation-analytics.service';

export class CreateOperationDto {
  orderId: number;
  operationNumber: number;
  operationType: 'MILLING' | 'TURNING';
  estimatedTime: number;
  machineAxes?: number;
  notes?: string;
}

export class UpdateOperationDto {
  operationType?: 'MILLING' | 'TURNING';
  estimatedTime?: number;
  machineAxes?: number;
  notes?: string;
}

@ApiTags('operation-management')
@Controller('operation-management')
export class OperationManagementController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly analyticsService: OperationAnalyticsService,
  ) {}

  @Post('operation')
  @ApiOperation({ summary: 'Создать новую операцию для заказа' })
  async createOperation(@Body() createOperationDto: CreateOperationDto) {
    try {
      console.log('OperationManagement: Создание операции:', createOperationDto);

      // Проверяем существование заказа
      const order = await this.dataSource.query(
        'SELECT * FROM orders WHERE id = $1',
        [createOperationDto.orderId]
      );

      if (order.length === 0) {
        return {
          success: false,
          message: 'Заказ не найден'
        };
      }

      // Создаем операцию
      const operationResult = await this.dataSource.query(`
        INSERT INTO operations (
          "orderId", 
          "operationNumber", 
          operationtype, 
          "estimatedTime", 
          machineaxes,
          status,
          "createdAt", 
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
        RETURNING id
      `, [
        createOperationDto.orderId,
        createOperationDto.operationNumber,
        createOperationDto.operationType,
        createOperationDto.estimatedTime,
        createOperationDto.machineAxes || 3
      ]);

      const operationId = operationResult[0].id;

      // Автоматически создаем запись прогресса
      await this.dataSource.query(`
        INSERT INTO operation_execution_progress (operation_id, total_units)
        VALUES ($1, $2)
      `, [operationId, order[0].quantity]);

      return {
        success: true,
        message: 'Операция создана успешно',
        operationId: operationId
      };
    } catch (error) {
      console.error('OperationManagement.createOperation ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при создании операции',
        error: error.message
      };
    }
  }

  @Get('order/:orderId/operations')
  @ApiOperation({ summary: 'Получить операции заказа' })
  async getOrderOperations(@Param('orderId') orderId: string) {
    try {
      const operations = await this.dataSource.query(`
        SELECT 
          op.id,
          op."operationNumber",
          op.operationtype as "operationType",
          op."estimatedTime",
          op.machineaxes as "machineAxes",
          op.status,
          prog.completed_units as "completedUnits",
          prog.total_units as "totalUnits",
          prog.progress_percentage as "progressPercentage",
          m.code as "assignedMachine"
        FROM operations op
        LEFT JOIN operation_execution_progress prog ON op.id = prog.operation_id
        LEFT JOIN machines m ON op."assignedMachine" = m.id
        WHERE op."orderId" = $1
        ORDER BY op."operationNumber"
      `, [parseInt(orderId)]);

      return {
        success: true,
        data: operations
      };
    } catch (error) {
      console.error('OperationManagement.getOrderOperations ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении операций',
        error: error.message
      };
    }
  }

  @Put('operation/:operationId')
  @ApiOperation({ summary: 'Обновить операцию' })
  async updateOperation(
    @Param('operationId') operationId: string,
    @Body() updateOperationDto: UpdateOperationDto
  ) {
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updateOperationDto).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = key === 'operationType' ? 'operationtype' : 
                         key === 'estimatedTime' ? '"estimatedTime"' :
                         key === 'machineAxes' ? 'machineaxes' : key;
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return {
          success: false,
          message: 'Нет полей для обновления'
        };
      }

      updateFields.push(`"updatedAt" = NOW()`);
      values.push(parseInt(operationId));

      await this.dataSource.query(`
        UPDATE operations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, values);

      return {
        success: true,
        message: 'Операция обновлена успешно'
      };
    } catch (error) {
      console.error('OperationManagement.updateOperation ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при обновлении операции',
        error: error.message
      };
    }
  }

  @Delete('operation/:operationId')
  @ApiOperation({ summary: 'Удалить операцию' })
  async deleteOperation(@Param('operationId') operationId: string) {
    try {
      // Проверяем, что операция не выполняется
      const operation = await this.dataSource.query(
        'SELECT status FROM operations WHERE id = $1',
        [parseInt(operationId)]
      );

      if (operation.length === 0) {
        return {
          success: false,
          message: 'Операция не найдена'
        };
      }

      if (operation[0].status === 'IN_PROGRESS') {
        return {
          success: false,
          message: 'Нельзя удалить операцию в процессе выполнения'
        };
      }

      // Удаляем операцию (прогресс удалится автоматически по CASCADE)
      await this.dataSource.query(
        'DELETE FROM operations WHERE id = $1',
        [parseInt(operationId)]
      );

      return {
        success: true,
        message: 'Операция удалена успешно'
      };
    } catch (error) {
      console.error('OperationManagement.deleteOperation ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при удалении операции',
        error: error.message
      };
    }
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Получить рекомендации для нового заказа на основе истории чертежа' })
  async getOperationSuggestions(
    @Query('orderDrawingNumber') orderDrawingNumber: string,
    @Query('orderQuantity') orderQuantity: string,
    @Query('workType') workType?: string
  ) {
    try {
      const suggestions = await this.analyticsService.getOperationSuggestions(
        orderDrawingNumber,
        parseInt(orderQuantity),
        workType
      );

      return {
        success: true,
        data: suggestions,
        message: suggestions.length > 0 
          ? `Найдено ${suggestions.length} рекомендаций на основе истории чертежа ${orderDrawingNumber}`
          : `Нет исторических данных для чертежа ${orderDrawingNumber}`
      };
    } catch (error) {
      console.error('OperationManagement.getOperationSuggestions ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении рекомендаций',
        error: error.message
      };
    }
  }

  @Get('drawing/:drawingNumber/history')
  @ApiOperation({ summary: 'Получить полную историю заказов и операций для чертежа' })
  async getDrawingHistory(@Param('drawingNumber') drawingNumber: string) {
    try {
      const history = await this.analyticsService.getDrawingHistory(drawingNumber);
      const stats = await this.analyticsService.getDrawingStatistics(drawingNumber);
      const lastCompleted = await this.analyticsService.getLastCompletedOrder(drawingNumber);

      return {
        success: true,
        data: {
          history,
          statistics: stats,
          lastCompletedOrder: lastCompleted
        },
        message: `История для чертежа ${drawingNumber}: ${stats.total_orders} заказов, ${stats.total_operations} операций`
      };
    } catch (error) {
      console.error('OperationManagement.getDrawingHistory ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении истории чертежа',
        error: error.message
      };
    }
  }

  @Get('drawing/:drawingNumber/last-completed')
  @ApiOperation({ summary: 'Получить последний завершенный заказ для чертежа' })
  async getLastCompletedOrder(@Param('drawingNumber') drawingNumber: string) {
    try {
      const lastOrder = await this.analyticsService.getLastCompletedOrder(drawingNumber);

      if (!lastOrder) {
        return {
          success: true,
          data: null,
          message: `Нет завершенных заказов для чертежа ${drawingNumber}`
        };
      }

      // Получаем операции последнего завершенного заказа
      const operations = await this.dataSource.query(`
        SELECT 
          op.id,
          op."operationNumber",
          op.operationtype,
          op."estimatedTime",
          op.status,
          prog.completed_units,
          prog.total_units,
          prog.progress_percentage
        FROM operations op
        LEFT JOIN operation_execution_progress prog ON op.id = prog.operation_id
        WHERE op."orderId" = $1
        ORDER BY op."operationNumber"
      `, [lastOrder.id]);

      return {
        success: true,
        data: {
          order: lastOrder,
          operations: operations
        },
        message: `Последний завершенный заказ ID ${lastOrder.id} для чертежа ${drawingNumber}`
      };
    } catch (error) {
      console.error('OperationManagement.getLastCompletedOrder ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении последнего заказа',
        error: error.message
      };
    }
  }

  @Get('analytics/time')
  @ApiOperation({ summary: 'Получить аналитику времени выполнения операций' })
  async getTimeAnalytics(
    @Query('operationType') operationType?: string,
    @Query('machineType') machineType?: string
  ) {
    try {
      const analytics = await this.analyticsService.getOperationTimeAnalytics(
        operationType,
        machineType
      );

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('OperationManagement.getTimeAnalytics ошибка:', error);
      return {
        success: false,
        message: 'Ошибка при получении аналитики',
        error: error.message
      };
    }
  }

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint' })
  async test() {
    try {
      const counts = await this.dataSource.query(`
        SELECT 
          (SELECT COUNT(*) FROM orders) as orders,
          (SELECT COUNT(*) FROM operations) as operations,
          (SELECT COUNT(*) FROM operation_execution_progress) as progress_records,
          (SELECT COUNT(DISTINCT drawing_number) FROM orders WHERE drawing_number IS NOT NULL) as unique_drawings
      `);

      // Пример работы с чертежом
      const exampleDrawing = await this.dataSource.query(`
        SELECT drawing_number, COUNT(*) as order_count
        FROM orders 
        WHERE drawing_number IS NOT NULL
        GROUP BY drawing_number
        ORDER BY order_count DESC
        LIMIT 1
      `);

      return {
        status: 'ok',
        message: 'Operation management service is working',
        data: counts[0],
        example: exampleDrawing[0] || null,
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /operation-management/operation - Создать операцию',
          'GET /operation-management/order/:orderId/operations - Операции заказа',
          'PUT /operation-management/operation/:operationId - Обновить операцию',
          'DELETE /operation-management/operation/:operationId - Удалить операцию',
          'GET /operation-management/suggestions - Рекомендации по чертежу',
          'GET /operation-management/drawing/:drawingNumber/history - История чертежа',
          'GET /operation-management/drawing/:drawingNumber/last-completed - Последний завершенный заказ',
          'GET /operation-management/analytics/time - Аналитика времени'
        ]
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
