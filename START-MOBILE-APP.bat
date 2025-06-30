@echo off
chcp 65001 > nul
echo =============================================
echo     Flutter Mobile App - Production CRM
echo =============================================

:: Цвета для вывода
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "NC=[0m"

:: Переходим в папку mobile
cd /d "%~dp0mobile"

echo %YELLOW%Проверка Flutter...%NC%
flutter --version
if %errorlevel% neq 0 (
    echo %RED%ОШИБКА: Flutter не найден или не установлен%NC%
    echo %YELLOW%Установите Flutter: https://docs.flutter.dev/get-started/install%NC%
    pause
    exit /b 1
)

echo.
echo %YELLOW%Установка зависимостей...%NC%
flutter pub get
if %errorlevel% neq 0 (
    echo %RED%ОШИБКА: Не удалось установить зависимости%NC%
    pause
    exit /b 1
)

echo.
echo %YELLOW%Проверка доступных устройств...%NC%
flutter devices

echo.
echo %GREEN%✅ Готово к запуску!%NC%
echo.
echo %YELLOW%Команды для запуска:%NC%
echo 1. flutter run                    - Запуск в режиме отладки
echo 2. flutter run --release          - Запуск в режиме релиза
echo 3. flutter run -d chrome          - Запуск в браузере
echo 4. flutter run -d windows         - Запуск в Windows
echo.
echo %YELLOW%Команды для сборки:%NC%
echo 5. flutter build apk --release    - Android APK
echo 6. flutter build appbundle        - Android App Bundle
echo 7. flutter build web              - Web версия
echo 8. flutter build windows          - Windows приложение
echo.

:menu
echo %YELLOW%Выберите действие:%NC%
echo 1 - Запуск в отладке
echo 2 - Запуск релиза  
echo 3 - Запуск в браузере
echo 4 - Сборка Android APK
echo 5 - Сборка Web
echo 6 - Выход
echo.
set /p choice="Введите номер (1-6): "

if "%choice%"=="1" (
    echo %GREEN%Запуск в режиме отладки...%NC%
    flutter run
    goto menu
)

if "%choice%"=="2" (
    echo %GREEN%Запуск в режиме релиза...%NC%
    flutter run --release
    goto menu
)

if "%choice%"=="3" (
    echo %GREEN%Запуск в браузере...%NC%
    flutter run -d chrome
    goto menu
)

if "%choice%"=="4" (
    echo %GREEN%Сборка Android APK...%NC%
    flutter build apk --release
    echo %GREEN%✅ APK создан: build\app\outputs\flutter-apk\app-release.apk%NC%
    goto menu
)

if "%choice%"=="5" (
    echo %GREEN%Сборка Web версии...%NC%
    flutter build web
    echo %GREEN%✅ Web версия создана: build\web\%NC%
    goto menu
)

if "%choice%"=="6" (
    echo %GREEN%До свидания!%NC%
    exit /b 0
)

echo %RED%Неверный выбор, попробуйте снова%NC%
goto menu
