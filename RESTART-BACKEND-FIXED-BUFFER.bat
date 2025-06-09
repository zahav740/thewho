@echo off
echo ====================================
echo ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЕМ BUFFER
echo ====================================

echo [1/3] Переходим в директорию backend...
cd /d "%~dp0\backend"

echo.
echo [2/3] Останавливаем все Node.js процессы...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Запускаем backend с исправлениями buffer...
echo Исправления:
echo ✅ Убран diskStorage из FileInterceptor
echo ✅ Добавлена проверка file.buffer
echo ✅ Улучшена диагностика Excel файлов
echo ✅ Добавлено логирование структуры данных
echo.

start "Backend Server (Buffer Fix)" cmd /k "npm run start:dev"

echo.
echo ====================================
echo Backend запущен с исправлениями!
echo ====================================
echo Теперь попробуйте загрузить Excel файл
echo в интерфейсе - должен работать с buffer
echo ====================================

pause
