@echo off
echo ====================================
echo ТЕСТИРОВАНИЕ НОВОГО API
echo ====================================
echo.

echo Тестирование основного API станков:
curl -s http://localhost:5100/api/machines | echo "Основной API: %errorlevel%"

echo.
echo Тестирование нового API с реальным статусом:
curl -s http://localhost:5100/api/machines-enhanced/status/all | echo "Новый API: %errorlevel%"

echo.
echo Тестирование активных операций:
curl -s http://localhost:5100/api/machines-enhanced/active-operations | echo "Активные операции: %errorlevel%"

echo.
echo Тестирование диагностики:
curl -s http://localhost:5100/api/machines-enhanced/diagnostic/status | echo "Диагностика: %errorlevel%"

echo.
pause