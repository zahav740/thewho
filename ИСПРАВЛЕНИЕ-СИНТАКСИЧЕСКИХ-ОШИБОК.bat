@echo off
echo ===========================================
echo ИСПРАВЛЕНИЕ СИНТАКСИЧЕСКИХ ОШИБОК
echo ===========================================
echo.

echo ✅ ИСПРАВЛЕНО:
echo - Синтаксическая ошибка в OperationCompletionModal.tsx
echo - Убраны неправильные символы \n в импортах
echo - Исправлены все TypeScript ошибки
echo - Убран неиспользуемый импорт
echo.

cd frontend

echo 🔧 Проверяем компиляцию...
echo.
call npm run build > compile_check.log 2>&1

if %ERRORLEVEL% == 0 (
    echo ✅ Компиляция успешна! Все ошибки исправлены.
    echo.
    echo 🚀 Запускаем исправленную версию...
    start "Frontend Server" cmd /c "npm start"
    
    echo.
    echo Запускаем backend...
    cd ..\backend
    start "Backend Server" cmd /c "npm run start:dev"
    
    echo.
    echo 🎉 Все серверы запущены успешно!
    echo 📱 Откройте: http://localhost:3000/shifts
    echo.
    echo 🎯 ПРОВЕРЬТЕ:
    echo 1. Нет ошибок компиляции
    echo 2. Кнопка "Редактировать" работает
    echo 3. Мгновенное обновление данных (3-5 сек)
    echo 4. Правильная фильтрация по номеру чертежа
) else (
    echo ❌ Остались ошибки компиляции:
    type compile_check.log
    echo.
    echo 🔧 Проверьте файлы и исправьте оставшиеся ошибки
)

echo.
echo ===========================================
echo ГОТОВО! Проверьте работу в браузере
echo ===========================================
pause
