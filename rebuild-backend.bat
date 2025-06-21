@echo off
echo =========================================
echo Создание архива Backend с правильными портами
echo Backend: 5200
echo =========================================

cd backend

echo Проверка зависимостей...
if not exist node_modules\@nestjs\core (
    echo Установка зависимостей...
    npm install
)

echo Сборка backend...
npm run build

if exist dist (
    echo ✅ Сборка backend успешна!
    
    echo Создание архива...
    if exist ..\backend-beget.zip del ..\backend-beget.zip
    
    powershell "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('.\', '..\backend-beget.zip', 'Optimal', $false)"
    
    echo ✅ Архив backend-beget.zip создан!
) else (
    echo ❌ Ошибка сборки backend!
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Backend готов для Beget!
echo - Порт: 5200
echo - База данных: Supabase PostgreSQL
echo.
pause