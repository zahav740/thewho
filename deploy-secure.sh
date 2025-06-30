#!/bin/bash

# Скрипт безопасного развертывания Production CRM
# Автор: CRM Security Team
# Дата: 2025

set -euo pipefail  # Строгий режим bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
LOG_FILE="/var/log/crm-deployment.log"
touch "$LOG_FILE"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Проверка root прав
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Этот скрипт должен быть запущен с правами root"
    fi
}

# Проверка системных требований
check_system_requirements() {
    log "Проверка системных требований..."
    
    # Проверка ОС
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен"
    fi
    
    # Проверка свободного места
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=2097152  # 2GB в KB
    
    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        error "Недостаточно свободного места на диске. Требуется минимум 2GB"
    fi
    
    # Проверка памяти
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    REQUIRED_MEMORY=1024  # 1GB
    
    if [[ $AVAILABLE_MEMORY -lt $REQUIRED_MEMORY ]]; then
        warning "Мало доступной памяти. Рекомендуется минимум 1GB"
    fi
    
    success "Системные требования проверены"
}

# Настройка файрвола
setup_firewall() {
    log "Настройка файрвола..."
    
    # Установка ufw если не установлен
    if ! command -v ufw &> /dev/null; then
        apt-get update
        apt-get install -y ufw
    fi
    
    # Сброс правил
    ufw --force reset
    
    # Базовые правила
    ufw default deny incoming
    ufw default allow outgoing
    
    # Разрешенные порты
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Запрет прямого доступа к базе данных и Redis
    ufw deny 5432/tcp comment 'PostgreSQL'
    ufw deny 6379/tcp comment 'Redis'
    
    # Включение файрвола
    ufw --force enable
    
    success "Файрвол настроен"
}

# Генерация секретов
generate_secrets() {
    log "Генерация секретов безопасности..."
    
    # Создаем файл с секретами
    ENV_FILE=".env.production.generated"
    
    cat > "$ENV_FILE" << EOF
# Автоматически сгенерированные секреты - $(date)
# ВАЖНО: Измените эти значения перед первым запуском!

# Database
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)_DB_$(date +%Y)

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)_REDIS_$(date +%Y)

# JWT
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)_JWT_$(date +%Y)

# Encryption
ENCRYPTION_KEY=$(openssl rand -base64 32)
API_SECRET_KEY=$(openssl rand -base64 32)
WEBHOOK_SECRET=$(openssl rand -base64 24)

# Session
SESSION_SECRET=$(openssl rand -base64 32)
DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)
BACKUP_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Мониторинг
PROMETHEUS_PASSWORD=$(openssl rand -base64 16)
GRAFANA_PASSWORD=$(openssl rand -base64 16)
EOF

    chmod 600 "$ENV_FILE"
    success "Секреты сгенерированы в $ENV_FILE"
    warning "Обязательно проверьте и при необходимости измените секреты!"
}

