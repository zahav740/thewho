/**
 * @file: recommended-order.dto.ts
 * @description: DTO для рекомендуемых заказов
 * @dependencies: -
 * @created: 2025-01-28
 * @updated: 2025-05-28
 */
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../../../database/entities/order.entity';

export class RecommendedOrderDto {
  @ApiProperty()
  orderId: number; // Integer ID

  @ApiProperty()
  operationId: string; // UUID операции

  @ApiProperty()
  drawingNumber: string;

  @ApiProperty()
  revision: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  operationNumber: number;

  @ApiProperty()
  operationType: string;

  @ApiProperty()
  estimatedTime: number;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty()
  deadline: Date;

  @ApiProperty({ required: false })
  pdfUrl?: string;

  @ApiProperty({ required: false })
  previewUrl?: string;

  @ApiProperty({ required: false })
  previewHtml?: string;
}