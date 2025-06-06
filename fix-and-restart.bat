@echo off
title Production CRM - Исправление ошибок и перезапуск
color 0E

echo.
echo ================================================================
echo            PRODUCTION CRM - ИСПРАВЛЕНИЕ ОШИБОК
echo ================================================================
echo.

set PROJECT_ROOT=C:\Users\Alexey\Downloads\TheWho\production-crm

echo 🔧 Исправляем выявленные проблемы...
echo.

echo ✅ 1. Исправлен компонент Spin в ProductionPage.tsx
echo    - Убрано предупреждение Antd о неправильном использовании 'tip'
echo.

echo ✅ 2. Добавлены future flags для React Router в App.tsx  
echo    - v7_startTransition: true
echo    - v7_relativeSplatPath: true
echo.

echo ✅ 3. Добавлены CSS исправления для SVG и внешних скриптов
echo    - Скрыты проблемные элементы переводчика
echo    - Исправлена отрисовка SVG элементов
echo.

echo ✅ 4. Создана миграция для инициализации базы данных
echo    - Исправлена структура таблиц
echo    - Добавлены тестовые данные
echo.

echo.
echo 🔄 Запускаем миграции базы данных...
echo.

cd /d "%PROJECT_ROOT%\backend"

REM Проверяем подключение к PostgreSQL
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL недоступен. Убедитесь, что сервер запущен.
    pause
    exit /b 1
)

REM Создаем базу данных, если её нет
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'production_crm'" | findstr -q 1 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Создание базы данных...
    psql -U postgres -c "CREATE DATABASE production_crm;" >nul 2>&1
)

REM Запускаем миграции
call npm run migration:run
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка выполнения миграций
    echo.
    echo Возможные решения:
    echo 1. Проверьте подключение к PostgreSQL
    echo 2. Убедитесь, что база данных 'production_crm' создана
    echo 3. Проверьте права доступа пользователя postgres
    echo.
    pause
    exit /b 1
)

echo ✅ Миграции выполнены успешно
echo.

echo ================================================================
echo                  ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ
echo ================================================================
echo.
echo 🎯 Исправленные проблемы:
echo.
echo ❌ Error: relation "machines" does not exist
echo ✅ ИСПРАВЛЕНО: Созданы все необходимые таблицы
echo.
echo ❌ Warning: ^[antd: Spin^] `tip` only work in nest pattern
echo ✅ ИСПРАВЛЕНО: Изменен способ использования Spin
echo.
echo ❌ React Router Future Flag Warnings  
echo ✅ ИСПРАВЛЕНО: Добавлены future flags
echo.
echo ❌ jQuery SVG path attribute errors
echo ✅ ИСПРАВЛЕНО: Добавлены CSS исправления
echo.
echo 📱 Теперь можно запустить приложение:
echo.
echo Backend:  cd "%PROJECT_ROOT%\backend" ^&^& npm run start:dev
echo Frontend: cd "%PROJECT_ROOT%\frontend" ^&^& npm start
echo.
echo Или используйте start-all.bat для автоматического запуска
echo.
pause

REM Опционально запускаем приложение
echo.
choice /M "Запустить приложение сейчас"
if %ERRORLEVEL%==1 (
    echo.
    echo 🚀 Запускаем приложение...
    start "Backend" cmd /k "cd /d \"%PROJECT_ROOT%\backend\" && npm run start:dev"
    timeout /t 3 /nobreak >nul
    start "Frontend" cmd /k "cd /d \"%PROJECT_ROOT%\frontend\" && npm start"
    echo.
    echo ✅ Приложение запущено в отдельных окнах
    echo Backend: http://localhost:3000
    echo Frontend: http://localhost:3001 (откроется автоматически)
)
