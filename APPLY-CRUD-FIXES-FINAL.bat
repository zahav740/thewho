@echo off
title ПРИМЕНЕНИЕ CRUD ИСПРАВЛЕНИЙ - Мониторинг производства
color 0A

echo ================================================================
echo 🚀 ПРИМЕНЕНИЕ CRUD ИСПРАВЛЕНИЙ ДЛЯ МОНИТОРИНГА ПРОИЗВОДСТВА
echo ================================================================
echo.

echo 📋 Что будет исправлено:
echo   ✅ Добавлены CRUD операции для управления станками
echo   ✅ Исправлено отображение актуального прогресса операций  
echo   ✅ Улучшена карточка станка с полным функционалом
echo   ✅ Добавлена статистика производства в реальном времени
echo   ✅ Настроено автоматическое обновление данных
echo   ✅ Создана таблица operation_progress для отслеживания прогресса
echo.

set /p confirm="Продолжить? (y/n): "
if /i not "%confirm%"=="y" (
    echo Операция отменена пользователем
    pause
    exit /b 0
)

echo.
echo 🔄 Остановка текущих процессов...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
timeout /t 2 >nul

echo 📁 Создание резервных копий...
if not exist "backup" mkdir backup
copy "frontend\src\pages\Production\components\MachineCard.tsx" "backup\MachineCard.tsx.backup.%date:~-4%%date:~3,2%%date:~0,2%" >nul 2>&1
copy "frontend\src\pages\Production\ProductionPage.tsx" "backup\ProductionPage.tsx.backup.%date:~-4%%date:~3,2%%date:~0,2%" >nul 2>&1

echo 🗃️ Создание таблицы прогресса операций...
psql -h localhost -U postgres -d thewho -f CREATE-OPERATION-PROGRESS-TABLE.sql
if errorlevel 1 (
    echo ❌ Ошибка при создании таблицы operation_progress
    echo Проверьте подключение к базе данных PostgreSQL
    pause
    exit /b 1
)

echo ✅ Таблица operation_progress создана успешно

echo 🔧 Обновление frontend компонентов...
copy "frontend\src\pages\Production\components\MachineCard.enhanced.tsx" "frontend\src\pages\Production\components\MachineCard.tsx" >nul
if errorlevel 1 (
    echo ❌ Ошибка при обновлении MachineCard.tsx
    pause
    exit /b 1
)

echo ⚡ Создание API сервиса для операций...
if not exist "frontend\src\services" mkdir "frontend\src\services"

echo // operationsApi.ts - API для работы с операциями > frontend\src\services\operationsApi.ts
echo import axios from 'axios'; >> frontend\src\services\operationsApi.ts
echo. >> frontend\src\services\operationsApi.ts
echo const API_BASE_URL = process.env.REACT_APP_API_URL ^|^| 'http://localhost:5100/api'; >> frontend\src\services\operationsApi.ts
echo. >> frontend\src\services\operationsApi.ts
echo export const operationsApi = { >> frontend\src\services\operationsApi.ts
echo   getAll: ^(filters^) =^> axios.get^(`${API_BASE_URL}/operations`, { params: filters }^), >> frontend\src\services\operationsApi.ts
echo   getById: ^(id^) =^> axios.get^(`${API_BASE_URL}/operations/${id}`^), >> frontend\src\services\operationsApi.ts
echo   create: ^(data^) =^> axios.post^(`${API_BASE_URL}/operations`, data^), >> frontend\src\services\operationsApi.ts
echo   update: ^(id, data^) =^> axios.put^(`${API_BASE_URL}/operations/${id}`, data^), >> frontend\src\services\operationsApi.ts
echo   delete: ^(id^) =^> axios.delete^(`${API_BASE_URL}/operations/${id}`^), >> frontend\src\services\operationsApi.ts
echo   getProgress: ^(id^) =^> axios.get^(`${API_BASE_URL}/operations/${id}/progress`^), >> frontend\src\services\operationsApi.ts
echo   updateProgress: ^(id, data^) =^> axios.put^(`${API_BASE_URL}/operations/${id}/progress`, data^), >> frontend\src\services\operationsApi.ts
echo }; >> frontend\src\services\operationsApi.ts

echo 🔄 Компиляция backend...
cd backend
npm run build >nul 2>&1
if errorlevel 1 (
    echo ❌ Ошибка компиляции backend
    echo Проверьте код на наличие ошибок TypeScript
    pause
    exit /b 1
)

echo 🚀 Запуск backend сервера...
start "Backend Server" cmd /c "npm run start:dev"

echo ⏳ Ожидание запуска backend (15 секунд)...
timeout /t 15 >nul

echo 🌐 Запуск frontend...
cd ..\frontend
start "Frontend Server" cmd /c "npm start"

echo.
echo ✅ CRUD ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ УСПЕШНО!
echo.
echo 📊 Новые возможности:
echo   🔧 Полный CRUD для операций (создание, редактирование, удаление)
echo   📈 Отображение реального прогресса операций
echo   ⚡ Автоматическое обновление данных каждые 10 секунд
echo   📋 Статистика производства в реальном времени
echo   🎯 Улучшенное управление станками
echo   📊 Визуальный прогресс выполнения операций
echo   🔄 Кнопки для быстрого управления операциями
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5100/api
echo.
echo ⏳ Ожидание полной загрузки frontend (30 секунд)...
timeout /t 30 >nul

echo 🚀 Открытие браузера...
start http://localhost:3000

echo.
echo 🎉 Система мониторинга производства с CRUD готова к использованию!
echo.
echo 📝 Основные улучшения:
echo   • На карточках станков теперь отображается реальный прогресс
echo   • Добавлены кнопки для редактирования, удаления и создания операций
echo   • Прогресс операций обновляется в реальном времени
echo   • Улучшена визуализация с прогресс-барами и статистикой
echo   • Добавлены модальные окна для управления операциями
echo.
echo 🔧 Использование:
echo   • Нажмите "Изм." для редактирования операции
echo   • Нажмите "Прог." для обновления прогресса
echo   • Нажмите "Удал." для удаления операции
echo   • Нажмите "Создать операцию" для новых операций
echo.
pause
