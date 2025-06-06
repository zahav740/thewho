# Автоматическое исправление всех найденных ошибок
# Этот скрипт попытается исправить основные проблемы автоматически

Write-Host "=== Автоматическое исправление ошибок Production CRM ===" -ForegroundColor Green

# Остановка всех процессов
Write-Host "`n1. Остановка всех процессов..." -ForegroundColor Yellow
.\stop-all.bat

Start-Sleep -Seconds 3

# Запуск PostgreSQL
Write-Host "`n2. Запуск PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -ne "Running") {
        Start-Service $pgService.Name -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
        Write-Host "PostgreSQL запущен" -ForegroundColor Green
    }
} catch {
    Write-Host "Не удалось запустить PostgreSQL автоматически" -ForegroundColor Red
}

# Сборка backend
Write-Host "`n3. Сборка backend..." -ForegroundColor Yellow
Push-Location .\backend

try {
    Write-Host "Сборка TypeScript..." -ForegroundColor Yellow
    npm run build 2>build_errors.log
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend собран успешно" -ForegroundColor Green
    } else {
        Write-Host "Ошибки при сборке - проверьте build_errors.log" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка при сборке backend: $($_)" -ForegroundColor Red
}

# Выполнение миграций
Write-Host "`n4. Выполнение миграций базы данных..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "magarel"
    $dbExists = psql -h localhost -p 5432 -U postgres -lqt 2>$null | Select-String -Pattern "the_who"
    
    if (-not $dbExists) {
        Write-Host "Создание базы данных the_who..." -ForegroundColor Yellow
        createdb -h localhost -p 5432 -U postgres the_who 2>$null
    }
    
    Write-Host "Выполнение миграций..." -ForegroundColor Yellow
    npm run migration:run 2>migration_errors.log
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Миграции выполнены успешно" -ForegroundColor Green
    } else {
        Write-Host "Ошибки при выполнении миграций - проверьте migration_errors.log" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка при выполнении миграций: $($_)" -ForegroundColor Red
} finally {
    Pop-Location
}

# Запуск backend
Write-Host "`n5. Запуск backend сервера..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", ".\start-backend.bat" -WindowStyle Minimized

# Ожидание запуска backend
Start-Sleep -Seconds 10

$backendStarted = $false
for ($i = 0; $i -lt 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend успешно запущен" -ForegroundColor Green
            $backendStarted = $true
            break
        }
    } catch {
        Write-Host "Ожидание запуска backend... ($($i+1)/6)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $backendStarted) {
    Write-Host "Backend не удалось запустить автоматически" -ForegroundColor Red
    Write-Host "Попробуйте запустить вручную: .\start-backend.bat" -ForegroundColor Yellow
}

# Запуск frontend
Write-Host "`n6. Запуск frontend сервера..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", ".\start-frontend.bat" -WindowStyle Minimized

Start-Sleep -Seconds 15

$frontendStarted = $false
for ($i = 0; $i -lt 4; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Frontend успешно запущен" -ForegroundColor Green
            $frontendStarted = $true
            break
        }
    } catch {
        Write-Host "Ожидание запуска frontend... ($($i+1)/4)" -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $frontendStarted) {
    Write-Host "Frontend не удалось запустить автоматически" -ForegroundColor Red
    Write-Host "Попробуйте запустить вручную: .\start-frontend.bat" -ForegroundColor Yellow
}

# Финальная проверка
Write-Host "`n7. Финальная проверка системы..." -ForegroundColor Yellow

try {
    $ordersTest = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $machinesTest = Invoke-WebRequest -Uri "http://localhost:3000/api/machines" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $calendarTest = Invoke-WebRequest -Uri "http://localhost:3000/api/calendar?startDate=2025-05-26&endDate=2025-06-08" -TimeoutSec 5 -ErrorAction SilentlyContinue
    
    Write-Host "`nРезультаты проверки API:" -ForegroundColor Cyan
    
    $ordersStatus = if($ordersTest.StatusCode -eq 200){"OK - Работает"}else{"ERROR - Ошибка"}
    $machinesStatus = if($machinesTest.StatusCode -eq 200){"OK - Работает"}else{"ERROR - Ошибка"}
    $calendarStatus = if($calendarTest.StatusCode -eq 200){"OK - Работает"}else{"ERROR - Ошибка"}
    
    Write-Host "Orders API: $ordersStatus" -ForegroundColor $(if($ordersTest.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Machines API: $machinesStatus" -ForegroundColor $(if($machinesTest.StatusCode -eq 200){'Green'}else{'Red'})
    Write-Host "Calendar API: $calendarStatus" -ForegroundColor $(if($calendarTest.StatusCode -eq 200){'Green'}else{'Red'})
    
} catch {
    Write-Host "Ошибка при проверке API: $($_)" -ForegroundColor Red
}

Write-Host "`n=== Исправление завершено ===" -ForegroundColor Green
Write-Host "Откройте браузер и перейдите по адресу: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Для мониторинга используйте: http://localhost:3000/api/health" -ForegroundColor Cyan

# Открытие браузера
try {
    Start-Process "http://localhost:3001"
} catch {
    Write-Host "Не удалось открыть браузер автоматически" -ForegroundColor Yellow
}
