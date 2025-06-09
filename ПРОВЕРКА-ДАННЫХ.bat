@echo off
echo ====================================
echo ОЧИСТКА БРАУЗЕРА И ПРОВЕРКА
echo ====================================

echo 1. Очистите кеш браузера:
echo    - Нажмите Ctrl+Shift+Delete
echo    - Выберите "Изображения и файлы в кеше"
echo    - Нажмите "Очистить данные"
echo.
echo 2. Или используйте жесткое обновление:
echo    - Нажмите Ctrl+F5 (Chrome/Firefox)
echo    - Или Ctrl+Shift+R
echo.
echo 3. Проверьте данные в базе:

psql -h localhost -p 5432 -U postgres -d thewho -c "SELECT id, drawing_number, quantity, deadline FROM orders ORDER BY id;"

echo.
echo 4. Если данные в базе правильные, но интерфейс показывает старые:
echo    - Проблема в кеше браузера
echo    - Используйте приватный режим (Ctrl+Shift+N)
echo    - Или другой браузер

pause