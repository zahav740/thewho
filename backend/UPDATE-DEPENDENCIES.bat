@echo off
chcp 65001 >nul
echo =====================================================
echo  🔧 ОБНОВЛЕНИЕ ЗАВИСИМОСТЕЙ ДЛЯ SUPABASE
echo =====================================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\backend"

echo 📦 Установка/обновление зависимостей...
npm install

echo.
echo 🔄 Обновление PostgreSQL драйвера...
npm install pg@latest @types/pg@latest

echo.
echo 🔄 Добавление дополнительных зависимостей для TypeScript...
npm install --save-dev @types/dotenv

echo.
echo ✅ Зависимости обновлены!
echo.

echo 🧪 Теперь запустите тест подключения:
echo TEST-SUPABASE-CONNECTION.bat
echo.

pause
