/**
 * @file: machines-enhanced.controller.ts
 * @description: Контроллер для расширенного API станков
 * @dependencies: services
 * @created: 2025-07-01
 */
import {
  Controller,
  Get,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MachinesService } from './machines.service';

@ApiTags('machines-enhanced')
@Controller('machines-enhanced')
export class MachinesEnhancedController {
  private readonly logger = new Logger(MachinesEnhancedController.name);

  constructor(
    private readonly machinesService: MachinesService,
  ) {}

  @Get('status/all')
  @ApiOperation({ summary: 'Получить статус всех станков с операциями (enhanced)' })
  async getAllWithStatus() {
    try {
      this.logger.log('Enhanced API: Получение всех станков с расширенной информацией и операциями');
      const machines = await this.machinesService.findAllWithOperations();
      
      this.logger.log(`Enhanced API: Возвращено ${machines.length} станков с операциями`);
      return machines;
    } catch (error) {
      this.logger.error('Enhanced API: Ошибка при получении станков с операциями:', error);
      throw error;
    }
  }
}
