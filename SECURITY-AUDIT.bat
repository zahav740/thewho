@echo off
echo ================================================================
echo    KASUF CRM - SECURITY AUDIT SCRIPT
echo    Проверка безопасности текущего развертывания
echo ================================================================
echo.

REM --- Проверка файлов безопасности ---
echo [AUDIT] Проверка компонентов безопасности...
echo.

set "SECURITY_SCORE=0"
set "MAX_SCORE=10"

echo 1. Проверка защищенной Docker конфигурации...
if exist "docker-compose.security.yml" (
    echo    ✅ docker-compose.security.yml найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ docker-compose.security.yml НЕ НАЙДЕН
    echo       Рекомендация: Используйте защищенную конфигурацию Docker
)

echo 2. Проверка скрипта безопасного развертывания...
if exist "deploy-secure.sh" (
    echo    ✅ deploy-secure.sh найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ deploy-secure.sh НЕ НАЙДЕН
    echo       Рекомендация: Используйте автоматизированный скрипт развертывания
)

echo 3. Проверка конфигурации Nginx...
if exist "nginx\nginx-security.conf" (
    echo    ✅ nginx-security.conf найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ nginx-security.conf НЕ НАЙДЕН
    echo       Рекомендация: Настройте защищенную конфигурацию Nginx
)

echo 4. Проверка Fail2ban конфигурации...
if exist "fail2ban\jail.local" (
    echo    ✅ fail2ban конфигурация найдена
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ fail2ban конфигурация НЕ НАЙДЕНА
    echo       Рекомендация: Настройте защиту от брутфорса
)

echo 5. Проверка Security Middleware...
if exist "backend\src\middleware\security.middleware.ts" (
    echo    ✅ Security Middleware найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Security Middleware НЕ НАЙДЕН
    echo       Рекомендация: Добавьте защиту на уровне приложения
)

echo 6. Проверка Rate Limiting Guard...
if exist "backend\src\guards\rate-limit.guard.ts" (
    echo    ✅ Rate Limiting Guard найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Rate Limiting Guard НЕ НАЙДЕН
    echo       Рекомендация: Добавьте защиту от DDoS атак
)

echo 7. Проверка Security Exception Filter...
if exist "backend\src\filters\security-exception.filter.ts" (
    echo    ✅ Security Exception Filter найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Security Exception Filter НЕ НАЙДЕН
    echo       Рекомендация: Добавьте безопасную обработку ошибок
)

echo 8. Проверка мониторинга Prometheus...
if exist "monitoring\prometheus.yml" (
    echo    ✅ Мониторинг Prometheus настроен
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Мониторинг Prometheus НЕ НАСТРОЕН
    echo       Рекомендация: Настройте мониторинг безопасности
)

echo 9. Проверка переменных окружения...
if exist ".env.security" (
    echo    ✅ Шаблон безопасных переменных найден
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Шаблон безопасных переменных НЕ НАЙДЕН
    echo       Рекомендация: Используйте защищенные переменные окружения
)

echo 10. Проверка документации безопасности...
if exist "SECURITY-DEPLOYMENT-GUIDE.md" (
    echo    ✅ Документация безопасности найдена
    set /a SECURITY_SCORE+=1
) else (
    echo    ❌ Документация безопасности НЕ НАЙДЕНА
    echo       Рекомендация: Добавьте руководство по безопасности
)

echo.
echo ================================================================
echo                    РЕЗУЛЬТАТ АУДИТА БЕЗОПАСНОСТИ
echo ================================================================

set /a SECURITY_PERCENT=(%SECURITY_SCORE% * 100) / %MAX_SCORE%

echo 🔒 Оценка безопасности: %SECURITY_SCORE%/%MAX_SCORE% (%SECURITY_PERCENT%%)
echo.

if %SECURITY_PERCENT% GEQ 90 (
    echo 🟢 ОТЛИЧНО! Ваше приложение имеет высокий уровень безопасности.
) else if %SECURITY_PERCENT% GEQ 70 (
    echo 🟡 ХОРОШО! Но есть возможности для улучшения безопасности.
) else if %SECURITY_PERCENT% GEQ 50 (
    echo 🟠 УДОВЛЕТВОРИТЕЛЬНО. Рекомендуется усилить защиту.
) else (
    echo 🔴 КРИТИЧНО! Необходимо немедленно улучшить безопасность!
)

echo.
echo 📋 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:
echo.

if %SECURITY_SCORE% LSS %MAX_SCORE% (
    echo 1. Запустите: BUILD-SECURE.bat для создания полного защищенного пакета
    echo 2. Используйте docker-compose.security.yml вместо обычного
    echo 3. Настройте Fail2ban для защиты от атак
    echo 4. Добавьте мониторинг с Prometheus
    echo 5. Обновите переменные окружения с сильными паролями
    echo.
    echo 🚀 Для автоматической установки всех компонентов безопасности:
    echo    Запустите BUILD-SECURE.bat
    echo.
)

echo ================================================================
echo 📞 Поддержка: admin@kasuf.xyz
echo 📖 Документация: SECURITY-DEPLOYMENT-GUIDE.md
echo ================================================================
echo.
pause
