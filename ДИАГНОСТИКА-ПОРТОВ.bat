@echo off
chcp 65001 > nul
echo.
echo 🔍 ДИАГНОСТИКА ПОРТОВ 5100-5101
echo ============================
echo.

echo 📊 Проверяем какие порты заняты...
netstat -an | find ":5100"
netstat -an | find ":5101"

echo.
echo 🌐 Тестируем доступность портов...

echo Тестируем порт 5100 (backend):
curl -s http://localhost:5100/api/health
if %ERRORLEVEL% EQU 0 (
    echo ✅ Порт 5100 доступен
) else (
    echo ❌ Порт 5100 недоступен
)

echo.
echo Тестируем порт 5101 (frontend):
curl -s http://localhost:5101
if %ERRORLEVEL% EQU 0 (
    echo ✅ Порт 5101 доступен
) else (
    echo ❌ Порт 5101 недоступен
)

echo.
echo 🔍 Процессы на портах:
echo Порт 5100:
netstat -ano | find ":5100"
echo Порт 5101:
netstat -ano | find ":5101"

echo.
echo 📋 РЕКОМЕНДАЦИИ:
echo 1. Если backend (5100) не запущен - запустите ЗАПУСК-BACKEND-ПОРТ-5100.bat
echo 2. Если frontend (5101) не запущен - запустите: cd frontend && npm start
echo 3. Проверьте нет ли других приложений на этих портах
echo.

pause
