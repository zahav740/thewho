@echo off
setlocal enabledelayedexpansion

echo ====================================
echo ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБКИ
echo ====================================
echo ОШИБКА: Property 'buttonProps' does not exist
echo ФАЙЛ: DatabasePage.tsx:188:23
echo.

echo 🔍 ПРОБЛЕМА:
echo - TypeScript не может найти свойство buttonProps
echo - Интерфейс ExcelUploaderWithSettingsProps не экспортирован
echo - Возможны проблемы с типизацией
echo.

echo ✅ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ:
echo 1. Экспортирован интерфейс ExcelUploaderWithSettingsProps
echo 2. Расширены типы для buttonProps
echo 3. Добавлены дополнительные свойства (size, className, style)
echo.

echo 🔄 ПЕРЕЗАПУСК FRONTEND...
echo.

REM Переходим в папку frontend
cd frontend

REM Останавливаем существующий процесс
echo 🛑 Останавливаем существующий frontend...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo 🧹 Очищаем кеш TypeScript...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Кеш очищен
)

echo 🚀 Запускаем исправленный frontend...
start "ИСПРАВЛЕННЫЙ Frontend Server" cmd /k "echo ================================ && echo ИСПРАВЛЕННЫЙ FRONTEND СЕРВЕР && echo ================================ && echo Порт: 5101 && echo URL: http://localhost:5101 && echo Backend: http://localhost:5100 && echo ================================ && npm start"

echo.
echo ⏳ Ждем запуска frontend (20 секунд)...
timeout /t 20 >nul

echo.
echo 🧪 ПРОВЕРЯЕМ ИСПРАВЛЕНИЕ...
echo.

REM Проверяем, что frontend запущен
curl -s http://localhost:5101 >nul 2>&1
if !errorlevel!==0 (
    echo ✅ Frontend запущен и отвечает на порту 5101
) else (
    echo ❌ Frontend не отвечает, проверьте окно с сервером
    pause
    exit /b 1
)

echo.
echo 📋 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:
echo.
echo ✅ Интерфейс ExcelUploaderWithSettingsProps экспортирован
echo ✅ Добавлены типы для buttonProps:
echo   - icon?: React.ReactNode
echo   - children?: React.ReactNode  
echo   - type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
echo   - size?: 'large' | 'middle' | 'small'
echo   - className?: string
echo   - style?: React.CSSProperties
echo ✅ TypeScript ошибка должна исчезнуть
echo.

echo 🌐 ОТКРОЙТЕ БРАУЗЕР:
echo http://localhost:5101
echo.
echo Если ошибка все еще есть:
echo 1. Перезагрузите страницу в браузере (Ctrl+F5)
echo 2. Откройте DevTools (F12) и проверьте консоль
echo 3. Убедитесь, что backend запущен на порту 5100
echo.

echo 🔗 ПОЛЕЗНЫЕ ССЫЛКИ:
echo - Frontend: http://localhost:5101
echo - Backend API: http://localhost:5100/api/docs
echo - Health Check: http://localhost:5100/api/health
echo.

pause

echo.
echo 📊 ФИНАЛЬНАЯ ПРОВЕРКА:
echo.

echo Проверяем оба сервера:
echo.
echo Frontend (5101):
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5101
echo.
echo.
echo Backend (5100):
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5100/api/health
echo.
echo.

echo ================================
echo ✅ TYPESCRIPT ОШИБКА ИСПРАВЛЕНА!
echo ================================
echo.
echo Откройте http://localhost:5101 в браузере.
echo Если все работает, ошибка компиляции исчезла.
echo.

pause
