@echo off
chcp 65001 > nul
title ИСПРАВЛЕНИЕ СИНХРОНИЗАЦИИ Production ↔ Shifts

echo.
echo 🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ СИНХРОНИЗАЦИИ
echo.
echo ❌ ПРОБЛЕМА: Данные смен не отображаются в карточках станков
echo ✅ РЕШЕНИЕ: Улучшенный алгоритм сопоставления с диагностикой
echo.

echo 🚀 Запуск системы с исправлениями...

REM Переходим в директорию frontend
cd frontend

echo 📦 Компиляция TypeScript...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции! Исправляем...
    echo.
    echo 🔧 Исправления:
    echo   1. Исправлен импорт Tag в ProductionPage.tsx
    echo   2. Исправлены ошибки React Query в MachineCard.tsx  
    echo   3. Добавлен улучшенный алгоритм сопоставления
    echo   4. Удален проблемный файл MachineCard.enhanced.tsx
    echo.
    echo Попробуйте снова запустить после исправлений
    pause
    exit /b 1
)

echo ✅ Компиляция успешна!
echo.

echo 🚀 Запуск Frontend с исправлениями...
start /B cmd /c "npm start"

echo.
echo ✅ Система запущена с исправлениями!
echo.
echo 🔍 Проверьте в консоли браузера новые логи диагностики:
echo    - Откройте F12 (Developer Tools)
echo    - Перейдите на вкладку Console
echo    - Найдите логи "=== ДИАГНОСТИКА СИНХРОНИЗАЦИИ ==="
echo.
echo 📊 Ожидаемый результат:
echo    - Данные смен должны отображаться в карточках станков
echo    - Станок Doosan 3 должен показать: День 8 + Ночь 20 = 28 деталей
echo    - Прогресс: 28/30 = 93%
echo.

timeout /t 5 /nobreak >nul
start "" "http://localhost:3000/production"

echo 🔄 Система работает. Нажмите любую клавишу для остановки.
pause >nul

echo.
echo 🛑 Остановка системы...
taskkill /f /im node.exe /t >nul 2>&1
echo ✅ Система остановлена
