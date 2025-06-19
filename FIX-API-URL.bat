@echo off
echo 🔧 Исправление API URL для фронтенда...

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📝 Создание правильного .env.production файла...
(
echo REACT_APP_API_URL=http://31.128.35.6/api
echo REACT_APP_ENVIRONMENT=production
echo GENERATE_SOURCEMAP=false
) > .env.production

echo ✅ .env.production создан с правильным API URL
echo.
echo 📋 Содержимое .env.production:
type .env.production

echo.
echo 🔨 Пересборка фронтенда...
call npm run build

if %ERRORLEVEL% == 0 (
    echo ✅ Фронтенд успешно пересобран!
    echo.
    echo 🎉 Исправление завершено!
    echo 📦 Теперь нужно загрузить новый build на сервер
    echo 📁 Директория build готова для загрузки
) else (
    echo ❌ Ошибка при сборке фронтенда!
    echo Проверьте логи выше
)

pause
