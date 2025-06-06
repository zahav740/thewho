# Альтернативное решение - понизить версию некоторых пакетов
Write-Host "Alternative fix with compatible versions..." -ForegroundColor Green
Set-Location frontend

# Удаляем всё
Write-Host "Cleaning everything..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# Устанавливаем базовые пакеты
Write-Host "Installing base packages..." -ForegroundColor Green
npm install react@18.2.0 react-dom@18.2.0 react-scripts@5.0.1 --save --legacy-peer-deps

# Устанавливаем остальные зависимости
Write-Host "Installing other dependencies..." -ForegroundColor Green
npm install --legacy-peer-deps

# Добавляем переменную окружения для игнорирования проверки источников
$env:SKIP_PREFLIGHT_CHECK = "true"

Write-Host "Starting frontend with SKIP_PREFLIGHT_CHECK..." -ForegroundColor Green
npm start
