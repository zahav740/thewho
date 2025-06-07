@echo off
echo 🔧 БЫСТРАЯ ПРОВЕРКА API ФАЙЛОВОЙ СИСТЕМЫ
echo.

:: Проверим доступность API
echo ▶️ Проверяем /api/orders/filesystem/statistics/overview
curl -s http://localhost:5100/api/orders/filesystem/statistics/overview

echo.
echo.

echo ▶️ Проверяем /api/orders/filesystem
curl -s http://localhost:5100/api/orders/filesystem

echo.
echo.

echo ▶️ Пробуем экспорт
curl -X POST http://localhost:5100/api/orders/filesystem/export-all

echo.
pause
