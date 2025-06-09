@echo off
chcp 65001
echo.
echo ================================================
echo 🔧 ИСПРАВЛЕНИЕ API ОПЕРАТОРОВ - 500 ERROR
echo ================================================
echo.

echo 📋 Исправляем проблемы:
echo   1. Создаем таблицу operators в БД
echo   2. Исправляем порт backend (3001 вместо 5100)
echo   3. Перезапускаем backend с правильной конфигурацией
echo.

echo 🗄️ ЭТАП 1: Создание таблицы операторов
echo.

psql -h localhost -p 5432 -U postgres -d thewho -c "\dt" | findstr operators > nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Таблица operators не найдена. Создаем...
  echo.
  psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"
  
  if %ERRORLEVEL% EQU 0 (
    echo ✅ Таблица operators создана успешно!
  ) else (
    echo ❌ Ошибка при создании таблицы!
    echo 💡 Убедитесь что PostgreSQL запущен и доступен
    pause
    exit /b 1
  )
) else (
  echo ✅ Таблица operators уже существует
)

echo.
echo 📊 Проверяем операторов в БД:
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT name, \"operatorType\", \"isActive\" FROM operators ORDER BY name;" 2>nul

echo.
echo 🔧 ЭТАП 2: Исправление конфигурации Backend
echo.
echo ✅ Конфигурация обновлена:
echo   - Порт изменен с 5100 на 3001
echo   - Добавлены CORS для портов 3000, 3001
echo   - OperatorsModule подключен в AppModule
echo.

echo 🚀 ЭТАП 3: Запуск Backend с исправлениями
echo.
echo 📡 Запускаем Backend на порту 3001...
cd backend

echo.
echo 🔍 Проверяем компиляцию TypeScript...
call npm run build > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Ошибка компиляции TypeScript!
  echo 🔧 Запускаем в dev режиме...
  call npm run start:dev
) else (
  echo ✅ Компиляция успешна, запускаем production...
  call npm run start:prod
)

pause
