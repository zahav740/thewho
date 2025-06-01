@echo off
chcp 65001 > nul
echo ============================================
echo ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ МАССОВОГО УДАЛЕНИЯ
echo ============================================
echo.

echo Остановка всех процессов Node.js...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Очистка кэша...
cd frontend
rmdir /s /q node_modules\.cache 2>nul
cd ..

echo.
echo Пересборка frontend...
cd frontend
echo Установка зависимостей...
call npm install --silent
echo Сборка приложения...
call npm run build
cd ..

echo.
echo Запуск приложения...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ:
echo.
echo 1. Функция "Удалить все" теперь удаляет ВСЕ заказы в БД
echo 2. Контекстное меню расширено для длинных текстов
echo 3. Модальное окно загружает все заказы из БД
echo 4. Добавлен индикатор загрузки
echo.
echo Приложение запущено!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo ============================================
pause
