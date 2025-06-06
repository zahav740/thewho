/**
 * @file: operations.controller.ts
 * @description: Контроллер для управления операциями (обновленный)
 * @dependencies: services
 * @created: 2025-01-28
 * @updated: 2025-05-28
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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { OperationExecutionService } from './operation-execution.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { UpdateOperationDto } from './dto/update-operation.dto';
import { AssignMachineDto } from './dto/assign-machine.dto';
import { Operation, OperationStatus } from '../../database/entities/operation.entity';

@ApiTags('operations')
@Controller('operations')
export class OperationsController {
  constructor(
    private readonly operationsService: OperationsService,
    private readonly operationExecutionService: OperationExecutionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все операции' })
  @ApiQuery({ name: 'status', enum: OperationStatus, required: false })
  async findAll(@Query('status') status?: OperationStatus): Promise<Operation[]> {
    if (status) {
      return this.operationsService.findByStatus(status);
    }
    return this.operationsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные операции' })
  async getActiveOperations(): Promise<Operation[]> {
    return this.operationExecutionService.getActiveOperations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить операцию по ID' })
  async findOne(@Param('id') id: string): Promise<Operation> {
    return this.operationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать новую операцию' })
  async create(@Body() createOperationDto: CreateOperationDto): Promise<Operation> {
    return this.operationsService.create(createOperationDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить операцию' })
  async update(
    @Param('id') id: string,
    @Body() updateOperationDto: UpdateOperationDto,
  ): Promise<Operation> {
    return this.operationsService.update(id, updateOperationDto);
  }

  @Put(':id/assign-machine')
  @ApiOperation({ summary: 'Назначить станок для операции (legacy)' })
  async assignMachine(
    @Param('id') id: string,
    @Body() assignMachineDto: AssignMachineDto,
  ): Promise<Operation> {
    return this.operationsService.assignMachine(id, assignMachineDto);
  }

  @Post(':operationId/start')
  @ApiOperation({ summary: 'Запустить операцию в работу' })
  async startOperation(
    @Param('operationId') operationId: string,
    @Body() body: { machineId: string },
  ) {
    const result = await this.operationExecutionService.startOperation(
      operationId, 
      body.machineId
    );
    
    return {
      success: result.success,
      startDate: result.startDate,
      message: 'Операция запущена в работу',
      operation: result.operation
    };
  }

  @Put(':operationId/complete')
  @ApiOperation({ summary: 'Завершить операцию' })
  async completeOperation(@Param('operationId') operationId: string): Promise<Operation> {
    return this.operationExecutionService.completeOperation(operationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить операцию' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.operationsService.remove(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Получить операции по заказу' })
  async getByOrder(
    @Param('orderId') orderId: string,
  ): Promise<Operation[]> {
    return this.operationsService.getOperationsByOrder(orderId);
  }

  @Get('machine/:machineName')
  @ApiOperation({ summary: 'Получить операции по станку' })
  async getByMachine(
    @Param('machineName') machineName: string,
  ): Promise<Operation[]> {
    return this.operationExecutionService.getOperationsByMachine(machineName);
  }

  // Legacy методы
  @Put('legacy/:id/start')
  @ApiOperation({ summary: 'Начать выполнение операции (legacy)' })
  async startOperationLegacy(@Param('id') id: string): Promise<Operation> {
    return this.operationsService.startOperation(id);
  }

  @Put('legacy/:id/complete')
  @ApiOperation({ summary: 'Завершить операцию (legacy)' })
  async completeOperationLegacy(@Param('id') id: string): Promise<Operation> {
    return this.operationsService.completeOperation(id);
  }

  @Get('legacy/machine/:machineId')
  @ApiOperation({ summary: 'Получить операции по ID станка (legacy)' })
  async getByMachineLegacy(
    @Param('machineId') machineId: string,
  ): Promise<Operation[]> {
    return this.operationsService.getOperationsByMachine(machineId);
  }
}