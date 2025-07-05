@echo off
echo ====================================
echo РЕШЕНИЕ ПРОБЛЕМЫ ОТОБРАЖЕНИЯ ДАННЫХ
echo ====================================
echo.

echo 🔍 ПРОБЛЕМА НАЙДЕНА:
echo    - Excel файл успешно импортирован в БД
echo    - Но данные не попали в таблицу orders
echo    - Причина: отсутствует колонка deadline
echo    - Ваш файл на иврите с колонками: מקט, כמות, ת.אספקה
echo.

echo ✅ РЕШЕНИЕ ПРИМЕНЕНО:
echo    - Создан новый гибкий фильтр для иврита
echo    - Deadline теперь необязательное поле
echo    - Добавлена поддержка маппинга на иврите
echo.

echo 🔄 ПЕРЕЗАПУСК BACKEND С ИСПРАВЛЕНИЯМИ...
cd /d "%~dp0backend"

echo 🛑 Останавливаем backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5100 "') do taskkill /F /PID %%a 2>nul

timeout /t 2 /nobreak > nul

echo 🚀 Запускаем backend...
start "Backend" cmd /k "npm run start:dev"

echo ⏳ Ждем запуска backend...
timeout /t 8 /nobreak > nul

echo.
echo 🔄 ПОВТОРНЫЙ ИМПОРТ С НОВЫМ ФИЛЬТРОМ...
cd /d "%~dp0"
node scripts\reimport-with-hebrew-filter.js

echo.
echo ====================================
echo 🎯 ИНСТРУКЦИИ:
echo ====================================
echo 1. В интерфейсе обновите страницу (F5)
echo 2. В разделе "База данных" должны появиться заказы
echo 3. Или загрузите файл заново с новым фильтром:
echo    "Импорт заказов на иврите"
echo.
echo 📊 Новый фильтр поддерживает:
echo    מקט → drawing_number
echo    כמות → quantity  
echo    ת.אספקה → deadline (необязательно)
echo    דחיפויות → priority
echo    סטטוס → workType
echo ====================================
pause
