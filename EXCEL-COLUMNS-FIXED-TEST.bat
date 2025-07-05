@echo off
echo ==============================================
echo    ИСПРАВЛЕНИЯ EXCEL IMPORT: ПРАВИЛЬНЫЕ КОЛОНКИ
echo ==============================================

cd /d "%~dp0"

echo.
echo 🎯 КРИТИЧНЫЕ ИСПРАВЛЕНИЯ:
echo    ✓ Убран workType из ExcelImportModal (его нет в Excel)
echo    ✓ Обновлена инструкция: C, E, I, K колонки
echo    ✓ Исправлена функция calculatePriority
echo    ✓ workType теперь опциональный (не отправляется)
echo.

echo ⏳ Перезапускаем frontend с исправлениями...
cd frontend

taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo 🚀 Запускаем frontend с правильным Excel импортом...
start "CRM Frontend Excel Fixed" npm run dev

echo.
echo ✅ FRONTEND ЗАПУЩЕН С ИСПРАВЛЕНИЯМИ EXCEL!
echo.
echo 📋 ПРАВИЛЬНАЯ СТРУКТУРА EXCEL:
echo    C - Номер чертежа
echo    E - Количество  
echo    I - Дедлайн (дата)
echo    K - Приоритет (необязательно)
echo.
echo 🧪 ТЕПЕРЬ ТЕСТИРУЙТЕ ИМПОРТ:
echo    1. Откройте http://localhost:5101
echo    2. Developer Tools (F12) → Console
echo    3. Попробуйте импортировать Excel с правильными колонками
echo.
echo 🔍 В КОНСОЛИ ДОЛЖНО БЫТЬ:
echo    📝 Парсинг строки 1: Чертёж=..., Кол-во=..., Срок=...
echo    🔍 Отладка данных перед отправкой: {workType: не должно быть}
echo    ✅ API RESPONSE: Object (статус 201)
echo.
echo 💡 ЕСЛИ ВСЕ ЕЩЕ ОШИБКА 400:
echo    Ищите "🐛 Ошибки валидации:" в консоли
echo    и сообщите точное содержимое массива
echo.
pause
