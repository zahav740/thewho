# Быстрый запуск Production CRM после исправлений
# Этот скрипт запускает все компоненты в правильном порядке

Write-Host "=== Быстрый запуск Production CRM ===" -ForegroundColor Green

# 1. Запуск PostgreSQL
Write-Host "`n1. Запуск PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -ne "Running") {
        Start-Service $pgService.Name
        Start-Sleep -Seconds 3
        Write-Host "PostgreSQL запущен" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL уже запущен" -ForegroundColor Green
    }
} catch {
    Write-Host "Ошибка запуска PostgreSQL: $($_)" -ForegroundColor Red
}

# 2. Запуск backend
Write-Host "`n2. Запуск backend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", ".\start-backend.bat" -WindowStyle Minimized
Write-Host "Backend запускается..." -ForegroundColor Cyan

# 3. Ожидание запуска backend
Write-Host "`n3. Ожидание готовности backend..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 12; $i++) {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend готов к работе!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "Ожидание backend... ($($i*5+5) сек)" -ForegroundColor Yellow
    }
}

if (-not $backendReady) {
    Write-Host "Backend не запустился за отведенное время" -ForegroundColor Red
    Write-Host "Проверьте логи или запустите вручную" -ForegroundColor Yellow
    return
}

# 4. Запуск frontend
Write-Host "`n4. Запуск frontend..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", ".\start-frontend.bat" -WindowStyle Minimized
Write-Host "Frontend запускается..." -ForegroundColor Cyan

# 5. Ожидание запуска frontend
Write-Host "`n5. Ожидание готовности frontend..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 0; $i -lt 8; $i++) {
    Start-Sleep -Seconds 10
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Frontend готов к работе!" -ForegroundColor Green
            $frontendReady = $true
            break
        }
    } catch {
        Write-Host "Ожидание frontend... ($($i*10+10) сек)" -ForegroundColor Yellow
    }
}

if (-not $frontendReady) {
    Write-Host "Frontend не запустился за отведенное время" -ForegroundColor Red
    Write-Host "Проверьте логи или запустите вручную" -ForegroundColor Yellow
}

# 6. Финальная проверка
Write-Host "`n6. Проверка всех компонентов..." -ForegroundColor Yellow

$allGood = $true

# Проверка API
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "Backend API работает" -ForegroundColor Green
    } else {
        Write-Host "Backend API не отвечает" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "Backend API недоступен" -ForegroundColor Red
    $allGood = $false
}

# Проверка Frontend
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($frontendCheck.StatusCode -eq 200) {
        Write-Host "Frontend работает" -ForegroundColor Green
    } else {
        Write-Host "Frontend не отвечает" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "Frontend недоступен" -ForegroundColor Red
    $allGood = $false
}

# Результат
if ($allGood) {
    Write-Host "`n=== ВСЕ ГОТОВО! ===" -ForegroundColor Green
    Write-Host "Приложение запущено и готово к работе" -ForegroundColor Green
    Write-Host "`nОткройте браузер:" -ForegroundColor Cyan
    Write-Host "- Основное приложение: http://localhost:3001" -ForegroundColor White
    Write-Host "- API документация: http://localhost:3000/api/docs" -ForegroundColor White
    Write-Host "- Мониторинг: http://localhost:3000/api/health" -ForegroundColor White
    
    # Автоматически открываем браузер
    try {
        Start-Process "http://localhost:3001"
        Write-Host "`nБраузер открыт автоматически" -ForegroundColor Green
    } catch {
        Write-Host "`nОткройте браузер вручную" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n=== ЕСТЬ ПРОБЛЕМЫ ===" -ForegroundColor Red
    Write-Host "Не все компоненты запустились корректно" -ForegroundColor Red
    Write-Host "Запустите диагностику: .\diagnose-errors.ps1" -ForegroundColor Yellow
}
