/**
 * @file: operators.controller.ts
 * @description: Контроллер для управления операторами (ИСПРАВЛЕН)
 * @dependencies: DataSource
 * @created: 2025-06-09
 * @updated: 2025-07-01 - Исправлены типы и названия полей
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
  active: boolean;
  type: 'SETUP' | 'PRODUCTION' | 'BOTH';
  experience?: number;
  hourlyrate?: number;
  email?: string;
  phone?: string;
  createdat: string;
  updatedat: string;
}

export interface CreateOperatorDto {
  name: string;
  type?: 'SETUP' | 'PRODUCTION' | 'BOTH';
  experience?: number;
  hourlyrate?: number;
  email?: string;
  phone?: string;
}

export interface UpdateOperatorDto {
  name?: string;
  active?: boolean;
  type?: 'SETUP' | 'PRODUCTION' | 'BOTH';
  experience?: number;
  hourlyrate?: number;
  email?: string;
  phone?: string;
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
          active,
          type,
          experience,
          hourlyrate,
          email,
          phone,
          createdat,
          updatedat
        FROM operators
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Фильтр по активности
      if (active !== undefined) {
        query += ` AND active = $${paramIndex}`;
        params.push(active === 'true');
        paramIndex++;
      }

      // Фильтр по типу оператора
      if (type) {
        query += ` AND (type = $${paramIndex} OR type = 'BOTH')`;
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

      const columns: string[] = ['name', 'type'];
      const values: any[] = [createOperatorDto.name, createOperatorDto.type || 'BOTH'];
      const placeholders: string[] = ['$1', '$2'];
      let paramIndex = 3;

      if (createOperatorDto.experience !== undefined) {
        columns.push('experience');
        values.push(createOperatorDto.experience);
        placeholders.push(`$${paramIndex++}`);
      }

      if (createOperatorDto.hourlyrate !== undefined) {
        columns.push('hourlyrate');
        values.push(createOperatorDto.hourlyrate);
        placeholders.push(`$${paramIndex++}`);
      }

      if (createOperatorDto.email) {
        columns.push('email');
        values.push(createOperatorDto.email);
        placeholders.push(`$${paramIndex++}`);
      }

      if (createOperatorDto.phone) {
        columns.push('phone');
        values.push(createOperatorDto.phone);
        placeholders.push(`$${paramIndex++}`);
      }

      const result = await this.dataSource.query(
        `INSERT INTO operators (${columns.join(', ')}) 
         VALUES (${placeholders.join(', ')}) 
         RETURNING *`,
        values
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

      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updateOperatorDto.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        params.push(updateOperatorDto.name);
        paramIndex++;
      }

      if (updateOperatorDto.active !== undefined) {
        setClauses.push(`active = $${paramIndex}`);
        params.push(updateOperatorDto.active);
        paramIndex++;
      }

      if (updateOperatorDto.type !== undefined) {
        setClauses.push(`type = $${paramIndex}`);
        params.push(updateOperatorDto.type);
        paramIndex++;
      }

      if (updateOperatorDto.experience !== undefined) {
        setClauses.push(`experience = $${paramIndex}`);
        params.push(updateOperatorDto.experience);
        paramIndex++;
      }

      if (updateOperatorDto.hourlyrate !== undefined) {
        setClauses.push(`hourlyrate = $${paramIndex}`);
        params.push(updateOperatorDto.hourlyrate);
        paramIndex++;
      }

      if (updateOperatorDto.email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        params.push(updateOperatorDto.email);
        paramIndex++;
      }

      if (updateOperatorDto.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        params.push(updateOperatorDto.phone);
        paramIndex++;
      }

      setClauses.push(`updatedat = NOW()`);

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
         SET active = false, updatedat = NOW()
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
