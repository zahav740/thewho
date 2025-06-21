@echo off
echo ====================================
echo БЫСТРЫЙ ТЕСТ ИСПРАВЛЕНИЙ ЛОГИНА
echo ====================================

cd frontend

echo Проверяем .env.local...
if exist .env.local (
    findstr "5200" .env.local >nul
    if errorlevel 1 (
        echo ❌ API URL в .env.local неправильный
        echo Текущий:
        type .env.local | findstr "REACT_APP_API_URL"
        echo Должен быть: REACT_APP_API_URL=http://localhost:5200/api
        pause
        exit /b 1
    ) else (
        echo ✅ API URL в .env.local правильный (5200)
    )
) else (
    echo ⚠️ .env.local не найден
)

echo.
echo Проверяем LoginPage.tsx...
findstr "position: 'fixed'" src\pages\Auth\LoginPage.tsx >nul
if errorlevel 1 (
    echo ❌ LoginPage не имеет исправленного позиционирования
    pause
    exit /b 1
) else (
    echo ✅ LoginPage имеет исправленное позиционирование
)

echo.
echo Проверяем RegisterPage.tsx...
findstr "position: 'fixed'" src\pages\Auth\RegisterPage.tsx >nul
if errorlevel 1 (
    echo ❌ RegisterPage не имеет исправленного позиционирования
    pause
    exit /b 1
) else (
    echo ✅ RegisterPage имеет исправленное позиционирование
)

echo.
echo Проверяем backend .env...
cd ..\backend
findstr "PORT=5200" .env >nul
if errorlevel 1 (
    echo ❌ Backend порт неправильный
    echo Текущий:
    type .env | findstr "PORT="
    echo Должен быть: PORT=5200
    pause
    exit /b 1
) else (
    echo ✅ Backend порт правильный (5200)
)

echo.
echo ====================================
echo ✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!
echo ====================================
echo.
echo 🔧 Готовые исправления:
echo - API URL: localhost:5200 (локально)
echo - Production API: https://kasuf.xyz/api
echo - Backend порт: 5200
echo - Frontend порт: 5201
echo - Абсолютное позиционирование login/register
echo.
echo 🚀 Следующий шаг: запустите fix-login-final.bat
echo для создания архива с исправлениями
echo.
cd ..
pause