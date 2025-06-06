# Production CRM - Full Start Script (PowerShell)
Write-Host "========================================"
Write-Host "  Production CRM - Full Start Script"
Write-Host "========================================"
Write-Host ""

# Проверка Node.js
try {
    $null = node --version
} catch {
    Write-Host "[ERROR] Node.js не установлен! Пожалуйста, установите Node.js" -ForegroundColor Red
    Write-Host "Скачать можно с https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Получаем текущую директорию
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "[1/6] Остановка запущенных процессов..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[2/6] Настройка Backend..." -ForegroundColor Cyan
Write-Host "========================================"
Set-Location backend

# Проверка node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Установка зависимостей backend..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Ошибка установки зависимостей backend" -ForegroundColor Red
        Read-Host "Нажмите Enter для выхода"
        exit 1
    }
}

# Проверка .env
if (-not (Test-Path ".env")) {
    Write-Host "Создание .env файла для backend..."
    @"
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=production_crm

# App
PORT=3000
NODE_ENV=development
"@ | Out-File -FilePath .env -Encoding UTF8
}

# Сборка backend
Write-Host "Сборка backend..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Ошибка сборки backend" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host ""
Write-Host "[3/6] Запуск Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\backend'; npm run start:dev" -WindowStyle Minimized
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[4/6] Настройка Frontend..." -ForegroundColor Cyan
Write-Host "========================================"
Set-Location ..\frontend

# Проверка node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Установка зависимостей frontend..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Ошибка установки зависимостей frontend" -ForegroundColor Red
        Read-Host "Нажмите Enter для выхода"
        exit 1
    }
}

# Проверка http-proxy-middleware
$proxyCheck = npm list http-proxy-middleware 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Установка http-proxy-middleware..."
    npm install --save-dev http-proxy-middleware
}

# Создание .env.local
Write-Host "Создание .env.local для frontend..."
@"
PORT=3001
GENERATE_SOURCEMAP=false
REACT_APP_API_URL=http://localhost:3000/api
"@ | Out-File -FilePath .env.local -Encoding UTF8

# Очистка кеша
Write-Host "Очистка кеша..."
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
}
if (Test-Path ".cache") {
    Remove-Item -Path ".cache" -Recurse -Force
}

Write-Host ""
Write-Host "[5/6] Запуск Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir\frontend'; npm start" -WindowStyle Minimized

Write-Host ""
Write-Host "[6/6] Проверка статуса..." -ForegroundColor Cyan
Write-Host "========================================"
Start-Sleep -Seconds 10

# Проверка backend
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000/api" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OK] Backend запущен на http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Backend еще запускается..." -ForegroundColor Yellow
}

# Проверка frontend
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OK] Frontend запущен на http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Frontend еще запускается..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Приложение запущено!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Backend:  http://localhost:3000"
Write-Host "Frontend: http://localhost:3001"
Write-Host "API Docs: http://localhost:3000/api/docs"
Write-Host ""
Write-Host "Для остановки закройте окна PowerShell с Backend и Frontend"
Write-Host ""
Write-Host "Открываю приложение в браузере..."
Start-Sleep -Seconds 3
Start-Process "http://localhost:3001"

Write-Host ""
Read-Host "Нажмите Enter для выхода"
