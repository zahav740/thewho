@echo off
echo ========================================
echo БЫСТРАЯ ПРОВЕРКА КОМПИЛЯЦИИ FRONTEND
echo ========================================
echo.

cd frontend

echo 🔍 Проверяем TypeScript компиляцию...
call npx tsc --noEmit

if errorlevel 1 (
    echo.
    echo ❌ Есть ошибки TypeScript!
    echo Просмотрите ошибки выше
    echo.
) else (
    echo.
    echo ✅ TypeScript компиляция успешна!
    echo 🚀 Можно запускать систему
    echo.
)

echo 🔧 Проверяем статус портов...
netstat -an | findstr ":5100" >nul
if errorlevel 1 (
    echo ⚠️ Backend (5100) не запущен
) else (
    echo ✅ Backend (5100) работает
)

netstat -an | findstr ":5101" >nul
if errorlevel 1 (
    echo ⚠️ Frontend (5101) не запущен  
) else (
    echo ✅ Frontend (5101) работает
)

echo.
pause
