@echo off
title Production CRM - PDF Fix Testing
color 0A

echo.
echo  ██████╗ ██████╗ ███████╗    ██████╗ ██████╗ ███████╗
echo  ██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔══██╗██╔════╝ 
echo  ██████╔╝██║  ██║█████╗      ██████╔╝██║  ██║█████╗   
echo  ██╔═══╝ ██║  ██║██╔══╝      ██╔═══╝ ██║  ██║██╔══╝   
echo  ██║     ██████╔╝██║         ██║     ██████╔╝██║      
echo  ╚═╝     ╚═════╝ ╚═╝         ╚═╝     ╚═════╝ ╚═╝      
echo.
echo  ████████╗███████╗███████╗████████╗
echo  ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
echo     ██║   █████╗  ███████╗   ██║   
echo     ██║   ██╔══╝  ╚════██║   ██║   
echo     ██║   ███████╗███████║   ██║   
echo     ╚═╝   ╚══════╝╚══════╝   ╚═╝   
echo.
echo ═══════════════════════════════════════════════════════════
echo    🔧 ИСПРАВЛЕНИЕ PDF ПРЕВЬЮ - ПОЛНЫЙ ТЕСТ СИСТЕМЫ
echo ═══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo 📋 1. Проверка структуры проекта...
if not exist "backend" (
    echo ❌ ERROR: Папка backend не найдена
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERROR: Папка frontend не найдена  
    pause
    exit /b 1
)

echo ✅ Структура проекта корректна
echo.

echo 📄 2. Проверка PDF файлов...
set "pdf_found=0"
if exist "backend\uploads\pdf\*.pdf" (
    echo ✅ PDF файлы найдены в backend\uploads\pdf
    set "pdf_found=1"
) else if exist "uploads\pdf\*.pdf" (
    echo ✅ PDF файлы найдены в uploads\pdf
    set "pdf_found=1"
) else (
    echo ⚠️  PDF файлы не найдены, создаем тестовый...
    
    if not exist "backend\uploads\pdf" mkdir "backend\uploads\pdf"
    if not exist "uploads\pdf" mkdir "uploads\pdf"
    
    echo Creating test PDF...
    node create-test-pdf.js >nul 2>&1
    
    if exist "backend\uploads\pdf\test-pdf-document.pdf" (
        echo ✅ Тестовый PDF создан
        set "pdf_found=1"
    ) else (
        echo ⚠️  Не удалось создать тестовый PDF
    )
)

echo.
echo 🚀 3. Запуск Backend...
echo.
echo    🌐 Backend будет доступен на: http://localhost:5100
echo    📚 Swagger API: http://localhost:5100/api/docs
echo    🏥 Health check: http://localhost:5100/api/health
echo    📄 PDF тест: http://localhost:5100/api/orders/pdf/test-pdf-document.pdf
echo.

start "Backend Server" cmd /k "cd backend && echo 🚀 Запуск Backend сервера... && npm run start:dev"

echo ⏳ Ждем запуска backend сервера (10 секунд)...
timeout /t 10 /nobreak >nul

echo.
echo 🌐 4. Проверка доступности Backend...
node test-pdf-backend-detailed.js

echo.
echo 🎨 5. Запуск Frontend...
echo    🌐 Frontend будет доступен на: http://localhost:3000
echo.

start "Frontend Server" cmd /k "cd frontend && echo 🎨 Запуск Frontend сервера... && npm start"

echo ⏳ Ждем запуска frontend сервера (15 секунд)...
timeout /t 15 /nobreak >nul

echo.
echo 🌐 6. Открытие приложения...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ═══════════════════════════════════════════════════════════
echo    🎯 ГОТОВО! Система запущена
echo ═══════════════════════════════════════════════════════════
echo.
echo 📋 ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ:
echo.
echo    1. ✅ Backend: http://localhost:5100
echo    2. ✅ Frontend: http://localhost:3000  
echo    3. 🔐 Войдите в систему (admin/admin или создайте аккаунт)
echo    4. 📊 Перейдите: База данных → Заказы
echo    5. ✏️  Нажмите кнопку "Редактировать" на любом заказе
echo    6. 📄 Перейдите на вкладку "PDF Документация"
echo    7. 🔍 Проверьте диагностическую информацию
echo    8. 👁️  Нажмите "Click to preview" для просмотра PDF
echo.
echo 🔧 ДИАГНОСТИКА:
echo    • Если PDF не отображается - смотрите консоль браузера (F12)
echo    • Если backend недоступен - проверьте окно "Backend Server"
echo    • Для дополнительной диагностики запустите: DIAGNOSE-PDF-ISSUES.bat
echo.
echo 🌟 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:
echo    ✅ В модальном окне должен показываться превью PDF
echo    ✅ Кнопки просмотра и скачивания должны работать
echo    ✅ Диагностика должна показывать HTTP 200 статус
echo.
echo ═══════════════════════════════════════════════════════════

echo.
echo 💡 Нажмите любую клавишу чтобы открыть диагностику...
pause >nul

echo.
echo 🔍 Запуск полной диагностики...
DIAGNOSE-PDF-ISSUES.bat
