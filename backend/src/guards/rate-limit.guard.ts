import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request as ExpressRequest } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  lastRequest: number;
}

interface BruteForceInfo {
  attempts: number;
  lockUntil: number;
  lastAttempt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  
  // Хранилище для rate limiting (в продакшене лучше использовать Redis)
  private readonly rateLimitStore = new Map<string, RateLimitInfo>();
  
  // Хранилище для защиты от брутфорса
  private readonly bruteForceStore = new Map<string, BruteForceInfo>();
  
  // Настройки по умолчанию
  private readonly defaultLimits = {
    // Общие лимиты
    general: { requests: 100, window: 15 * 60 * 1000 }, // 100 запросов за 15 минут
    
    // Лимиты для аутентификации
    auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 попыток входа за 15 минут
    
    // Лимиты для API
    api: { requests: 200, window: 15 * 60 * 1000 }, // 200 API запросов за 15 минут
    
    // Лимиты для загрузки файлов
    upload: { requests: 10, window: 60 * 60 * 1000 }, // 10 загрузок за час
    
    // Лимиты для экспорта данных
    export: { requests: 3, window: 60 * 60 * 1000 }, // 3 экспорта за час
  };

  constructor(private reflector: Reflector) {
    // Очистка старых записей каждые 5 минут
    setInterval(() => {
      this.cleanupOldEntries();
    }, 5 * 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const clientIp = this.getClientIp(request);
    const endpoint = `${request.method} ${request.route?.path || request.path}`;
    
    // Получаем настройки лимитов для данного эндпоинта
    const limitType = this.getLimitType(request);
    const limits = this.defaultLimits[limitType];

    try {
      // Проверяем общий rate limit
      if (!this.checkRateLimit(clientIp, limits, endpoint)) {
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: clientIp,
          endpoint,
          limitType,
          limits
        });
        
        throw new HttpException({
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Try again in ${Math.ceil(limits.window / 60000)} minutes.`,
          retryAfter: Math.ceil(limits.window / 1000)
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      // Дополнительная проверка для аутентификации
      if (limitType === 'auth') {
        if (!this.checkBruteForceProtection(clientIp, endpoint)) {
          this.logSecurityEvent('BRUTE_FORCE_ATTEMPT', {
            ip: clientIp,
            endpoint,
            attempts: this.bruteForceStore.get(clientIp)?.attempts || 0
          });
          
          throw new HttpException({
            error: 'Account Locked',
            message: 'Too many failed login attempts. Account temporarily locked.',
            lockTime: 15 * 60 // 15 минут
          }, HttpStatus.TOO_MANY_REQUESTS);
        }
      }

      // Логируем подозрительную активность (много запросов близко к лимиту)
      const currentCount = this.rateLimitStore.get(clientIp)?.count || 0;
      if (currentCount > limits.requests * 0.8) { // 80% от лимита
        this.logSecurityEvent('HIGH_REQUEST_RATE', {
          ip: clientIp,
          endpoint,
          currentCount,
          limit: limits.requests,
          percentage: Math.round((currentCount / limits.requests) * 100)
        });
      }

      return true;
    } catch (error) {
      // Логируем все заблокированные запросы
      this.logger.warn(`Rate limit block: IP ${clientIp}, endpoint ${endpoint}, type ${limitType}`);
      throw error;
    }
  }

  private checkRateLimit(clientIp: string, limits: { requests: number; window: number }, endpoint: string): boolean {
    const now = Date.now();
    const key = clientIp;
    
    let rateLimitInfo = this.rateLimitStore.get(key);
    
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      // Создаем новое окно или сбрасываем старое
      rateLimitInfo = {
        count: 1,
        resetTime: now + limits.window,
        lastRequest: now
      };
      this.rateLimitStore.set(key, rateLimitInfo);
      return true;
    }

    // Проверяем, не превышен ли лимит
    if (rateLimitInfo.count >= limits.requests) {
      return false;
    }

    // Увеличиваем счетчик
    rateLimitInfo.count++;
    rateLimitInfo.lastRequest = now;
    this.rateLimitStore.set(key, rateLimitInfo);
    
    return true;
  }

  private checkBruteForceProtection(clientIp: string, endpoint: string): boolean {
    const now = Date.now();
    const key = clientIp;
    
    let bruteForceInfo = this.bruteForceStore.get(key);
    
    if (!bruteForceInfo) {
      bruteForceInfo = {
        attempts: 1,
        lockUntil: 0,
        lastAttempt: now
      };
      this.bruteForceStore.set(key, bruteForceInfo);
      return true;
    }

    // Проверяем, заблокирован ли IP
    if (now < bruteForceInfo.lockUntil) {
      return false;
    }

    // Сбрасываем счетчик если прошло более 1 часа с последней попытки
    if (now - bruteForceInfo.lastAttempt > 60 * 60 * 1000) {
      bruteForceInfo.attempts = 1;
      bruteForceInfo.lockUntil = 0;
    } else {
      bruteForceInfo.attempts++;
    }

    bruteForceInfo.lastAttempt = now;

    // Блокируем после 5 неудачных попыток на 15 минут
    if (bruteForceInfo.attempts >= 5) {
      bruteForceInfo.lockUntil = now + (15 * 60 * 1000); // 15 минут
      this.bruteForceStore.set(key, bruteForceInfo);
      return false;
    }

    this.bruteForceStore.set(key, bruteForceInfo);
    return true;
  }

  private getLimitType(request: ExpressRequest): keyof typeof RateLimitGuard.prototype.defaultLimits {
    const path = request.path.toLowerCase();
    const method = request.method.toLowerCase();

    // Аутентификация
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return 'auth';
    }

    // Загрузка файлов
    if ((method === 'post' && path.includes('/upload')) || path.includes('/files')) {
      return 'upload';
    }

    // Экспорт данных
    if (path.includes('/export') || path.includes('/download') || 
        (method === 'get' && (path.includes('/excel') || path.includes('/pdf')))) {
      return 'export';
    }

    // API эндпоинты
    if (path.startsWith('/api/')) {
      return 'api';
    }

    // Общие лимиты для всего остального
    return 'general';
  }

  private getClientIp(request: ExpressRequest): string {
    return (
      request.headers['cf-connecting-ip'] as string ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] as string ||
      (request as any).connection?.remoteAddress ||
      (request as any).socket?.remoteAddress ||
      'unknown'
    );
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Очистка rate limit записей
    for (const [key, info] of this.rateLimitStore.entries()) {
      if (now > info.resetTime) {
        this.rateLimitStore.delete(key);
        cleanedCount++;
      }
    }

    // Очистка brute force записей
    for (const [key, info] of this.bruteForceStore.entries()) {
      if (now > info.lockUntil && (now - info.lastAttempt) > 60 * 60 * 1000) {
        this.bruteForceStore.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} old rate limit entries`);
    }
  }

  // Метод для ручного сброса лимитов (для административных целей)
  public resetLimitsForIp(ip: string): void {
    this.rateLimitStore.delete(ip);
    this.bruteForceStore.delete(ip);
    this.logger.log(`Rate limits reset for IP: ${ip}`);
  }

  // Метод для получения статистики
  public getStatistics() {
    return {
      totalTrackedIps: this.rateLimitStore.size,
      blockedIps: Array.from(this.bruteForceStore.entries())
        .filter(([, info]) => Date.now() < info.lockUntil)
        .map(([ip]) => ip),
      rateLimitEntries: this.rateLimitStore.size,
      bruteForceEntries: this.bruteForceStore.size
    };
  }

  private logSecurityEvent(eventType: string, details: any): void {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getSeverityLevel(eventType),
      details,
      source: 'RateLimitGuard'
    };

    this.logger.warn(`🔒 SECURITY EVENT: ${eventType}`, securityEvent);
    
    // TODO: Интеграция с системой алертов
    // await this.alertService.sendSecurityAlert(securityEvent);
  }

  private getSeverityLevel(eventType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (eventType) {
      case 'BRUTE_FORCE_ATTEMPT':
        return 'HIGH';
      case 'RATE_LIMIT_EXCEEDED':
        return 'MEDIUM';
      case 'HIGH_REQUEST_RATE':
        return 'LOW';
      default:
        return 'LOW';
    }
  }
}

// Декоратор для настройки лимитов для конкретных эндпоинтов
export const RateLimit = (requests: number, windowMs: number) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('rate-limit', { requests, windowMs }, descriptor.value);
  };
};
