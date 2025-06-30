import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const clientIp = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'Unknown';
    const requestId = request['requestId'] || 'unknown';
    
    let status: number;
    let message: string;
    let errorCode: string;
    let details: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || exception.message;
        details = errorResponse;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_ERROR';
      
      // Логируем полную информацию об ошибке для внутреннего использования
      this.logger.error(`[${requestId}] Unhandled exception:`, {
        error: exception.message,
        stack: exception.stack,
        ip: clientIp,
        path: request.originalUrl,
        method: request.method,
        userAgent: userAgent.substring(0, 100)
      });
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown error occurred';
      errorCode = 'UNKNOWN_ERROR';
      
      this.logger.error(`[${requestId}] Unknown exception type:`, exception);
    }

    // Определяем тип безопасности ошибки
    const securityErrorType = this.getSecurityErrorType(status, message, request.originalUrl);
    
    // Логируем события безопасности
    if (this.isSecurityRelated(status, message)) {
      this.logSecurityEvent(securityErrorType, {
        ip: clientIp,
        path: request.originalUrl,
        method: request.method,
        statusCode: status,
        message: message,
        userAgent: userAgent.substring(0, 100),
        requestId,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        timestamp: new Date().toISOString()
      });
    }

    // Формируем ответ в зависимости от типа ошибки
    const responseBody = this.createSecureResponse(status, message, errorCode, details, requestId);
    
    // Добавляем заголовки безопасности
    this.addSecurityHeaders(response, status);
    
    // Логируем ошибку
    this.logger.warn(
      `[${requestId}] ${request.method} ${request.originalUrl} - ${status} - IP: ${clientIp} - Error: ${message}`
    );

    response.status(status).json(responseBody);
  }

  private getClientIp(request: Request): string {
    return (
      request.get('CF-Connecting-IP') ||
      request.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      request.get('X-Real-IP') ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private isSecurityRelated(status: number, message: string): boolean {
    // Коды состояния связанные с безопасностью
    const securityStatusCodes = [401, 403, 429, 444];
    
    // Ключевые слова в сообщениях связанные с безопасностью
    const securityKeywords = [
      'unauthorized', 'forbidden', 'access denied', 'rate limit', 
      'suspicious', 'blocked', 'malicious', 'injection', 'xss',
      'csrf', 'authentication', 'invalid token', 'expired token'
    ];

    const lowerMessage = message.toLowerCase();
    
    return securityStatusCodes.includes(status) || 
           securityKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private getSecurityErrorType(status: number, message: string, path: string): string {
    const lowerMessage = message.toLowerCase();
    const lowerPath = path.toLowerCase();

    if (status === 401) return 'UNAUTHORIZED_ACCESS';
    if (status === 403) return 'FORBIDDEN_ACCESS';
    if (status === 429) return 'RATE_LIMIT_VIOLATION';
    if (status === 444) return 'BLOCKED_REQUEST';
    
    if (lowerMessage.includes('injection') || lowerMessage.includes('sql')) return 'SQL_INJECTION_BLOCKED';
    if (lowerMessage.includes('xss')) return 'XSS_BLOCKED';
    if (lowerMessage.includes('csrf')) return 'CSRF_BLOCKED';
    if (lowerMessage.includes('suspicious')) return 'SUSPICIOUS_ACTIVITY';
    if (lowerMessage.includes('malicious')) return 'MALICIOUS_REQUEST';
    if (lowerPath.includes('/auth/')) return 'AUTH_ERROR';
    
    return 'SECURITY_ERROR';
  }

  private createSecureResponse(status: number, message: string, errorCode: string, details: any, requestId: string): any {
    // В продакшене не раскрываем подробности ошибок
    const isProduction = process.env.NODE_ENV === 'production';
    
    const baseResponse = {
      success: false,
      error: {
        code: errorCode || this.getErrorCodeFromStatus(status),
        message: isProduction ? this.getSafeErrorMessage(status) : message,
        timestamp: new Date().toISOString(),
        requestId
      }
    };

    // Добавляем дополнительные поля только для определенных ошибок
    if (status === 429 && details.retryAfter) {
      baseResponse.error['retryAfter'] = details.retryAfter;
    }

    if (status === 422 && details.validationErrors && !isProduction) {
      baseResponse.error['validationErrors'] = details.validationErrors;
    }

    return baseResponse;
  }

  private getSafeErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request';
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 409:
        return 'Conflict detected';
      case 422:
        return 'Invalid input data';
      case 429:
        return 'Too many requests';
      case 444:
        return 'Request blocked';
      case 500:
        return 'Internal server error';
      case 502:
        return 'Bad gateway';
      case 503:
        return 'Service temporarily unavailable';
      default:
        return 'An error occurred';
    }
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 444: return 'BLOCKED';
      case 500: return 'INTERNAL_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'UNKNOWN_ERROR';
    }
  }

  private addSecurityHeaders(response: Response, status: number): void {
    // Стандартные заголовки безопасности
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Убираем информацию о сервере
    response.removeHeader('X-Powered-By');
    response.removeHeader('Server');
    
    // Для заблокированных запросов добавляем дополнительные заголовки
    if (status === 444 || status === 429) {
      response.setHeader('X-Request-Blocked', 'true');
    }
    
    // Для ошибок аутентификации
    if (status === 401) {
      response.setHeader('WWW-Authenticate', 'Bearer realm="API"');
    }
  }

  private sanitizeHeaders(headers: any): any {
    // Удаляем чувствительную информацию из заголовков перед логированием
    const sanitized = { ...headers };
    
    // Удаляем авторизационные заголовки
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    
    // Обрезаем длинные заголовки
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + '...';
      }
    });
    
    return sanitized;
  }

  private logSecurityEvent(eventType: string, details: any): void {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getSeverityLevel(eventType),
      details,
      source: 'SecurityExceptionFilter',
      environment: process.env.NODE_ENV || 'unknown',
      server: process.env.HOSTNAME || 'unknown'
    };

    this.logger.warn(`🔒 SECURITY EXCEPTION: ${eventType}`, securityEvent);
    
    // TODO: Интеграция с системой алертов
    // await this.alertService.sendSecurityAlert(securityEvent);
    
    // TODO: Интеграция с SIEM системой
    // await this.siemService.sendEvent(securityEvent);
  }

  private getSeverityLevel(eventType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalEvents = ['SQL_INJECTION_BLOCKED', 'XSS_BLOCKED'];
    const highEvents = ['UNAUTHORIZED_ACCESS', 'FORBIDDEN_ACCESS', 'MALICIOUS_REQUEST'];
    const mediumEvents = ['RATE_LIMIT_VIOLATION', 'SUSPICIOUS_ACTIVITY', 'AUTH_ERROR'];
    
    if (criticalEvents.includes(eventType)) return 'CRITICAL';
    if (highEvents.includes(eventType)) return 'HIGH';
    if (mediumEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }
}

// Вспомогательный класс для создания кастомных исключений безопасности
export class SecurityException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.FORBIDDEN,
    public readonly securityEventType?: string,
    public readonly additionalDetails?: any
  ) {
    super(
      {
        error: 'Security Violation',
        message,
        timestamp: new Date().toISOString(),
        ...(additionalDetails && { details: additionalDetails })
      },
      status
    );
  }
}

// Специализированные исключения
export class RateLimitException extends SecurityException {
  constructor(retryAfter: number, message = 'Rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_VIOLATION', { retryAfter });
  }
}

export class SuspiciousActivityException extends SecurityException {
  constructor(activityType: string, details?: any) {
    super(
      'Suspicious activity detected',
      HttpStatus.FORBIDDEN,
      'SUSPICIOUS_ACTIVITY',
      { activityType, ...details }
    );
  }
}

export class MaliciousRequestException extends SecurityException {
  constructor(attackType: string, details?: any) {
    super(
      'Malicious request blocked',
      444 as any, // Custom status code
      'MALICIOUS_REQUEST',
      { attackType, ...details }
    );
  }
}
