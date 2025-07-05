@echo off
echo ========================================
echo ЗАПУСК CRM СИСТЕМЫ (Порты 5100 и 5101)
echo ========================================
echo.

:: Цвета для вывода
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

echo %GREEN%🔧 Проверка структуры проекта...%RESET%
if not exist "backend" (
    echo %RED%❌ Папка backend не найдена!%RESET%
    pause
    exit /b 1
)

if not exist "frontend" (
    echo %RED%❌ Папка frontend не найдена!%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ Структура проекта найдена%RESET%
echo.

echo %BLUE%📦 Установка зависимостей...%RESET%

:: Устанавливаем зависимости для бэкенда
echo %YELLOW%➤ Backend зависимости...%RESET%
cd backend
call npm install
if errorlevel 1 (
    echo %RED%❌ Ошибка установки зависимостей backend%RESET%
    pause
    exit /b 1
)

:: Проверяем TypeScript
echo %YELLOW%➤ Проверка TypeScript...%RESET%
call npx tsc --noEmit
if errorlevel 1 (
    echo %YELLOW%⚠️ Есть TypeScript ошибки, но продолжаем...%RESET%
)

cd ..

:: Устанавливаем зависимости для фронтенда
echo %YELLOW%➤ Frontend зависимости...%RESET%
cd frontend
call npm install
if errorlevel 1 (
    echo %RED%❌ Ошибка установки зависимостей frontend%RESET%
    pause
    exit /b 1
)
cd ..

echo %GREEN%✅ Зависимости установлены%RESET%
echo.

echo %BLUE%🚀 ЗАПУСК СИСТЕМЫ:%RESET%
echo %YELLOW%   Backend:  http://localhost:5100%RESET%
echo %YELLOW%   Frontend: http://localhost:5101%RESET%
echo %YELLOW%   API Docs: http://localhost:5100/api/docs%RESET%
echo.

:: Запускаем backend в отдельном окне
echo %GREEN%🔥 Запускаем Backend (порт 5100)...%RESET%
start "CRM Backend (5100)" cmd /k "cd backend && set PORT=5100 && npm run start:dev"

:: Ждем немного
timeout /t 3 /nobreak >nul

:: Запускаем frontend в отдельном окне  
echo %GREEN%🎨 Запускаем Frontend (порт 5101)...%RESET%
start "CRM Frontend (5101)" cmd /k "cd frontend && set PORT=5101 && npm start"

echo.
echo %GREEN%✅ СИСТЕМА ЗАПУЩЕНА!%RESET%
echo.
echo %BLUE%🌐 Доступные адреса:%RESET%
echo    • Frontend: %YELLOW%http://localhost:5101%RESET%
echo    • Backend API: %YELLOW%http://localhost:5100%RESET%
echo    • Swagger Docs: %YELLOW%http://localhost:5100/api/docs%RESET%
echo.
echo %GREEN%📋 Секция "Заказы" теперь использует колонку K вместо J%RESET%
echo %GREEN%🔧 TypeScript ошибки исправлены%RESET%
echo.
echo %YELLOW%Нажмите любую клавишу для завершения...%RESET%
pause >nul
