@echo off
echo ==============================================
echo    ИСПРАВЛЕНИЕ ЛОГИКИ ВХОДА/ВЫХОДА
echo ==============================================
echo.

echo 🛑 Останавливаем процессы...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🔧 ИСПРАВЛЕНИЯ:
echo    ✅ AuthContext теперь правильно обрабатывает logout
echo    ✅ LoginPage использует AuthContext.login()
echo    ✅ Автоматическое перенаправление при входе
echo    ✅ Улучшено логирование процесса аутентификации
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📦 Устанавливаем зависимости...
call npm install --silent

echo 🚀 Запускаем исправленный frontend...
echo.
echo ✅ Frontend запускается на http://localhost:5101
echo.
echo 📋 ТЕСТ ВХОДА/ВЫХОДА:
echo    1. Откройте http://localhost:5101
echo    2. Войдите: kasuf / kasuf123
echo    3. Нажмите на имя пользователя (справа вверху)
echo    4. Выберите "Выйти"
echo    5. ✅ Должно перенаправить на /login БЕЗ перезагрузки
echo    6. Войдите снова - должно работать сразу
echo.
echo 🔍 ПРОВЕРКА ИКОНОК:
echo    - Откройте "База данных"
echo    - Иконки должны быть 32px (большие!)
echo.

set GENERATE_SOURCEMAP=false
call npm start
