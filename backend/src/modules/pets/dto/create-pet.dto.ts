/**
 * @file: create-pet.dto.ts
 * @description: DTO для создания объявления о животном
 * @dependencies: class-validator
 * @created: 2025-05-30
 */
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsEmail, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';
import { PetType, AnimalSize } from '../entities/pet.entity';

export class CreatePetDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsEnum(PetType)
  type: PetType;

  @IsString()
  animalType: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsEnum(AnimalSize)
  size?: AnimalSize;

  @IsOptional()
  @IsNumber()
  lastSeenLatitude?: number;

  @IsOptional()
  @IsNumber()
  lastSeenLongitude?: number;

  @IsOptional()
  @IsString()
  lastSeenAddress?: string;

  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  preferredContact?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsNumber()
  reward?: number;

  @IsString()
  userId: string;

  @IsString()
  userName: string;
}
