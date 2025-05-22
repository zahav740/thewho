@echo off
echo.
echo ==========================================
echo   ТHE WHO - АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ
echo ==========================================
echo.

REM Проверяем, существует ли приложение
if not exist "package.json" (
    echo ❌ Ошибка: Файл package.json не найден
    echo Убедитесь, что вы находитесь в папке приложения
    pause
    exit /b 1
)

echo ✅ Приложение найдено
echo.

REM Проверяем Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен или недоступен
    echo Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js доступен
echo.

REM Проверяем .env файл
if not exist ".env" (
    echo ⚠️  Файл .env не найден
    echo Создаем .env файл с примерными настройками...
    (
    echo VITE_SUPABASE_URL=https://kukqacmzfmzepdfddppl.supabase.co
    echo VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3FhY216Zm16ZXBkZmRkcHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzk4MTUsImV4cCI6MjA2MzQ1NTgxNX0.Zsjy_i87wyAxfBN0cGuLEvaF7-vk0tJ8Jo1lNOod74w
    echo.
    echo # Other environment variables
    echo VITE_API_URL=http://localhost:3000
    ) > .env
    echo ✅ Файл .env создан
) else (
    echo ✅ Файл .env существует
)
echo.

REM Проверяем зависимости
if not exist "node_modules" (
    echo 📦 Устанавливаем зависимости...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
    echo ✅ Зависимости установлены
) else (
    echo ✅ Зависимости уже установлены
)
echo.

REM Проверяем, что синхронизация настроена
echo 🔧 Проверяем настройки синхронизации...

REM Убеждаемся, что новый контекст используется
if exist "src\context\AppContextWithSync.tsx" (
    echo ⚠️  Обнаружен старый файл синхронизации, обновляем...
    del "src\context\AppContextWithSync.tsx" >nul 2>&1
)

if not exist "src\hooks\useSupabaseSync.ts" (
    echo ❌ Хук синхронизации не найден
    echo Убедитесь, что все файлы синхронизации на месте
    pause
    exit /b 1
)

if not exist "src\components\SyncStatusIndicator.tsx" (
    echo ❌ Компонент индикатора синхронизации не найден
    pause
    exit /b 1
)

echo ✅ Все компоненты синхронизации на месте
echo.

REM Создаем ярлык для очистки localStorage
echo 🧹 Создаем утилиту очистки данных...
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo ^<head^>
echo     ^<title^>Очистка данных приложения^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
echo         button { padding: 15px 30px; font-size: 16px; margin: 10px; border: none; border-radius: 5px; cursor: pointer; }
echo         .clear-btn { background-color: #ff4444; color: white; }
echo         .reload-btn { background-color: #4CAF50; color: white; }
echo         .info { background-color: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>🛠️ Утилиты для The Who^</h1^>
echo     ^<div class="info"^>
echo         ^<h3^>Очистка локальных данных^</h3^>
echo         ^<p^>Используйте это, если приложение работает некорректно или есть проблемы с синхронизацией^</p^>
echo     ^</div^>
echo     ^<button class="clear-btn" onclick="clearAllData()"^>🗑️ Очистить все данные^</button^>
echo     ^<button class="clear-btn" onclick="clearSyncSettings()"^>⚙️ Сбросить настройки синхронизации^</button^>
echo     ^<button class="reload-btn" onclick="enableAutoSync()"^>✅ Включить автосинхронизацию^</button^>
echo     ^<br^>^<br^>
echo     ^<button class="reload-btn" onclick="window.location.reload()"^>🔄 Обновить страницу^</button^>
echo     
echo     ^<div id="result" style="margin-top: 20px; font-weight: bold;"^>^</div^>
echo     
echo     ^<script^>
echo         function clearAllData() {
echo             localStorage.clear();
echo             sessionStorage.clear();
echo             document.getElementById('result').innerHTML = '✅ Все локальные данные очищены!';
echo             document.getElementById('result').style.color = 'green';
echo         }
echo         
echo         function clearSyncSettings() {
echo             localStorage.removeItem('supabaseAutoSync');
echo             localStorage.removeItem('supabaseAccessToken');
echo             localStorage.removeItem('lastSupabaseSync');
echo             document.getElementById('result').innerHTML = '✅ Настройки синхронизации сброшены!';
echo             document.getElementById('result').style.color = 'green';
echo         }
echo         
echo         function enableAutoSync() {
echo             localStorage.setItem('supabaseAutoSync', 'true');
echo             localStorage.setItem('language', 'ru');
echo             document.getElementById('result').innerHTML = '✅ Автосинхронизация включена!';
echo             document.getElementById('result').style.color = 'green';
echo         }
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > clear-app-data.html

echo ✅ Утилита очистки создана (clear-app-data.html)
echo.

echo 🎉 ВСЕ ГОТОВО К ЗАПУСКУ!
echo.
echo 📋 Что было настроено:
echo   • Автоматическая синхронизация с Supabase
echo   • Индикатор статуса синхронизации в сайдбаре  
echo   • Панель управления синхронизацией
echo   • Защита от потери данных
echo   • Синхронизация между устройствами
echo.
echo 🚀 Запускаем приложение...
echo.
echo ⏱️  Приложение откроется автоматически в браузере
echo 🔗 URL: http://localhost:5173
echo.
echo 📍 Найдите индикатор синхронизации в левом сайдбаре
echo ⚙️  Кликните на него для управления настройками
echo.

REM Открываем утилиту очистки (опционально)
start clear-app-data.html

REM Ждем немного и запускаем приложение
timeout /t 2 /nobreak >nul

echo Запускаем сервер разработки...
npm run dev

echo.
echo 👋 Приложение остановлено
echo 📖 Руководство пользователя: SYNC_USER_GUIDE.md
echo 📖 Техническая документация: SUPABASE_AUTO_SYNC_GUIDE.md
echo.
pause
