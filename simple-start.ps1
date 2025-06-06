# Простой скрипт для проверки и запуска без лишних действий
Write-Host "=== Простой запуск Production CRM ===" -ForegroundColor Green

# Останавливаем что запущено
Write-Host "Остановка процессов..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Запуск PostgreSQL
Write-Host "Запуск PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Start-Service $pgService.Name -ErrorAction SilentlyContinue
}

# Переход в backend и запуск
Write-Host "Запуск backend..." -ForegroundColor Yellow
cd backend
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:dev" -WindowStyle Minimized
cd ..

# Ожидание backend
Write-Host "Ожидание backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Запуск frontend
Write-Host "Запуск frontend..." -ForegroundColor Yellow
cd frontend  
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start" -WindowStyle Minimized
cd ..

Write-Host "Ожидание запуска..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Проверка
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction SilentlyContinue
    
    if ($backend.StatusCode -eq 200) {
        Write-Host "Backend: OK" -ForegroundColor Green
    } else {
        Write-Host "Backend: ERROR" -ForegroundColor Red
    }
    
    if ($frontend.StatusCode -eq 200) {
        Write-Host "Frontend: OK" -ForegroundColor Green
        Write-Host "Открываем браузер..." -ForegroundColor Green
        Start-Process "http://localhost:3001"
    } else {
        Write-Host "Frontend: ERROR" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка проверки: $($_)" -ForegroundColor Red
}

Write-Host "Готово!" -ForegroundColor Green
