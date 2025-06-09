/**
 * @file: translations.service.ts
 * @description: Сервис для работы с переводами
 * @created: 2025-01-28
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation } from './translation.entity';

export interface CreateTranslationDto {
  key: string;
  ru: string;
  en: string;
  category?: string;
}

export interface UpdateTranslationDto {
  ru?: string;
  en?: string;
  category?: string;
}

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Translation)
    private translationRepository: Repository<Translation>,
  ) {}

  /**
   * Получить все переводы
   */
  async findAll(): Promise<Translation[]> {
    return this.translationRepository.find({
      order: { category: 'ASC', key: 'ASC' }
    });
  }

  /**
   * Получить переводы по категории
   */
  async findByCategory(category: string): Promise<Translation[]> {
    return this.translationRepository.find({
      where: { category },
      order: { key: 'ASC' }
    });
  }

  /**
   * Найти перевод по ключу
   */
  async findByKey(key: string): Promise<Translation | null> {
    return this.translationRepository.findOne({ where: { key } });
  }

  /**
   * Создать новый перевод
   */
  async create(createTranslationDto: CreateTranslationDto): Promise<Translation> {
    const translation = this.translationRepository.create(createTranslationDto);
    return this.translationRepository.save(translation);
  }

  /**
   * Обновить перевод
   */
  async update(key: string, updateTranslationDto: UpdateTranslationDto): Promise<Translation> {
    await this.translationRepository.update({ key }, updateTranslationDto);
    const updatedTranslation = await this.findByKey(key);
    if (!updatedTranslation) {
      throw new Error(`Translation with key ${key} not found`);
    }
    return updatedTranslation;
  }

  /**
   * Удалить перевод
   */
  async delete(key: string): Promise<void> {
    await this.translationRepository.delete({ key });
  }

  /**
   * Создать или обновить перевод
   */
  async upsert(createTranslationDto: CreateTranslationDto): Promise<Translation> {
    const existing = await this.findByKey(createTranslationDto.key);
    
    if (existing) {
      return this.update(createTranslationDto.key, {
        ru: createTranslationDto.ru,
        en: createTranslationDto.en,
        category: createTranslationDto.category,
      });
    } else {
      return this.create(createTranslationDto);
    }
  }

  /**
   * Массовое создание/обновление переводов
   */
  async bulkUpsert(translations: CreateTranslationDto[]): Promise<Translation[]> {
    const results: Translation[] = [];
    
    for (const translation of translations) {
      const result = await this.upsert(translation);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Получить переводы в формате для клиента
   */
  async getTranslationsForClient(): Promise<{ ru: Record<string, string>; en: Record<string, string> }> {
    const translations = await this.findAll();
    
    const result = {
      ru: {} as Record<string, string>,
      en: {} as Record<string, string>,
    };

    translations.forEach((translation) => {
      result.ru[translation.key] = translation.ru;
      result.en[translation.key] = translation.en;
    });

    return result;
  }
}
