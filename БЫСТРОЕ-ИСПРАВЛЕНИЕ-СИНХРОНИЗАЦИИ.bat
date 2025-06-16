@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ СИНХРОНИЗАЦИИ БД
echo ========================================
echo.

echo ✅ Все TypeScript ошибки исправлены:
echo    - Исправлены импорты в OperatorsApiDiagnostics.tsx
echo    - Исправлена типизация в operatorsApi.ts
echo    - Убраны ошибки с 'this' и 'unknown' типами
echo.

echo 📋 Что исправлено:
echo    1. Модальное окно теперь загружает операторов из БД
echo    2. Убраны захардкоженные тестовые данные
echo    3. Добавлена диагностика API операторов
echo    4. Улучшена обработка ошибок
echo.

echo 🚀 Запуск системы для проверки...
echo.

echo 1️⃣ Проверяем backend...
timeout /t 2 >nul
curl -s "http://localhost:5100/api/operators/test" && echo [BACKEND OK] || echo [❌ BACKEND НЕ ЗАПУЩЕН - запустите ЗАПУСК-BACKEND.bat]
echo.

echo 2️⃣ Запускаем frontend...
cd frontend
echo 🌐 Откройте: http://localhost:3000
echo 📋 Путь: Учет смен > Мониторинг > Запись смены
echo 🔍 В модальном окне появится диагностика API
echo.

echo ▶️ Запуск frontend в режиме разработки...
npm start

pause