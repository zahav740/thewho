/**
 * @file: translations.controller.ts
 * @description: Контроллер для API переводов
 * @created: 2025-01-28
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
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { TranslationsService, CreateTranslationDto, UpdateTranslationDto } from './translations.service';
import { Translation } from './translation.entity';
import { Public } from '../../common/decorators/public.decorator';

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  /**
   * Получить все переводы
   */
  @Get()
  async findAll(@Query('category') category?: string): Promise<Translation[]> {
    try {
      if (category) {
        return await this.translationsService.findByCategory(category);
      }
      return await this.translationsService.findAll();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch translations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Получить переводы в формате для клиента
   */
  @Public()
  @Get('client')
  async getClientTranslations(): Promise<{ ru: Record<string, string>; en: Record<string, string> }> {
    try {
      return await this.translationsService.getTranslationsForClient();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch client translations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Получить перевод по ключу
   */
  @Get(':key')
  async findByKey(@Param('key') key: string): Promise<Translation> {
    try {
      const translation = await this.translationsService.findByKey(key);
      if (!translation) {
        throw new HttpException(
          `Translation with key '${key}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      return translation;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Создать новый перевод
   */
  @Post()
  async create(@Body() createTranslationDto: CreateTranslationDto): Promise<Translation> {
    try {
      return await this.translationsService.create(createTranslationDto);
    } catch (error) {
      if (error.code === '23505') { // Уникальный ключ уже существует
        throw new HttpException(
          `Translation with key '${createTranslationDto.key}' already exists`,
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Обновить перевод
   */
  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() updateTranslationDto: UpdateTranslationDto,
  ): Promise<Translation> {
    try {
      return await this.translationsService.update(key, updateTranslationDto);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Translation with key '${key}' not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to update translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Удалить перевод
   */
  @Delete(':key')
  async delete(@Param('key') key: string): Promise<{ message: string }> {
    try {
      await this.translationsService.delete(key);
      return { message: `Translation with key '${key}' successfully deleted` };
    } catch (error) {
      throw new HttpException(
        'Failed to delete translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Создать или обновить перевод
   */
  @Post('upsert')
  async upsert(@Body() createTranslationDto: CreateTranslationDto): Promise<Translation> {
    try {
      return await this.translationsService.upsert(createTranslationDto);
    } catch (error) {
      throw new HttpException(
        'Failed to upsert translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Массовое создание/обновление переводов
   */
  @Post('bulk-upsert')
  async bulkUpsert(@Body() translations: CreateTranslationDto[]): Promise<Translation[]> {
    try {
      return await this.translationsService.bulkUpsert(translations);
    } catch (error) {
      throw new HttpException(
        'Failed to bulk upsert translations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
