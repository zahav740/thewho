@echo off
chcp 65001 > nul
echo ============================================
echo ПРИНУДИТЕЛЬНЫЙ СБРОС И ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ
echo ============================================
echo.
echo Этот скрипт полностью перезапустит приложение
echo и сбросит соединения между компонентами.
echo.

echo Остановка всех процессов Node.js...
taskkill /F /IM node.exe 2>nul

echo.
echo Очистка временных файлов...
IF EXIST "backend\dist" rmdir /S /Q "backend\dist"
IF EXIST "frontend\build" rmdir /S /Q "frontend\build"
IF EXIST "frontend\node_modules\.cache" rmdir /S /Q "frontend\node_modules\.cache"
IF EXIST "backend\node_modules\.cache" rmdir /S /Q "backend\node_modules\.cache"

echo.
echo Очистка API-кэша...
cd frontend\src\services
echo // Временный патч для сброса API-кэша > api-reset.js
echo const fs = require('fs'); >> api-reset.js
echo const apiFile = 'api.ts'; >> api-reset.js
echo let content = fs.readFileSync(apiFile, 'utf8'); >> api-reset.js
echo // Добавляем уникальный параметр к запросам >> api-reset.js
echo if (!content.includes('api.interceptors.request.use')) { >> api-reset.js
echo   const importIndex = content.indexOf('export default'); >> api-reset.js
echo   const patchedContent = content.slice(0, importIndex) + >> api-reset.js
echo     "\n// Патч для сброса кэша\n" + >> api-reset.js
echo     "api.interceptors.request.use(config => {\n" + >> api-reset.js
echo     "  if (config.method === 'get') {\n" + >> api-reset.js
echo     "    config.params = { ...config.params, _ts: new Date().getTime() };\n" + >> api-reset.js
echo     "  }\n" + >> api-reset.js
echo     "  return config;\n" + >> api-reset.js
echo     "});\n\n" + >> api-reset.js
echo     content.slice(importIndex); >> api-reset.js
echo   fs.writeFileSync(apiFile, patchedContent, 'utf8'); >> api-reset.js
echo   console.log('API патч применен - добавлен сброс кэша'); >> api-reset.js
echo } else { >> api-reset.js
echo   console.log('API патч уже применен'); >> api-reset.js
echo } >> api-reset.js
node api-reset.js
cd ..\..\..

echo.
echo Перезапуск всего приложения...
echo.
echo 1. Запуск бэкенда...
start cmd /k "cd backend && npm start"

echo Ожидание запуска бэкенда...
timeout /t 10 /nobreak > nul

echo 2. Запуск фронтенда...
start cmd /k "cd frontend && set PORT=3000 && npm start"

echo.
echo ============================================
echo Приложение полностью перезапущено!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Если проблема сохраняется, выполните следующее:
echo 1. Полностью закройте браузер и откройте заново
echo 2. Проверьте логи бэкенда на наличие ошибок
echo 3. Выполните команду `npm run build` в frontend
echo    папке и запустите снова
echo ============================================
pause