# Проверка конфигурации безопасности
check_security_config() {
    log "Проверка конфигурации безопасности..."
    
    ISSUES=()
    
    # Проверка .env файла
    if [[ ! -f ".env.production" ]]; then
        ISSUES+=("Отсутствует файл .env.production")
    fi
    
    # Проверка секретов
    if [[ -f ".env.production" ]]; then
        source .env.production
        
        if [[ ${#JWT_SECRET} -lt 32 ]]; then
            ISSUES+=("JWT_SECRET слишком короткий (минимум 32 символа)")
        fi
        
        if [[ ${#DB_PASSWORD} -lt 12 ]]; then
            ISSUES+=("DB_PASSWORD слишком короткий (минимум 12 символов)")
        fi
        
        if [[ -z ${CORS_ORIGIN:-} ]]; then
            ISSUES+=("CORS_ORIGIN не настроен")
        fi
    fi
    
    # Проверка SSL сертификатов
    if [[ ! -d "/etc/letsencrypt/live" ]] && [[ "${NODE_ENV:-}" == "production" ]]; then
        ISSUES+=("SSL сертификаты не найдены. Настройте Let's Encrypt")
    fi
    
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        error "Найдены проблемы безопасности:\n$(printf '%s\n' "${ISSUES[@]}")"
    fi
    
    success "Конфигурация безопасности проверена"
}

# Установка обновлений безопасности
install_security_updates() {
    log "Установка обновлений безопасности..."
    
    apt-get update
    apt-get upgrade -y
    apt-get autoremove -y
    apt-get autoclean
    
    # Установка fail2ban
    if ! command -v fail2ban-server &> /dev/null; then
        apt-get install -y fail2ban
    fi
    
    success "Обновления безопасности установлены"
}

# Настройка Fail2ban
setup_fail2ban() {
    log "Настройка Fail2ban..."
    
    # Копируем конфигурацию
    cp fail2ban/jail.local /etc/fail2ban/
    cp -r fail2ban/filter.d/* /etc/fail2ban/filter.d/
    
    # Перезапуск fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    success "Fail2ban настроен и запущен"
}

# Настройка логирования
setup_logging() {
    log "Настройка системы логирования..."
    
    # Создаем директории для логов
    mkdir -p /var/log/crm-security
    mkdir -p /var/log/crm-application
    
    # Настройка ротации логов
    cat > /etc/logrotate.d/crm << EOF
/var/log/crm-*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker-compose -f docker-compose.security.yml restart nginx
    endscript
}
EOF
    
    success "Система логирования настроена"
}

# Создание резервных копий
setup_backup() {
    log "Настройка системы резервного копирования..."
    
    # Создаем скрипт резервного копирования
    cat > /usr/local/bin/crm-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/crm"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_backup_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

# Бэкап базы данных
docker exec production_crm_db_secure pg_dump -U $DB_USERNAME $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Бэкап файлов приложения
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    /app/crm-data

# Шифрование бэкапа
if [[ -n "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
    openssl enc -aes-256-cbc -salt -in "$BACKUP_FILE" -out "$BACKUP_FILE.enc" -pass pass:"$BACKUP_ENCRYPTION_KEY"
    rm "$BACKUP_FILE"
fi

# Удаление старых бэкапов (старше 30 дней)
find "$BACKUP_DIR" -name "*.tar.gz*" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

    chmod +x /usr/local/bin/crm-backup.sh
    
    # Добавляем в cron
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/crm-backup.sh") | crontab -
    
    success "Система резервного копирования настроена"
}

# Запуск приложения
deploy_application() {
    log "Развертывание приложения..."
    
    # Остановка существующих контейнеров
    docker-compose -f docker-compose.security.yml down --remove-orphans || true
    
    # Очистка Docker
    docker system prune -f
    
    # Сборка образов
    docker-compose -f docker-compose.security.yml build --no-cache
    
    # Запуск приложения
    docker-compose -f docker-compose.security.yml up -d
    
    # Ожидание запуска
    sleep 30
    
    # Проверка состояния контейнеров
    if docker-compose -f docker-compose.security.yml ps | grep -q "Exit"; then
        error "Некоторые контейнеры не смогли запуститься"
    fi
    
    success "Приложение развернуто"
}

# Проверка безопасности после развертывания
post_deployment_security_check() {
    log "Проверка безопасности после развертывания..."
    
    # Проверка открытых портов
    OPEN_PORTS=$(netstat -tuln | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -n | uniq)
    ALLOWED_PORTS="22 80 443"
    
    for port in $OPEN_PORTS; do
        if [[ ! " $ALLOWED_PORTS " =~ " $port " ]] && [[ $port -lt 32768 ]]; then
            warning "Обнаружен открытый порт: $port"
        fi
    done
    
    # Проверка контейнеров
    docker-compose -f docker-compose.security.yml ps
    
    # Проверка логов на ошибки
    if docker-compose -f docker-compose.security.yml logs | grep -i error; then
        warning "Обнаружены ошибки в логах"
    fi
    
    success "Проверка безопасности завершена"
}

# Создание отчета о развертывании
generate_deployment_report() {
    log "Создание отчета о развертывании..."
    
    REPORT_FILE="/var/log/crm-deployment-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
=================================
CRM DEPLOYMENT SECURITY REPORT
=================================
Дата развертывания: $(date)
Версия: Production CRM v1.0
Администратор: $(whoami)

БЕЗОПАСНОСТЬ:
- Файрвол: $(ufw status | head -1)
- Fail2ban: $(systemctl is-active fail2ban)
- SSL: $(if [[ -d "/etc/letsencrypt/live" ]]; then echo "Настроен"; else echo "Не настроен"; fi)
- Backup: Настроен (cron: 3:00 daily)

КОНТЕЙНЕРЫ:
$(docker-compose -f docker-compose.security.yml ps)

ОТКРЫТЫЕ ПОРТЫ:
$(netstat -tuln | grep LISTEN)

ДИСКОВОЕ ПРОСТРАНСТВО:
$(df -h)

ПАМЯТЬ:
$(free -h)

РЕКОМЕНДАЦИИ:
1. Измените все пароли в .env.production
2. Настройте SSL сертификаты (certbot)
3. Настройте мониторинг (Grafana)
4. Протестируйте резервное копирование
5. Настройте алерты безопасности

ВАЖНЫЕ ФАЙЛЫ:
- Конфигурация: /app/production-crm/docker-compose.security.yml
- Логи: /var/log/nginx/, /var/log/crm-*
- Бэкапы: /var/backups/crm/
- Fail2ban: /etc/fail2ban/jail.local

EOF
    
    success "Отчет создан: $REPORT_FILE"
}

# Главная функция
main() {
    log "🚀 Начало безопасного развертывания Production CRM"
    
    check_root
    check_system_requirements
    install_security_updates
    setup_firewall
    generate_secrets
    check_security_config
    setup_fail2ban
    setup_logging
    setup_backup
    deploy_application
    post_deployment_security_check
    generate_deployment_report
    
    success "🎉 Развертывание успешно завершено!"
    echo ""
    echo -e "${GREEN}Следующие шаги:${NC}"
    echo "1. Проверьте .env.production и измените секреты"
    echo "2. Настройте SSL: certbot --nginx -d kasuf.xyz"
    echo "3. Проверьте приложение: https://kasuf.xyz"
    echo "4. Настройте мониторинг и алерты"
    echo ""
    echo -e "${YELLOW}Важные команды:${NC}"
    echo "- Просмотр логов: docker-compose -f docker-compose.security.yml logs"
    echo "- Перезапуск: docker-compose -f docker-compose.security.yml restart"
    echo "- Остановка: docker-compose -f docker-compose.security.yml down"
    echo "- Бэкап: /usr/local/bin/crm-backup.sh"
    echo ""
}

# Запуск скрипта
main "$@"
