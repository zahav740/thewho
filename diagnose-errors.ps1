# Диагностика и исправление ошибок Production CRM
# Этот скрипт поможет быстро диагностировать и исправить основные проблемы

Write-Host "=== Диагностика Production CRM ===" -ForegroundColor Green

# 1. Проверяем, запущен ли PostgreSQL
Write-Host "`n1. Проверка PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host "PostgreSQL сервис найден: $($pgService.Status)" -ForegroundColor Cyan
        if ($pgService.Status -ne "Running") {
            Write-Host "Запускаем PostgreSQL..." -ForegroundColor Yellow
            Start-Service $pgService.Name
        }
    } else {
        Write-Host "PostgreSQL сервис не найден. Проверьте установку." -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка при проверке PostgreSQL: $($_)" -ForegroundColor Red
}

# 2. Проверяем подключение к базе данных
Write-Host "`n2. Проверка подключения к базе данных..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "magarel"
    $dbTest = psql -h localhost -p 5432 -U postgres -d the_who -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Подключение к базе данных успешно" -ForegroundColor Green
    } else {
        Write-Host "Не удается подключиться к базе данных" -ForegroundColor Red
        Write-Host $dbTest -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка при тестировании базы данных: $($_)" -ForegroundColor Red
}

# 3. Проверяем, запущен ли backend
Write-Host "`n3. Проверка backend сервера..." -ForegroundColor Yellow
try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($backendTest.StatusCode -eq 200) {
        Write-Host "Backend работает нормально" -ForegroundColor Green
        $healthData = $backendTest.Content | ConvertFrom-Json
        Write-Host "Данные health check: $($healthData | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    } else {
        Write-Host "Backend не отвечает или работает некорректно" -ForegroundColor Red
    }
} catch {
    Write-Host "Backend не доступен на порту 3000" -ForegroundColor Red
    Write-Host "Проверяем, запущены ли процессы Node.js..." -ForegroundColor Yellow
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Найдены процессы Node.js:" -ForegroundColor Cyan
        $nodeProcesses | ForEach-Object { Write-Host "  PID: $($_.Id), CPU: $($_.CPU)" }
    } else {
        Write-Host "Процессы Node.js не найдены" -ForegroundColor Red
    }
}

# 4. Проверяем, запущен ли frontend
Write-Host "`n4. Проверка frontend сервера..." -ForegroundColor Yellow
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($frontendTest.StatusCode -eq 200) {
        Write-Host "Frontend работает нормально" -ForegroundColor Green
    } else {
        Write-Host "Frontend не отвечает" -ForegroundColor Red
    }
} catch {
    Write-Host "Frontend не доступен на порту 3001" -ForegroundColor Red
}

# 5. Проверяем наличие node_modules
Write-Host "`n5. Проверка зависимостей..." -ForegroundColor Yellow
if (Test-Path ".\backend\node_modules") {
    Write-Host "Backend node_modules найдены" -ForegroundColor Green
} else {
    Write-Host "Backend node_modules отсутствуют" -ForegroundColor Red
}

if (Test-Path ".\frontend\node_modules") {
    Write-Host "Frontend node_modules найдены" -ForegroundColor Green
} else {
    Write-Host "Frontend node_modules отсутствуют" -ForegroundColor Red
}

# 6. Предлагаем исправления
Write-Host "`n=== Рекомендуемые действия ===" -ForegroundColor Green

Write-Host "`nДля исправления проблем выполните:" -ForegroundColor Yellow
Write-Host "1. Запуск PostgreSQL: .\start-postgresql.bat" -ForegroundColor Cyan
Write-Host "2. Выполнение миграций: cd backend && npm run migration:run" -ForegroundColor Cyan
Write-Host "3. Запуск backend: .\start-backend.bat" -ForegroundColor Cyan
Write-Host "4. Запуск frontend: .\start-frontend.bat" -ForegroundColor Cyan

Write-Host "`nЛибо используйте автоматическое исправление:" -ForegroundColor Yellow
Write-Host ".\fix-all-errors.ps1" -ForegroundColor Cyan

Write-Host "`n=== Завершение диагностики ===" -ForegroundColor Green
