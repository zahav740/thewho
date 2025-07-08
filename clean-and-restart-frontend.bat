@echo off
echo 🧹 Очистка кэша и перезапуск...

REM Переходим в папку frontend
cd frontend

REM Очищаем кэш
echo Очищаем node_modules и кэши...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .cache rmdir /s /q .cache
if exist build rmdir /s /q build

REM Очищаем npm кэш
npm cache clean --force

REM Устанавливаем зависимости
echo Устанавливаем зависимости...
npm install

REM Запускаем
echo Запускаем frontend...
npm start

echo ✅ Готово!
pause
