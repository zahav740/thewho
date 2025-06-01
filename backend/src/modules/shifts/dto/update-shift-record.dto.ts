/**
 * @file: update-shift-record.dto.ts
 * @description: DTO для обновления записи смены
 * @dependencies: create-shift-record.dto
 * @created: 2025-01-28
 */
import { PartialType } from '@nestjs/swagger';
import { CreateShiftRecordDto } from './create-shift-record.dto';

export class UpdateShiftRecordDto extends PartialType(CreateShiftRecordDto) {}
