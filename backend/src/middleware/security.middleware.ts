import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  
  // Список подозрительных User-Agent строк
  private readonly suspiciousUserAgents = [
    'nmap', 'nikto', 'wikto', 'sf', 'sqlmap', 'bsqlbf', 'w3af', 
    'acunetix', 'havij', 'appscan', 'burp', 'masscan', 'dirb',
    'gobuster', 'dirbuster', 'hydra', 'metasploit', 'nessus',
    'openvas', 'nuclei', 'scrapy', 'python-requests', 'curl/7'
  ];

  // SQL инъекции паттерны
  private readonly sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /union(.|\n)*select/i,
    /select(.|\n)*from/i,
    /insert(.|\n)*into/i,
    /delete(.|\n)*from/i,
    /update(.|\n)*set/i,
    /drop(.|\n)*table/i,
    /create(.|\n)*table/i,
    /alter(.|\n)*table/i,
    /script(.|\n)*alert/i,
    /javascript(.|\n)*:/i,
    /vbscript(.|\n)*:/i
  ];

  // XSS паттерны
  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
    /onfocus=/gi,
    /onblur=/gi,
    /eval\(/gi,
    /expression\(/gi
  ];

  // Подозрительные пути
  private readonly suspiciousPaths = [
    '/wp-admin', '/wp-login', '/xmlrpc.php', '/wp-content',
    '/admin', '/administrator', '/manager', '/phpmyadmin',
    '/.env', '/.git', '/config', '/backup', '/test',
    '/shell', '/cmd', '/console', '/debug', '/api/debug',
    '/swagger', '/docs', '/metrics', '/health-detailed'
  ];

  use(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
    const startTime = Date.now();
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const requestId = this.generateRequestId();

    // Добавляем request ID для трейсинга
    req['requestId'] = requestId;

    // Логируем каждый запрос
    this.logger.log(`[${requestId}] ${req.method} ${req.originalUrl} - IP: ${clientIp} - UA: ${userAgent.substring(0, 100)}`);

    try {
      // 1. Проверка подозрительного User-Agent
      if (this.isSuspiciousUserAgent(userAgent)) {
        this.logSecurityEvent('SUSPICIOUS_USER_AGENT', {
          ip: clientIp,
          userAgent,
          path: req.originalUrl,
          requestId
        });
        return this.blockRequest(res, 'Suspicious User-Agent detected');
      }

      // 2. Проверка подозрительных путей
      if (this.isSuspiciousPath(req.originalUrl)) {
        this.logSecurityEvent('SUSPICIOUS_PATH', {
          ip: clientIp,
          path: req.originalUrl,
          userAgent: userAgent.substring(0, 100),
          requestId
        });
        return this.blockRequest(res, 'Access denied');
      }

      // 3. Проверка SQL инъекций в URL и параметрах
      if (this.containsSqlInjection(req.originalUrl) || this.containsSqlInjection(JSON.stringify(req.query))) {
        this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
          ip: clientIp,
          url: req.originalUrl,
          query: req.query,
          userAgent: userAgent.substring(0, 100),
          requestId
        });
        return this.blockRequest(res, 'Malicious request detected');
      }

      // 4. Проверка XSS в параметрах
      if (this.containsXss(JSON.stringify(req.query))) {
        this.logSecurityEvent('XSS_ATTEMPT', {
          ip: clientIp,
          query: req.query,
          userAgent: userAgent.substring(0, 100),
          requestId
        });
        return this.blockRequest(res, 'Malicious request detected');
      }

      // 5. Проверка размера запроса
      const contentLength = parseInt(req.headers['content-length'] || '0');
      if (contentLength > 50 * 1024 * 1024) { // 50MB
        this.logSecurityEvent('LARGE_REQUEST', {
          ip: clientIp,
          contentLength,
          path: req.originalUrl,
          requestId
        });
        return this.blockRequest(res, 'Request too large');
      }

      // 6. Проверка заголовков
      if (this.hasSuspiciousHeaders(req)) {
        this.logSecurityEvent('SUSPICIOUS_HEADERS', {
          ip: clientIp,
          headers: req.headers,
          requestId
        });
        return this.blockRequest(res, 'Suspicious headers detected');
      }

      // 7. Добавляем заголовки безопасности
      this.addSecurityHeaders(res);

      // 8. Логируем время выполнения при завершении
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        this.logger.log(
          `[${requestId}] ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms - IP: ${clientIp}`
        );

        // Логируем подозрительные коды ответов
        if (statusCode >= 400) {
          this.logSecurityEvent('HTTP_ERROR', {
            ip: clientIp,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            duration,
            userAgent: userAgent.substring(0, 100),
            requestId
          });
        }
      });

      next();
    } catch (error) {
      this.logger.error(`[${requestId}] Security middleware error:`, error);
      return this.blockRequest(res, 'Internal security error');
    }
  }

  private getClientIp(req: ExpressRequest): string {
    return (
      req.headers['cf-connecting-ip'] as string ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.headers['x-real-ip'] as string ||
      (req as any).connection?.remoteAddress ||
      (req as any).socket?.remoteAddress ||
      'unknown'
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const lowerUA = userAgent.toLowerCase();
    return this.suspiciousUserAgents.some(suspicious => 
      lowerUA.includes(suspicious.toLowerCase())
    );
  }

  private isSuspiciousPath(path: string): boolean {
    const lowerPath = path.toLowerCase();
    return this.suspiciousPaths.some(suspicious => 
      lowerPath.includes(suspicious.toLowerCase())
    );
  }

  private containsSqlInjection(input: string): boolean {
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  private containsXss(input: string): boolean {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  private hasSuspiciousHeaders(req: ExpressRequest): boolean {
    const headers = req.headers;
    
    // Проверка на отсутствие User-Agent (боты часто не отправляют)
    if (!headers['user-agent']) {
      return true;
    }

    // Проверка на подозрительные заголовки
    const suspiciousHeaders = [
      'x-scanner', 'x-forwarded-host', 'x-originating-ip',
      'x-remote-ip', 'x-remote-addr'
    ];

    return suspiciousHeaders.some(header => headers[header]);
  }

  private addSecurityHeaders(res: ExpressResponse): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Убираем информацию о сервере
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }

  private blockRequest(res: ExpressResponse, reason: string): void {
    res.status(444).json({
      error: 'Access Denied',
      message: 'Your request has been blocked by security policies',
      timestamp: new Date().toISOString()
    });
  }

  private logSecurityEvent(eventType: string, details: any): void {
    this.logger.warn(`🔒 SECURITY EVENT: ${eventType}`, details);
    
    // Здесь можно добавить отправку алертов в внешние системы
    // например, в Slack, Telegram, email или SIEM систему
    
    // Пример структуры для мониторинга
    const securityAlert = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getSeverityLevel(eventType),
      details,
      server: process.env.HOSTNAME || 'unknown',
      environment: process.env.NODE_ENV || 'unknown'
    };

    // TODO: Интеграция с системой алертов
    // await this.alertService.sendSecurityAlert(securityAlert);
  }

  private getSeverityLevel(eventType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const highSeverityEvents = ['SQL_INJECTION_ATTEMPT', 'XSS_ATTEMPT'];
    const mediumSeverityEvents = ['SUSPICIOUS_USER_AGENT', 'SUSPICIOUS_PATH'];
    
    if (highSeverityEvents.includes(eventType)) return 'HIGH';
    if (mediumSeverityEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }
}
