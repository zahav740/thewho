@echo off
chcp 65001 >nul
echo ========================================
echo 🔒 ОТКЛЮЧЕНИЕ ТЕСТОВЫХ СКРИПТОВ
echo ========================================
echo.

echo 📁 Переименовываем тестовые скрипты в .disabled:
echo.

if exist "backend\create-test-completion-data.sql" (
    ren "backend\create-test-completion-data.sql" "create-test-completion-data.sql.disabled"
    echo ✅ create-test-completion-data.sql -> create-test-completion-data.sql.disabled
) else (
    echo ⚠️ create-test-completion-data.sql не найден
)

echo.
echo 📋 Проверяем другие тестовые файлы:
dir /b backend\*test*.sql 2>nul || echo "Других тестовых SQL файлов не найдено"

echo.
echo ✅ Тестовые скрипты отключены!
echo 💡 Теперь система будет работать только с реальными данными из БД

pause