@echo off
echo =========================================
echo Пересборка Frontend с правильными портами
echo Backend: 5200, Frontend: 5201
echo =========================================

cd frontend

echo Остановка существующих процессов...
taskkill /f /im node.exe 2>nul

echo Очистка кэша...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist build rmdir /s /q build

echo Пересборка с обновленными настройками...
npm run build

if exist build (
    echo ✅ Сборка успешна!
    echo Создание архива...
    
    if exist frontend-beget.zip del frontend-beget.zip
    powershell Compress-Archive -Path "build\*" -DestinationPath "..\frontend-beget.zip" -Force
    
    echo ✅ Архив frontend-beget.zip создан!
) else (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Frontend готов для Beget!
echo - Порт: 5201
echo - API: http://localhost:5200/api (для разработки)
echo - API: https://kasuf.xyz/api (для продакшена)
echo.
pause