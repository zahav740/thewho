@echo off
chcp 65001
echo.
echo ========================================
echo 🔧 ДИАГНОСТИКА API ОПЕРАТОРОВ - 500 ERROR
echo ========================================
echo.

echo 📋 Проблема: API /operators возвращает 500 ошибку
echo 🎯 Причины:
echo   1. Таблица operators не создана в БД
echo   2. Backend не подключен к портам 5100-5101
echo   3. Модуль OperatorsModule не зарегистрирован
echo.

echo 🔍 ЭТАП 1: Проверяем подключение к БД
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "\dt" | findstr operators

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ Таблица operators НЕ НАЙДЕНА!
  echo 🔧 Создаем таблицу operators...
  echo.
  psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"
  
  if %ERRORLEVEL% EQU 0 (
    echo ✅ Таблица operators создана успешно!
  ) else (
    echo ❌ Ошибка при создании таблицы!
    pause
    exit /b 1
  )
) else (
  echo ✅ Таблица operators уже существует
)

echo.
echo 🔍 ЭТАП 2: Проверяем данные операторов
echo.
psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT count(*) as operators_count FROM operators;"

echo.
echo 🔍 ЭТАП 3: Тестируем API операторов
echo.
echo 📡 Проверяем доступность Backend на портах 5100-5101...
curl -s http://localhost:5100/api/health > nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ Backend доступен на порту 5100
) else (
  echo ❌ Backend НЕ ДОСТУПЕН на порту 5100!
  echo 🚀 Запускаем Backend...
  echo.
  goto start_backend
)

echo.
echo 📡 Тестируем API операторов...
curl -s http://localhost:5100/api/operators
if %ERRORLEVEL% EQU 0 (
  echo ✅ API операторов работает
) else (
  echo ❌ API операторов возвращает ошибку
  echo 🔧 Перезапускаем Backend с исправлениями...
  goto start_backend
)

echo.
echo ✅ Диагностика завершена успешно!
pause
exit /b 0

:start_backend
echo.
echo 🚀 Запускаем Backend с поддержкой операторов...
cd backend
npm run start:prod

pause
