/**
 * @file: pets.controller.ts
 * @description: Контроллер для работы с объявлениями о животных
 * @dependencies: PetsService, DTOs
 * @created: 2025-05-30
 */
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { Pet, PetType, PetStatus } from './entities/pet.entity';

@ApiTags('Pets - FindThePuppy')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать объявление о животном' })
  @ApiResponse({ status: 201, description: 'Объявление создано', type: Pet })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async create(@Body() createPetDto: CreatePetDto): Promise<Pet> {
    console.log('PetsController.create: Создание объявления о животном', createPetDto.title);
    return await this.petsService.create(createPetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список объявлений о животных' })
  @ApiQuery({ name: 'page', required: false, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, description: 'Количество на странице' })
  @ApiQuery({ name: 'type', required: false, enum: PetType, description: 'Тип объявления' })
  @ApiQuery({ name: 'status', required: false, enum: PetStatus, description: 'Статус объявления' })
  @ApiQuery({ name: 'animalType', required: false, description: 'Тип животного' })
  @ApiResponse({ status: 200, description: 'Список объявлений получен' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('type') type?: PetType,
    @Query('status') status?: PetStatus,
    @Query('animalType') animalType?: string,
  ) {
    console.log('PetsController.findAll: Запрос списка животных', { page, limit, type, status, animalType });
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    const result = await this.petsService.findAll(pageNum, limitNum, type, status, animalType);
    
    console.log(`PetsController.findAll: Найдено ${result.pets.length} объявлений из ${result.total}`);
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику объявлений' })
  @ApiResponse({ status: 200, description: 'Статистика получена' })
  async getStats() {
    console.log('PetsController.getStats: Запрос статистики');
    return await this.petsService.getStats();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Найти животных поблизости' })
  @ApiQuery({ name: 'lat', required: true, description: 'Широта' })
  @ApiQuery({ name: 'lng', required: true, description: 'Долгота' })
  @ApiQuery({ name: 'radius', required: false, description: 'Радиус поиска в км' })
  @ApiQuery({ name: 'type', required: false, enum: PetType, description: 'Тип объявления' })
  @ApiResponse({ status: 200, description: 'Список найденных животных' })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '10',
    @Query('type') type?: PetType,
  ) {
    console.log('PetsController.findNearby: Поиск поблизости', { lat, lng, radius, type });
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 10;
    
    return await this.petsService.findNearby(latitude, longitude, radiusKm, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить объявление по ID' })
  @ApiResponse({ status: 200, description: 'Объявление найдено', type: Pet })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Pet> {
    console.log('PetsController.findOne: Поиск объявления по ID', id);
    return await this.petsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить объявление' })
  @ApiResponse({ status: 200, description: 'Объявление обновлено', type: Pet })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @UsePipes(ValidationPipe)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePetDto: Partial<CreatePetDto>,
  ): Promise<Pet> {
    console.log('PetsController.update: Обновление объявления', id);
    return await this.petsService.update(id, updatePetDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Изменить статус объявления' })
  @ApiResponse({ status: 200, description: 'Статус изменен', type: Pet })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PetStatus,
  ): Promise<Pet> {
    console.log('PetsController.updateStatus: Изменение статуса', { id, status });
    return await this.petsService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить объявление' })
  @ApiResponse({ status: 204, description: 'Объявление удалено' })
  @ApiResponse({ status: 404, description: 'Объявление не найдено' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    console.log('PetsController.remove: Удаление объявления', id);
    await this.petsService.remove(id);
  }
}
