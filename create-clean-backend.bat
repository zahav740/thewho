@echo off
echo ===================================
echo Создание ЧИСТОГО архива Backend
echo ===================================

rem Удаляем старый архив
if exist "backend-clean.zip" del "backend-clean.zip"

rem Создаем временную папку для чистых файлов
if exist "temp_backend" rmdir /s /q "temp_backend"
mkdir temp_backend

echo Копирование необходимых файлов Backend...

rem Копируем основные файлы
copy "backend\package.json" "temp_backend\"
copy "backend\package-lock.json" "temp_backend\"
copy "backend\tsconfig.json" "temp_backend\"
if exist "backend\.gitignore" copy "backend\.gitignore" "temp_backend\"

rem Копируем папки
echo Копирование src...
xcopy "backend\src" "temp_backend\src" /E /I /Q

rem Копируем dist если есть
if exist "backend\dist" (
    echo Копирование dist...
    xcopy "backend\dist" "temp_backend\dist" /E /I /Q
)

rem Копируем scripts если есть
if exist "backend\scripts" (
    echo Копирование scripts...
    xcopy "backend\scripts" "temp_backend\scripts" /E /I /Q
)

rem Создаем .env файл для продакшена
echo # Supabase Database Configuration > temp_backend\.env
echo DB_HOST=aws-0-eu-central-1.pooler.supabase.com >> temp_backend\.env
echo DB_PORT=6543 >> temp_backend\.env
echo DB_USERNAME=postgres.kukqacmzfmzepdfddppl >> temp_backend\.env
echo DB_PASSWORD=Magarel1! >> temp_backend\.env
echo DB_NAME=postgres >> temp_backend\.env
echo. >> temp_backend\.env
echo # JWT Configuration >> temp_backend\.env
echo JWT_SECRET=YourSuperSecretJWTKeyForBeget256BitsLong! >> temp_backend\.env
echo JWT_EXPIRES_IN=7d >> temp_backend\.env
echo. >> temp_backend\.env
echo # App Configuration >> temp_backend\.env
echo NODE_ENV=production >> temp_backend\.env
echo PORT=5200 >> temp_backend\.env
echo. >> temp_backend\.env
echo # CORS для kasuf.xyz >> temp_backend\.env
echo CORS_ORIGIN=https://kasuf.xyz >> temp_backend\.env
echo. >> temp_backend\.env
echo # Database URL для TypeORM >> temp_backend\.env
echo DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres >> temp_backend\.env

rem Создаем архив из временной папки
cd temp_backend
powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '..\backend-clean.zip' -Force"
cd ..

rem Удаляем временную папку
rmdir /s /q "temp_backend"

echo.
echo ✅ ЧИСТЫЙ архив Backend создан: backend-clean.zip
for %%F in (backend-clean.zip) do echo Размер: %%~zF bytes
echo.
pause