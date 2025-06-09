/**
 * @file: operators.controller.ts
 * @description: Контроллер для управления операторами
 * @dependencies: DataSource
 * @created: 2025-06-09
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

export interface Operator {
  id: number;
  name: string;
  isActive: boolean;
  operatorType: 'SETUP' | 'PRODUCTION' | 'BOTH';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperatorDto {
  name: string;
  operatorType?: 'SETUP' | 'PRODUCTION' | 'BOTH';
}

export interface UpdateOperatorDto {
  name?: string;
  isActive?: boolean;
  operatorType?: 'SETUP' | 'PRODUCTION' | 'BOTH';
}

@ApiTags('operators')
@Controller('operators')
export class OperatorsController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Тестовый endpoint для операторов' })
  async test() {
    try {
      console.log('OperatorsController.test: Тест API операторов');
      
      // Проверяем существование таблицы
      const tableExists = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'operators'
      `);
      
      if (tableExists.length === 0) {
        return {
          status: 'error',
          message: 'Таблица operators не существует',
          suggestion: 'Запустите ПРИМЕНИТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.bat',
          timestamp: new Date().toISOString(),
        };
      }
      
      const count = await this.dataSource.query('SELECT COUNT(*) as count FROM operators');
      const sample = await this.dataSource.query('SELECT * FROM operators LIMIT 3');
      
      return {
        status: 'ok',
        message: 'Operators API is working',
        tableExists: true,
        count: count[0]?.count || 0,
        sample,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('OperatorsController.test: Ошибка:', error);
      return {
        status: 'error',
        error: error.message,
        suggestion: 'Проверьте подключение к PostgreSQL и создайте таблицу operators',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Получить всех операторов' })
  @ApiResponse({ status: 200, description: 'Список операторов' })
  async getAllOperators(
    @Query('type') type?: string,
    @Query('active') active?: string,
  ): Promise<Operator[]> {
    try {
      console.log('OperatorsController.getAllOperators: Получение операторов', { type, active });

      let query = `
        SELECT 
          id,
          name,
          "isActive",
          "operatorType",
          "createdAt",
          "updatedAt"
        FROM operators
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Фильтр по активности
      if (active !== undefined) {
        query += ` AND "isActive" = $${paramIndex}`;
        params.push(active === 'true');
        paramIndex++;
      }

      // Фильтр по типу оператора
      if (type) {
        query += ` AND ("operatorType" = $${paramIndex} OR "operatorType" = 'BOTH')`;
        params.push(type.toUpperCase());
        paramIndex++;
      }

      query += ' ORDER BY name ASC';

      const operators = await this.dataSource.query(query, params);

      console.log(`OperatorsController.getAllOperators: Найдено ${operators.length} операторов`);
      return operators;
    } catch (error) {
      console.error('OperatorsController.getAllOperators: Ошибка:', error);
      throw error;
    }
  }

  @Get('setup')
  @ApiOperation({ summary: 'Получить операторов наладки' })
  async getSetupOperators(): Promise<Operator[]> {
    return this.getAllOperators('SETUP', 'true');
  }

  @Get('production')
  @ApiOperation({ summary: 'Получить операторов производства' })
  async getProductionOperators(): Promise<Operator[]> {
    return this.getAllOperators('PRODUCTION', 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить оператора по ID' })
  async getOperatorById(@Param('id') id: string): Promise<Operator> {
    try {
      const operators = await this.dataSource.query(
        'SELECT * FROM operators WHERE id = $1',
        [parseInt(id)]
      );

      if (operators.length === 0) {
        throw new Error('Оператор не найден');
      }

      return operators[0];
    } catch (error) {
      console.error('OperatorsController.getOperatorById: Ошибка:', error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового оператора' })
  @ApiResponse({ status: 201, description: 'Оператор создан' })
  async createOperator(@Body() createOperatorDto: CreateOperatorDto): Promise<Operator> {
    try {
      console.log('OperatorsController.createOperator: Создание оператора:', createOperatorDto);

      // Проверяем, не существует ли оператор с таким именем
      const existing = await this.dataSource.query(
        'SELECT id FROM operators WHERE name = $1',
        [createOperatorDto.name]
      );

      if (existing.length > 0) {
        throw new Error('Оператор с таким именем уже существует');
      }

      const result = await this.dataSource.query(
        `INSERT INTO operators (name, "operatorType") 
         VALUES ($1, $2) 
         RETURNING *`,
        [
          createOperatorDto.name,
          createOperatorDto.operatorType || 'BOTH'
        ]
      );

      console.log('OperatorsController.createOperator: Оператор создан:', result[0]);
      return result[0];
    } catch (error) {
      console.error('OperatorsController.createOperator: Ошибка:', error);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить оператора' })
  async updateOperator(
    @Param('id') id: string,
    @Body() updateOperatorDto: UpdateOperatorDto,
  ): Promise<Operator> {
    try {
      console.log('OperatorsController.updateOperator: Обновление оператора:', id, updateOperatorDto);

      const setClauses = [];
      const params = [];
      let paramIndex = 1;

      if (updateOperatorDto.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        params.push(updateOperatorDto.name);
        paramIndex++;
      }

      if (updateOperatorDto.isActive !== undefined) {
        setClauses.push(`"isActive" = $${paramIndex}`);
        params.push(updateOperatorDto.isActive);
        paramIndex++;
      }

      if (updateOperatorDto.operatorType !== undefined) {
        setClauses.push(`"operatorType" = $${paramIndex}`);
        params.push(updateOperatorDto.operatorType);
        paramIndex++;
      }

      setClauses.push(`"updatedAt" = NOW()`);

      if (setClauses.length === 1) {
        throw new Error('Нет данных для обновления');
      }

      params.push(parseInt(id));

      const query = `
        UPDATE operators 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.dataSource.query(query, params);

      if (result.length === 0) {
        throw new Error('Оператор не найден');
      }

      console.log('OperatorsController.updateOperator: Оператор обновлен:', result[0]);
      return result[0];
    } catch (error) {
      console.error('OperatorsController.updateOperator: Ошибка:', error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить оператора (мягкое удаление)' })
  async deleteOperator(@Param('id') id: string): Promise<{ message: string }> {
    try {
      console.log('OperatorsController.deleteOperator: Удаление оператора:', id);

      // Мягкое удаление - просто помечаем как неактивный
      const result = await this.dataSource.query(
        `UPDATE operators 
         SET "isActive" = false, "updatedAt" = NOW()
         WHERE id = $1
         RETURNING name`,
        [parseInt(id)]
      );

      if (result.length === 0) {
        throw new Error('Оператор не найден');
      }

      console.log('OperatorsController.deleteOperator: Оператор деактивирован:', result[0].name);
      return { message: `Оператор ${result[0].name} деактивирован` };
    } catch (error) {
      console.error('OperatorsController.deleteOperator: Ошибка:', error);
      throw error;
    }
  }
}
