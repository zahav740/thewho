/**
 * @file: pets.service.ts
 * @description: Сервис для работы с объявлениями о животных
 * @dependencies: TypeORM, Pet entity
 * @created: 2025-05-30
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PetStatus, PetType } from './entities/pet.entity';
import { CreatePetDto } from './dto/create-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  async create(createPetDto: CreatePetDto): Promise<Pet> {
    const pet = this.petRepository.create(createPetDto);
    return await this.petRepository.save(pet);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: PetType,
    status?: PetStatus,
    animalType?: string,
  ): Promise<{ pets: Pet[]; total: number; page: number; limit: number }> {
    const query = this.petRepository.createQueryBuilder('pet');
    
    if (type) {
      query.andWhere('pet.type = :type', { type });
    }
    
    if (status) {
      query.andWhere('pet.status = :status', { status });
    } else {
      // По умолчанию показываем только активные объявления
      query.andWhere('pet.status = :status', { status: PetStatus.ACTIVE });
    }
    
    if (animalType) {
      query.andWhere('LOWER(pet.animalType) LIKE LOWER(:animalType)', { 
        animalType: `%${animalType}%` 
      });
    }

    query.orderBy('pet.createdAt', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    const [pets, total] = await query.getManyAndCount();

    return {
      pets,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException(`Pet with ID ${id} not found`);
    }
    return pet;
  }

  async update(id: string, updateData: Partial<CreatePetDto>): Promise<Pet> {
    const pet = await this.findOne(id);
    Object.assign(pet, updateData);
    return await this.petRepository.save(pet);
  }

  async remove(id: string): Promise<void> {
    const pet = await this.findOne(id);
    await this.petRepository.remove(pet);
  }

  async updateStatus(id: string, status: PetStatus): Promise<Pet> {
    const pet = await this.findOne(id);
    pet.status = status;
    return await this.petRepository.save(pet);
  }

  // Поиск по геолокации (в радиусе от точки)
  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    type?: PetType,
  ): Promise<Pet[]> {
    const query = `
      SELECT *, 
        (6371 * acos(
          cos(radians($1)) * 
          cos(radians("lastSeenLatitude")) * 
          cos(radians("lastSeenLongitude") - radians($2)) + 
          sin(radians($1)) * 
          sin(radians("lastSeenLatitude"))
        )) AS distance
      FROM pets 
      WHERE "lastSeenLatitude" IS NOT NULL 
        AND "lastSeenLongitude" IS NOT NULL
        AND status = 'active'
        ${type ? `AND type = '${type}'` : ''}
      HAVING distance < $3
      ORDER BY distance;
    `;

    return await this.petRepository.query(query, [latitude, longitude, radiusKm]);
  }

  // Статистика
  async getStats(): Promise<{
    total: number;
    lost: number;
    found: number;
    resolved: number;
    active: number;
  }> {
    const [total, lost, found, resolved, active] = await Promise.all([
      this.petRepository.count(),
      this.petRepository.count({ where: { type: PetType.LOST } }),
      this.petRepository.count({ where: { type: PetType.FOUND } }),
      this.petRepository.count({ where: { status: PetStatus.RESOLVED } }),
      this.petRepository.count({ where: { status: PetStatus.ACTIVE } }),
    ]);

    return { total, lost, found, resolved, active };
  }
}
