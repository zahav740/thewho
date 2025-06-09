@echo off
chcp 65001
echo.
echo ===============================================
echo 🔧 ИСПРАВЛЕНИЕ ОШИБКИ 500 - ОПЕРАТОРЫ
echo ===============================================
echo.

echo ЭТАП 1: Создание таблицы операторов
echo.
echo 📋 Применяем SQL скрипт...
psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo ✅ Таблица operators создана
) else (
  echo ❌ Ошибка создания таблицы operators
  echo Проверьте:
  echo  - PostgreSQL запущен на порту 5432
  echo  - База данных 'thewho' существует
  echo  - Пользователь postgres имеет права
  pause
  exit /b 1
)

echo.
echo ЭТАП 2: Проверка содержимого таблицы
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT COUNT(*) as count, string_agg(name, ', ') as operators FROM operators WHERE \"isActive\" = true;"

echo.
echo ЭТАП 3: Тестирование подключения к таблице
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT id, name, \"operatorType\" FROM operators LIMIT 3;"

echo.
echo ✅ База данных готова!
echo.
echo ЭТАП 4: Перезапуск Backend...
echo.

cd backend
echo 🔄 Останавливаем текущий процесс backend...
taskkill /f /im node.exe 2>nul || echo "Backend процесс не найден"

echo.
echo 🚀 Запускаем Backend с модулем операторов...
call npm run start:prod

pause
