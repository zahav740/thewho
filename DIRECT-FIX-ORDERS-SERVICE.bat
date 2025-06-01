@echo off
echo ====================================
echo DIRECT REPLACEMENT FIX FOR BAD REQUEST ERROR
echo ====================================
echo.
echo Creating fixed service file...

echo // Fixed OrdersService > orders.service.fixed.js
echo const fs = require('fs'); >> orders.service.fixed.js
echo const fixedContent = `/** 
 * @file: orders.service.ts
 * @description: Fixed service for orders (400 Bad Request error fix)
 * @dependencies: typeorm, entities
 * @created: 2025-01-28
 * @updated: 2025-05-31
 */
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { Operation } from '../../database/entities/operation.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersFilterDto } from './dto/orders-filter.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
  ) {}

  async findAll(filterDto?: OrdersFilterDto) {
    try {
      console.log('OrdersService.findAll: Getting all orders');
      console.log('OrdersService.findAll: Filter:', filterDto);

      const queryBuilder = this.orderRepository.createQueryBuilder('order');

      if (filterDto?.search) {
        queryBuilder.where(
          'order.drawingNumber ILIKE :search OR order.workType ILIKE :search',
          { search: \`%\${filterDto.search}%\` }
        );
      }

      queryBuilder.orderBy('order.priority', 'ASC')
                  .addOrderBy('order.deadline', 'ASC');

      let page = filterDto?.page || 1;
      let limit = filterDto?.limit || 10;

      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      console.log(\`OrdersService.findAll: Found \${orders.length} orders out of \${total} total\`);

      const enrichedOrders = orders.map(order => this.enrichOrder(order));

      return {
        data: enrichedOrders,
        total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit) || 1
      };
    } catch (error) {
      console.error('OrdersService.findAll Error:', error);
      throw new InternalServerErrorException('Error getting orders list');
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      console.log(\`OrdersService.findOne: Finding order with ID \${id}\`);

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new NotFoundException(\`Invalid order ID: \${id}\`);
      }

      const order = await this.orderRepository.findOne({
        where: { id: numericId }
      });

      if (!order) {
        throw new NotFoundException(\`Order with ID \${id} not found\`);
      }

      console.log(\`OrdersService.findOne: Found order \${order.drawingNumber}\`);

      const enrichedOrder = this.enrichOrder({ ...order });
      enrichedOrder.operations = [];

      return enrichedOrder;
    } catch (error) {
      console.error(\`OrdersService.findOne Error for ID \${id}:\`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(\`Error finding order with ID \${id}\`);
    }
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      console.log('OrdersService.create: Creating new order:', createOrderDto);

      const { operations: operationsDto, ...orderData } = createOrderDto;

      // Safe type conversion
      const priorityValue = parseInt(String(orderData.priority), 10);
      if (isNaN(priorityValue)) {
        throw new BadRequestException(\`Invalid priority value: \${orderData.priority}\`);
      }

      const orderEntityData = {
        ...orderData,
        priority: priorityValue,
        deadline: new Date(orderData.deadline)
      };

      const orderEntity = this.orderRepository.create(orderEntityData);
      const savedOrder = await this.orderRepository.save(orderEntity);

      console.log(\`OrdersService.create: Created order with ID \${savedOrder.id}\`);

      let createdOperationsEntities = [];
      if (operationsDto && operationsDto.length > 0) {
        console.log(\`OrdersService.create: Creating \${operationsDto.length} operations\`);
        try {
          const operationEntities = operationsDto.map(opDto => {
            // Safe machineAxes conversion
            const machineAxes = typeof opDto.machineAxes === 'number' 
              ? \`\${opDto.machineAxes}-axis\` 
              : (String(opDto.machineAxes).includes('-axis') 
                ? String(opDto.machineAxes) 
                : \`\${opDto.machineAxes || 3}-axis\`);
            
            return this.operationRepository.create({
              sequenceNumber: opDto.operationNumber,
              operationType: opDto.operationType,
              estimatedTime: opDto.estimatedTime,
              machine: machineAxes,
              status: 'pending',
              completedUnits: 0,
              operators: [],
              order: savedOrder,
            });
          });
          
          createdOperationsEntities = await this.operationRepository.save(operationEntities);
          console.log(\`OrdersService.create: Operations created (\${createdOperationsEntities.length})\`);
        } catch (opError) {
          console.error('OrdersService.create: Error creating operations:', opError);
        }
      }

      const enrichedOrder = this.enrichOrder(savedOrder);

      if (createdOperationsEntities.length > 0) {
         enrichedOrder.operations = createdOperationsEntities.map(op => ({
           id: op.id,
           operationNumber: op.sequenceNumber,
           operationType: op.operationType,
           machineAxes: this.extractMachineAxesNumber(op.machine),
           estimatedTime: op.estimatedTime,
           status: op.status,
           completedUnits: op.completedUnits,
         }));
      } else {
        enrichedOrder.operations = [];
      }

      return enrichedOrder;
    } catch (error) {
      console.error('OrdersService.create Error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating order');
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      console.log(\`OrdersService.update: Updating order \${id}:\`, updateOrderDto);

      const order = await this.findOne(id);

      const { operations: operationsDto, ...orderDataToUpdate } = updateOrderDto;

      const processedUpdateData = {};
      
      if (orderDataToUpdate.drawingNumber !== undefined) {
        processedUpdateData.drawingNumber = orderDataToUpdate.drawingNumber;
      }
      if (orderDataToUpdate.quantity !== undefined) {
        processedUpdateData.quantity = orderDataToUpdate.quantity;
      }
      if (orderDataToUpdate.workType !== undefined) {
        processedUpdateData.workType = orderDataToUpdate.workType;
      }
      if (orderDataToUpdate.priority !== undefined) {
        const priorityValue = parseInt(String(orderDataToUpdate.priority), 10);
        if (isNaN(priorityValue)) {
          throw new BadRequestException(\`Invalid priority value: \${orderDataToUpdate.priority}\`);
        }
        processedUpdateData.priority = priorityValue;
      }
      if (orderDataToUpdate.deadline !== undefined) {
        processedUpdateData.deadline = new Date(orderDataToUpdate.deadline);
      }

      this.orderRepository.merge(order, processedUpdateData);
      const updatedOrderEntity = await this.orderRepository.save(order);

      console.log(\`OrdersService.update: Basic order data \${id} updated.\`);

      let updatedOperationsResult = [];

      if (operationsDto !== undefined) {
        console.log(\`OrdersService.update: Updating operations for order \${id}\`);
        try {
          await this.operationRepository.delete({ order: { id: updatedOrderEntity.id } });
          console.log(\`OrdersService.update: Old operations for order \${id} deleted.\`);

          if (operationsDto && operationsDto.length > 0) {
            const newOperationEntities = operationsDto.map(opDto => {
              // Safe machineAxes conversion
              const machineAxes = typeof opDto.machineAxes === 'number' 
                ? \`\${opDto.machineAxes}-axis\` 
                : (String(opDto.machineAxes).includes('-axis') 
                  ? String(opDto.machineAxes) 
                  : \`\${opDto.machineAxes || 3}-axis\`);
              
              return this.operationRepository.create({
                sequenceNumber: opDto.operationNumber,
                operationType: opDto.operationType,
                estimatedTime: opDto.estimatedTime,
                machine: machineAxes,
                status: opDto.status || 'pending',
                completedUnits: opDto.completedUnits || 0,
                operators: [],
                order: updatedOrderEntity,
              });
            });
            
            const savedNewOperations = await this.operationRepository.save(newOperationEntities);
            console.log(\`OrdersService.update: Created \${savedNewOperations.length} new operations.\`);
            
            updatedOperationsResult = savedNewOperations.map(op => ({
              id: op.id,
              operationNumber: op.sequenceNumber,
              operationType: op.operationType,
              machineAxes: this.extractMachineAxesNumber(op.machine),
              estimatedTime: op.estimatedTime,
              status: op.status,
              completedUnits: op.completedUnits,
            }));
          } else {
            console.log(\`OrdersService.update: No new operations to create.\`);
          }
        } catch (opError) {
          console.error(\`OrdersService.update: Error updating operations:\`, opError);
        }
      }

      const enrichedUpdatedOrder = this.enrichOrder(updatedOrderEntity);
      enrichedUpdatedOrder.operations = updatedOperationsResult;

      console.log(\`OrdersService.update: Updated order \${updatedOrderEntity.id}\`);
      return enrichedUpdatedOrder;
    } catch (error) {
      console.error(\`OrdersService.update Error for ID \${id}:\`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(\`Error updating order with ID \${id}\`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      console.log(\`OrdersService.remove: Deleting order \${id}\`);
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new NotFoundException(\`Invalid order ID for deletion: \${id}\`);
      }

      const order = await this.orderRepository.findOneBy({ id: numericId });
      if (!order) {
        throw new NotFoundException(\`Order with ID \${id} not found for deletion\`);
      }
      
      const result = await this.orderRepository.delete(numericId);

      if (result.affected === 0) {
        throw new NotFoundException(\`Order with ID \${id} not found (maybe deleted concurrently)\`);
      }
      console.log(\`OrdersService.remove: Deleted order \${id}\`);
    } catch (error) {
      console.error(\`OrdersService.remove Error for ID \${id}:\`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(\`Error deleting order with ID \${id}\`);
    }
  }

  async removeBatch(ids: string[]): Promise<number> {
    try {
      console.log(\`OrdersService.removeBatch: Deleting \${ids.length} orders\`);
      const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (numericIds.length === 0) {
        console.warn('OrdersService.removeBatch: No valid IDs for deletion.');
        return 0;
      }
      
      const result = await this.orderRepository.delete(numericIds);
      const deletedCount = result.affected || 0;

      console.log(\`OrdersService.removeBatch: Deleted \${deletedCount} orders\`);
      return deletedCount;
    } catch (error) {
      console.error('OrdersService.removeBatch Error:', error);
      throw new InternalServerErrorException('Error batch deleting orders');
    }
  }

  async removeAll(): Promise<number> {
    try {
      console.log('OrdersService.removeAll: Deleting all orders');
      await this.operationRepository.clear();
      console.log('OrdersService.removeAll: All operations deleted.');

      const count = await this.orderRepository.count();
      await this.orderRepository.clear();

      console.log(\`OrdersService.removeAll: Deleted \${count} orders\`);
      return count;
    } catch (error) {
      console.error('OrdersService.removeAll Error:', error);
      throw new InternalServerErrorException('Error deleting all orders');
    }
  }

  async uploadPdf(id: string, filename: string): Promise<Order> {
    try {
      console.log(\`OrdersService.uploadPdf: Uploading PDF for order \${id}\`);
      const order = await this.findOne(id);
      order.pdfPath = filename;
      const updatedOrder = await this.orderRepository.save(order);

      console.log(\`OrdersService.uploadPdf: PDF uploaded for order \${id}\`);
      return this.enrichOrder(updatedOrder);
    } catch (error) {
      console.error(\`OrdersService.uploadPdf Error for ID \${id}:\`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(\`Error uploading PDF for order \${id}\`);
    }
  }

  // Helper method to extract number from "3-axis" string
  private extractMachineAxesNumber(machineStr: string): number {
    if (!machineStr) return 3;
    try {
      const match = machineStr.match(/(\\d+)/);
      return match && match[1] ? parseInt(match[1], 10) : 3;
    } catch (e) {
      return 3; // Default 3 axes
    }
  }

  private enrichOrder(order: Order): Order {
    const enriched = { ...order } as any;

    enriched.name = enriched.drawingNumber || 'Unnamed';
    enriched.clientName = enriched.clientName || 'Not specified';
    enriched.remainingQuantity = enriched.quantity;
    enriched.status = enriched.status || 'planned';
    enriched.completionPercentage = enriched.completionPercentage || 0;
    enriched.forecastedCompletionDate = enriched.deadline;
    enriched.isOnSchedule = true;
    enriched.lastRecalculationAt = enriched.updatedAt || enriched.createdAt || new Date();
    
    enriched.operations = enriched.operations || [];

    return enriched as Order;
  }
}`; >> orders.service.fixed.js
echo. >> orders.service.fixed.js
echo // Write to file >> orders.service.fixed.js
echo fs.writeFileSync('backend/src/modules/orders/orders.service.ts', fixedContent, 'utf8'); >> orders.service.fixed.js
echo console.log('Fixed orders.service.ts file created'); >> orders.service.fixed.js

echo.
echo Stopping application...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Applying fixed service...
node orders.service.fixed.js

echo.
echo Restarting application...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ====================================
echo Direct fix successfully applied!
echo.
echo Orders and operations should now work correctly.
echo ====================================
pause
