@echo off
chcp 65001
echo.
echo ========================================
echo 🗄️ СОЗДАНИЕ ТАБЛИЦЫ ОПЕРАТОРОВ
echo ========================================
echo.

echo 📋 Применяем изменения к базе данных...
echo.

psql -h localhost -p 5432 -U postgres -d thewho -f "СОЗДАТЬ-ТАБЛИЦУ-ОПЕРАТОРОВ.sql"

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Таблица операторов создана успешно!
  echo.
  echo 👥 Добавлены операторы:
  echo   - Denis
  echo   - Andrey  
  echo   - Daniel
  echo   - Slava
  echo   - Kirill
  echo   - Аркадий (для ночных смен)
  echo.
) else (
  echo.
  echo ❌ Ошибка при создании таблицы!
  echo Проверьте подключение к PostgreSQL
  echo.
)

pause
