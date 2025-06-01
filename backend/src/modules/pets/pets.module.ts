/**
 * @file: pets.module.ts
 * @description: Модуль для работы с объявлениями о животных
 * @dependencies: TypeORM, Pet entity, PetsService, PetsController
 * @created: 2025-05-30
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { Pet } from './entities/pet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet]),
  ],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
