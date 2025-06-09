@echo off
chcp 65001
echo.
echo ===============================================
echo 🔧 ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБКИ - ОПЕРАТОРЫ
echo ===============================================
echo.
echo ✅ Исправлено:
echo   - Добавлен правильный тип для параметра render
echo   - Добавлен ColumnsType<Operator> для типизации
echo   - Параметр '_' заменен на 'value: any'
echo.

echo 🚀 Перезапускаем Frontend...
cd frontend
call npm start

pause
